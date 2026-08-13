'use client';

import React from 'react';

interface HeaderProps {
  yearMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function Header({ yearMonth, onPrevMonth, onNextMonth }: HeaderProps) {
  const [year, month] = yearMonth.split('-').map(Number);

  return (
    <header style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      paddingBottom: '20px',
      borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          padding: '10px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(37, 99, 235, 0.15))',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#22d3ee',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 1.5vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
            storebook
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>스마트 클라우드 가계부</p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(30, 41, 59, 0.8)',
        borderRadius: '16px',
        padding: '6px 16px',
      }}>
        <button
          onClick={onPrevMonth}
          style={{
            padding: '6px', borderRadius: '8px', background: 'transparent',
            border: 'none', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
          aria-label="이전 달"
        >
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{
          fontSize: 'clamp(0.9rem, 1vw, 1.125rem)',
          fontWeight: 700,
          color: '#e2e8f0',
          minWidth: '120px',
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}>
          {year}년 {String(month).padStart(2, '0')}월
        </span>
        <button
          onClick={onNextMonth}
          style={{
            padding: '6px', borderRadius: '8px', background: 'transparent',
            border: 'none', color: '#94a3b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
          aria-label="다음 달"
        >
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
