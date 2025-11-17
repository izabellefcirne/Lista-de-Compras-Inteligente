import { create } from 'zustand';
import { AppState, ShoppingList, ListItem } from '../types';
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
      session: null,
      currentPage: 'myLists',
      currentListId: null,
      hasSeenOnboarding: false,
      theme: 'light',
      lists: [],
      budgets: [],
      priceHistory: [],

      // ACTIONS
      setSession: (session) => set({ session }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, lists: [], budgets: [], priceHistory: [], currentPage: 'myLists', currentListId: null });
      },
      fetchInitialData: async () => {
        const { session } = get();
        if (!session) return;
        
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*, items(*)')
          .eq('user_id', session.user.id);
        
        if (listsError) console.error("Error fetching lists", listsError);
        else set({ lists: listsData.map(mapListFromDb) });

        // NOTE: Budgets and PriceHistory fetching would be added here similarly
      },

      setCurrentPage: (page, listId = null) => set({ currentPage: page, currentListId: listId }),
      setHasSeenOnboarding: (status) => set({ hasSeenOnboarding: status }),
      setTheme: (theme) => set({ theme }),

      setMonthlyBudget: async (amount, date) => {
         // TODO: Supabase integration
        console.log("setMonthlyBudget needs to be migrated to Supabase.");
      },

      addList: async (listData) => {
        const { session } = get();
        if (!session) return;
        const { data, error } = await supabase
            .from('lists')
            .insert({
                name: listData.name,
                category: listData.category,
                list_budget: listData.listBudget,
                user_id: session.user.id,
            })
            .select()
            .single();

        if (error) console.error("Error adding list:", error);
        else {
            const newList = mapListFromDb(data);
            set((state) => ({ lists: [...state.lists, newList] }));
            get().setCurrentPage('listDetail', newList.id);
        }
      },

      updateList: async (listId, updates) => {
        const dbUpdates: Record<string, any> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.status) dbUpdates.status = updates.status;
        if (typeof updates.isPinned === 'boolean') dbUpdates.is_pinned = updates.isPinned;
        if (typeof updates.listBudget === 'number') dbUpdates.list_budget = updates.listBudget;
        
        const { error } = await supabase.from('lists').update(dbUpdates).eq('id', listId);

        if (error) console.error("Error updating list", error);
        else {
            set((state) => ({
              lists: state.lists.map(list => list.id === listId ? { ...list, ...updates } : list),
            }));
            if(updates.status === 'completed') {
                const completedList = get().lists.find(l => l.id === listId);
                if(completedList) get().recordPriceHistory(completedList);
            }
        }
      },

      deleteList: async (listId) => {
        const { error } = await supabase.from('lists').delete().eq('id', listId);
        if (error) console.error("Error deleting list", error);
        else set((state) => ({ lists: state.lists.filter(list => list.id !== listId) }));
      },

      duplicateList: async (listId) => {
        // This is more complex with a DB, involving multiple queries.
        // For simplicity, we'll keep it as a placeholder.
        console.log("duplicateList needs to be migrated to Supabase.");
      },

      addItemToList: async (listId, itemData) => {
         const { session } = get();
         if (!session) return;
         // In a real scenario, we'd check for existing items first.
         const { data, error } = await supabase.from('items').insert({
             name: itemData.name,
             quantity: itemData.quantity,
             unit_price: itemData.unitPrice,
             category: itemData.category,
             list_id: listId,
             user_id: session.user.id,
             item_order: get().lists.find(l => l.id === listId)?.items.length || 0,
         }).select().single();
         
         if (error) console.error("Error adding item", error);
         else {
             const newItem = mapItemFromDb(data);
             set(state => ({
                 lists: state.lists.map(l => l.id === listId ? {...l, items: [...l.items, newItem].sort((a,b) => a.order - b.order)} : l)
             }));
         }
      },

      updateItemInList: async (listId, itemId, updates) => {
        const dbUpdates: Record<string, any> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.quantity) dbUpdates.quantity = updates.quantity;
        if (typeof updates.unitPrice === 'number') dbUpdates.unit_price = updates.unitPrice;
        if (updates.category) dbUpdates.category = updates.category;
        if (typeof updates.isPurchased === 'boolean') dbUpdates.is_purchased = updates.isPurchased;

        const { error } = await supabase.from('items').update(dbUpdates).eq('id', itemId);
        if (error) console.error("Error updating item", error);
        else {
            set((state) => ({
              lists: state.lists.map(list => 
                list.id === listId
                  ? { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
                  : list
              ),
            }));
        }
      },

      removeItemFromList: async (listId, itemId) => {
        const { error } = await supabase.from('items').delete().eq('id', itemId);
        if (error) console.error("Error removing item", error);
        else {
            set((state) => ({
              lists: state.lists.map(list =>
                list.id === listId
                  ? { ...list, items: list.items.filter(item => item.id !== itemId) }
                  : list
              ),
            }));
        }
      },
      
      updateItemOrder: async (listId, itemOrders) => {
          const updates = itemOrders.map(o => supabase.from('items').update({ item_order: o.newOrder }).eq('id', o.itemId));
          const results = await Promise.all(updates);
          const hasError = results.some(res => res.error);

          if (hasError) console.error("Error updating item order", results);
          else {
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
          }
      },

      recordPriceHistory: async (list) => {
         console.log("recordPriceHistory needs to be migrated to Supabase.");
      },
    })
);
