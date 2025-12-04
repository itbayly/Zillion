import React, { useState, useMemo } from 'react';
import { Settings, EyeOff, RotateCcw, Check } from 'lucide-react';
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
export const TopMerchantsCard = React.memo(({ transactions, excludedMerchants = [], onUpdateExclusions, theme = 'light', className = '' }) => {
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

      <div className={`glass-card h-[317px] w-full p-6 relative group/card ${className || 'mb-6'}`}>
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
});
TopMerchantsCard.displayName = 'TopMerchantsCard';

// --- Recent Activity ---
export const RecentActivityCard = React.memo(({ transactions, categories, theme = 'light' }) => {
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
    <div className="glass-card mb-6 h-[317px] w-full p-6">
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
});
RecentActivityCard.displayName = 'RecentActivityCard';

// --- Upcoming Bills (Recurring Transactions View) ---
export const UpcomingBillsCard = React.memo(({ recurringTransactions = [], categories = [], theme = 'light' }) => {
  
  const sortedItems = useMemo(() => {
    return [...recurringTransactions].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [recurringTransactions]);

  const getCatName = (subId) => {
    for (const c of categories) {
       const s = c.subcategories.find(sub => sub.id === subId);
       if (s) return s.name;
    }
    return 'Unknown';
  };

  return (
    <div className="glass-card h-[317px] w-full p-6 flex flex-col">
      <h3 className={`mb-6 text-xl font-bold flex-shrink-0 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Upcoming Bills</h3>
      
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {sortedItems.length === 0 ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No recurring bills set up.</p>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all gap-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-white/50'}`}>
               
               {/* Info Area */}
               <div className="flex items-center gap-3 flex-grow min-w-0">
                   <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex flex-col items-center justify-center text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                       <span className="text-[9px] uppercase opacity-70">Day</span>
                       <span>{item.dayOfMonth}</span>
                   </div>
                   <div className="min-w-0 flex-grow truncate">
                       <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{item.merchant}</p>
                       <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{getCatName(item.subCategoryId)}</p>
                   </div>
               </div>

               {/* Amount */}
               <div className="flex-shrink-0 text-right">
                   {item.isVariable ? (
                      <span className={`text-xs font-medium italic ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.pendingAmount > 0 ? formatCurrency(item.pendingAmount) : 'Variable'}
                      </span>
                   ) : (
                      <span className={`text-sm font-mono font-bold ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>
                          {formatCurrency(item.amount)}
                      </span>
                   )}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
UpcomingBillsCard.displayName = 'UpcomingBillsCard';