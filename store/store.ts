import { create } from 'zustand';
import { AppState, ShoppingList, ListItem, PriceHistoryEntry, RawPurchaseHistoryItem } from '../types';
import { supabase } from '../lib/supabase';

// Helper to map DB snake_case to JS camelCase
const mapListFromDb = (dbList: any): ShoppingList => ({
  id: dbList.id,
  createdAt: dbList.created_at,
  items: dbList.list_items?.map(mapItemFromDb) || [],
  name: dbList.name,
  listBudget: dbList.budget,
  user_id: dbList.user_id,
  category: dbList.category,
});

const mapItemFromDb = (dbItem: any): ListItem => ({
    id: dbItem.id,
    name: dbItem.name,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price,
    category: dbItem.category,
    isPurchased: dbItem.is_purchased,
    list_id: dbItem.list_id,
    user_id: dbItem.user_id,
    created_at: dbItem.added_at,
});


export const useStore = create<AppState>((set, get) => ({
      // STATE
      loadingStates: {},
      error: null,
      session: null,
      currentPage: 'myLists',
      currentListId: null,
      hasSeenOnboarding: false,
      theme: 'light',
      lists: [],
      budgets: [],
      priceHistory: [],
      rawPurchaseHistory: [],

      // ACTIONS
      setLoadingState: (key, isLoading) => set(state => ({ loadingStates: { ...state.loadingStates, [key]: isLoading } })),
      setError: (error) => set({ error }),
      
      setSession: (session) => set({ session }),
      
      signOut: async () => {
        get().setLoadingState('signOut', true);
        try {
            await supabase.auth.signOut();
            set({ session: null, lists: [], budgets: [], priceHistory: [], rawPurchaseHistory: [], currentPage: 'myLists', currentListId: null });
        } catch (error) {
            console.error("Error signing out", error);
            get().setError("Não foi possível sair. Tente novamente.");
        } finally {
            get().setLoadingState('signOut', false);
        }
      },

      fetchInitialData: async () => {
        const { session } = get();
        if (!session) return;
        
        try {
            const { data: listsData, error: listsError } = await supabase
              .from('shopping_lists')
              .select('*, list_items(*)')
              .eq('user_id', session.user.id);
            if (listsError) throw listsError;
            set({ lists: listsData.map(mapListFromDb) });

            // The 'budgets' table does not exist in the provided schema.
            set({ budgets: [] });

            const { data: historyData, error: historyError } = await supabase
              .from('purchase_history')
              .select('*')
              .eq('user_id', session.user.id);
            if (historyError) throw historyError;
            
            set({ rawPurchaseHistory: historyData as RawPurchaseHistoryItem[] });

            const groupedHistory = historyData.reduce((acc, curr) => {
                const itemName = curr.item_name;
                if (!acc[itemName]) {
                    acc[itemName] = { id: curr.id, user_id: curr.user_id, itemName: itemName, prices: [] };
                }
                acc[itemName].prices.push({ date: curr.purchased_at, price: curr.total_price });
                return acc;
            }, {} as Record<string, PriceHistoryEntry>);
            set({ priceHistory: Object.values(groupedHistory) });

        } catch (error) {
            console.error("Error fetching initial data:", error);
            get().setError("Não foi possível carregar seus dados.");
        }
      },

      setCurrentPage: (page, listId = null) => set({ currentPage: page, currentListId: listId }),
      setHasSeenOnboarding: (status) => set({ hasSeenOnboarding: status }),
      setTheme: (theme) => set({ theme }),

      setMonthlyBudget: async (amount, date) => {
        // This feature is not supported by the provided database schema,
        // as there is no 'budgets' table.
        console.warn("setMonthlyBudget is not supported by the current database schema.");
        return Promise.resolve();
      },

      addList: async (listData) => {
        const key = 'addList';
        get().setLoadingState(key, true);
        try {
            const { session } = get();
            if (!session) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('shopping_lists')
                .insert({ 
                    name: listData.name, 
                    budget: listData.listBudget, 
                    user_id: session.user.id,
                    category: listData.category,
                })
                .select()
                .single();
            if (error) throw error;
            
            const newList = mapListFromDb(data);
            set((state) => ({ lists: [...state.lists, newList] }));
            get().setCurrentPage('listDetail', newList.id);
        } catch (error) {
            console.error("Error adding list:", error);
            get().setError("Não foi possível criar a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      updateList: async (listId, updates) => {
        const key = `updateList-${listId}`;
        get().setLoadingState(key, true);
        try {
            const dbUpdates: Record<string, any> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (typeof updates.listBudget === 'number') dbUpdates.budget = updates.listBudget;
            if (updates.category) dbUpdates.category = updates.category;
            
            const { error } = await supabase.from('shopping_lists').update(dbUpdates).eq('id', listId);
            if (error) throw error;

            set((state) => ({ lists: state.lists.map(list => list.id === listId ? { ...list, ...updates } : list) }));
        } catch (error) {
            console.error("Error updating list", error);
            get().setError("Não foi possível atualizar a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },
      
      finalizeList: async (listId: string) => {
        const key = `finalizeList-${listId}`;
        get().setLoadingState(key, true);
        try {
            const listToFinalize = get().lists.find(l => l.id === listId);
            if (!listToFinalize) throw new Error("List not found");

            await get().recordPriceHistory(listToFinalize);
            await get().deleteList(listId);

        } catch (error) {
            console.error("Error finalizing list:", error);
            get().setError("Não foi possível finalizar a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      deleteList: async (listId) => {
        const key = `deleteList-${listId}`;
        get().setLoadingState(key, true);
        try {
            const { error } = await supabase.from('shopping_lists').delete().eq('id', listId);
            if (error) throw error;
            set((state) => ({ lists: state.lists.filter(list => list.id !== listId) }));
        } catch (error) {
            console.error("Error deleting list", error);
            get().setError("Não foi possível excluir a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      duplicateList: async (listId) => {
        const key = `duplicateList-${listId}`;
        get().setLoadingState(key, true);
        try {
            const { session } = get();
            if (!session) throw new Error("User not authenticated");
            const originalList = get().lists.find(l => l.id === listId);
            if (!originalList) throw new Error("Original list not found");

            const { data: newListData, error: newListError } = await supabase
                .from('shopping_lists')
                .insert({ 
                    name: `${originalList.name} (Cópia)`, 
                    budget: originalList.listBudget, 
                    user_id: session.user.id,
                    category: originalList.category,
                })
                .select()
                .single();
            if (newListError) throw newListError;

            const itemsToCopy = originalList.items.map(item => ({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, category: item.category, is_purchased: false, list_id: newListData.id, user_id: session.user.id }));

            if (itemsToCopy.length > 0) {
                const { error: itemsError } = await supabase.from('list_items').insert(itemsToCopy);
                if (itemsError) {
                    await supabase.from('shopping_lists').delete().eq('id', newListData.id); // Rollback
                    throw itemsError;
                }
            }
            
            const { data: fullNewList, error: fetchError } = await supabase.from('shopping_lists').select('*, list_items(*)').eq('id', newListData.id).single();
            if (fetchError) throw fetchError;

            const newList = mapListFromDb(fullNewList);
            set(state => ({ lists: [...state.lists, newList] }));
            get().setCurrentPage('listDetail', newList.id);
        } catch (error) {
            console.error("Error duplicating list:", error);
            get().setError("Não foi possível duplicar a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      addItemToList: async (listId, itemData) => {
        const key = 'addItem';
        get().setLoadingState(key, true);
        try {
            const { session } = get();
            if (!session) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('list_items').insert({ name: itemData.name, quantity: itemData.quantity, unit_price: itemData.unitPrice, category: itemData.category, list_id: listId, user_id: session.user.id }).select().single();
            if (error) throw error;

            const newItem = mapItemFromDb(data);
            set(state => ({ lists: state.lists.map(l => l.id === listId ? {...l, items: [...l.items, newItem] } : l) }));
        } catch(error) {
            console.error("Error adding item", error);
            get().setError("Não foi possível adicionar o item.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      updateItemInList: async (listId, itemId, updates) => {
        const key = `updateItem-${itemId}`;
        get().setLoadingState(key, true);
        try {
            const dbUpdates: Record<string, any> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.quantity) dbUpdates.quantity = updates.quantity;
            if (typeof updates.unitPrice === 'number') dbUpdates.unit_price = updates.unitPrice;
            if (updates.category) dbUpdates.category = updates.category;
            if (typeof updates.isPurchased === 'boolean') dbUpdates.is_purchased = updates.isPurchased;

            const { error } = await supabase.from('list_items').update(dbUpdates).eq('id', itemId);
            if (error) throw error;
            
            set((state) => ({ lists: state.lists.map(list => list.id === listId ? { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) } : list) }));
        } catch(error) {
            console.error("Error updating item", error);
            get().setError("Não foi possível atualizar o item.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      removeItemFromList: async (listId, itemId) => {
        const key = `deleteItem-${itemId}`;
        get().setLoadingState(key, true);
        try {
            const { error } = await supabase.from('list_items').delete().eq('id', itemId);
            if (error) throw error;
            set((state) => ({ lists: state.lists.map(list => list.id === listId ? { ...list, items: list.items.filter(item => item.id !== itemId) } : list) }));
        } catch(error) {
            console.error("Error removing item", error);
            get().setError("Não foi possível remover o item.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      recordPriceHistory: async (list) => {
        try {
            const { session } = get();
            if (!session) return;

            const historyUpdates = list.items
              .filter(item => item.unitPrice > 0)
              .map(item => ({ 
                user_id: session.user.id, 
                item_name: item.name, 
                total_price: item.unitPrice, // Storing unit_price in total_price to power the price evolution feature.
                purchased_at: new Date().toISOString(),
                category: item.category,
                original_item_id: item.id,
             }));
            
            if (historyUpdates.length === 0) return;

            const { error } = await supabase.from('purchase_history').insert(historyUpdates);
            if (error) throw error;
            
            // OPTIMIZATION: Update state locally instead of re-fetching everything
            get().fetchInitialData(); // Re-fetch to get the latest history

        } catch(error) {
            console.error("Error recording price history:", error);
            // Non-critical error, no user-facing message.
        }
      },
    })
);