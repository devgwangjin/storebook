'use client';

import React, { useState } from 'react';
import { Transaction, TransactionType } from '@/lib/storebook-types';
import { formatCurrency } from '@/lib/storebook-utils';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => Promise<void>;
}

export default function TransactionList({ transactions, onDeleteTransaction }: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter((t) => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    return true;
  });

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-sm font-bold text-slate-200">내역 리스트</h2>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            전체 ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            수입 ({transactions.filter((t) => t.type === 'income').length})
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            지출 ({transactions.filter((t) => t.type === 'expense').length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 font-medium">
          해당하는 내역이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {filtered.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '💰' : '💳'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">{tx.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 shrink-0">
                      {tx.category}
                    </span>
                    {tx.isRecurring && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                        고정
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{tx.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs sm:text-sm font-extrabold ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-80 group-hover:opacity-100"
                  title="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
