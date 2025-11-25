import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/helpers';

// --- Recent Activity ---
export function RecentActivityCard({ transactions, categories, theme = 'light' }) {
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  const getCategoryName = (subId) => {
    for (const cat of categories) {
      const sub = cat.subcategories.find((s) => s.id === subId);
      if (sub) return cat.name;
    }
    return 'Uncategorized';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return { month, day };
  };

  return (
    <div className={`
      mb-6 h-[317px] w-full rounded-3xl p-6 backdrop-blur-md transition-all duration-500 border
      ${theme === 'dark' 
        ? 'bg-slate-900/40 border-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]' 
        : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}
    `}>
      <h3 className={`mb-6 text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Recent Activity</h3>
      <div className="flex flex-col gap-4">
        {recentTransactions.length === 0 ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No recent transactions.</p>
        ) : (
          recentTransactions.map((tx) => {
            const { month, day } = formatDate(tx.date);
            const amountColor = tx.isIncome ? 'text-zillion-500' : 'text-red-500';
            const sign = tx.isIncome ? '+' : '-';

            return (
              <div key={tx.id} className="flex items-start justify-between">
                <div className="w-[40px] text-right leading-tight">
                  <div className={`text-[12px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{month}</div>
                  <div className={`text-[16px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{day}</div>
                </div>
                <div className="ml-4 flex-grow">
                  <div className={`text-[14px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {tx.merchant || (tx.isIncome ? 'Income' : 'Transaction')}
                  </div>
                  <div className={`text-[12px] font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {tx.isIncome ? 'Income' : getCategoryName(tx.subCategoryId)}
                  </div>
                </div>
                <div className={`text-[14px] font-bold ${amountColor}`}>
                  {sign} {formatCurrency(Math.abs(tx.amount))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Upcoming Bills ---
export function UpcomingBillsCard({ debts, theme = 'light' }) {
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return debts
      .filter((d) => d.paymentDueDate)
      .map((d) => {
        const dueDay = parseInt(d.paymentDueDate);
        let nextDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1);
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...d, nextDate, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5);
  }, [debts]);

  const getDueLabel = (diffDays, dateObj) => {
    if (diffDays === 0) return { text: 'Due Today', color: 'text-yellow-500' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-yellow-500' };
    const color = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    if (diffDays <= 7) {
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      return { text: `Due on ${dayName}`, color };
    }
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return { text: `Due on ${dateStr}`, color };
  };

  return (
    <div className={`
      h-[317px] w-full rounded-3xl p-6 backdrop-blur-md transition-all duration-500 border
      ${theme === 'dark' 
        ? 'bg-slate-900/40 border-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]' 
        : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}
    `}>
      <h3 className={`mb-6 text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Upcoming Bills</h3>
      <div className="flex flex-col gap-4">
        {upcomingBills.length === 0 ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming bills found in Debts.</p>
        ) : (
          upcomingBills.map((bill) => {
            const { text, color } = getDueLabel(bill.diffDays, bill.nextDate);
            return (
              <div key={bill.id} className="flex items-start justify-between">
                <div>
                  <div className={`text-[14px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{bill.name}</div>
                  <div className={`mt-1 text-[12px] font-medium ${color}`}>{text}</div>
                </div>
                <div className={`text-[14px] font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {formatCurrency(bill.monthlyPayment)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}