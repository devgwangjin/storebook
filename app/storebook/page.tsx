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
} from '@/lib/storebook-service';
import { getPrevMonthString, getNextMonthString } from '@/lib/storebook-utils';

export default function StorebookPage() {
  const [yearMonth, setYearMonth] = useState('2026-07');
  const [carryOver, setCarryOver] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Categories on mount
  useEffect(() => {
    async function loadCats() {
      const cats = await fetchCategories();
      setIncomeCategories(cats.income);
      setExpenseCategories(cats.expense);
    }
    loadCats();
  }, []);

  // Load Month Data when yearMonth changes
  const loadData = useCallback(async (ym: string) => {
    setIsLoading(true);
    const mData = await fetchMonthData(ym);
    setCarryOver(mData.carryOver);
    setTransactions(mData.transactions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(yearMonth);
  }, [yearMonth, loadData]);

  // Month handlers
  const handlePrevMonth = () => setYearMonth(getPrevMonthString(yearMonth));
  const handleNextMonth = () => setYearMonth(getNextMonthString(yearMonth));

  // Carry-over handler
  const handleUpdateCarryOver = async (newAmount: number) => {
    setCarryOver(newAmount);
    await saveCarryOverBalance(yearMonth, newAmount);
  };

  // Add Transaction handler
  const handleAddTx = async (txPayload: {
    type: TransactionType;
    name: string;
    amount: number;
    category: string;
    isRecurring: boolean;
    date: string;
  }) => {
    const created = await addTransaction(yearMonth, txPayload);
    setTransactions((prev) => [created, ...prev]);
  };

  // Delete Transaction handler
  const handleDeleteTx = async (id: string) => {
    await deleteTransaction(yearMonth, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Add Category handler
  const handleAddCat = async (type: TransactionType, value: string, label: string) => {
    const created = await addCategory(type, value, label);
    if (type === 'income') {
      setIncomeCategories((prev) => [...prev, created]);
    } else {
      setExpenseCategories((prev) => [...prev, created]);
    }
  };

  // Aggregates
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Header
          yearMonth={yearMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-xs font-semibold">데이터를 불러오는 중입니다...</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryGrid
              carryOver={carryOver}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              onUpdateCarryOver={handleUpdateCarryOver}
            />

            {/* Budget Progress Bar */}
            <BudgetProgressBar totalIncome={totalIncome} totalExpense={totalExpense} />

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (Forms & Settings) */}
              <div className="lg:col-span-5 space-y-6">
                <TransactionForm
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  onAddTransaction={handleAddTx}
                />

                <CategoryManager
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  onAddCategory={handleAddCat}
                />
              </div>

              {/* Right Column (Visual Breakdown & Lists) */}
              <div className="lg:col-span-7 space-y-6">
                <CategoryBreakdown transactions={transactions} totalExpense={totalExpense} />

                <TransactionList transactions={transactions} onDeleteTransaction={handleDeleteTx} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
