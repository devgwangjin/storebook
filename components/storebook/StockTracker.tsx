'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StockItem, StockQuote } from '@/lib/stock-types';
import { fetchUserStocks, addStock, deleteStock } from '@/lib/stock-service';
import { formatCurrency } from '@/lib/storebook-utils';

const PRESET_STOCKS = [
  { name: '삼성전자', symbol: '005930.KS', market: 'KR' as const, currency: 'KRW' as const },
  { name: 'SK하이닉스', symbol: '000660.KS', market: 'KR' as const, currency: 'KRW' as const },
  { name: '현대차', symbol: '005380.KS', market: 'KR' as const, currency: 'KRW' as const },
  { name: '애플', symbol: 'AAPL', market: 'US' as const, currency: 'USD' as const },
  { name: '엔비디아', symbol: 'NVDA', market: 'US' as const, currency: 'USD' as const },
  { name: '테슬라', symbol: 'TSLA', market: 'US' as const, currency: 'USD' as const },
  { name: '마이크로소프트', symbol: 'MSFT', market: 'US' as const, currency: 'USD' as const },
];

const panelStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 28px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  minWidth: 0,
};

const cardStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 24px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  minWidth: 0,
};

export default function StockTracker() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [exchangeRate, setExchangeRate] = useState(1350);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [symbol, setSymbol] = useState('005930.KS');
  const [name, setName] = useState('삼성전자');
  const [market, setMarket] = useState<'KR' | 'US'>('KR');
  const [quantity, setQuantity] = useState('10');
  const [avgPrice, setAvgPrice] = useState('68500');
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');

  // Load stocks on mount
  const loadStocks = useCallback(async () => {
    setIsLoading(true);
    const list = await fetchUserStocks();
    setStocks(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // Fetch live quotes from /api/stock
  const fetchQuotes = useCallback(async (stockList: StockItem[]) => {
    if (stockList.length === 0) return;
    setIsFetchingQuotes(true);
    try {
      const symbolsStr = stockList.map((s) => s.symbol).join(',');
      const res = await fetch(`/api/stock?symbols=${encodeURIComponent(symbolsStr)}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || {});
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      }
    } catch (e) {
      console.warn('Failed to fetch stock quotes', e);
    } finally {
      setIsFetchingQuotes(false);
    }
  }, []);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchQuotes(stocks);
    }
  }, [stocks, fetchQuotes]);

  // Calculations
  let totalInvestedKRW = 0;
  let totalValuationKRW = 0;
  let totalDailyChangeKRW = 0;

  const stockRows = stocks.map((stock) => {
    const quote = quotes[stock.symbol];
    const currentPrice = quote?.currentPrice || stock.avgPrice;
    const isUSD = stock.currency === 'USD';
    const rate = isUSD ? exchangeRate : 1;

    const investedKRW = stock.quantity * stock.avgPrice * rate;
    const valuationKRW = stock.quantity * currentPrice * rate;
    const profitKRW = valuationKRW - investedKRW;
    const returnPercent = investedKRW > 0 ? (profitKRW / investedKRW) * 100 : 0;
    const dailyChangeKRW = quote ? (quote.change * stock.quantity * rate) : 0;

    totalInvestedKRW += investedKRW;
    totalValuationKRW += valuationKRW;
    totalDailyChangeKRW += dailyChangeKRW;

    return {
      ...stock,
      currentPrice,
      investedKRW,
      valuationKRW,
      profitKRW,
      returnPercent,
      dailyChangeKRW,
      quote,
    };
  });

  const totalProfitKRW = totalValuationKRW - totalInvestedKRW;
  const totalReturnPercent = totalInvestedKRW > 0 ? (totalProfitKRW / totalInvestedKRW) * 100 : 0;

  // Add stock handler
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(avgPrice) || 0;
    if (qty <= 0 || price <= 0 || !symbol.trim()) return;

    const newStock = await addStock({
      symbol: symbol.trim(),
      name: name.trim() || symbol,
      market,
      quantity: qty,
      avgPrice: price,
      currency,
    });

    setStocks((prev) => [newStock, ...prev]);
    setIsModalOpen(false);
  };

  // Delete stock handler
  const handleDeleteStock = async (id: string) => {
    await deleteStock(id);
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  // Preset chip select handler
  const handleSelectPreset = (p: typeof PRESET_STOCKS[0]) => {
    setSymbol(p.symbol);
    setName(p.name);
    setMarket(p.market);
    setCurrency(p.currency);
    setAvgPrice(p.currency === 'USD' ? '180' : '70000');
  };

  const chartColors = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 1.5vw, 24px)', width: '100%' }}>
      {/* Top Controls & Refresh */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem, 1.3vw, 1.5rem)', fontWeight: 800, color: '#f1f5f9' }}>
            📈 주식 투자 실시간 수익률 트래커
          </h2>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', fontWeight: 600, border: '1px solid rgba(6,182,212,0.3)' }}>
            무료 실시간 시세 (1 USD = {exchangeRate.toLocaleString()}원)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchQuotes(stocks)}
            disabled={isFetchingQuotes}
            style={{
              padding: '8px 14px', borderRadius: '12px', background: '#020617', border: '1px solid #1e293b',
              color: '#22d3ee', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ animation: isFetchingQuotes ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>🔄</span>
            <span>{isFetchingQuotes ? '시세 수신 중...' : '시세 새로고침'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '8px 16px', borderRadius: '12px', background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span>+ 종목 추가</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '32px', height: '32px', border: '4px solid rgba(6,182,212,0.3)', borderTopColor: '#06b6d4', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <span>주식 데이터를 불러오는 중입니다...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(12px, 1vw, 20px)' }}>
            {/* Total Valuation */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>총 주식 자산</div>
              <div style={{ fontSize: 'clamp(1.25rem, 1.8vw, 2rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalValuationKRW)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>환율 적용 원화 총 평가금액</div>
            </div>

            {/* Total Invested */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>총 투자 원금</div>
              <div style={{ fontSize: 'clamp(1.25rem, 1.8vw, 2rem)', fontWeight: 800, color: '#cbd5e1', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalInvestedKRW)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>총 매수 평단가 합계</div>
            </div>

            {/* Total Profit / Loss */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>총 평가 손익 (수익률)</div>
              <div style={{ fontSize: 'clamp(1.25rem, 1.8vw, 2rem)', fontWeight: 800, color: totalProfitKRW >= 0 ? '#10b981' : '#f43f5e', letterSpacing: '-0.02em' }}>
                {totalProfitKRW >= 0 ? '+' : ''}{formatCurrency(totalProfitKRW)}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: totalReturnPercent >= 0 ? '#10b981' : '#f43f5e', marginTop: '4px' }}>
                {totalReturnPercent >= 0 ? '▲' : '▼'} {totalReturnPercent.toFixed(2)}%
              </div>
            </div>

            {/* Daily Change */}
            <div style={cardStyle}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>오늘의 변동폭</div>
              <div style={{ fontSize: 'clamp(1.25rem, 1.8vw, 2rem)', fontWeight: 800, color: totalDailyChangeKRW >= 0 ? '#22d3ee' : '#f43f5e', letterSpacing: '-0.02em' }}>
                {totalDailyChangeKRW >= 0 ? '+' : ''}{formatCurrency(totalDailyChangeKRW)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>전일 대비 예상 변동액</div>
            </div>
          </div>

          {/* Main Content Layout: Table (Left) + Asset Allocation (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) minmax(0, 1fr)', gap: 'clamp(16px, 1.5vw, 24px)', width: '100%' }} className="storebook-stock-grid">
            {/* Table Panel */}
            <div style={panelStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(30, 41, 59, 0.8)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>보유 주식 목록 ({stockRows.length})</h3>
              </div>

              {stockRows.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  등록된 주식이 없습니다. 오른쪽 상단 [+ 종목 추가] 버튼을 눌러보세요!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px', fontWeight: 600 }}>종목명 / 티커</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>수량</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>평단가</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>현재가</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>평가금액</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>수익률</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockRows.map((row) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{row.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {row.symbol} <span style={{ padding: '1px 4px', borderRadius: '4px', background: row.market === 'KR' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)', color: row.market === 'KR' ? '#60a5fa' : '#c084fc', fontSize: '0.65rem' }}>{row.market}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: '#cbd5e1' }}>
                            {row.quantity.toLocaleString()}주
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: '#cbd5e1' }}>
                            {row.currency === 'USD' ? `$${row.avgPrice.toLocaleString()}` : `${row.avgPrice.toLocaleString()}원`}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#f1f5f9' }}>
                            {row.currency === 'USD' ? `$${row.currentPrice.toLocaleString()}` : `${row.currentPrice.toLocaleString()}원`}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: '#f1f5f9' }}>
                            {formatCurrency(row.valuationKRW)}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: row.profitKRW >= 0 ? '#10b981' : '#f43f5e' }}>
                            <div>{row.profitKRW >= 0 ? '+' : ''}{row.returnPercent.toFixed(2)}%</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>({formatCurrency(row.profitKRW)})</div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteStock(row.id)}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                              title="종목 삭제"
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Asset Allocation Panel */}
            <div style={panelStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(30, 41, 59, 0.8)' }}>
                종목별 자산 비중
              </h3>

              {stockRows.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  등록된 종목이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {stockRows.map((row, i) => {
                    const weightPct = totalValuationKRW > 0 ? Math.round((row.valuationKRW / totalValuationKRW) * 100) : 0;
                    const color = chartColors[i % chartColors.length];
                    return (
                      <div key={row.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                          <span style={{ color: '#cbd5e1' }}>{row.name}</span>
                          <span style={{ color }}>{weightPct}% ({formatCurrency(row.valuationKRW)})</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#020617', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(30,41,59,0.8)' }}>
                          <div style={{ height: '100%', borderRadius: '9999px', background: color, width: `${weightPct}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>+ 새로운 주식 종목 추가</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}>✕</button>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>빠른 추천 종목 선택</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_STOCKS.map((p) => (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      padding: '4px 10px', borderRadius: '8px', background: symbol === p.symbol ? 'rgba(6,182,212,0.2)' : '#020617',
                      border: symbol === p.symbol ? '1px solid #06b6d4' : '1px solid #1e293b', color: symbol === p.symbol ? '#22d3ee' : '#cbd5e1',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>티커 코드 (Ticker)</label>
                <input
                  type="text"
                  placeholder="예: 005930.KS 또는 AAPL"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>종목명</label>
                <input
                  type="text"
                  placeholder="예: 삼성전자, 애플"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>시장 구분</label>
                  <select
                    value={market}
                    onChange={(e) => {
                      const m = e.target.value as 'KR' | 'US';
                      setMarket(m);
                      setCurrency(m === 'KR' ? 'KRW' : 'USD');
                    }}
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="KR">국내 (한국)</option>
                    <option value="US">해외 (미국)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>통화</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'KRW' | 'USD')}
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="KRW">KRW (원화)</option>
                    <option value="USD">USD (달러)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>보유 수량 (주)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>매수 평단가 ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="68500"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    required
                    style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(90deg, #06b6d4, #3b82f6)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
                >
                  종목 추가 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .storebook-stock-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
