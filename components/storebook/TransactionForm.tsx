'use client';

import React, { useState } from 'react';
import { CategoryItem, TransactionType } from '@/lib/storebook-types';
import { numberToKorean } from '@/lib/storebook-utils';

interface TransactionFormProps {
  incomeCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  onAddTransaction: (tx: {
    type: TransactionType;
    name: string;
    amount: number;
    category: string;
    isRecurring: boolean;
    date: string;
  }) => Promise<void>;
}

export default function TransactionForm({
  incomeCategories,
  expenseCategories,
  onAddTransaction,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  // Amount parsing
  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const koreanAmountText = numericAmount > 0 ? numberToKorean(numericAmount) : '영 원';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numericAmount <= 0) return;

    const selectedCategory = category || (categories[0]?.value || '기타');

    setIsSubmitting(true);
    await onAddTransaction({
      type,
      name: name.trim(),
      amount: numericAmount,
      category: selectedCategory,
      isRecurring,
      date,
    });
    setIsSubmitting(false);

    // Reset fields
    setName('');
    setAmountStr('');
    setIsRecurring(false);
  };

  return (
    <div className="w-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      {/* Tab Selector */}
      <div className="flex bg-slate-950 p-1.5 rounded-xl mb-6 border border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            setType('expense');
            setCategory(expenseCategories[0]?.value || '');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            type === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          지출 추가 💸
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income');
            setCategory(incomeCategories[0]?.value || '');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            type === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          수입 추가 💰
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">항목 이름</label>
          <input
            type="text"
            placeholder={type === 'expense' ? '예: 식비, 월세, 쇼핑' : '예: 월급, 보너스'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">금액 (원)</label>
          <div className="relative">
            <input
              type="text"
              placeholder="0"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setAmountStr(val ? parseInt(val, 10).toLocaleString() : '');
              }}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-cyan-500 pr-10"
            />
            <span className="absolute right-4 top-3 text-sm font-bold text-slate-500">원</span>
          </div>
          <div className="mt-1.5 text-xs text-cyan-400 font-semibold">{koreanAmountText}</div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">카테고리</label>
          <select
            value={category || (categories[0]?.value || '')}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-slate-300">매월 반복 고정 항목</span>
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              isRecurring ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isRecurring ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${
            type === 'expense'
              ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 shadow-rose-600/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>{type === 'expense' ? '지출 추가하기' : '수입 추가하기'}</span>
        </button>
      </form>
    </div>
  );
}
