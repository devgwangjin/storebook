'use client';

import React from 'react';

interface HeaderProps {
  yearMonth: string; // e.g. "2026-07"
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function Header({ yearMonth, onPrevMonth, onNextMonth }: HeaderProps) {
  const [year, month] = yearMonth.split('-').map(Number);

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            storebook
          </h1>
          <p className="text-xs text-slate-400 font-medium">스마트 클라우드 가계부</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl px-4 py-2 shadow-inner">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="이전 달"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-bold text-slate-200 min-w-[110px] text-center tracking-wide">
          {year}년 {String(month).padStart(2, '0')}월
        </span>
        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="다음 달"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
