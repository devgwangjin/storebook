import { supabase } from './supabase';
import { StockItem } from './stock-types';

export const INITIAL_DEMO_STOCKS: StockItem[] = [
  { id: 'stock-demo-1', symbol: '005930.KS', name: '삼성전자', market: 'KR', quantity: 35, avgPrice: 68500, currency: 'KRW' },
  { id: 'stock-demo-2', symbol: 'AAPL', name: 'Apple Inc.', market: 'US', quantity: 12, avgPrice: 175.5, currency: 'USD' },
  { id: 'stock-demo-3', symbol: 'NVDA', name: 'NVIDIA Corp', market: 'US', quantity: 8, avgPrice: 112.0, currency: 'USD' },
  { id: 'stock-demo-4', symbol: '005380.KS', name: '현대차', market: 'KR', quantity: 15, avgPrice: 242000, currency: 'KRW' },
];

/**
 * Fetch stocks list from Supabase or LocalStorage
 */
export async function fetchUserStocks(): Promise<StockItem[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('storebook_stocks').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          symbol: row.symbol,
          name: row.name,
          market: row.market as 'KR' | 'US',
          quantity: Number(row.quantity),
          avgPrice: Number(row.avg_price),
          currency: row.currency as 'KRW' | 'USD',
          createdAt: row.created_at,
        }));
      }
    }
  } catch (e) {
    console.warn('Supabase fetchUserStocks failed, fallback to LocalStorage', e);
  }

  return getLocalStorageStocks();
}

/**
 * Add a new Stock to Supabase or LocalStorage
 */
export async function addStock(stock: Omit<StockItem, 'id'>): Promise<StockItem> {
  const newId = 'stock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('storebook_stocks')
        .insert({
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          quantity: stock.quantity,
          avg_price: stock.avgPrice,
          currency: stock.currency,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          market: data.market,
          quantity: Number(data.quantity),
          avgPrice: Number(data.avg_price),
          currency: data.currency,
          createdAt: data.created_at,
        };
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
 * Delete Stock from Supabase or LocalStorage
 */
export async function deleteStock(id: string): Promise<boolean> {
  try {
    if (supabase && !id.startsWith('stock-demo-') && !id.startsWith('stock-')) {
      const { error } = await supabase.from('storebook_stocks').delete().eq('id', id);
      if (!error) return true;
    }
  } catch (e) {
    console.warn('Supabase deleteStock failed', e);
  }

  const current = getLocalStorageStocks();
  const updated = current.filter((s) => s.id !== id);
  saveLocalStorageStocks(updated);
  return true;
}

function getLocalStorageStocks(): StockItem[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_STOCKS;
  try {
    const raw = localStorage.getItem('storebook_stocks_data');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('LocalStorage stock error', e);
  }
  return INITIAL_DEMO_STOCKS;
}

function saveLocalStorageStocks(stocks: StockItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('storebook_stocks_data', JSON.stringify(stocks));
  } catch (e) {
    console.error('saveLocalStorageStocks error', e);
  }
}
