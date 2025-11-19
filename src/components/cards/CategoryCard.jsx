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
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { totalBudgeted, totalSpent, remaining } = useMemo(() => {
    let b = 0;
    let s = 0;
    category.subcategories.forEach((sub) => {
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

  let statusColor = 'text-[#3DDC97]';
  let barColor = 'bg-[#3DDC97]';

  if (remaining < 0) {
    statusColor = 'text-[#EF767A]';
    barColor = 'bg-[#EF767A]';
  } else if (progressPercent > 75) {
    statusColor = 'text-[#FFB347]';
    barColor = 'bg-[#FFB347]';
  }

  return (
    <div className="mb-6 w-full max-w-[1050px] rounded-xl bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.10)] transition-all">
      {/* Header */}
      <div className="cursor-pointer p-6" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <h3 className="font-montserrat text-[18px] font-bold uppercase text-[#4B5563]">{category.name}</h3>
          <div className="flex items-center gap-4">
            <span className={`font-montserrat text-[18px] font-bold ${statusColor}`}>
              {remaining < 0
                ? `${formatCurrency(Math.abs(remaining))} OVER BUDGET`
                : `${formatCurrency(remaining)} REMAINING`}
            </span>
            <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-montserrat text-[14px] font-normal text-[#4B5563]">{formatCurrency(totalSpent)} SPENT</span>
          <span className="mr-10 font-montserrat text-[14px] font-normal text-[#4B5563]">{formatCurrency(totalBudgeted)} BUDGETED</span>
        </div>
        <div className="mt-6 h-[12px] w-full rounded-full bg-[#E5E7EB]">
          <div className={`h-[12px] rounded-full ${barColor}`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
        </div>
      </div>

      {/* Expanded Subcategories */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 pb-6 pt-6">
          <div className="flex flex-col gap-8">
            {category.subcategories.map((sub) => {
              const isDebt = !!sub.linkedDebtId;
              const isFund = sub.type === 'sinking_fund';
              const subSpent = spentBySubCategory[sub.id] || 0;
              let subBudgeted = sub.budgeted || 0;
              if (isDebt) {
                const debt = debts.find((d) => d.id === sub.linkedDebtId);
                if (debt) subBudgeted = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
              }

              const currentBalance = isFund ? sinkingFundBalances[sub.id] || 0 : 0;
              let subProgress = subBudgeted > 0 ? (subSpent / subBudgeted) * 100 : 0;
              let subBarColor = 'bg-[#3DDC97]';
              let subStatusColor = 'text-[#3DDC97]';
              let subStatusText = '';

              if (isDebt) {
                const subRemaining = subBudgeted - subSpent;
                subBarColor = 'bg-[#A78BFA]';
                subStatusColor = 'text-[#7C3AED]';
                subStatusText = `${formatCurrency(subRemaining)} LEFT TO PAY`;
              } else if (isFund) {
                const subRemaining = currentBalance;
                subBarColor = 'bg-[#60A5FA]';
                if (subRemaining < 0) {
                  subStatusColor = 'text-[#EF767A]';
                  subStatusText = `${formatCurrency(Math.abs(subRemaining))} OVERDRAWN`;
                } else {
                  subStatusColor = 'text-[#60A5FA]';
                  subStatusText = `${formatCurrency(subRemaining)} AVAILABLE`;
                }
              } else {
                const subRemaining = subBudgeted - subSpent;
                if (subRemaining < 0) {
                  subStatusColor = 'text-[#EF767A]';
                  subBarColor = 'bg-[#EF767A]';
                  subStatusText = `${formatCurrency(Math.abs(subRemaining))} OVER BUDGET`;
                } else {
                  subStatusText = `${formatCurrency(subRemaining)} REMAINING`;
                  if (subProgress > 75) {
                      subStatusColor = 'text-[#FFB347]';
                      subBarColor = 'bg-[#FFB347]';
                  }
                }
              }

              return (
                <div key={sub.id} className="relative w-full">
                  <button
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    onClick={() => onOpenTransactionDetails({ type: 'subcategory', id: sub.id, name: sub.name })}
                    title="View transactions"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-montserrat text-[16px] font-bold text-[#4B5563]">{sub.name}</span>
                      {isDebt && <StatusPill type="debt" />}
                      {isFund && <StatusPill type="fund" />}
                    </div>
                    <span className={`font-montserrat text-[14px] font-bold ${subStatusColor}`}>{subStatusText}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-montserrat text-[14px] font-normal text-[#4B5563]">
                    <span>{formatCurrency(subSpent)} Spent {isFund ? ` | ${formatCurrency(subBudgeted)} Added` : ''}</span>
                    <span>{isDebt ? 'Monthly Payment' : 'Budgeted'}: {formatCurrency(subBudgeted)}</span>
                  </div>
                  <div className="mt-3 h-[8px] w-full rounded-full bg-[#E5E7EB]">
                    <div className={`h-[8px] rounded-full ${subBarColor}`} style={{ width: `${Math.min(subProgress, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}