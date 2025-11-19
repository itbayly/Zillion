import React, { useState } from 'react';
import { TrendingDown, Plus, PiggyBank, TrendingUp, CalendarCheck, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { DebtForm } from '../../components/modals/DebtModals';
import { DebtInfoRow } from '../../components/ui/SharedUI';

export default function DebtsView({ debts, onDebtsChange, onOpenDebtDetails, onOpenLumpSumModal }) {
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

  // Amortization Helper (Local for Payoff Date calculation)
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
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Debt Tracker</h2>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button type="button" onClick={onOpenLumpSumModal} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <TrendingDown className="-ml-1 mr-2 h-5 w-5" /> Make Lump Sum Payment
          </button>
          <button type="button" onClick={() => setIsFormOpen(!isFormOpen)} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="-ml-1 mr-2 h-5 w-5" /> {isFormOpen ? 'Close Form' : 'Add New Debt'}
          </button>
        </div>
      </div>

      {isFormOpen && <DebtForm onAddDebt={handleAddDebt} />}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.length === 0 ? (
          <p className="text-center text-sm text-gray-500 md:col-span-2 lg:col-span-3">No debts added yet.</p>
        ) : (
          debts.map((debt) => {
            const startingAmount = debt.startingAmount || debt.amountOwed;
            const totalPaidOnPrincipal = startingAmount - debt.amountOwed;
            return (
              <div key={debt.id} className="rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <h3 className="text-lg font-bold text-gray-900">{debt.name}</h3>
                </div>
                <div className="p-4 space-y-3 flex-grow">
                  <DebtInfoRow icon={PiggyBank} label="Remaining Owed:" value={formatCurrency(debt.amountOwed)} isMainValue={true} />
                  <DebtInfoRow icon={TrendingUp} label="Paid on Principal:" value={formatCurrency(totalPaidOnPrincipal)} />
                  <DebtInfoRow icon={CalendarCheck} label="Est. Payoff Date:" value={getPayoffDate(debt)} />
                </div>
                <div className="border-t border-gray-200 p-4 bg-slate-50 rounded-b-lg">
                  <button type="button" onClick={() => onOpenDebtDetails(debt)} className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                    <Info className="mr-2 h-5 w-5 text-indigo-600" /> View Debt Info & Calculator
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}