import { Session } from '@supabase/supabase-js';

export type ListStatus = 'active' | 'completed' | 'archived';
export type Theme = 'light' | 'dark' | 'system';
export type Page = 'welcome' | 'setBudget' | 'myLists' | 'listDetail' | 'statistics' | 'history' | 'settings';

export interface ListItem {
  id: string;
  list_id?: string;
  user_id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
  isPurchased: boolean;
  order: number;
  created_at?: string;
}

export interface ShoppingList {
  id: string;
  user_id?: string;
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
  id?: string;
  user_id?: string;
  year: number;
  month: number;
  amount: number;
}

export interface PriceHistoryEntry {
  id?: string;
  user_id?: string;
  itemName: string;
  prices: { date: string; price: number }[];
}

export interface AppState {
  // Auth
  session: Session | null;
  
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
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  setCurrentPage: (page: Page, listId?: string | null) => void;
  setHasSeenOnboarding: (status: boolean) => void;
  setTheme: (theme: Theme) => void;
  
  // Budget Actions
  setMonthlyBudget: (amount: number, date: Date) => Promise<void>;
  
  // List Actions
  addList: (list: Omit<ShoppingList, 'id' | 'createdAt' | 'status' | 'items' | 'isPinned'>) => Promise<void>;
  updateList: (listId: string, updates: Partial<ShoppingList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  duplicateList: (listId: string) => Promise<void>;

  // Item Actions
  addItemToList: (listId: string, item: Omit<ListItem, 'id' | 'isPurchased' | 'order'>) => Promise<void>;
  updateItemInList: (listId: string, itemId: string, updates: Partial<ListItem>) => Promise<void>;
  removeItemFromList: (listId: string, itemId: string) => Promise<void>;
  updateItemOrder: (listId: string, itemOrders: { itemId: string; newOrder: number }[]) => Promise<void>;
  
  // Price History Actions
  recordPriceHistory: (list: ShoppingList) => Promise<void>;
}
