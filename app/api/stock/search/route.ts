import { NextResponse } from 'next/server';

interface StockSearchResult {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  type: string;
}

// Popular Korean Stocks & ETFs Dictionary with exact Korean names & codes
const KOREAN_POPULAR_DICT: Record<string, { symbol: string; name: string; market: 'KR'; currency: 'KRW' }> = {
  '379810': { symbol: '379810.KS', name: 'KODEX 미국나스닥100TR', market: 'KR', currency: 'KRW' },
  'kodex 미국나스닥100': { symbol: '379810.KS', name: 'KODEX 미국나스닥100TR', market: 'KR', currency: 'KRW' },
  'kodex 미국나스닥100tr': { symbol: '379810.KS', name: 'KODEX 미국나스닥100TR', market: 'KR', currency: 'KRW' },
  '379800': { symbol: '379800.KS', name: 'KODEX 미국S&P500TR', market: 'KR', currency: 'KRW' },
  'kodex 미국s&p500': { symbol: '379800.KS', name: 'KODEX 미국S&P500TR', market: 'KR', currency: 'KRW' },
  '360750': { symbol: '360750.KS', name: 'TIGER 미국S&P500', market: 'KR', currency: 'KRW' },
  'tiger 미국s&p500': { symbol: '360750.KS', name: 'TIGER 미국S&P500', market: 'KR', currency: 'KRW' },
  '133690': { symbol: '133690.KS', name: 'TIGER 미국나스닥100', market: 'KR', currency: 'KRW' },
  'tiger 미국나스닥100': { symbol: '133690.KS', name: 'TIGER 미국나스닥100', market: 'KR', currency: 'KRW' },
  '368590': { symbol: '368590.KS', name: 'ACE 미국S&P500', market: 'KR', currency: 'KRW' },
  'ace 미국s&p500': { symbol: '368590.KS', name: 'ACE 미국S&P500', market: 'KR', currency: 'KRW' },
  '446720': { symbol: '446720.KS', name: 'SOL 미국배당다우존스', market: 'KR', currency: 'KRW' },
  'sol 미국배당다우존스': { symbol: '446720.KS', name: 'SOL 미국배당다우존스', market: 'KR', currency: 'KRW' },
  '005930': { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW' },
  '삼성전자': { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW' },
  '000660': { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW' },
  'sk하이닉스': { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW' },
  '035720': { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW' },
  '카카오': { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW' },
  '035420': { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW' },
  '네이버': { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW' },
  '005380': { symbol: '005380.KS', name: '현대차', market: 'KR', currency: 'KRW' },
  '현대차': { symbol: '005380.KS', name: '현대차', market: 'KR', currency: 'KRW' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({
      results: [
        { symbol: '379810.KS', name: 'KODEX 미국나스닥100TR (379810)', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '379800.KS', name: 'KODEX 미국S&P500TR (379800)', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '360750.KS', name: 'TIGER 미국S&P500 (360750)', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '133690.KS', name: 'TIGER 미국나스닥100 (133690)', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '005930.KS', name: '삼성전자 (005930)', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: '000660.KS', name: 'SK하이닉스 (000660)', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: 'AAPL', name: 'Apple Inc. (애플)', market: 'US', currency: 'USD', type: 'Equity' },
        { symbol: 'NVDA', name: 'NVIDIA Corp (엔비디아)', market: 'US', currency: 'USD', type: 'Equity' },
      ],
    });
  }

  const results: StockSearchResult[] = [];
  const addedSymbols = new Set<string>();

  const qClean = query.toLowerCase().replace(/\s+/g, '');

  // 1. Direct match with Local Popular Dictionary (supporting code 379810, name, etc.)
  for (const [key, item] of Object.entries(KOREAN_POPULAR_DICT)) {
    const keyClean = key.replace(/\s+/g, '');
    if (keyClean.includes(qClean) || item.name.replace(/\s+/g, '').toLowerCase().includes(qClean) || item.symbol.includes(query)) {
      if (!addedSymbols.has(item.symbol)) {
        addedSymbols.add(item.symbol);
        results.push({
          ...item,
          type: item.name.includes('KODEX') || item.name.includes('TIGER') || item.name.includes('ACE') || item.name.includes('SOL') ? 'ETF' : 'Equity',
        });
      }
    }
  }

  // 2. Fetch Naver Finance Autocomplete API
  try {
    const naverRes = await fetch(
      `https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    );

    if (naverRes.ok) {
      const data = await naverRes.json();
      const items = data?.items?.[0] || [];
      for (const item of items) {
        if (Array.isArray(item) && item.length >= 2) {
          const rawName = item[0]?.[0] || item[0];
          const rawCode = item[1]?.[0] || item[1];
          if (typeof rawName === 'string' && typeof rawCode === 'string' && /^\d{6}$/.test(rawCode)) {
            const symbol = `${rawCode}.KS`;
            if (!addedSymbols.has(symbol)) {
              addedSymbols.add(symbol);
              results.push({
                symbol,
                name: `${rawName} (${rawCode})`,
                market: 'KR',
                currency: 'KRW',
                type: rawName.includes('ETF') || rawName.includes('TIGER') || rawName.includes('KODEX') || rawName.includes('ACE') || rawName.includes('SOL') ? 'ETF' : 'Equity',
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Naver search API error', e);
  }

  // 3. Fallback: If 6-digit numeric code supplied (e.g. 379810), directly format symbol 379810.KS
  if (/^\d{6}$/.test(query)) {
    const symbol = `${query}.KS`;
    if (!addedSymbols.has(symbol)) {
      addedSymbols.add(symbol);
      results.push({
        symbol,
        name: `KODEX/TIGER 종목 (${query})`,
        market: 'KR',
        currency: 'KRW',
        type: 'ETF',
      });
    }
  }

  // 4. Yahoo Finance Search for US Stocks & Tickers
  try {
    const yahooRes = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    );

    if (yahooRes.ok) {
      const data = await yahooRes.json();
      const yahooQuotes = data.quotes || [];
      for (const q of yahooQuotes) {
        const isKR = q.symbol?.endsWith('.KS') || q.symbol?.endsWith('.KQ');
        if (!isKR && q.symbol && !addedSymbols.has(q.symbol)) {
          addedSymbols.add(q.symbol);
          results.push({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            market: 'US',
            currency: 'USD',
            type: q.quoteType || 'Equity',
          });
        }
      }
    }
  } catch (e) {
    console.warn('Yahoo search error', e);
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
