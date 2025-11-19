import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { WizardTextInput } from '../../components/ui/FormInputs';
import { DebtForm } from '../../components/modals/DebtModals';

// Step 7
export function WizardStep2_Income({ income, totalIncome, onIncomeChange, onNext, onBack, budgetData }) {
  const [source1, setSource1] = useState(income.source1 === 0 ? '' : income.source1);
  const [source2, setSource2] = useState(income.source2 === 0 ? '' : income.source2);
  const [showPartnerIncome, setShowPartnerIncome] = useState(income.source2 > 0);

  const internalTotalIncome = useMemo(() => (parseFloat(source1) || 0) + (parseFloat(source2) || 0), [source1, source2]);

  useEffect(() => {
    setSource1(income.source1 === 0 ? '' : income.source1);
    setSource2(income.source2 === 0 ? '' : income.source2);
    if (income.source2 > 0) setShowPartnerIncome(true);
  }, [income]);

  const handleBlur = (source, value) => {
    const numericValue = parseFloat(value) || 0;
    if (source === 'source1') { setSource1(numericValue === 0 ? '' : numericValue); onIncomeChange('source1', numericValue); } 
    else { setSource2(numericValue === 0 ? '' : numericValue); onIncomeChange('source2', numericValue); }
  };

  const handleTogglePartnerIncome = (show) => { setShowPartnerIncome(show); if (!show) { setSource2(''); onIncomeChange('source2', 0); } };
  const handleNext = () => { onIncomeChange('source1', parseFloat(source1) || 0); onIncomeChange('source2', parseFloat(source2) || 0); onNext(); };
  const handleBack = () => { onIncomeChange('source1', parseFloat(source1) || 0); onIncomeChange('source2', parseFloat(source2) || 0); onBack(); };
  const userFirstName = budgetData.userName?.split(' ')[0] || 'Your';

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Set Up Your Monthly Income</h3>
      </div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <WizardTextInput label={`${userFirstName}'s Monthly Income`} id="source1" value={source1} onChange={e => setSource1(e.target.value)} onBlur={e => handleBlur('source1', e.target.value)} placeholder="0.00" type="number" />
        {!showPartnerIncome && (
          <div className="pt-2 text-center">
            <button type="button" onClick={() => handleTogglePartnerIncome(true)} className="inline-flex items-center rounded-md border border-[#3DDC97] bg-white px-4 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50"><UserPlus className="mr-2 h-5 w-5" /> Add Partner's Income</button>
            <p className="mt-4 text-xs text-gray-500">Note: You can invite your partner later in Settings.</p>
          </div>
        )}
        {showPartnerIncome && (
          <div>
            <WizardTextInput label="Partner's Monthly Income" id="source2" value={source2} onChange={e => setSource2(e.target.value)} onBlur={e => handleBlur('source2', e.target.value)} placeholder="0.00" type="number" />
            <button type="button" onClick={() => handleTogglePartnerIncome(false)} className="mt-2 text-xs text-red-600 hover:text-red-500">Remove Partner Income</button>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 flex items-center justify-between">
            <span className="text-lg font-medium text-gray-800">Total Monthly Income:</span>
            <span className="text-2xl font-semibold text-emerald-600">{formatCurrency(internalTotalIncome)}</span>
        </div>
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={handleBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={handleNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT</button>
      </div>
    </div>
  );
}

// Step 8
export function WizardStep3_Savings({ savingsGoal, totalIncome, onSavingsChange, bankAccounts, mainSavingsAccountId, onMainSavingsAccountChange, onNext, onBack }) {
  const [goal, setGoal] = useState(savingsGoal === 0 ? '' : savingsGoal);
  const internalRemainingAfterSavings = useMemo(() => totalIncome - (parseFloat(goal) || 0), [totalIncome, goal]);

  useEffect(() => { setGoal(savingsGoal === 0 ? '' : savingsGoal); }, [savingsGoal]);

  const handleBlur = (value) => { const numericValue = parseFloat(value) || 0; setGoal(numericValue === 0 ? '' : numericValue); onSavingsChange(numericValue); };
  const handleNext = () => { onSavingsChange(parseFloat(goal) || 0); onNext(); };
  const handleBack = () => { onSavingsChange(parseFloat(goal) || 0); onBack(); };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Set Your Monthly Savings Goal</h3>
      </div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 flex items-center justify-between">
            <span className="text-lg font-medium text-gray-800">Total Monthly Income:</span>
            <span className="text-2xl font-semibold text-emerald-600">{formatCurrency(totalIncome)}</span>
        </div>
        <WizardTextInput label="Monthly Savings Goal" id="savingsGoal" value={goal} onChange={e => setGoal(e.target.value)} onBlur={e => handleBlur(e.target.value)} placeholder="0.00" type="number" />
        <div>
          <label htmlFor="mainSavingsAccount" className="block text-sm font-medium text-gray-700">Which account will this savings go into?</label>
          <select id="mainSavingsAccount" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value={mainSavingsAccountId || ''} onChange={e => onMainSavingsAccountChange(e.target.value)}>
            <option value="">Select an account...</option>
            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
        </div>
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between"><span className="text-lg font-medium text-gray-800">Remaining to Budget:</span><span className="text-2xl font-semibold text-emerald-600">{formatCurrency(internalRemainingAfterSavings)}</span></div>
        </div>
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={handleBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={handleNext} disabled={!mainSavingsAccountId} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300">NEXT</button>
      </div>
    </div>
  );
}

// Step 9
export function WizardStep6_DebtSetup({ debts, onDebtsChange, onBack, onNext }) {
  const handleDeleteDebt = (id) => onDebtsChange(debts.filter((debt) => debt.id !== id));
  const handleAddDebt = (newDebt) => onDebtsChange([...debts, newDebt]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Set Up Debt Tracking</h3>
      </div>
      <DebtForm onAddDebt={handleAddDebt} />
      <div className="mt-8 max-w-md mx-auto space-y-3">
        <h4 className="text-sm font-medium text-gray-500">Added Debts</h4>
        {debts.length === 0 ? <p className="text-center text-sm text-gray-500">No debts added yet.</p> : debts.map((debt) => (
            <div key={debt.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex-1"><span className="font-medium text-gray-900">{debt.name}</span>{debt.autoInclude && <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">Auto-Budget</span>}<p className="text-sm text-gray-600">{formatCurrency(debt.amountOwed)} at {debt.interestRate}% - {formatCurrency(debt.monthlyPayment)}/mo</p></div>
              <button type="button" onClick={() => handleDeleteDebt(debt.id)} className="ml-4 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
        ))}
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={onNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT</button>
      </div>
    </div>
  );
}