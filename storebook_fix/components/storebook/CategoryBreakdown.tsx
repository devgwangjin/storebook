'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/storebook-types';
import { formatCurrency } from '@/lib/storebook-utils';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  totalExpense: number;
}

export default function CategoryBreakdown({ transactions, totalExpense }: CategoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'bar'>('grid');

  // Filter expenses and aggregate by category
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

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h2 className="text-sm font-bold text-slate-200">카테고리별 지출 요약</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-rose-400">
            합계: {formatCurrency(totalExpense)}
          </span>

          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="그리드 카드형"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'bar' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="막대그래프형"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">등록된 지출 내역이 없습니다.</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sortedCategories.map((item) => (
            <div key={item.category} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-300">{item.category}</span>
                <span className="text-[11px] font-semibold text-rose-400/90">{item.percentage}%</span>
              </div>
              <div className="text-sm font-extrabold text-slate-100 mb-2">
                {formatCurrency(item.amount)}
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300 font-bold">{item.category}</span>
                <div className="space-x-2">
                  <span className="text-slate-200 font-bold">{formatCurrency(item.amount)}</span>
                  <span className="text-rose-400 font-semibold">({item.percentage}%)</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
