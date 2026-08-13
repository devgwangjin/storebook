import { supabase } from './supabase';
import { Transaction, CategoryItem, MonthData, TransactionType } from './storebook-types';

export const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { value: '급여', label: '급여 💰' },
  { value: '지원금', label: '지원금 🎁' },
  { value: '투자/부업', label: '투자/부업 📈' },
  { value: '기타', label: '기타 수입 🪙' }
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  { value: '쇼핑/카드', label: '쇼핑/카드 💳' },
  { value: '주거/월세', label: '주거/월세 🏠' },
  { value: '보험/세금', label: '보험/세금 🛡️' },
  { value: '식비', label: '식비 🍔' },
  { value: '교통', label: '교통 🚗' },
  { value: '생활비', label: '생활비/기타 🛒' }
];

export const INITIAL_DEMO_DATA: Record<string, MonthData> = {
  '2026-07': {
    carryOver: 560000,
    transactions: [
      { id: 'tx-demo-1', type: 'income', name: '월급', amount: 2780000, category: '급여', isRecurring: true, date: '2026-07-25' },
      { id: 'tx-demo-2', type: 'income', name: "'그거' 지원금", amount: 1200000, category: '지원금', isRecurring: false, date: '2026-07-10' },
      { id: 'tx-demo-3', type: 'expense', name: '카드', amount: 537460, category: '쇼핑/카드', isRecurring: false, date: '2026-07-15' },
      { id: 'tx-demo-4', type: 'expense', name: '보험', amount: 100000, category: '보험/세금', isRecurring: true, date: '2026-07-20' },
      { id: 'tx-demo-5', type: 'expense', name: '월세', amount: 450000, category: '주거/월세', isRecurring: true, date: '2026-07-01' },
      { id: 'tx-demo-6', type: 'expense', name: '최저한도 맞추기', amount: 440000, category: '생활비', isRecurring: false, date: '2026-07-05' }
    ]
  }
};

/**
 * Fetch month data for given YYYY-MM
 */
export async function fetchMonthData(yearMonth: string): Promise<MonthData> {
  try {
    if (supabase) {
      // 1. Fetch carry-over balance
      const { data: summaryData, error: summaryErr } = await supabase
        .from('storebook_monthly_summaries')
        .select('carry_over')
        .eq('year_month', yearMonth)
        .single();

      // 2. Fetch transactions for yearMonth
      const { data: txData, error: txErr } = await supabase
        .from('storebook_transactions')
        .select('*')
        .eq('year_month', yearMonth)
        .order('date', { ascending: false });

      if (!summaryErr || !txErr) {
        const carryOver = summaryData ? Number(summaryData.carry_over) : 0;
        const transactions: Transaction[] = (txData || []).map((row: any) => ({
          id: row.id,
          type: row.type,
          name: row.name,
          amount: Number(row.amount),
          category: row.category,
          isRecurring: row.is_recurring,
          date: row.date
        }));

        return { carryOver, transactions };
      }
    }
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to LocalStorage/Demo data', err);
  }

  // Fallback to LocalStorage / Demo Data
  return getLocalStorageMonthData(yearMonth);
}

/**
 * Save / Update Carry Over Balance
 */
export async function saveCarryOverBalance(yearMonth: string, amount: number): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('storebook_monthly_summaries')
        .upsert({ year_month: yearMonth, carry_over: amount, updated_at: new Date().toISOString() });
      if (!error) return true;
    }
  } catch (e) {
    console.warn('Supabase saveCarryOver failed', e);
  }

  // Fallback
  const current = getLocalStorageMonthData(yearMonth);
  current.carryOver = amount;
  saveLocalStorageMonthData(yearMonth, current);
  return true;
}

/**
 * Add Transaction
 */
export async function addTransaction(yearMonth: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const newId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('storebook_transactions')
        .insert({
          year_month: yearMonth,
          type: tx.type,
          name: tx.name,
          amount: tx.amount,
          category: tx.category,
          is_recurring: tx.isRecurring,
          date: tx.date
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          type: data.type,
          name: data.name,
          amount: Number(data.amount),
          category: data.category,
          isRecurring: data.is_recurring,
          date: data.date
        };
      }
    }
  } catch (e) {
    console.warn('Supabase addTransaction failed', e);
  }

  // LocalStorage Fallback
  const fullTx: Transaction = { id: newId, ...tx };
  const current = getLocalStorageMonthData(yearMonth);
  current.transactions.unshift(fullTx);
  saveLocalStorageMonthData(yearMonth, current);
  return fullTx;
}

/**
 * Delete Transaction
 */
export async function deleteTransaction(yearMonth: string, id: string): Promise<boolean> {
  try {
    if (supabase && !id.startsWith('tx-demo-') && !id.startsWith('tx-')) {
      const { error } = await supabase
        .from('storebook_transactions')
        .delete()
        .eq('id', id);
      if (!error) return true;
    }
  } catch (e) {
    console.warn('Supabase deleteTransaction failed', e);
  }

  // LocalStorage Fallback
  const current = getLocalStorageMonthData(yearMonth);
  current.transactions = current.transactions.filter(t => t.id !== id);
  saveLocalStorageMonthData(yearMonth, current);
  return true;
}

/**
 * Fetch Categories
 */
export async function fetchCategories(): Promise<{ income: CategoryItem[]; expense: CategoryItem[] }> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('storebook_categories').select('*');
      if (!error && data && data.length > 0) {
        const income = data.filter((c: any) => c.type === 'income').map((c: any) => ({ value: c.value, label: c.label }));
        const expense = data.filter((c: any) => c.type === 'expense').map((c: any) => ({ value: c.value, label: c.label }));
        if (income.length > 0 || expense.length > 0) {
          return {
            income: income.length > 0 ? income : DEFAULT_INCOME_CATEGORIES,
            expense: expense.length > 0 ? expense : DEFAULT_EXPENSE_CATEGORIES
          };
        }
      }
    }
  } catch (e) {
    console.warn('Supabase fetchCategories failed', e);
  }

  return getLocalStorageCategories();
}

/**
 * Add Category
 */
export async function addCategory(type: TransactionType, value: string, label: string): Promise<CategoryItem> {
  const newItem = { value, label };
  try {
    if (supabase) {
      const { error } = await supabase.from('storebook_categories').insert({ type, value, label });
      if (!error) return newItem;
    }
  } catch (e) {
    console.warn('Supabase addCategory failed', e);
  }

  const current = getLocalStorageCategories();
  if (type === 'income') current.income.push(newItem);
  else current.expense.push(newItem);
  saveLocalStorageCategories(current);
  return newItem;
}

/**
 * Delete Category
 */
export async function deleteCategory(type: TransactionType, value: string): Promise<boolean> {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('storebook_categories')
        .delete()
        .eq('type', type)
        .eq('value', value);
      if (!error) return true;
    }
  } catch (e) {
    console.warn('Supabase deleteCategory failed', e);
  }

  const current = getLocalStorageCategories();
  if (type === 'income') {
    current.income = current.income.filter((c) => c.value !== value);
  } else {
    current.expense = current.expense.filter((c) => c.value !== value);
  }
  saveLocalStorageCategories(current);
  return true;
}

/**
 * Sync LocalStorage data to Supabase DB
 */
export async function syncLocalStorageToSupabase(): Promise<number> {
  if (!supabase) return 0;
  let count = 0;
  try {
    const raw = localStorage.getItem('storebook_data');
    if (!raw) return 0;
    const allData = JSON.parse(raw);
    for (const ym of Object.keys(allData)) {
      const mData = allData[ym];
      if (mData.carryOver) {
        await saveCarryOverBalance(ym, mData.carryOver);
      }
      if (mData.transactions && mData.transactions.length > 0) {
        for (const tx of mData.transactions) {
          await addTransaction(ym, {
            type: tx.type,
            name: tx.name,
            amount: tx.amount,
            category: tx.category,
            isRecurring: tx.isRecurring,
            date: tx.date,
          });
          count++;
        }
      }
    }
  } catch (e) {
    console.error('syncLocalStorageToSupabase error', e);
  }
  return count;
}

/**
 * LocalStorage Helper Functions
 */
function getLocalStorageMonthData(yearMonth: string): MonthData {
  if (typeof window === 'undefined') return INITIAL_DEMO_DATA[yearMonth] || { carryOver: 0, transactions: [] };
  try {
    const raw = localStorage.getItem('storebook_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[yearMonth]) return parsed[yearMonth];
    }
  } catch (e) {
    console.error('LocalStorage error', e);
  }
  return INITIAL_DEMO_DATA[yearMonth] || { carryOver: 0, transactions: [] };
}

function saveLocalStorageMonthData(yearMonth: string, data: MonthData) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('storebook_data');
    const allData = raw ? JSON.parse(raw) : { ...INITIAL_DEMO_DATA };
    allData[yearMonth] = data;
    localStorage.setItem('storebook_data', JSON.stringify(allData));
  } catch (e) {
    console.error('saveLocalStorageMonthData error', e);
  }
}

function getLocalStorageCategories(): { income: CategoryItem[]; expense: CategoryItem[] } {
  if (typeof window === 'undefined') return { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES };
  try {
    const inc = localStorage.getItem('storebook_income_categories');
    const exp = localStorage.getItem('storebook_expense_categories');
    return {
      income: inc ? JSON.parse(inc) : DEFAULT_INCOME_CATEGORIES,
      expense: exp ? JSON.parse(exp) : DEFAULT_EXPENSE_CATEGORIES
    };
  } catch (e) {
    return { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES };
  }
}

function saveLocalStorageCategories(cats: { income: CategoryItem[]; expense: CategoryItem[] }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('storebook_income_categories', JSON.stringify(cats.income));
  localStorage.setItem('storebook_expense_categories', JSON.stringify(cats.expense));
}
