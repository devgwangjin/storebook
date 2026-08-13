'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/storebook/Header';
import SummaryGrid from '@/components/storebook/SummaryGrid';
import BudgetProgressBar from '@/components/storebook/BudgetProgressBar';
import TransactionForm from '@/components/storebook/TransactionForm';
import CategoryBreakdown from '@/components/storebook/CategoryBreakdown';
import TransactionList from '@/components/storebook/TransactionList';
import CategoryManager from '@/components/storebook/CategoryManager';

import { Transaction, CategoryItem, TransactionType } from '@/lib/storebook-types';
import {
  fetchMonthData,
  saveCarryOverBalance,
  addTransaction,
  deleteTransaction,
  fetchCategories,
  addCategory,
  deleteCategory,
  syncLocalStorageToSupabase,
  fixTransactionMonths,
} from '@/lib/storebook-service';
import { getPrevMonthString, getNextMonthString } from '@/lib/storebook-utils';

const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function StorebookPage() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [carryOver, setCarryOver] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCats() {
      // Fix any mismatched year_month in DB first
      await fixTransactionMonths();
      const cats = await fetchCategories();
      setIncomeCategories(cats.income);
      setExpenseCategories(cats.expense);
    }
    loadCats();
  }, []);

  const loadData = useCallback(async (ym: string) => {
    setIsLoading(true);
    const mData = await fetchMonthData(ym);
    setCarryOver(mData.carryOver);
    setTransactions(mData.transactions);

    // Auto-extract any categories used in the loaded transactions!
    if (mData.transactions && mData.transactions.length > 0) {
      setIncomeCategories((prev) => {
        const map = new Map<string, CategoryItem>();
        prev.forEach((c) => map.set(c.value, c));
        mData.transactions
          .filter((t) => t.type === 'income' && Boolean(t.category))
          .forEach((t) => {
            if (!map.has(t.category)) map.set(t.category, { value: t.category, label: t.category });
          });
        return Array.from(map.values());
      });

      setExpenseCategories((prev) => {
        const map = new Map<string, CategoryItem>();
        prev.forEach((c) => map.set(c.value, c));
        mData.transactions
          .filter((t) => t.type === 'expense' && Boolean(t.category))
          .forEach((t) => {
            if (!map.has(t.category)) map.set(t.category, { value: t.category, label: t.category });
          });
        return Array.from(map.values());
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(yearMonth);
  }, [yearMonth, loadData]);

  const handlePrevMonth = () => setYearMonth(getPrevMonthString(yearMonth));
  const handleNextMonth = () => setYearMonth(getNextMonthString(yearMonth));

  const handleUpdateCarryOver = async (newAmount: number) => {
    setCarryOver(newAmount);
    await saveCarryOverBalance(yearMonth, newAmount);
  };

  const handleAddTx = async (txPayload: {
    type: TransactionType;
    name: string;
    amount: number;
    category: string;
    isRecurring: boolean;
    date: string;
  }) => {
    // Dynamically derive the correct target YYYY-MM from the transaction date!
    const targetYearMonth = txPayload.date.substring(0, 7); // e.g. "2026-08"
    const created = await addTransaction(targetYearMonth, txPayload);

    // Merge newly used category into state
    if (txPayload.category) {
      const setCats = txPayload.type === 'income' ? setIncomeCategories : setExpenseCategories;
      setCats((prev) => {
        if (!prev.some((c) => c.value === txPayload.category)) {
          return [...prev, { value: txPayload.category, label: txPayload.category }];
        }
        return prev;
      });
    }

    if (targetYearMonth === yearMonth) {
      setTransactions((prev) => [created, ...prev]);
    } else {
      // Automatically switch view to the added transaction's month!
      setYearMonth(targetYearMonth);
    }
  };

  const handleDeleteTx = async (id: string) => {
    await deleteTransaction(yearMonth, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddCat = async (type: TransactionType, value: string, label: string) => {
    const created = await addCategory(type, value, label);
    if (type === 'income') {
      setIncomeCategories((prev) => [...prev, created]);
    } else {
      setExpenseCategories((prev) => [...prev, created]);
    }
  };

  const handleDeleteCat = async (type: TransactionType, value: string) => {
    await deleteCategory(type, value);
    if (type === 'income') {
      setIncomeCategories((prev) => prev.filter((c) => c.value !== value));
    } else {
      setExpenseCategories((prev) => prev.filter((c) => c.value !== value));
    }
  };

  const handleSyncLocalData = async () => {
    await syncLocalStorageToSupabase();
    await fixTransactionMonths();
    const cats = await fetchCategories();
    setIncomeCategories(cats.income);
    setExpenseCategories(cats.expense);
    await loadData(yearMonth);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#090d16',
        color: '#e2e8f0',
        padding: 'clamp(16px, 2vw, 40px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 1.5vw, 28px)',
        }}
      >
        <Header
          yearMonth={yearMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSyncLocalData={handleSyncLocalData}
        />

        {isLoading ? (
          <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#64748b' }}>
            <div style={{
              width: '32px', height: '32px',
              border: '4px solid rgba(6, 182, 212, 0.3)',
              borderTopColor: '#06b6d4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>데이터를 불러오는 중입니다...</span>
          </div>
        ) : (
          <>
            <SummaryGrid
              carryOver={carryOver}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              onUpdateCarryOver={handleUpdateCarryOver}
            />

            <BudgetProgressBar totalIncome={totalIncome} totalExpense={totalExpense} />

            {/* Main 2-column layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 2fr)',
                gap: 'clamp(16px, 1.5vw, 28px)',
                width: '100%',
              }}
              className="storebook-main-grid"
            >
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 1.5vw, 28px)' }}>
                <TransactionForm
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  onAddTransaction={handleAddTx}
                />
                <CategoryManager
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  onAddCategory={handleAddCat}
                  onDeleteCategory={handleDeleteCat}
                />
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 1.5vw, 28px)', minWidth: 0 }}>
                <CategoryBreakdown transactions={transactions} totalExpense={totalExpense} />
                <TransactionList transactions={transactions} onDeleteTransaction={handleDeleteTx} />
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .storebook-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
