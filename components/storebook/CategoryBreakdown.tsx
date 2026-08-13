'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/storebook-types';
import { formatCurrency } from '@/lib/storebook-utils';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  totalExpense: number;
}

const panelStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 28px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

export default function CategoryBreakdown({ transactions, totalExpense }: CategoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'bar'>('grid');

  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const colors = ['#fb7185', '#f59e0b', '#06b6d4', '#a78bfa', '#34d399', '#f472b6', '#38bdf8'];

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '20px', paddingBottom: '16px',
        borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ width: '20px', height: '20px', color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h2 style={{ fontSize: 'clamp(0.85rem, 0.95vw, 1.05rem)', fontWeight: 700, color: '#e2e8f0' }}>카테고리별 지출 요약</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.9rem)', fontWeight: 700, color: '#fb7185' }}>
            합계: {formatCurrency(totalExpense)}
          </span>

          <div style={{
            display: 'flex', background: '#020617', padding: '3px',
            borderRadius: '8px', border: '1px solid #1e293b',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? '#1e293b' : 'transparent',
                color: viewMode === 'grid' ? '#22d3ee' : '#475569',
                display: 'flex', alignItems: 'center',
              }}
              title="그리드 카드형"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('bar')}
              style={{
                padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: viewMode === 'bar' ? '#1e293b' : 'transparent',
                color: viewMode === 'bar' ? '#22d3ee' : '#475569',
                display: 'flex', alignItems: 'center',
              }}
              title="막대그래프형"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {sortedCategories.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '0.85rem', color: '#475569' }}>
          등록된 지출 내역이 없습니다.
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))',
          gap: 'clamp(8px, 0.8vw, 14px)',
        }}>
          {sortedCategories.map((item, i) => (
            <div key={item.category} style={{
              padding: 'clamp(12px, 1vw, 16px)',
              borderRadius: '12px',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(30, 41, 59, 0.8)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.9rem)', fontWeight: 700, color: '#cbd5e1' }}>{item.category}</span>
                <span style={{ fontSize: 'clamp(0.65rem, 0.75vw, 0.8rem)', fontWeight: 700, color: colors[i % colors.length] + 'cc' }}>{item.percentage}%</span>
              </div>
              <div style={{ fontSize: 'clamp(0.85rem, 1vw, 1.05rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
                {formatCurrency(item.amount)}
              </div>
              <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '9999px',
                  background: colors[i % colors.length],
                  transition: 'width 0.3s ease',
                  width: `${item.percentage}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedCategories.map((item, i) => (
            <div key={item.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(0.75rem, 0.85vw, 0.9rem)', marginBottom: '4px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{item.category}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{formatCurrency(item.amount)}</span>
                  <span style={{ color: colors[i % colors.length], fontWeight: 600 }}>({item.percentage}%)</span>
                </div>
              </div>
              <div style={{
                width: '100%', height: '10px', background: '#020617',
                borderRadius: '9999px', overflow: 'hidden',
                border: '1px solid rgba(30, 41, 59, 0.8)', padding: '2px',
              }}>
                <div style={{
                  height: '100%', borderRadius: '9999px',
                  background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
                  transition: 'width 0.5s ease',
                  width: `${item.percentage}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
