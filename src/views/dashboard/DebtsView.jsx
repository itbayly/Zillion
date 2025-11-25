import React, { useState } from 'react';
import { TrendingDown, Plus, PiggyBank, TrendingUp, CalendarCheck, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { DebtForm } from '../../components/modals/DebtModals';
import { DebtInfoRow } from '../../components/ui/SharedUI';
import { Button } from '../../components/ui/Button';

export default function DebtsView({ debts, onDebtsChange, onOpenDebtDetails, onOpenLumpSumModal, theme = 'light' }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddDebt = (newDebt) => {
    const debtWithDefaults = {
      ...newDebt,
      startingAmount: newDebt.startingAmount || newDebt.amountOwed,
      originalTerm: newDebt.originalTerm || 0,
      remainingTerm: newDebt.remainingTerm || 0,
      extraMonthlyPayment: newDebt.extraMonthlyPayment || 0,
    };
    onDebtsChange([...debts, debtWithDefaults]);
    setIsFormOpen(false);
  };

  const calculateAmortization = (principal, monthlyPayment, monthlyRate) => {
    if (monthlyPayment <= 0) return { term: Infinity };
    if (monthlyRate <= 0) return { term: principal / monthlyPayment };
    if (monthlyPayment <= principal * monthlyRate) return { term: Infinity };
    const n = -Math.log(1 - (principal * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
    return { term: n };
  };

  const getPayoffDate = (debt) => {
    const P = debt.amountOwed;
    const M = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
    const r = (debt.interestRate || 0) / 100 / 12;
    if (M <= 0) return 'N/A';
    if (P <= 0) return 'Paid Off!';
    const { term } = calculateAmortization(P, M, r);
    if (!isFinite(term) || term <= 0) return 'N/A';
    const date = new Date();
    date.setMonth(date.getMonth() + term);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Debt Tracker</h2>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={onOpenLumpSumModal} icon={<TrendingDown className="w-4 h-4" />}>Make Lump Sum Payment</Button>
          <Button variant="primary" onClick={() => setIsFormOpen(!isFormOpen)} icon={<Plus className="w-4 h-4" />}>
            {isFormOpen ? 'Close Form' : 'Add New Debt'}
          </Button>
        </div>
      </div>

      {isFormOpen && <DebtForm onAddDebt={handleAddDebt} theme={theme} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.length === 0 ? (
          <p className={`text-center text-sm col-span-full ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No debts added yet.</p>
        ) : (
          debts.map((debt) => {
            const startingAmount = debt.startingAmount || debt.amountOwed;
            const totalPaidOnPrincipal = startingAmount - debt.amountOwed;
            
            // Glassmorphic Card Style
            const cardClass = theme === 'dark' 
              ? 'bg-slate-900/40 border-white/10 shadow-lg shadow-black/20' 
              : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50';
            const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-100';
            const textClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-900';

            return (
              <div key={debt.id} className={`rounded-3xl border backdrop-blur-md transition-all duration-500 flex flex-col overflow-hidden ${cardClass}`}>
                <div className={`flex items-center justify-between border-b p-5 ${borderClass}`}>
                  <h3 className={`text-lg font-bold ${textClass}`}>{debt.name}</h3>
                </div>
                <div className="p-5 space-y-4 flex-grow">
                  <DebtInfoRow icon={PiggyBank} label="Remaining Owed:" value={formatCurrency(debt.amountOwed)} isMainValue={true} theme={theme} />
                  <DebtInfoRow icon={TrendingUp} label="Paid on Principal:" value={formatCurrency(totalPaidOnPrincipal)} theme={theme} />
                  <DebtInfoRow icon={CalendarCheck} label="Est. Payoff Date:" value={getPayoffDate(debt)} theme={theme} />
                </div>
                <div className={`border-t p-4 ${borderClass} ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                  <Button variant="outline" fullWidth onClick={() => onOpenDebtDetails(debt)} icon={<Info className="w-4 h-4" />} className="text-xs h-9">
                    View Debt Info & Calculator
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}