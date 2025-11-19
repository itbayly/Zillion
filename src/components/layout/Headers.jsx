import React, { useState, useMemo } from 'react';
import { CalendarDays, ChevronDown, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// --- Month Dropdown ---
function MonthDropdown({ isOpen, onClose, monthlyDataKeys, onSelectMonth, onSimulateRollover }) {
  if (!isOpen) return null;

  const sortedKeys = [...monthlyDataKeys].sort((a, b) => b.localeCompare(a));

  const formatKey = (key) => {
    const [year, month] = key.split('-');
    const date = new Date(year, month - 1, 15);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="absolute right-[228px] top-[60px] z-50 w-[218px] rounded-lg border border-gray-100 bg-white py-2 shadow-xl">
      <div className="max-h-60 overflow-y-auto">
        {sortedKeys.map((key) => (
          <button
            key={key}
            onClick={() => { onSelectMonth(key); onClose(); }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:font-semibold"
          >
            {formatKey(key)}
          </button>
        ))}
      </div>
      <div className="border-t border-dashed border-gray-300 mt-2 pt-2 px-2">
        <button
          onClick={() => { onSimulateRollover(); onClose(); }}
          className="flex w-full items-center justify-center rounded-md bg-indigo-50 px-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
        >
          <Plus className="mr-1 h-3 w-3" />
          Test: Next Month
        </button>
      </div>
    </div>
  );
}

// --- Header Bar ---
export function HeaderBar({ userName, viewDate, monthlyDataKeys, setViewDate, onSimulateRollover, onOpenTransactionModal }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = userName ? userName.split(' ')[0] : 'there';
    if (hour >= 4 && hour < 12) return `Good Morning, ${firstName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  };

  const formatViewDate = (key) => {
    if (!key) return 'Loading...';
    const [year, month] = key.split('-');
    const date = new Date(year, month - 1, 15);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const getContextText = () => {
    const [year, month] = viewDate.split('-');
    const date = new Date(year, month - 1, 15);
    const fullMonth = date.toLocaleString('default', { month: 'long' });
    return `Here is your budget overview for ${fullMonth} ${year}`;
  };

  return (
    // Added 'w-full max-w-[1050px]' to the className below to match card width
    <div className="relative mb-10 flex w-full max-w-[1050px] items-center justify-between">
      <div>
        <h1 className="font-montserrat text-[28px] font-bold text-[#1E1E1E]">{getGreeting()}</h1>
        <p className="mt-1 font-montserrat text-[14px] font-normal text-[#6B7280]">{getContextText()}</p>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex h-[44px] w-[218px] items-center justify-center rounded-xl bg-white shadow-[0px_3px_10px_rgba(0,0,0,0.10)] transition-shadow hover:shadow-md"
        >
          <CalendarDays className="mr-3 h-5 w-5 text-[#4B5563]" />
          <span className="font-montserrat text-sm font-bold text-[#4B5563]">{formatViewDate(viewDate)}</span>
          <ChevronDown className="ml-2 h-5 w-5 text-[#4B5563]" />
        </button>
        <button
          onClick={onOpenTransactionModal}
          className="flex h-[44px] w-[204px] items-center justify-center rounded-xl bg-[#3DDC97] font-montserrat text-sm font-bold text-white transition-transform active:scale-95 hover:brightness-95"
        >
          + ADD TRANSACTION
        </button>
      </div>

      <MonthDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        monthlyDataKeys={monthlyDataKeys}
        onSelectMonth={setViewDate}
        onSimulateRollover={onSimulateRollover}
      />
    </div>
  );
}

// --- Hero Bar ---
export function HeroBar({ categories, transactions, income, savingsGoal }) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  const { totalBudgeted, totalSpent, discretionaryRemaining } = useMemo(() => {
    let tBudgeted = 0;
    let tSpent = 0;
    let discRemaining = 0;

    const spentMap = {};
    transactions.forEach((tx) => {
      if (!tx.isIncome) {
        const amt = parseFloat(tx.amount) || 0;
        spentMap[tx.subCategoryId] = (spentMap[tx.subCategoryId] || 0) + amt;
        tSpent += amt;
      }
    });

    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        const subBudgeted = sub.budgeted || 0;
        const subSpent = spentMap[sub.id] || 0;
        const subRemaining = subBudgeted - subSpent;
        tBudgeted += subBudgeted;
        if (sub.type !== 'sinking_fund' && !sub.linkedDebtId) {
          discRemaining += subRemaining;
        }
      });
    });

    return { totalBudgeted: tBudgeted, totalSpent: tSpent, discretionaryRemaining: discRemaining };
  }, [categories, transactions]);

  const safeColor = discretionaryRemaining >= 0 ? 'text-[#3DDC97]' : 'text-[#EF767A]';
  const daysRemaining = daysInMonth - currentDay;
  const dailySafe = daysRemaining > 0 ? discretionaryRemaining / daysRemaining : 0;

  const timeElapsedPercent = (currentDay / daysInMonth) * 100;
  const pacingPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  let pacingColor = 'text-[#3DDC97]';
  if (pacingPercent > timeElapsedPercent) {
    pacingColor = pacingPercent > timeElapsedPercent * 2 ? 'text-[#EF767A]' : 'text-[#FFB347]';
  }

  const totalIncome = (income.source1 || 0) + (income.source2 || 0);
  const netCashFlow = totalIncome - totalSpent;
  let flowColor = 'text-[#3DDC97]';
  const totalSavingsAllocated = parseFloat(savingsGoal) || 0;
  if (netCashFlow < 0) flowColor = 'text-[#EF767A]';
  else if (netCashFlow < totalSavingsAllocated) flowColor = 'text-[#FFB347]';

  return (
    <div className="mb-8 flex h-[120px] w-full max-w-[1050px] items-center justify-between rounded-xl bg-white px-6 shadow-[0px_3px_20px_rgba(0,0,0,0.10)]">
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="font-montserrat text-[12px] font-bold text-[#4B5563]">
          {discretionaryRemaining >= 0 ? 'SAFE TO SPEND' : 'OVER BUDGET BY'}
        </span>
        <span className={`mt-1 font-montserrat text-[32px] font-bold ${safeColor}`}>
          {formatCurrency(Math.abs(discretionaryRemaining))}
        </span>
        <span className="font-montserrat text-[14px] font-normal text-[#4B5563]">
          {discretionaryRemaining >= 0 ? `${formatCurrency(dailySafe)} / Day Remaining` : 'Reduce spending immediately'}
        </span>
      </div>

      <div className="h-[72px] w-[1px] bg-[#E5E7EB]" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="font-montserrat text-[12px] font-bold text-[#4B5563]">MONTHLY PACING</span>
        <span className={`mt-1 font-montserrat text-[32px] font-bold ${pacingColor}`}>{pacingPercent.toFixed(0)}%</span>
        <span className="font-montserrat text-[14px] font-normal text-[#4B5563]">
          {formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)} Spent
        </span>
      </div>

      <div className="h-[72px] w-[1px] bg-[#E5E7EB]" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="font-montserrat text-[12px] font-bold text-[#4B5563]">NET CASH FLOW</span>
        <span className={`mt-1 font-montserrat text-[32px] font-bold ${flowColor}`}>
          {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
        </span>
        <span className="font-montserrat text-[14px] font-normal text-[#4B5563]">
          {formatCurrency(totalIncome)} In / {formatCurrency(totalSpent)} Out
        </span>
      </div>
    </div>
  );
}
