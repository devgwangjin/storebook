import { supabase } from './supabase';
import { StockItem } from './stock-types';

// Empty — no more fake demo data anywhere
export const INITIAL_DEMO_STOCKS: StockItem[] = [];

/**
 * Fetch stocks from Supabase Cloud DB.
 * If cloud is empty but localStorage has real stocks, AUTO-SYNC them to cloud first.
 * This ensures PC-registered stocks appear on phone without any manual action.
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
        if (data.length > 0) {
          // Cloud has stocks — this is the truth
          const cloudStocks = data.map(parseCloudRow);
          if (typeof window !== 'undefined') {
            saveLocalStorageStocks(cloudStocks);
          }
          return cloudStocks;
        }

        // Cloud is empty — check if localStorage has real (non-demo) stocks to auto-sync
        if (typeof window !== 'undefined') {
          const localStocks = getRealLocalStocks();
          if (localStocks.length > 0) {
            // AUTO-SYNC: push localStorage stocks to cloud silently
            const synced = await autoSyncToCloud(localStocks);
            if (synced.length > 0) {
              return synced;
            }
          }
        }

        // Both empty — return empty
        return [];
      }
    }
  } catch (e) {
    console.warn('Supabase fetchUserStocks failed, fallback to LocalStorage', e);
  }

  // Supabase connection failed — use localStorage as offline fallback
  return getRealLocalStocks();
}

/**
 * Add a new Stock — always writes to cloud first, then caches locally
 */
export async function addStock(stock: Omit<StockItem, 'id'>): Promise<StockItem> {
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
        const created = parseCloudRow(data);
        const current = getRealLocalStocks();
        current.unshift(created);
        saveLocalStorageStocks(current);
        return created;
      }
    }
  } catch (e) {
    console.warn('Supabase addStock failed, fallback to LocalStorage', e);
  }

  // Offline fallback
  const newId = 'stock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const fullStock: StockItem = { id: newId, ...stock };
  const current = getRealLocalStocks();
  current.unshift(fullStock);
  saveLocalStorageStocks(current);
  return fullStock;
}

/**
 * Delete Stock — removes from cloud and local cache
 */
export async function deleteStock(id: string): Promise<boolean> {
  try {
    if (supabase && !id.startsWith('stock-')) {
      const { error } = await supabase
        .from('storebook_transactions')
        .delete()
        .eq('id', id);
      if (!error) {
        removeFromLocalCache(id);
        return true;
      }
    }
  } catch (e) {
    console.warn('Supabase deleteStock failed', e);
  }

  removeFromLocalCache(id);
  return true;
}

/**
 * Manual cloud sync (for the sync button)
 */
export async function syncLocalStocksToSupabase(): Promise<number> {
  if (!supabase) return 0;
  const localStocks = getRealLocalStocks();
  if (localStocks.length === 0) return 0;
  const synced = await autoSyncToCloud(localStocks);
  return synced.length;
}

// ─── Internal helpers ───────────────────────────────────────

function parseCloudRow(r: any): StockItem {
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
}

/**
 * Silently push local stocks to cloud and return the cloud-stored versions.
 */
async function autoSyncToCloud(localStocks: StockItem[]): Promise<StockItem[]> {
  if (!supabase) return localStocks;
  const results: StockItem[] = [];

  for (const s of localStocks) {
    const encodedCategory = `${s.symbol}|${s.quantity}|${s.currency}|${s.market}`;
    try {
      const { data, error } = await supabase
        .from('storebook_transactions')
        .insert({
          year_month: 'STOCKS',
          type: 'income',
          name: s.name,
          amount: s.avgPrice,
          category: encodedCategory,
          is_recurring: false,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (!error && data) {
        results.push(parseCloudRow(data));
      } else {
        results.push(s); // keep local version as fallback
      }
    } catch {
      results.push(s);
    }
  }

  // Replace local cache with cloud-assigned IDs
  if (results.length > 0) {
    saveLocalStorageStocks(results);
  }

  return results;
}

/**
 * Get localStorage stocks, filtering out old demo IDs
 */
function getRealLocalStocks(): StockItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('storebook_stocks_data');
    if (raw) {
      const parsed: StockItem[] = JSON.parse(raw);
      return parsed.filter((s) => !s.id.startsWith('stock-demo-'));
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

function removeFromLocalCache(id: string) {
  if (typeof window === 'undefined') return;
  const current = getRealLocalStocks();
  const updated = current.filter((s) => s.id !== id);
  saveLocalStorageStocks(updated);
}
