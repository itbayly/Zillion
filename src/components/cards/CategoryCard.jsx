import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { StatusPill } from '../ui/SharedUI';

export default function CategoryCard({
  category,
  spentBySubCategory,
  sinkingFundBalances,
  debts,
  onOpenTransactionDetails,
  theme,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { totalBudgeted, totalSpent, remaining } = useMemo(() => {
    let b = 0;
    let s = 0;
    category.subcategories.forEach((sub) => {
      if (sub.type === 'deduction') return;
      let subBudget = sub.budgeted || 0;
      if (sub.linkedDebtId) {
        const debt = debts.find((d) => d.id === sub.linkedDebtId);
        if (debt)
          subBudget = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
      }
      b += subBudget;
      s += spentBySubCategory[sub.id] || 0;
    });
    return { totalBudgeted: b, totalSpent: s, remaining: b - s };
  }, [category, spentBySubCategory, debts]);

  const progressPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Theme-aware colors
  const cardBg = theme === 'dark' 
    ? 'bg-slate-950/70 border border-white/10 shadow-xl shadow-black/20' 
    : 'bg-white/70 border border-white/60 shadow-lg shadow-slate-200/50';
  
  const textColorMain = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const textColorSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-slate-800' : 'border-slate-100';

  let statusColor = theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600';
  if (remaining < 0) {
    statusColor = 'text-red-500';
  } else if (progressPercent > 75) {
    statusColor = 'text-yellow-500';
  }

  return (
    <div className={`w-full max-w-[924px] rounded-3xl backdrop-blur-md transition-all duration-500 ${cardBg}`}>
      {/* --- Main Category Header --- */}
      <div className="cursor-pointer p-6" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <h3 className={`font-sans text-[17px] font-bold uppercase tracking-wide ${textColorMain}`}>{category.name}</h3>
          <div className="flex items-center gap-4">
            <span className={`text-[11px] font-bold uppercase ${textColorSub}`}>
              SPENT: {formatCurrency(totalSpent)}
            </span>
            <span className={`text-[11px] font-bold uppercase ${statusColor}`}>
              {remaining < 0
                ? `${formatCurrency(Math.abs(remaining))} OVER`
                : `${formatCurrency(remaining)} REMAINING`}
            </span>
            <div className={`p-1 rounded-full transition-all duration-300 ${isExpanded ? 'bg-zillion-500/20 rotate-180' : ''}`}>
               <ChevronDown className={`h-5 w-5 transition-colors ${isExpanded ? 'text-zillion-500' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* --- Expanded Subcategories --- */}
      {isExpanded && (
        <div className={`border-t px-6 pb-6 pt-2 ${borderColor}`}>
          <div className="flex flex-col gap-2">
            {category.subcategories.map((sub) => {
              const isDebt = !!sub.linkedDebtId;
              const isFund = sub.type === 'sinking_fund';
              const isDeduction = sub.type === 'deduction';
              
              const subSpent = spentBySubCategory[sub.id] || 0;
              let subBudgeted = sub.budgeted || 0;
              
              if (isDebt) {
                const debt = debts.find((d) => d.id === sub.linkedDebtId);
                if (debt) subBudgeted = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
              }

              const currentBalance = isFund ? sinkingFundBalances[sub.id] || 0 : 0;
              let subProgress = (subBudgeted > 0 && !isDeduction) ? (subSpent / subBudgeted) * 100 : 0;
              
              // Sub-Item Colors
              let subBarColor = 'bg-zillion-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
              let subStatusColor = theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600';
              let subStatusText = '';

              if (isDeduction) {
                 subStatusColor = 'text-slate-400';
                 subStatusText = 'AUTO-DEDUCTED';
                 subBarColor = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200';
              } else if (isDebt) {
                const subRemaining = subBudgeted - subSpent;
                subBarColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
                subStatusColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600';
                subStatusText = `${formatCurrency(subRemaining)} LEFT TO PAY`;
              } else if (isFund) {
                const subRemaining = currentBalance;
                subBarColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
                if (subRemaining < 0) {
                  subStatusColor = 'text-red-500';
                  subStatusText = `${formatCurrency(Math.abs(subRemaining))} OVERDRAWN`;
                } else {
                  subStatusColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
                  subStatusText = `${formatCurrency(subRemaining)} AVAILABLE`;
                }
              } else {
                const subRemaining = subBudgeted - subSpent;
                if (subRemaining < 0) {
                  subStatusColor = 'text-red-500';
                  subBarColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                  subStatusText = `${formatCurrency(Math.abs(subRemaining))} OVER BUDGET`;
                } else {
                  subStatusText = `${formatCurrency(subRemaining)} REMAINING`;
                  if (subProgress > 75) {
                      subStatusColor = 'text-yellow-500';
                      subBarColor = 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                  }
                }
              }

              return (
                <div key={sub.id} className={`relative w-full border-t py-4 first:border-t-0 ${borderColor} ${isDeduction ? 'opacity-60' : ''}`}>
                  <button
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    onClick={() => !isDeduction && onOpenTransactionDetails({ type: 'subcategory', id: sub.id, name: sub.name })}
                    title={isDeduction ? "Deductions are automatic" : "View transactions"}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`font-sans text-[15px] font-semibold ${textColorMain}`}>{sub.name}</span>
                      {isDebt && <StatusPill type="debt" theme={theme} />}
                      {isFund && <StatusPill type="fund" theme={theme} />}
                      {isDeduction && (
                        <div className={`ml-3 flex items-center justify-center rounded-full px-2 py-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">PAYSTUB</span>
                        </div>
                      )}
                    </div>
                    <span className={`font-mono text-[12px] font-bold tracking-wide ${subStatusColor}`}>{subStatusText}</span>
                  </div>

                  <div className={`mt-1 flex justify-between font-sans text-[13px] font-normal ${textColorSub}`}>
                    {isDeduction ? (
                        <span className="italic opacity-70">Value: {formatCurrency(subBudgeted)}</span>
                    ) : (
                        <>
                            <span>{formatCurrency(subSpent)} {isDebt ? 'Paid' : 'Spent'} {isFund ? ` | ${formatCurrency(subBudgeted)} Added` : ''}</span>
                            <span>{isDebt ? 'Monthly Payment' : 'Budgeted'}: {formatCurrency(subBudgeted)}</span>
                        </>
                    )}
                  </div>

                  {!isDeduction && (
                    <div className={`mt-3 h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${subBarColor}`} style={{ width: `${Math.min(subProgress, 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}