import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AssignmentInput } from '../ui/FormInputs';
import { CategoryBudgetList } from '../ui/BudgetLists';

// --- 1. Assign Remaining Funds (Wizard Step) ---
export function AssignRemainingModal({
  isOpen,
  onClose,
  remainingAmount,
  bankAccounts,
  onAssign,
  debts,
  categories,
}) {
  const [accountAssignments, setAccountAssignments] = useState({});
  const [debtAssignments, setDebtAssignments] = useState({});
  const [sinkingFundAssignments, setSinkingFundAssignments] = useState({});

  const sinkingFundSubCategories = useMemo(() => {
    return categories
      .flatMap((cat) => cat.subcategories)
      .filter((sub) => sub.type === 'sinking_fund' && !sub.linkedDebtId);
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setAccountAssignments({});
      setDebtAssignments({});
      setSinkingFundAssignments({});
    }
  }, [isOpen]);

  const totalAssigned = useMemo(() => {
    const accSum = Object.values(accountAssignments).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const debtSum = Object.values(debtAssignments).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const sinkingFundSum = Object.values(sinkingFundAssignments).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return Math.round((accSum + debtSum + sinkingFundSum) * 100) / 100;
  }, [accountAssignments, debtAssignments, sinkingFundAssignments]);

  const unassignedAmount = useMemo(() => {
    return Math.round((remainingAmount - totalAssigned) * 100) / 100;
  }, [remainingAmount, totalAssigned]);

  const handleAssignmentChange = (setter, id, value) => {
    setter((prev) => ({ ...prev, [id]: value }));
  };

  const handleBlur = (setter, id, e) => {
    const numericValue = parseFloat(e.target.value) || 0;
    setter((prev) => ({ ...prev, [id]: numericValue }));
  };

  const handleSubmit = () => {
    if (unassignedAmount !== 0) return;
    const numericAccountAssignments = {};
    for (const key in accountAssignments) numericAccountAssignments[key] = parseFloat(accountAssignments[key]) || 0;
    const numericDebtAssignments = {};
    for (const key in debtAssignments) numericDebtAssignments[key] = parseFloat(debtAssignments[key]) || 0;
    const numericSinkingFundAssignments = {};
    for (const key in sinkingFundAssignments) numericSinkingFundAssignments[key] = parseFloat(sinkingFundAssignments[key]) || 0;

    onAssign(numericAccountAssignments, numericDebtAssignments, numericSinkingFundAssignments);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Assign Your Remaining Funds</h3>
        <p className="mt-2 text-sm text-gray-500">
          You have <strong className="text-[#3DDC97]">{formatCurrency(remainingAmount)}</strong> left. Assign it to hit $0.
        </p>

        <div className={`mt-4 rounded-lg p-4 mb-4 border ${unassignedAmount !== 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-[#3DDC97]'}`}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${unassignedAmount !== 0 ? 'text-red-800' : 'text-emerald-800'}`}>Unassigned:</span>
            <span className={`text-xl font-semibold ${unassignedAmount !== 0 ? 'text-red-700' : 'text-[#3DDC97]'}`}>{formatCurrency(unassignedAmount)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4 max-h-60 overflow-y-auto pr-2">
          <div>
            <h4 className="text-xs uppercase tracking-wide font-bold text-gray-500 mb-2">Bank Accounts</h4>
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-800">{acc.name}</span>
                <div className="w-full sm:w-auto sm:max-w-xs">
                  <AssignmentInput value={accountAssignments[acc.id]} onChange={(val) => handleAssignmentChange(setAccountAssignments, acc.id, val)} onBlur={(e) => handleBlur(setAccountAssignments, acc.id, e)} />
                </div>
              </div>
            ))}
          </div>
          {debts.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide font-bold text-gray-500 mt-4 mb-2">Debts (Pay Extra)</h4>
              {debts.map((debt) => (
                <div key={debt.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-800">{debt.name}</span>
                  <div className="w-full sm:w-auto sm:max-w-xs">
                    <AssignmentInput value={debtAssignments[debt.id]} onChange={(val) => handleAssignmentChange(setDebtAssignments, debt.id, val)} onBlur={(e) => handleBlur(setDebtAssignments, debt.id, e)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {sinkingFundSubCategories.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide font-bold text-gray-500 mt-4 mb-2">Sinking Funds (Add Extra)</h4>
              {sinkingFundSubCategories.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-800">{sub.name}</span>
                  <div className="w-full sm:w-auto sm:max-w-xs">
                    <AssignmentInput value={sinkingFundAssignments[sub.id]} onChange={(val) => handleAssignmentChange(setSinkingFundAssignments, sub.id, val)} onBlur={(e) => handleBlur(setSinkingFundAssignments, sub.id, e)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={unassignedAmount !== 0} className="rounded-md border border-transparent bg-[#3DDC97] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed">Confirm & Finish</button>
        </div>
      </div>
    </div>
  );
}

// --- 2. Rebalance Budget (Deficit/Surplus Manager) ---
export function RebalanceBudgetModal({ isOpen, onClose, onSave, rebalanceData }) {
  const { categories: initialCategories, spentBySubCategory, sinkingFundBalances, debts, newRemaining, totalIncome, savingsGoal } = rebalanceData || {};
  const [modalCategories, setModalCategories] = useState([]);

  useEffect(() => {
    if (isOpen && initialCategories) {
      setModalCategories(JSON.parse(JSON.stringify(initialCategories)));
    }
  }, [isOpen, initialCategories]);

  const isDeficit = newRemaining < 0;

  const currentRemainingInModal = useMemo(() => {
    if (!modalCategories) return newRemaining || 0;
    const totalBudgeted = modalCategories.reduce((catTotal, category) => {
      const subTotal = category.subcategories.reduce((subAcc, sub) => {
        if (sub.linkedDebtId) {
          const debt = debts.find((d) => d.id === sub.linkedDebtId);
          if (debt) {
            const monthly = parseFloat(debt.monthlyPayment) || 0;
            const extra = parseFloat(debt.extraMonthlyPayment) || 0;
            return subAcc + monthly + extra;
          }
        }
        return subAcc + (parseFloat(sub.budgeted) || 0);
      }, 0);
      return catTotal + subTotal;
    }, 0);
    const remaining = (totalIncome || 0) - (savingsGoal || 0) - totalBudgeted;
    return Math.round(remaining * 100) / 100;
  }, [modalCategories, debts, totalIncome, savingsGoal]);

  const isSaveDisabled = currentRemainingInModal !== 0;

  const handleSave = () => {
    if (isSaveDisabled) return;
    onSave(modalCategories);
  };

  if (!isOpen || !rebalanceData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Re-balance Your Budget</h3>
        <p className="mt-2 text-sm text-gray-500">
          {isDeficit
            ? 'Your debt payment change has created a deficit. You must reduce your budgeted categories to get back to $0.'
            : 'Your debt payment change has created a surplus. You must assign this extra money to a category to get back to $0.'}
        </p>
        <div className={`sticky top-0 z-10 my-4 rounded-lg border-2 p-4 ${isDeficit ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-medium ${isDeficit ? 'text-red-800' : 'text-green-800'}`}>Remaining to Budget:</span>
            <span className={`text-2xl font-semibold ${currentRemainingInModal === 0 ? 'text-green-600' : isDeficit ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(currentRemainingInModal)}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          <CategoryBudgetList
            categories={modalCategories}
            spentBySubCategory={spentBySubCategory || {}}
            sinkingFundBalances={sinkingFundBalances || {}}
            debts={debts || []}
            onCategoriesChange={setModalCategories}
            onOpenTransactionDetails={() => {}}
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaveDisabled} className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">Save Changes</button>
        </div>
      </div>
    </div>
  );
}