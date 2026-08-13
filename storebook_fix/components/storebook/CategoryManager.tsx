'use client';

import React, { useState } from 'react';
import { CategoryItem, TransactionType } from '@/lib/storebook-types';

interface CategoryManagerProps {
  incomeCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  onAddCategory: (type: TransactionType, value: string, label: string) => Promise<void>;
}

export default function CategoryManager({
  incomeCategories,
  expenseCategories,
  onAddCategory,
}: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const val = newCatName.trim();
    setIsAdding(true);
    await onAddCategory(activeTab, val, val);
    setIsAdding(false);
    setNewCatName('');
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10m-8 5h8" />
        </svg>
        <h2 className="text-sm font-bold text-slate-200">카테고리 관리</h2>
      </div>

      <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800/80">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'expense' ? 'bg-slate-800 text-rose-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          지출 카테고리
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'income' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          수입 카테고리
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto p-1">
        {categories.map((c) => (
          <span
            key={c.value}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
          >
            {c.label}
          </span>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="새 카테고리 (예: 도서 📚)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shrink-0 shadow-lg shadow-cyan-600/20"
        >
          추가
        </button>
      </form>
    </div>
  );
}
