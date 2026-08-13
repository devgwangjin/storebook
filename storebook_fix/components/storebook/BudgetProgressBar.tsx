'use client';

import React from 'react';

interface BudgetProgressBarProps {
  totalIncome: number;
  totalExpense: number;
}

export default function BudgetProgressBar({ totalIncome, totalExpense }: BudgetProgressBarProps) {
  const ratio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

  // Determine progress color
  let barColorClass = 'bg-gradient-to-r from-cyan-500 to-emerald-400';
  if (ratio > 80 && ratio <= 100) {
    barColorClass = 'bg-gradient-to-r from-amber-500 to-rose-400';
  } else if (ratio > 100) {
    barColorClass = 'bg-gradient-to-r from-rose-600 to-red-500';
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-400">수입 대비 지출 비율</span>
        <span className={`text-xs font-bold ${ratio > 90 ? 'text-rose-400' : 'text-cyan-400'}`}>
          {ratio}%
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}
