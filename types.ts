
export type ListStatus = 'active' | 'completed' | 'archived';
export type Theme = 'light' | 'dark' | 'system';
export type Page = 'welcome' | 'setBudget' | 'myLists' | 'listDetail' | 'statistics' | 'history' | 'settings';

export interface ListItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
  isPurchased: boolean;
  order: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  status: ListStatus;
  items: ListItem[];
  isPinned: boolean;
  spendingForecast?: number;
  listBudget?: number;
}

export interface Budget {
  year: number;
  month: number;
  amount: number;
}

export interface PriceHistoryEntry {
  itemName: string;
  prices: { date: string; price: number }[];
}

export interface AppState {
  // Navigation & Settings
  currentPage: Page;
  currentListId: string | null;
  hasSeenOnboarding: boolean;
  theme: Theme;

  // Data
  lists: ShoppingList[];
  budgets: Budget[];
  priceHistory: PriceHistoryEntry[];

  // Actions
  setCurrentPage: (page: Page, listId?: string | null) => void;
  setHasSeenOnboarding: (status: boolean) => void;
  setTheme: (theme: Theme) => void;
  
  // Budget Actions
  setMonthlyBudget: (amount: number, date: Date) => void;
  
  // List Actions
  addList: (list: Omit<ShoppingList, 'id' | 'createdAt' | 'status' | 'items' | 'isPinned'>) => void;
  updateList: (listId: string, updates: Partial<ShoppingList>) => void;
  deleteList: (listId: string) => void;
  duplicateList: (listId: string) => void;

  // Item Actions
  addItemToList: (listId: string, item: Omit<ListItem, 'id' | 'isPurchased' | 'order'>) => void;
  updateItemInList: (listId: string, itemId: string, updates: Partial<ListItem>) => void;
  removeItemFromList: (listId: string, itemId: string) => void;
  updateItemOrder: (listId: string, itemOrders: { itemId: string; newOrder: number }[]) => void;
  
  // Price History Actions
  recordPriceHistory: (list: ShoppingList) => void;
}