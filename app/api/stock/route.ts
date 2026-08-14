import { NextResponse } from 'next/server';
import { StockQuote, StockQuotesResponse } from '@/lib/stock-types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || '005930.KS,AAPL,NVDA,TSLA';
  const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);

  const quotes: Record<string, StockQuote> = {};
  let exchangeRate = 1350; // Fallback USD/KRW rate

  try {
    // 1. Fetch USD/KRW exchange rate
    try {
      const fxRes = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } }
      );
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        const rate = fxData?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (rate && typeof rate === 'number') {
          exchangeRate = Math.round(rate * 100) / 100;
        }
      }
    } catch (e) {
      console.warn('Exchange rate fetch failed, using fallback 1350', e);
    }

    // 2. Fetch stock quotes for all requested symbols
    await Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 30 } }
          );
          if (res.ok) {
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta) {
              const currentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 0;
              const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
              const change = currentPrice - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
              const currency = meta.currency === 'KRW' ? 'KRW' : 'USD';

              quotes[sym] = {
                symbol: sym,
                currentPrice,
                prevClose,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                currency,
                marketState: meta.dataGranularity,
              };
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch quote for ${sym}`, err);
        }
      })
    );

    const response: StockQuotesResponse = {
      quotes,
      exchangeRate,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stock API error', error);
    return NextResponse.json({ quotes: {}, exchangeRate: 1350, updatedAt: new Date().toISOString() });
  }
}
