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

const panelStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(16px, 1.5vw, 28px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#020617',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  padding: 'clamp(8px, 0.8vw, 12px) clamp(12px, 1vw, 16px)',
  fontSize: 'clamp(0.8rem, 0.9vw, 0.95rem)',
  color: '#e2e8f0',
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
};

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
  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const koreanAmountText = numericAmount > 0 ? numberToKorean(numericAmount) : '영 원';

  // Helper date generators for quick buttons
  const getDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getDateStr(0);
  const yesterdayStr = getDateStr(1);
  const twoDaysAgoStr = getDateStr(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numericAmount <= 0) return;
    const selectedCategory = category || (categories[0]?.value || '기타');
    setIsSubmitting(true);
    await onAddTransaction({ type, name: name.trim(), amount: numericAmount, category: selectedCategory, isRecurring, date });
    setIsSubmitting(false);
    setName('');
    setAmountStr('');
    setIsRecurring(false);
  };

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: 'clamp(8px, 0.7vw, 12px)',
    borderRadius: '10px',
    fontSize: 'clamp(0.8rem, 0.85vw, 0.95rem)',
    fontWeight: 700,
    border: active ? `1px solid ${color}33` : '1px solid transparent',
    background: active ? `${color}1a` : 'transparent',
    color: active ? color : '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  });

  const quickDateBtnStyle = (isSelected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: 'clamp(0.7rem, 0.75vw, 0.8rem)',
    fontWeight: 600,
    background: isSelected ? 'rgba(6, 182, 212, 0.2)' : '#020617',
    border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid #1e293b',
    color: isSelected ? '#22d3ee' : '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  });

  return (
    <div style={panelStyle}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#020617',
        padding: '6px',
        borderRadius: '12px',
        marginBottom: 'clamp(16px, 1.2vw, 24px)',
        border: '1px solid rgba(30, 41, 59, 0.8)',
      }}>
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(expenseCategories[0]?.value || ''); }}
          style={tabStyle(type === 'expense', '#fb7185')}
        >
          지출 추가 💸
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(incomeCategories[0]?.value || ''); }}
          style={tabStyle(type === 'income', '#34d399')}
        >
          수입 추가 💰
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1vw, 16px)' }}>
        {/* Date Selector with Calendar Icon, Click Trigger & Hover Glow Effect */}
        <div>
          <label style={labelStyle}>날짜</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setDate(todayStr)}
              style={quickDateBtnStyle(date === todayStr)}
            >
              오늘 ⚡
            </button>
            <button
              type="button"
              onClick={() => setDate(yesterdayStr)}
              style={quickDateBtnStyle(date === yesterdayStr)}
            >
              어제
            </button>
            <button
              type="button"
              onClick={() => setDate(twoDaysAgoStr)}
              style={quickDateBtnStyle(date === twoDaysAgoStr)}
            >
              그저께
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => {
                try {
                  if ('showPicker' in e.currentTarget) {
                    (e.currentTarget as any).showPicker();
                  }
                } catch (err) {}
              }}
              required
              style={{
                ...inputStyle,
                colorScheme: 'dark',
                cursor: 'pointer',
                paddingRight: '44px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#06b6d4';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#22d3ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>항목 이름</label>
          <input
            type="text"
            placeholder={type === 'expense' ? '예: 식비, 월세, 쇼핑' : '예: 월급, 보너스'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>금액 (원)</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="0"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setAmountStr(val ? parseInt(val, 10).toLocaleString() : '');
              }}
              required
              style={{ ...inputStyle, fontWeight: 700, paddingRight: '40px' }}
            />
            <span style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              fontSize: 'clamp(0.8rem, 0.9vw, 0.95rem)', fontWeight: 700, color: '#475569',
            }}>원</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: 'clamp(0.7rem, 0.75vw, 0.85rem)', color: '#22d3ee', fontWeight: 600 }}>
            {koreanAmountText}
          </div>
        </div>

        <div>
          <label style={labelStyle}>카테고리</label>
          <select
            value={category || (categories[0]?.value || '')}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Recurring Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
          <span style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.9rem)', fontWeight: 500, color: '#cbd5e1' }}>매월 반복 고정 항목</span>
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            style={{
              width: '44px', height: '24px', borderRadius: '9999px',
              background: isRecurring ? '#06b6d4' : '#1e293b',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', padding: '2px',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
              transition: 'transform 0.2s',
              transform: isRecurring ? 'translateX(20px)' : 'translateX(0)',
            }} />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 'clamp(10px, 1vw, 14px)',
            borderRadius: '12px',
            fontSize: 'clamp(0.85rem, 0.9vw, 1rem)',
            fontWeight: 700,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '8px',
            background: type === 'expense'
              ? 'linear-gradient(90deg, #e11d48, #ef4444)'
              : 'linear-gradient(90deg, #059669, #14b8a6)',
            boxShadow: type === 'expense'
              ? '0 4px 16px rgba(225, 29, 72, 0.25)'
              : '0 4px 16px rgba(5, 150, 105, 0.25)',
            fontFamily: 'inherit',
          }}
        >
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>{type === 'expense' ? '지출 추가하기' : '수입 추가하기'}</span>
        </button>
      </form>
    </div>
  );
}
