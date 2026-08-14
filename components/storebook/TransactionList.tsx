'use client';

import React, { useState } from 'react';
import { Transaction, CategoryItem, TransactionType } from '@/lib/storebook-types';
import { formatCurrency } from '@/lib/storebook-utils';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction?: (id: string, updatedFields: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  incomeCategories?: CategoryItem[];
  expenseCategories?: CategoryItem[];
}

const panelStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 28px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
};

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  incomeCategories = [],
  expenseCategories = [],
}: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editDate, setEditDate] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = transactions.filter((t) => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    return true;
  });

  const filterBtnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
    fontWeight: 600,
    background: active ? (color ? `${color}1a` : '#1e293b') : 'transparent',
    color: active ? (color || '#f1f5f9') : '#475569',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  });

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditName(tx.name);
    setEditAmountStr(tx.amount.toLocaleString());
    setEditCategory(tx.category);
    setEditType(tx.type);
    setEditDate(tx.date);
    setEditIsRecurring(tx.isRecurring);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !onUpdateTransaction) return;

    const numAmount = parseInt(editAmountStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (!editName.trim() || numAmount <= 0) return;

    setIsSaving(true);
    await onUpdateTransaction(editingTx.id, {
      type: editType,
      name: editName.trim(),
      amount: numAmount,
      category: editCategory,
      date: editDate,
      isRecurring: editIsRecurring,
    });
    setIsSaving(false);
    setEditingTx(null);
  };

  const categories = editType === 'expense' ? expenseCategories : incomeCategories;

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 style={{ fontSize: 'clamp(0.85rem, 0.95vw, 1.05rem)', fontWeight: 700, color: '#e2e8f0' }}>내역 리스트</h2>
        </div>

        <div style={{
          display: 'flex', background: '#020617', padding: '4px',
          borderRadius: '12px', border: '1px solid rgba(30, 41, 59, 0.8)',
        }}>
          <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>
            전체 ({transactions.length})
          </button>
          <button onClick={() => setFilter('income')} style={filterBtnStyle(filter === 'income', '#34d399')}>
            수입 ({transactions.filter((t) => t.type === 'income').length})
          </button>
          <button onClick={() => setFilter('expense')} style={filterBtnStyle(filter === 'expense', '#fb7185')}>
            지출 ({transactions.filter((t) => t.type === 'expense').length})
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
          해당하는 내역이 없습니다.
        </div>
      ) : (
        <div>
          {filtered.map((tx, i) => (
            <div key={tx.id} style={{
              padding: 'clamp(10px, 0.8vw, 16px) 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(30, 41, 59, 0.5)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: 'clamp(32px, 2.5vw, 40px)',
                  height: 'clamp(32px, 2.5vw, 40px)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 'clamp(0.9rem, 1vw, 1.2rem)',
                  background: tx.type === 'income' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)',
                  border: `1px solid ${tx.type === 'income' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 113, 133, 0.2)'}`,
                }}>
                  {tx.type === 'income' ? '💰' : '💳'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 'clamp(0.8rem, 0.9vw, 0.95rem)',
                      fontWeight: 700, color: '#e2e8f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{tx.name}</span>
                    <span style={{
                      fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)',
                      fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                      background: '#1e293b', color: '#94a3b8', flexShrink: 0,
                    }}>{tx.category}</span>
                    {tx.isRecurring && (
                      <span style={{
                        fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)',
                        fontWeight: 700, padding: '2px 6px', borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        flexShrink: 0,
                      }}>고정</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.65rem, 0.75vw, 0.8rem)',
                    color: '#475569', fontWeight: 500, marginTop: '2px',
                  }}>{tx.date}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{
                  fontSize: 'clamp(0.85rem, 1vw, 1.05rem)',
                  fontWeight: 800,
                  color: tx.type === 'income' ? '#34d399' : '#fb7185',
                }}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>

                {/* Edit Button */}
                <button
                  onClick={() => handleStartEdit(tx)}
                  style={{
                    padding: '6px', borderRadius: '8px', background: 'transparent',
                    border: 'none', color: '#64748b', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                  }}
                  title="수정"
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#22d3ee')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  ✏️
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  style={{
                    padding: '6px', borderRadius: '8px', background: 'transparent',
                    border: 'none', color: '#64748b', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                  }}
                  title="삭제"
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>✏️ 내역 수정</h3>
              <button onClick={() => setEditingTx(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type Switcher */}
              <div style={{ display: 'flex', background: '#020617', padding: '4px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setEditType('expense')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: editType === 'expense' ? 'rgba(251,113,133,0.2)' : 'transparent',
                    color: editType === 'expense' ? '#fb7185' : '#64748b', fontWeight: 700, fontSize: '0.85rem',
                  }}
                >
                  지출 💸
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('income')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: editType === 'income' ? 'rgba(52,211,153,0.2)' : 'transparent',
                    color: editType === 'income' ? '#34d399' : '#64748b', fontWeight: 700, fontSize: '0.85rem',
                  }}
                >
                  수입 💰
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>날짜</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>항목 이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>금액 (원)</label>
                <input
                  type="text"
                  value={editAmountStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditAmountStr(val ? parseInt(val, 10).toLocaleString() : '');
                  }}
                  required
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>카테고리</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                  {/* If custom category not in list */}
                  {!categories.some((c) => c.value === editCategory) && (
                    <option value={editCategory}>{editCategory}</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#cbd5e1' }}>매월 반복 고정 항목</span>
                <button
                  type="button"
                  onClick={() => setEditIsRecurring(!editIsRecurring)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '9999px',
                    background: editIsRecurring ? '#06b6d4' : '#1e293b',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', padding: '2px',
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    transition: 'transform 0.2s',
                    transform: editIsRecurring ? 'translateX(20px)' : 'translateX(0)',
                  }} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  style={{ padding: '8px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '8px 20px', borderRadius: '10px', background: '#0891b2', color: '#fff', fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(8,145,178,0.3)' }}
                >
                  {isSaving ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
