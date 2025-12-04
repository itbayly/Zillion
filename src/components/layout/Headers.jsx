import React from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { calculateTotalIncome, calculateTotalSpent, calculateTotalBudgeted, calculateSafeToSpend } from '../../utils/budgetSelectors';
import { Button } from '../ui/Button';

export function HeaderBar({ 
  userName, 
  viewDate, 
  monthlyDataKeys, 
  setViewDate, 
  onSimulateRollover, 
  onOpenTransactionModal,
  theme
}) {
  // Helper to format "2023-10" -> "October 2023"
  const formatMonth = (key) => {
    if (!key) return '';
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const currentIndex = monthlyDataKeys.indexOf(viewDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < monthlyDataKeys.length - 1;

  const handlePrev = () => {
    if (hasPrev) setViewDate(monthlyDataKeys[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) setViewDate(monthlyDataKeys[currentIndex + 1]);
  };

  return (
    <div className="flex items-center justify-between w-full max-w-[924px] mb-8">
      <div className="flex items-center gap-4">
        {/* Date Navigation */}
        <div className={`flex items-center rounded-xl border p-1 shadow-sm backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white/70 border-white/60'}`}>
          <button 
            onClick={handlePrev} 
            disabled={!hasPrev}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 disabled:opacity-30' : 'hover:bg-slate-100 text-slate-500 disabled:opacity-30'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`px-4 font-bold min-w-[160px] text-center select-none transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
            {formatMonth(viewDate)}
          </span>
          <button 
            onClick={handleNext} 
            disabled={!hasNext}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 disabled:opacity-30' : 'hover:bg-slate-100 text-slate-500 disabled:opacity-30'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Simulate Rollover (Dev Tool) */}
        <button 
          onClick={onSimulateRollover}
          className="text-xs font-medium text-zillion-500 hover:text-zillion-600 underline decoration-dashed transition-colors"
        >
          Simulate Next Month
        </button>
      </div>

      {/* Add Transaction Button */}
      <div className="flex items-center gap-4">
        <span className={`text-sm font-medium hidden sm:block transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Welcome back, <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{userName}</span>
        </span>
        <Button
          variant="primary"
          onClick={onOpenTransactionModal}
          icon={<Plus className="w-5 h-5" />}
          className="shadow-lg shadow-zillion-400/20"
        >
          ADD NEW
        </Button>
      </div>
    </div>
  );
}

export function HeroBar({ categories, transactions, income, savingsGoal, debts, theme }) {
  // Use Selectors
  const totalIncome = calculateTotalIncome(income);
  const totalSpent = calculateTotalSpent(transactions);
  const totalBudgeted = calculateTotalBudgeted(categories, debts);
  const remaining = calculateSafeToSpend(income, transactions, savingsGoal);

  const cardClass = "glass-card p-5";
  const labelClass = "text-label";
  const valueClass = "text-heading-1 mt-1";

  return (
    <div className="w-full max-w-[924px] grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className={cardClass}>
        <p className={labelClass}>Total Income</p>
        <p className={valueClass}>{formatCurrency(totalIncome)}</p>
      </div>
      <div className={cardClass}>
        <p className={labelClass}>Total Spent</p>
        <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalSpent)}</p>
      </div>
      <div className={cardClass}>
        <p className={labelClass}>Budgeted</p>
        <p className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(totalBudgeted)}</p>
      </div>
      <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'bg-zillion-500/10 border-zillion-500/30' : 'bg-zillion-400 border-zillion-500 shadow-lg shadow-zillion-400/20'}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-900/80'}`}>Safe to Spend</p>
        <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-zillion-400' : 'text-white'}`}>{formatCurrency(remaining)}</p>
      </div>
    </div>
  );
}