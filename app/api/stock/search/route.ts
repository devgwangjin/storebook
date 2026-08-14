import { NextResponse } from 'next/server';

interface StockSearchResult {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  type: string;
}

// Curated dictionary for Korean stock names & popular global tickers
const KOREAN_STOCKS: StockSearchResult[] = [
  { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '035420.KS', name: 'NAVER (네이버)', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '005380.KS', name: '현대차', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '373220.KS', name: 'LG에너지솔루션', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '207940.KS', name: '삼성바이오로직스', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '068270.KS', name: '셀트리온', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '000270.KS', name: '기아', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '005490.KS', name: 'POSCO홀딩스', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '105560.KS', name: 'KB금융', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '055550.KS', name: '신한지주', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '003550.KS', name: 'LG', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '012330.KS', name: '현대모비스', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '028260.KS', name: '삼성물산', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '051910.KS', name: 'LG화학', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '006400.KS', name: '삼성SDI', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '035720.KS', name: '카카오페이', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '323410.KS', name: '카카오뱅크', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '259960.KS', name: '크래프톤', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '036570.KS', name: '엔씨소프트', market: 'KR', currency: 'KRW', type: 'Equity' },
  { symbol: '001500.KS', name: '현대차2우B', market: 'KR', currency: 'KRW', type: 'Equity' },
  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc. (애플)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp (엔비디아)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'TSLA', name: 'Tesla Inc. (테슬라)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'MSFT', name: 'Microsoft Corp (마이크로소프트)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'AMZN', name: 'Amazon.com (아마존)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (구글)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'META', name: 'Meta Platforms (메타/페이스북)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'NFLX', name: 'Netflix Inc. (넷플릭스)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'PLTR', name: 'Palantir Technologies (팔란티어)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor (TSMC)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'AMD', name: 'Advanced Micro Devices (AMD)', market: 'US', currency: 'USD', type: 'Equity' },
  { symbol: 'SOXL', name: 'Direxion Semiconductor 3X (SOXL)', market: 'US', currency: 'USD', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (나스닥 100 ETF)', market: 'US', currency: 'USD', type: 'ETF' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF (SPY)', market: 'US', currency: 'USD', type: 'ETF' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query) {
    return NextResponse.json({ results: KOREAN_STOCKS.slice(0, 10) });
  }

  // 1. Local curated search matching
  const localMatches = KOREAN_STOCKS.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.symbol.toLowerCase().includes(query)
  );

  // 2. Fetch live online search from Yahoo Finance API
  try {
    const yahooRes = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    );

    if (yahooRes.ok) {
      const data = await yahooRes.json();
      const yahooQuotes = (data.quotes || []).map((q: any) => {
        const isKR = q.symbol.endsWith('.KS') || q.symbol.endsWith('.KQ');
        return {
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          market: (isKR ? 'KR' : 'US') as 'KR' | 'US',
          currency: (isKR ? 'KRW' : 'USD') as 'KRW' | 'USD',
          type: q.quoteType || 'Equity',
        };
      });

      // Merge localMatches and yahooQuotes, avoiding duplicates
      const mergedMap = new Map<string, StockSearchResult>();
      localMatches.forEach((m) => mergedMap.set(m.symbol, m));
      yahooQuotes.forEach((y: StockSearchResult) => {
        if (!mergedMap.has(y.symbol)) {
          mergedMap.set(y.symbol, y);
        }
      });

      return NextResponse.json({ results: Array.from(mergedMap.values()).slice(0, 12) });
    }
  } catch (e) {
    console.warn('Yahoo stock search failed, fallback to local search', e);
  }

  return NextResponse.json({ results: localMatches });
}
