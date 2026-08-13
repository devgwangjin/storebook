'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/storebook-utils';

interface SummaryGridProps {
  carryOver: number;
  totalIncome: number;
  totalExpense: number;
  onUpdateCarryOver: (newAmount: number) => void;
}

const cardStyle: React.CSSProperties = {
  padding: 'clamp(16px, 1.5vw, 24px)',
  borderRadius: '16px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 'clamp(0.7rem, 0.8vw, 0.85rem)',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: '#94a3b8',
};

const amountStyle: React.CSSProperties = {
  fontSize: 'clamp(1.25rem, 1.8vw, 2rem)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  marginTop: '4px',
};

const subTextStyle: React.CSSProperties = {
  marginTop: '8px',
  fontSize: 'clamp(0.65rem, 0.7vw, 0.8rem)',
  fontWeight: 500,
  color: '#64748b',
};

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
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: 'clamp(12px, 1vw, 20px)',
      }}>
        {/* Carry-over */}
        <div onClick={handleStartEdit} style={{ ...cardStyle, cursor: 'pointer', transition: 'border-color 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={labelStyle}>이월 잔액</span>
            <svg style={{ width: '20px', height: '20px', color: '#22d3ee' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div style={{ ...amountStyle, color: '#f1f5f9' }}>{formatCurrency(carryOver)}</div>
          <div style={{ ...subTextStyle, color: 'rgba(34, 211, 238, 0.7)' }}>클릭하여 이월 잔액 수정</div>
        </div>

        {/* Income */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={labelStyle}>총 수입</span>
            <svg style={{ width: '20px', height: '20px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div style={{ ...amountStyle, color: '#34d399' }}>{formatCurrency(totalIncome)}</div>
          <div style={subTextStyle}>이번 달 총 수입 합계</div>
        </div>

        {/* Expense */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={labelStyle}>총 지출</span>
            <svg style={{ width: '20px', height: '20px', color: '#fb7185' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div style={{ ...amountStyle, color: '#fb7185' }}>{formatCurrency(totalExpense)}</div>
          <div style={subTextStyle}>이번 달 지출 합계</div>
        </div>

        {/* Remaining */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={labelStyle}>최종 잔액</span>
            <svg style={{ width: '20px', height: '20px', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div style={{ ...amountStyle, color: remainingBalance >= 0 ? '#60a5fa' : '#f43f5e' }}>
            {formatCurrency(remainingBalance)}
          </div>
          <div style={subTextStyle}>수입의 {incomePercentage}% 남음</div>
        </div>
      </div>

      {/* Modal */}
      {isEditingCarryOver && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>이월 잔액 수정</h3>
            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>금액 (원)</label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: '#f1f5f9',
                    fontSize: '1rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCarryOver(false)}
                  style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px', fontSize: '0.8rem', fontWeight: 600,
                    background: '#0891b2', color: '#fff', border: 'none',
                    borderRadius: '12px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
