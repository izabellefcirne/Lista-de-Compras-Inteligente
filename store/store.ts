import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, ShoppingList, ListItem } from '../types';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // STATE
      currentPage: 'myLists',
      currentListId: null,
      hasSeenOnboarding: false,
      theme: 'light',
      lists: [],
      budgets: [],
      priceHistory: [],

      // ACTIONS
      setCurrentPage: (page, listId = null) => set({ currentPage: page, currentListId: listId }),
      setHasSeenOnboarding: (status) => set({ hasSeenOnboarding: status }),
      setTheme: (theme) => set({ theme }),

      setMonthlyBudget: (amount, date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        set((state) => ({
          budgets: [
            ...state.budgets.filter(b => !(b.year === year && b.month === month)),
            { year, month, amount }
          ]
        }));
      },

      addList: (listData) => {
        const newList: ShoppingList = {
          ...listData,
          id: `list_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'active',
          items: [],
          isPinned: false,
          listBudget: undefined,
        };
        set((state) => ({ lists: [...state.lists, newList] }));
        get().setCurrentPage('listDetail', newList.id);
      },

      updateList: (listId, updates) => {
        set((state) => ({
          lists: state.lists.map(list => 
            list.id === listId ? { ...list, ...updates } : list
          ),
        }));
        if(updates.status === 'completed') {
            const completedList = get().lists.find(l => l.id === listId);
            if(completedList) get().recordPriceHistory(completedList);
        }
      },

      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter(list => list.id !== listId),
        }));
      },

      duplicateList: (listId) => {
        const listToDuplicate = get().lists.find(list => list.id === listId);
        if (!listToDuplicate) return;

        const duplicatedList: ShoppingList = {
          ...listToDuplicate,
          id: `list_${Date.now()}`,
          name: `${listToDuplicate.name} (Cópia)`,
          createdAt: new Date().toISOString(),
          status: 'active',
          isPinned: false,
          items: listToDuplicate.items.map(item => ({...item, isPurchased: false})) // Reset purchased status
        };
        set((state) => ({ lists: [...state.lists, duplicatedList] }));
      },

      addItemToList: (listId, itemData) => {
        set((state) => ({
          lists: state.lists.map(list => {
            if (list.id === listId) {
              const existingItem = list.items.find(item => item.name.toLowerCase() === itemData.name.toLowerCase());
              
              if (existingItem) {
                // Update existing item by adding quantity and updating price
                return {
                  ...list,
                  items: list.items.map(item =>
                    item.id === existingItem.id
                      ? { 
                          ...item, 
                          quantity: item.quantity + itemData.quantity, 
                          unitPrice: itemData.unitPrice > 0 ? itemData.unitPrice : item.unitPrice 
                        }
                      : item
                  ),
                };
              } else {
                // Add new item
                const newItem: ListItem = {
                  ...itemData,
                  id: `item_${Date.now()}`,
                  isPurchased: false,
                  order: list.items.length,
                };
                return { ...list, items: [...list.items, newItem] };
              }
            }
            return list;
          }),
        }));
      },

      updateItemInList: (listId, itemId, updates) => {
        set((state) => ({
          lists: state.lists.map(list => 
            list.id === listId
              ? { ...list, items: list.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
              : list
          ),
        }));
      },

      removeItemFromList: (listId, itemId) => {
        set((state) => ({
          lists: state.lists.map(list =>
            list.id === listId
              ? { ...list, items: list.items.filter(item => item.id !== itemId) }
              : list
          ),
        }));
      },
      
      updateItemOrder: (listId, itemOrders) => {
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
      },

      recordPriceHistory: (list) => {
        const today = new Date().toISOString();
        const priceHistory = get().priceHistory;
        const updatedPriceHistory = [...priceHistory];

        list.items.forEach(item => {
          if (item.unitPrice <= 0) return; // Don't record items without a price
          const entryIndex = updatedPriceHistory.findIndex(e => e.itemName.toLowerCase() === item.name.toLowerCase());
          const newPriceEntry = { date: today, price: item.unitPrice };

          if (entryIndex > -1) {
            updatedPriceHistory[entryIndex].prices.push(newPriceEntry);
          } else {
            updatedPriceHistory.push({
              itemName: item.name,
              prices: [newPriceEntry],
            });
          }
        });
        set({ priceHistory: updatedPriceHistory });
      },
    }),
    {
      name: 'smart-shopping-list-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);