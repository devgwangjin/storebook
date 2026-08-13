export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category: string;
  isRecurring: boolean;
  date: string; // YYYY-MM-DD
}

export interface CategoryItem {
  value: string;
  label: string;
}

export interface MonthData {
  carryOver: number;
  transactions: Transaction[];
}

export interface AppDataMap {
  [yearMonth: string]: MonthData; // key e.g. "2026-07"
}

export interface AppState {
  currentYear: number;
  currentMonth: number; // 1 ~ 12
  incomeCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  breakdownViewMode: 'grid' | 'bar';
}
