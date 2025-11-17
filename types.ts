import { Session } from '@supabase/supabase-js';

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
  created_at?: string;
}

export interface ShoppingList {
  id: string;
  user_id?: string;
  name: string;
  createdAt: string;
  items: ListItem[];
  spendingForecast?: number;
  listBudget?: number;
  category: string;
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

export interface RawPurchaseHistoryItem {
    id: string;
    user_id: string;
    item_name: string;
    total_price: number;
    purchased_at: string;
    category: string;
    original_item_id: string;
}

export interface AppState {
  // UI State
  loadingStates: { [key: string]: boolean };
  error: string | null;

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
  rawPurchaseHistory: RawPurchaseHistoryItem[];

  // Actions
  // UI Actions
  setLoadingState: (key: string, isLoading: boolean) => void;
  setError: (error: string | null) => void;

  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  setCurrentPage: (page: Page, listId?: string | null) => void;
  setHasSeenOnboarding: (status: boolean) => void;
  setTheme: (theme: Theme) => void;
  
  // Budget Actions
  setMonthlyBudget: (amount: number, date: Date) => Promise<void>;
  
  // List Actions
  addList: (list: { name: string, category: string, listBudget?: number }) => Promise<void>;
  updateList: (listId: string, updates: { name?: string; listBudget?: number; category?: string; }) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  duplicateList: (listId: string) => Promise<void>;
  finalizeList: (listId: string) => Promise<void>;

  // Item Actions
  addItemToList: (listId: string, item: Omit<ListItem, 'id' | 'isPurchased' | 'created_at'>) => Promise<void>;
  updateItemInList: (listId: string, itemId: string, updates: Partial<ListItem>) => Promise<void>;
  removeItemFromList: (listId: string, itemId: string) => Promise<void>;
  
  // Price History Actions
  recordPriceHistory: (list: ShoppingList) => Promise<void>;
}