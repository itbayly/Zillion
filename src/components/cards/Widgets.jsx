import React, { useState, useMemo } from 'react';
import { Settings, EyeOff, Trash2, X, RotateCcw, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ModalWrapper } from '../ui/SharedUI';
import { Button } from '../ui/Button';

// --- Exclusions Modal ---
function ManageExclusionsModal({ isOpen, onClose, excludedMerchants, onUpdateExclusions, theme }) {
  if (!isOpen) return null;

  const handleUnexclude = (name) => {
    onUpdateExclusions(excludedMerchants.filter(m => m !== name));
  };

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Excluded Merchants" maxWidth="max-w-md">
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
        These merchants are hidden from your Top Merchants list.
      </p>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {excludedMerchants.length === 0 ? (
          <div className={`text-center py-8 border rounded-xl ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
             <Check className="w-6 h-6 mx-auto mb-2 opacity-50" />
             <p className="text-xs">No merchants excluded.</p>
          </div>
        ) : (
          excludedMerchants.map((name) => (
            <div key={name} className={`flex justify-between items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
               <span className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{name}</span>
               <button 
                 onClick={() => handleUnexclude(name)}
                 className="text-xs flex items-center gap-1 text-zillion-500 hover:text-zillion-600 font-medium transition-colors"
               >
                 <RotateCcw size={12} /> Restore
               </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onClose}>Done</Button>
      </div>
    </ModalWrapper>
  );
}

// --- Top Merchants ---
export function TopMerchantsCard({ transactions, excludedMerchants = [], onUpdateExclusions, theme = 'light' }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const topMerchants = useMemo(() => {
    const totals = {};
    transactions.forEach(tx => {
      if (tx.isIncome) return;
      
      const name = tx.merchant || 'Unknown';
      
      // 1. Filter Transfers
      if (name.startsWith('Transfer to') || name.startsWith('Transfer from')) return;
      
      // 2. Filter Exclusions
      if (excludedMerchants.includes(name)) return;

      totals[name] = (totals[name] || 0) + (parseFloat(tx.amount) || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, excludedMerchants]);

  const handleExclude = (name) => {
    if (window.confirm(`Hide "${name}" from this list?`)) {
       onUpdateExclusions([...excludedMerchants, name]);
    }
  };

  return (
    <>
      <ManageExclusionsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        excludedMerchants={excludedMerchants} 
        onUpdateExclusions={onUpdateExclusions}
        theme={theme}
      />

      <div className={`
        mb-6 h-[317px] w-full rounded-3xl p-6 backdrop-blur-md transition-all duration-500 border relative group/card
        ${theme === 'dark' 
          ? 'bg-slate-900/40 border-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]' 
          : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}
      `}>
        <div className="flex items-center justify-between mb-6">
           <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Top Merchants</h3>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className={`p-2 rounded-full transition-all opacity-0 group-hover/card:opacity-100 ${theme === 'dark' ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
             title="Manage Exclusions"
           >
             <Settings className="w-4 h-4" />
           </button>
        </div>

        <div className="flex flex-col gap-4">
          {topMerchants.length === 0 ? (
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No spending data available.</p>
          ) : (
            topMerchants.map((merchant, idx) => (
              <div key={idx} className="flex items-center justify-between group/row">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div className={`text-[14px] font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {merchant.name}
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-2">
                   <span className={`text-[14px] font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                     {formatCurrency(merchant.value)}
                   </span>
                   <button 
                     onClick={() => handleExclude(merchant.name)}
                     className={`opacity-0 group-hover/row:opacity-100 transition-opacity ${theme === 'dark' ? 'text-slate-600 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}
                     title="Hide Merchant"
                   >
                     <EyeOff size={14} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

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