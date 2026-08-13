'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/storebook-utils';

interface SummaryGridProps {
  carryOver: number;
  totalIncome: number;
  totalExpense: number;
  onUpdateCarryOver: (newAmount: number) => void;
}

export default function SummaryGrid({
  carryOver,
  totalIncome,
  totalExpense,
  onUpdateCarryOver,
}: SummaryGridProps) {
  const [isEditingCarryOver, setIsEditingCarryOver] = useState(false);
  const [editValue, setEditValue] = useState('');

  const remainingBalance = carryOver + totalIncome - totalExpense;
  const incomePercentage = totalIncome > 0 ? Math.max(0, Math.round((remainingBalance / totalIncome) * 100)) : 100;

  const handleStartEdit = () => {
    setEditValue(String(carryOver));
    setIsEditingCarryOver(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(editValue.replace(/[^0-9-]/g, ''), 10);
    if (!isNaN(num)) {
      onUpdateCarryOver(num);
    }
    setIsEditingCarryOver(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Carry-over Card */}
      <div
        onClick={handleStartEdit}
        className="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-cyan-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">이월 잔액</span>
          <svg className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
          {formatCurrency(carryOver)}
        </div>
        <div className="mt-2 text-[11px] text-cyan-400/80 font-medium flex items-center gap-1">
          <span>클릭하여 이월 잔액 수정</span>
        </div>
      </div>

      {/* Total Income Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">총 수입</span>
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight">
          {formatCurrency(totalIncome)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium">이번 달 총 수입 합계</div>
      </div>

      {/* Total Expense Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">총 지출</span>
          <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-rose-400 tracking-tight">
          {formatCurrency(totalExpense)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium">이번 달 지출 합계</div>
      </div>

      {/* Remaining Balance Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">최종 잔액</span>
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${remainingBalance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
          {formatCurrency(remainingBalance)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-medium">
          수입의 {incomePercentage}% 남음
        </div>
      </div>

      {/* Carry over edit modal */}
      {isEditingCarryOver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">이월 잔액 수정</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">금액 (원)</label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-semibold"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingCarryOver(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
