'use client';

import React, { useState } from 'react';
import { CategoryItem, TransactionType } from '@/lib/storebook-types';

interface CategoryManagerProps {
  incomeCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  onAddCategory: (type: TransactionType, value: string, label: string) => Promise<void>;
  onDeleteCategory: (type: TransactionType, value: string) => Promise<void>;
}

const panelStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 28px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

export default function CategoryManager({
  incomeCategories,
  expenseCategories,
  onAddCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCatName.trim();
    if (!val) return;
    if (categories.some((c) => c.value === val || c.label === val)) {
      alert('이미 존재하는 카테고리입니다.');
      return;
    }
    setIsAdding(true);
    await onAddCategory(activeTab, val, val);
    setIsAdding(false);
    setNewCatName('');
  };

  const handleDelete = async (val: string) => {
    if (categories.length <= 1) {
      alert('최소 1개 이상의 카테고리가 필요합니다.');
      return;
    }
    await onDeleteCategory(activeTab, val);
  };

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: '6px',
    borderRadius: '8px',
    fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
    fontWeight: 700,
    background: active ? '#1e293b' : 'transparent',
    color: active ? color : '#475569',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  });

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <svg style={{ width: '20px', height: '20px', color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10m-8 5h8" />
        </svg>
        <h2 style={{ fontSize: 'clamp(0.85rem, 0.95vw, 1.05rem)', fontWeight: 700, color: '#e2e8f0' }}>카테고리 관리</h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: '#020617', padding: '4px',
        borderRadius: '12px', marginBottom: '16px',
        border: '1px solid rgba(30, 41, 59, 0.8)',
      }}>
        <button onClick={() => setActiveTab('expense')} style={tabStyle(activeTab === 'expense', '#fb7185')}>
          지출 카테고리
        </button>
        <button onClick={() => setActiveTab('income')} style={tabStyle(activeTab === 'income', '#34d399')}>
          수입 카테고리
        </button>
      </div>

      {/* Category Tag List with Delete Button */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        marginBottom: '16px', maxHeight: '140px', overflowY: 'auto', padding: '4px',
      }}>
        {categories.map((c) => (
          <span key={c.value} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '8px',
            background: '#020617', border: '1px solid #1e293b',
            fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
            fontWeight: 500, color: '#cbd5e1',
          }}>
            <span>{c.label}</span>
            <button
              type="button"
              onClick={() => handleDelete(c.value)}
              title={`${c.label} 카테고리 삭제`}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: 1,
                padding: '0 2px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="새 카테고리 (예: 도서 📚)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          style={{
            flex: 1,
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
            color: '#e2e8f0',
            fontWeight: 500,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={isAdding}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            background: '#0891b2',
            color: '#fff',
            fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)',
            fontFamily: 'inherit',
          }}
        >
          추가
        </button>
      </form>
    </div>
  );
}
