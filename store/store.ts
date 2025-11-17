import { create } from 'zustand';
import { AppState, ShoppingList, ListItem, Budget, PriceHistoryEntry } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Helper to map DB snake_case to JS camelCase
const mapListFromDb = (dbList: any): ShoppingList => ({
  id: dbList.id,
  createdAt: dbList.created_at,
  status: dbList.status,
  items: dbList.items?.map(mapItemFromDb) || [],
  isPinned: dbList.is_pinned,
  name: dbList.name,
  category: dbList.category,
  listBudget: dbList.list_budget,
  user_id: dbList.user_id,
});

const mapItemFromDb = (dbItem: any): ListItem => ({
    id: dbItem.id,
    name: dbItem.name,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price,
    category: dbItem.category,
    isPurchased: dbItem.is_purchased,
    order: dbItem.item_order,
    list_id: dbItem.list_id,
    user_id: dbItem.user_id,
    created_at: dbItem.created_at,
});


export const useStore = create<AppState>()((set, get) => ({
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

      // ACTIONS
      setLoadingState: (key, isLoading) => set(state => ({ loadingStates: { ...state.loadingStates, [key]: isLoading } })),
      setError: (error) => set({ error }),
      
      setSession: (session) => set({ session }),
      
      signOut: async () => {
        get().setLoadingState('signOut', true);
        try {
            await supabase.auth.signOut();
            set({ session: null, lists: [], budgets: [], priceHistory: [], currentPage: 'myLists', currentListId: null });
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
              .from('lists')
              .select('*, items(*)')
              .eq('user_id', session.user.id);
            if (listsError) throw listsError;
            set({ lists: listsData.map(mapListFromDb) });

            const { data: budgetsData, error: budgetsError } = await supabase
              .from('budgets')
              .select('*')
              .eq('user_id', session.user.id);
            if (budgetsError) throw budgetsError;
            set({ budgets: budgetsData });

            const { data: historyData, error: historyError } = await supabase
              .from('price_history')
              .select('*')
              .eq('user_id', session.user.id);
            if (historyError) throw historyError;
            
            const groupedHistory = historyData.reduce((acc, curr) => {
                const itemName = curr.item_name;
                if (!acc[itemName]) {
                    acc[itemName] = { id: curr.id, user_id: curr.user_id, itemName: itemName, prices: [] };
                }
                acc[itemName].prices.push({ date: curr.date, price: curr.price });
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
        const key = 'setMonthlyBudget';
        get().setLoadingState(key, true);
        try {
            const { session } = get();
            if (!session) throw new Error("User not authenticated");
            const year = date.getFullYear();
            const month = date.getMonth();

            const { data: existingBudget } = await supabase
                .from('budgets')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('year', year)
                .eq('month', month)
                .single();

            const budgetRecord = { user_id: session.user.id, year, month, amount };
            let updatedBudget: Budget | null = null;
            
            if(existingBudget) {
                const { data, error } = await supabase.from('budgets').update({ amount }).eq('id', existingBudget.id).select().single();
                if(error) throw error;
                updatedBudget = data;
            } else {
                const { data, error } = await supabase.from('budgets').insert(budgetRecord).select().single();
                if(error) throw error;
                updatedBudget = data;
            }

            if(updatedBudget) {
                set(state => {
                    const existingIndex = state.budgets.findIndex(b => b.year === year && b.month === month);
                    if (existingIndex > -1) {
                        const newBudgets = [...state.budgets];
                        newBudgets[existingIndex] = updatedBudget;
                        return { budgets: newBudgets };
                    }
                    return { budgets: [...state.budgets, updatedBudget] };
                });
            }
        } catch (error) {
            console.error("Error setting monthly budget", error);
            get().setError("Falha ao salvar o orçamento.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      addList: async (listData) => {
        const key = 'addList';
        get().setLoadingState(key, true);
        try {
            const { session } = get();
            if (!session) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('lists')
                .insert({ name: listData.name, category: listData.category, list_budget: listData.listBudget, user_id: session.user.id, status: 'active', is_pinned: false })
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
            if (updates.category) dbUpdates.category = updates.category;
            if (updates.status) dbUpdates.status = updates.status;
            if (typeof updates.isPinned === 'boolean') dbUpdates.is_pinned = updates.isPinned;
            if (typeof updates.listBudget === 'number') dbUpdates.list_budget = updates.listBudget;
            
            const { error } = await supabase.from('lists').update(dbUpdates).eq('id', listId);
            if (error) throw error;

            set((state) => ({ lists: state.lists.map(list => list.id === listId ? { ...list, ...updates } : list) }));
            if (updates.status === 'completed') {
                const completedList = get().lists.find(l => l.id === listId);
                if (completedList) get().recordPriceHistory(completedList);
            }
        } catch (error) {
            console.error("Error updating list", error);
            get().setError("Não foi possível atualizar a lista.");
        } finally {
            get().setLoadingState(key, false);
        }
      },

      deleteList: async (listId) => {
        const key = `deleteList-${listId}`;
        get().setLoadingState(key, true);
        try {
            const { error } = await supabase.from('lists').delete().eq('id', listId);
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
                .from('lists')
                .insert({ name: `${originalList.name} (Cópia)`, category: originalList.category, list_budget: originalList.listBudget, user_id: session.user.id, status: 'active', is_pinned: false })
                .select()
                .single();
            if (newListError) throw newListError;

            const itemsToCopy = originalList.items.map(item => ({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, category: item.category, is_purchased: false, item_order: item.order, list_id: newListData.id, user_id: session.user.id }));

            if (itemsToCopy.length > 0) {
                const { error: itemsError } = await supabase.from('items').insert(itemsToCopy);
                if (itemsError) {
                    await supabase.from('lists').delete().eq('id', newListData.id); // Rollback
                    throw itemsError;
                }
            }
            
            const { data: fullNewList, error: fetchError } = await supabase.from('lists').select('*, items(*)').eq('id', newListData.id).single();
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
            const { data, error } = await supabase.from('items').insert({ name: itemData.name, quantity: itemData.quantity, unit_price: itemData.unitPrice, category: itemData.category, list_id: listId, user_id: session.user.id, item_order: get().lists.find(l => l.id === listId)?.items.length || 0 }).select().single();
            if (error) throw error;

            const newItem = mapItemFromDb(data);
            set(state => ({ lists: state.lists.map(l => l.id === listId ? {...l, items: [...l.items, newItem].sort((a,b) => a.order - b.order)} : l) }));
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

            const { error } = await supabase.from('items').update(dbUpdates).eq('id', itemId);
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
            const { error } = await supabase.from('items').delete().eq('id', itemId);
            if (error) throw error;
            set((state) => ({ lists: state.lists.map(list => list.id === listId ? { ...list, items: list.items.filter(item => item.id !== itemId) } : list) }));
        } catch(error) {
            console.error("Error removing item", error);
            get().setError("Não foi possível remover o item.");
        } finally {
            get().setLoadingState(key, false);
        }
      },
      
      updateItemOrder: async (listId, itemOrders) => {
          // This is a quick operation, a global loader is not ideal.
          // For optimistic UI, we update the state first.
          const originalLists = get().lists;
          set((state) => ({
              lists: state.lists.map(list => {
                  if (list.id === listId) {
                      const newItems = list.items.map(item => {
                          const orderUpdate = itemOrders.find(o => o.itemId === item.id);
                          return orderUpdate ? { ...item, order: orderUpdate.newOrder } : item;
                      });
                      return { ...list, items: newItems.sort((a,b) => a.order - b.order) };
                  }
                  return list;
              })
          }));
          
          try {
            const updates = itemOrders.map(o => supabase.from('items').update({ item_order: o.newOrder }).eq('id', o.itemId));
            const results = await Promise.all(updates);
            const firstError = results.find(res => res.error);
            if (firstError) throw firstError.error;
          } catch(error) {
            console.error("Error updating item order", error);
            get().setError("Não foi possível reordenar os itens.");
            set({ lists: originalLists }); // Revert on error
          }
      },

      recordPriceHistory: async (list) => {
        try {
            const { session } = get();
            if (!session) return;

            const priceUpdates = list.items.filter(item => item.unitPrice > 0).map(item => ({ user_id: session.user.id, item_name: item.name, price: item.unitPrice, date: new Date().toISOString() }));
            
            if (priceUpdates.length === 0) return;

            const { error } = await supabase.from('price_history').insert(priceUpdates);
            if (error) throw error;
            
            get().fetchInitialData(); // Refetch to update stats
        } catch(error) {
            console.error("Error recording price history:", error);
            // Non-critical error, no user-facing message.
        }
      },
    })
);
