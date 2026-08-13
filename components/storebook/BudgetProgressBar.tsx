'use client';

import React from 'react';

interface BudgetProgressBarProps {
  totalIncome: number;
  totalExpense: number;
}

export default function BudgetProgressBar({ totalIncome, totalExpense }: BudgetProgressBarProps) {
  const ratio = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

  let barColor = 'linear-gradient(90deg, #06b6d4, #34d399)';
  if (ratio > 80 && ratio <= 100) {
    barColor = 'linear-gradient(90deg, #f59e0b, #fb7185)';
  } else if (ratio > 100) {
    barColor = 'linear-gradient(90deg, #e11d48, #ef4444)';
  }

  return (
    <div style={{
      padding: 'clamp(12px, 1vw, 20px)',
      borderRadius: '16px',
      background: 'rgba(15, 23, 42, 0.4)',
      border: '1px solid rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.9rem)', fontWeight: 600, color: '#94a3b8' }}>수입 대비 지출 비율</span>
        <span style={{
          fontSize: 'clamp(0.75rem, 0.85vw, 0.9rem)',
          fontWeight: 700,
          color: ratio > 90 ? '#fb7185' : '#22d3ee',
        }}>
          {ratio}%
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '10px',
        background: '#020617',
        borderRadius: '9999px',
        overflow: 'hidden',
        border: '1px solid rgba(30, 41, 59, 0.6)',
        padding: '2px',
      }}>
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            background: barColor,
            transition: 'width 0.5s ease',
            width: `${ratio}%`,
          }}
        />
      </div>
    </div>
  );
}
