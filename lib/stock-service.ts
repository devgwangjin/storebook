import { supabase } from './supabase';
import { StockItem } from './stock-types';

// No more demo stocks fallback - cloud DB is the single source of truth
export const INITIAL_DEMO_STOCKS: StockItem[] = [];

/**
 * Fetch stocks list from Supabase Cloud DB (year_month = 'STOCKS')
 * Falls back to LocalStorage ONLY when Supabase connection itself fails.
 * When Supabase returns 0 rows, returns empty array (not demo data).
 */
export async function fetchUserStocks(): Promise<StockItem[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('storebook_transactions')
        .select('*')
        .eq('year_month', 'STOCKS')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Trust the cloud result, even if 0 rows
        const cloudStocks = data.map((r: any) => {
          const parts = (r.category || '').split('|');
          return {
            id: r.id,
            name: r.name,
            avgPrice: Number(r.amount),
            symbol: parts[0] || '',
            quantity: Number(parts[1]) || 1,
            currency: (parts[2] || 'KRW') as 'KRW' | 'USD',
            market: (parts[3] || 'KR') as 'KR' | 'US',
            createdAt: r.created_at,
          };
        });

        // Also save to localStorage as local cache
        if (typeof window !== 'undefined' && cloudStocks.length > 0) {
          saveLocalStorageStocks(cloudStocks);
        }

        return cloudStocks;
      }
    }
  } catch (e) {
    console.warn('Supabase fetchUserStocks failed, fallback to LocalStorage', e);
  }

  // Only reach here if Supabase connection itself failed
  return getLocalStorageStocks();
}

/**
 * Add a new Stock to Supabase Cloud DB & LocalStorage
 */
export async function addStock(stock: Omit<StockItem, 'id'>): Promise<StockItem> {
  const newId = 'stock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const encodedCategory = `${stock.symbol}|${stock.quantity}|${stock.currency}|${stock.market}`;

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('storebook_transactions')
        .insert({
          year_month: 'STOCKS',
          type: 'income',
          name: stock.name,
          amount: stock.avgPrice,
          category: encodedCategory,
          is_recurring: false,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (!error && data) {
        const parts = (data.category || '').split('|');
        const created: StockItem = {
          id: data.id,
          name: data.name,
          avgPrice: Number(data.amount),
          symbol: parts[0] || stock.symbol,
          quantity: Number(parts[1]) || stock.quantity,
          currency: (parts[2] || stock.currency) as 'KRW' | 'USD',
          market: (parts[3] || stock.market) as 'KR' | 'US',
          createdAt: data.created_at,
        };
        // Update local cache
        const current = getLocalStorageStocks();
        current.unshift(created);
        saveLocalStorageStocks(current);
        return created;
      }
    }
  } catch (e) {
    console.warn('Supabase addStock failed, fallback to LocalStorage', e);
  }

  const fullStock: StockItem = { id: newId, ...stock };
  const current = getLocalStorageStocks();
  current.unshift(fullStock);
  saveLocalStorageStocks(current);
  return fullStock;
}

/**
 * Delete Stock from Supabase Cloud DB & LocalStorage
 */
export async function deleteStock(id: string): Promise<boolean> {
  try {
    if (supabase && !id.startsWith('stock-')) {
      const { error } = await supabase
        .from('storebook_transactions')
        .delete()
        .eq('id', id);
      if (!error) {
        const current = getLocalStorageStocks();
        const updated = current.filter((s) => s.id !== id);
        saveLocalStorageStocks(updated);
        return true;
      }
    }
  } catch (e) {
    console.warn('Supabase deleteStock failed', e);
  }

  const current = getLocalStorageStocks();
  const updated = current.filter((s) => s.id !== id);
  saveLocalStorageStocks(updated);
  return true;
}

/**
 * Sync LocalStorage Stocks to Supabase Cloud DB
 */
export async function syncLocalStocksToSupabase(): Promise<number> {
  if (!supabase) return 0;
  let count = 0;
  try {
    const localStocks = getLocalStorageStocks();
    if (localStocks.length === 0) return 0;

    for (const s of localStocks) {
      // Only sync local-only items (IDs starting with 'stock-')
      if (s.id.startsWith('stock-')) {
        const encodedCategory = `${s.symbol}|${s.quantity}|${s.currency}|${s.market}`;
        const { error } = await supabase.from('storebook_transactions').insert({
          year_month: 'STOCKS',
          type: 'income',
          name: s.name,
          amount: s.avgPrice,
          category: encodedCategory,
          is_recurring: false,
          date: new Date().toISOString().split('T')[0],
        });
        if (!error) count++;
      }
    }
  } catch (e) {
    console.error('syncLocalStocksToSupabase error', e);
  }
  return count;
}

function getLocalStorageStocks(): StockItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('storebook_stocks_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Filter out old demo stocks
      return parsed.filter((s: StockItem) => !s.id.startsWith('stock-demo-'));
    }
  } catch (e) {
    console.error('LocalStorage stock error', e);
  }
  return [];
}

function saveLocalStorageStocks(stocks: StockItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('storebook_stocks_data', JSON.stringify(stocks));
  } catch (e) {
    console.error('saveLocalStorageStocks error', e);
  }
}
