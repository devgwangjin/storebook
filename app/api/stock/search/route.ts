import { NextResponse } from 'next/server';

interface StockSearchResult {
  symbol: string;
  name: string;
  market: 'KR' | 'US';
  currency: 'KRW' | 'USD';
  type: string;
}

// Popular Korean Stocks & ETFs Dictionary with Korean Names
const KOREAN_POPULAR_DICT: Record<string, { symbol: string; name: string; market: 'KR'; currency: 'KRW' }> = {
  '삼성전자': { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW' },
  'sk하이닉스': { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW' },
  '카카오': { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW' },
  '네이버': { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW' },
  'naver': { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW' },
  '현대차': { symbol: '005380.KS', name: '현대차', market: 'KR', currency: 'KRW' },
  'lg에너지솔루션': { symbol: '373220.KS', name: 'LG에너지솔루션', market: 'KR', currency: 'KRW' },
  '삼성바이오로직스': { symbol: '207940.KS', name: '삼성바이오로직스', market: 'KR', currency: 'KRW' },
  '셀트리온': { symbol: '068270.KS', name: '셀트리온', market: 'KR', currency: 'KRW' },
  '기아': { symbol: '000270.KS', name: '기아', market: 'KR', currency: 'KRW' },
  'posco홀딩스': { symbol: '005490.KS', name: 'POSCO홀딩스', market: 'KR', currency: 'KRW' },
  '포스코홀딩스': { symbol: '005490.KS', name: 'POSCO홀딩스', market: 'KR', currency: 'KRW' },
  'kb금융': { symbol: '105560.KS', name: 'KB금융', market: 'KR', currency: 'KRW' },
  '신한지주': { symbol: '055550.KS', name: '신한지주', market: 'KR', currency: 'KRW' },
  'tiger 미국s&p500': { symbol: '360750.KS', name: 'TIGER 미국S&P500', market: 'KR', currency: 'KRW' },
  'kodex 미국s&p500': { symbol: '379800.KS', name: 'KODEX 미국S&P500', market: 'KR', currency: 'KRW' },
  'ace 미국s&p500': { symbol: '368590.KS', name: 'ACE 미국S&P500', market: 'KR', currency: 'KRW' },
  'sol 미국배당다우존스': { symbol: '446720.KS', name: 'SOL 미국배당다우존스', market: 'KR', currency: 'KRW' },
  'tiger 미국나스닥100': { symbol: '133690.KS', name: 'TIGER 미국나스닥100', market: 'KR', currency: 'KRW' },
  'kodex 200': { symbol: '069500.KS', name: 'KODEX 200', market: 'KR', currency: 'KRW' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({
      results: [
        { symbol: '005930.KS', name: '삼성전자', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: '000660.KS', name: 'SK하이닉스', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: '360750.KS', name: 'TIGER 미국S&P500', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '379800.KS', name: 'KODEX 미국S&P500', market: 'KR', currency: 'KRW', type: 'ETF' },
        { symbol: '035720.KS', name: '카카오', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: '035420.KS', name: 'NAVER', market: 'KR', currency: 'KRW', type: 'Equity' },
        { symbol: 'AAPL', name: 'Apple Inc. (애플)', market: 'US', currency: 'USD', type: 'Equity' },
        { symbol: 'NVDA', name: 'NVIDIA Corp (엔비디아)', market: 'US', currency: 'USD', type: 'Equity' },
        { symbol: 'TSLA', name: 'Tesla Inc. (테슬라)', market: 'US', currency: 'USD', type: 'Equity' },
      ],
    });
  }

  const results: StockSearchResult[] = [];
  const addedSymbols = new Set<string>();

  // 1. Fetch Naver Finance Autocomplete API for 100% Korean Stock & ETF Names!
  try {
    const naverRes = await fetch(
      `https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    );

    if (naverRes.ok) {
      const data = await naverRes.json();
      // Naver returns format: { items: [[ ["종목명", "종목코드", ...], ... ]] }
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
                name: rawName,
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

  // 2. Local Popular Dictionary Fallback
  const qLower = query.toLowerCase();
  for (const [key, item] of Object.entries(KOREAN_POPULAR_DICT)) {
    if (key.includes(qLower) || item.name.toLowerCase().includes(qLower)) {
      if (!addedSymbols.has(item.symbol)) {
        addedSymbols.add(item.symbol);
        results.push({
          ...item,
          type: item.name.includes('TIGER') || item.name.includes('KODEX') || item.name.includes('ACE') ? 'ETF' : 'Equity',
        });
      }
    }
  }

  // 3. Yahoo Finance Search for US Stocks & Tickers
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
