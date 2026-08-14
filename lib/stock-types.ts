export type MarketType = 'KR' | 'US';

export interface StockItem {
  id: string;
  symbol: string;       // e.g. '005930.KS' or 'AAPL'
  name: string;         // e.g. '삼성전자' or 'Apple Inc.'
  market: MarketType;   // 'KR' | 'US'
  quantity: number;     // e.g. 10
  avgPrice: number;     // e.g. 68000 (KRW) or 180.5 (USD)
  currency: 'KRW' | 'USD';
  createdAt?: string;
}

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  prevClose: number;
  change: number;
  changePercent: number;
  currency: 'KRW' | 'USD';
  marketState?: string;
}

export interface StockQuotesResponse {
  quotes: Record<string, StockQuote>;
  exchangeRate: number; // USD to KRW rate (e.g. 1350)
  updatedAt: string;
}
