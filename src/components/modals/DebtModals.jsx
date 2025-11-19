import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, DollarSign, Trash2, Edit3, History, TrendingDown, Calculator, PiggyBank, Landmark, TrendingUp, ArrowUpNarrowWide, ArrowDownWideNarrow, Percent, CalendarCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { WizardTextInput, BudgetInput } from '../ui/FormInputs';
import { DebtInfoRow } from '../ui/SharedUI';
import { TransactionHistoryModal } from './TransactionListModals';

// --- Helper Form ---
export function DebtForm({ onAddDebt }) {
  const [name, setName] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [amountOwed, setAmountOwed] = useState('');
  const [startingAmount, setStartingAmount] = useState('');
  const [originalTerm, setOriginalTerm] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [autoInclude, setAutoInclude] = useState(true);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState('');
  const [debtType, setDebtType] = useState('');
  const [compoundingFrequency, setCompoundingFrequency] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');

  useEffect(() => {
    if (['Credit Card', 'Student Loan'].includes(debtType)) setCompoundingFrequency('Daily');
    else if (['Mortgage', 'Auto Loan', 'Personal Loan'].includes(debtType)) setCompoundingFrequency('Monthly');
    else setCompoundingFrequency('');
  }, [debtType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalStarting = parseFloat(startingAmount) > 0 ? parseFloat(startingAmount) : parseFloat(amountOwed) || 0;
    const finalOwed = parseFloat(amountOwed) > 0 ? parseFloat(amountOwed) : finalStarting;

    onAddDebt({
      id: crypto.randomUUID(),
      name: name.trim(),
      debtType,
      compoundingFrequency,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
      amountOwed: finalOwed,
      startingAmount: finalStarting,
      originalTerm: parseFloat(originalTerm) || 0,
      interestRate: parseFloat(interestRate) || 0,
      autoInclude,
      extraMonthlyPayment: parseFloat(extraMonthlyPayment) || 0,
      paymentDueDate: compoundingFrequency === 'Monthly' ? parseFloat(paymentDueDate) || 1 : null,
      lastCompoundedDate: compoundingFrequency === 'Daily' ? new Date().toISOString() : null,
      currentMonthLedger: compoundingFrequency === 'Monthly' ? { monthKey: '', interestDue: 0, interestPaid: 0 } : null,
    });

    setName(''); setMonthlyPayment(''); setAmountOwed(''); setStartingAmount('');
    setOriginalTerm(''); setInterestRate(''); setAutoInclude(true);
    setExtraMonthlyPayment(''); setDebtType(''); setCompoundingFrequency(''); setPaymentDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto space-y-4">
      <WizardTextInput label="Debt Name" id="debtName" value={name} onChange={e => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select className="w-full border rounded p-2" value={debtType} onChange={e => setDebtType(e.target.value)}>
                <option value="">Select...</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Mortgage">Mortgage</option>
                <option value="Auto Loan">Auto Loan</option>
                <option value="Student Loan">Student Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Compounding</label>
            <select className="w-full border rounded p-2" value={compoundingFrequency} onChange={e => setCompoundingFrequency(e.target.value)}>
                <option value="">Select...</option>
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
            </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
          <WizardTextInput label="Original Amount" id="starting" value={startingAmount} onChange={e => setStartingAmount(e.target.value)} type="number" />
          <WizardTextInput label="Remaining" id="owed" value={amountOwed} onChange={e => setAmountOwed(e.target.value)} type="number" />
          <WizardTextInput label="Monthly Payment" id="pmt" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} type="number" />
          <WizardTextInput label="Interest Rate" id="rate" value={interestRate} onChange={e => setInterestRate(e.target.value)} type="number" step="0.01" />
          <WizardTextInput label="Original Term" id="term" value={originalTerm} onChange={e => setOriginalTerm(e.target.value)} type="number" />
          {compoundingFrequency === 'Monthly' && <WizardTextInput label="Due Date" id="due" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} type="number" />}
      </div>
      <div className="flex justify-end mt-4">
          <button type="submit" className="bg-[#3DDC97] text-white px-4 py-2 rounded font-bold">Add Debt</button>
      </div>
    </form>
  );
}

// --- Edit Modal ---
export function EditDebtModal({ isOpen, onClose, onSave, debt }) {
  const [formState, setFormState] = useState({});
  useEffect(() => { if (debt) setFormState({ ...debt }); }, [debt]);

  const handleChange = (e) => setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
        ...formState,
        monthlyPayment: parseFloat(formState.monthlyPayment) || 0,
        amountOwed: parseFloat(formState.amountOwed) || 0,
        interestRate: parseFloat(formState.interestRate) || 0,
        // ... add other parsings as needed
    };
    onSave(updated);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Edit Debt</h3>
            <div className="grid grid-cols-2 gap-4">
                <input name="name" value={formState.name || ''} onChange={handleChange} className="border p-2 rounded col-span-2" placeholder="Name" />
                <input name="amountOwed" type="number" value={formState.amountOwed || ''} onChange={handleChange} className="border p-2 rounded" placeholder="Remaining" />
                <input name="interestRate" type="number" step="0.01" value={formState.interestRate || ''} onChange={handleChange} className="border p-2 rounded" placeholder="Rate" />
                {/* Add other fields as needed for editing */}
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
            </div>
        </form>
    </div>
  );
}

// --- Detail & Calculator Modal ---
export function DebtDetailModal({ isOpen, onClose, debt, onUpdateDebt, allTransactions, categories, onOpenLumpSumModal, onOpenEditModal }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [extraRecurring, setExtraRecurring] = useState('');
  const [calcPayment, setCalcPayment] = useState('');
  const [calcType, setCalcType] = useState('monthly');
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    if (isOpen && debt) {
      setExtraRecurring(debt.extraMonthlyPayment || '');
      setCalcPayment(''); setCalcType('monthly'); setCalcResult(null);
    }
  }, [isOpen, debt]);

  const linkedSubCategoryId = useMemo(() => {
    if (!debt) return null;
    for (const cat of categories) {
      const sub = cat.subcategories.find(s => s.linkedDebtId === debt.id);
      if (sub) return sub.id;
    }
    return null;
  }, [categories, debt]);

  // Calculator Logic
  const calculateAmortization = (P, M, r_monthly) => {
    if (M <= P * r_monthly || M <= 0) return { term: Infinity, totalInterest: Infinity };
    const n = -Math.log(1 - (P * r_monthly) / M) / Math.log(1 + r_monthly);
    const totalPaid = n * M;
    return { term: n, totalInterest: totalPaid - P };
  };

  if (!isOpen || !debt) return null;

  // Aggregations
  const paymentHistory = allTransactions.filter(tx => tx.subCategoryId === linkedSubCategoryId && !tx.isIncome);
  const totalAmountPaid = paymentHistory.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const paidInInterest = paymentHistory.reduce((sum, tx) => sum + (tx.interestPaid || 0), 0);
  const paidTowardsPrincipal = totalAmountPaid - paidInInterest;

  const r = (debt.interestRate || 0) / 100 / 12;
  const M_total = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
  const currentAmort = calculateAmortization(debt.amountOwed, M_total, r);

  const handleCalculate = (e) => {
      e.preventDefault();
      const extra = parseFloat(calcPayment) || 0;
      if (extra <= 0) return;

      let newP = debt.amountOwed;
      let newM = M_total;
      if (calcType === 'onetime') newP -= extra;
      else newM += extra;

      const newAmort = calculateAmortization(newP, newM, r);
      setCalcResult({
          savings: currentAmort.totalInterest - newAmort.totalInterest,
          monthsSaved: currentAmort.term - newAmort.term
      });
  };

  const handleSetRecurring = (val) => {
      onUpdateDebt(debt.id, { extraMonthlyPayment: parseFloat(val) || 0 });
      setExtraRecurring(val);
  };

  return (
    <>
      <TransactionHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} debt={debt} allTransactions={allTransactions} linkedSubCategoryId={linkedSubCategoryId} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div className="relative w-full max-w-4xl bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{debt.name}</h3>
                <button onClick={onClose}><X className="h-6 w-6 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="border rounded p-4">
                        <h4 className="font-medium mb-4">Snapshot</h4>
                        <DebtInfoRow icon={PiggyBank} label="Remaining:" value={formatCurrency(debt.amountOwed)} isMainValue />
                        <DebtInfoRow icon={TrendingUp} label="Paid Principal:" value={formatCurrency(paidTowardsPrincipal)} />
                        <DebtInfoRow icon={ArrowDownWideNarrow} label="Paid Interest:" value={formatCurrency(paidInInterest)} />
                        <DebtInfoRow icon={Percent} label="Rate:" value={`${debt.interestRate}%`} />
                        <button onClick={() => setIsHistoryOpen(true)} className="w-full mt-4 border rounded p-2 text-sm hover:bg-gray-50">View History</button>
                    </div>
                    <div className="border rounded p-4">
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="mb-4">
                            <label className="text-sm text-gray-600">Set Recurring Extra</label>
                            <BudgetInput value={extraRecurring} onChange={handleSetRecurring} />
                        </div>
                        <button onClick={() => onOpenLumpSumModal(debt.id)} className="w-full bg-green-600 text-white rounded p-2">Make Lump Sum Payment</button>
                    </div>
                </div>

                <div className="border rounded p-4 bg-indigo-50 border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-4 flex items-center"><Calculator className="w-5 h-5 mr-2" /> Simulator</h4>
                    <div className="flex gap-2 mb-2">
                         <button onClick={() => setCalcType('monthly')} className={`px-3 py-1 text-sm rounded ${calcType === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Monthly</button>
                         <button onClick={() => setCalcType('onetime')} className={`px-3 py-1 text-sm rounded ${calcType === 'onetime' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>One-Time</button>
                    </div>
                    <input type="number" value={calcPayment} onChange={e => setCalcPayment(e.target.value)} className="w-full border rounded p-2 mb-2" placeholder="Extra Amount" />
                    <button onClick={handleCalculate} className="w-full bg-indigo-600 text-white rounded p-2">Calculate Savings</button>

                    {calcResult && (
                        <div className="mt-4 p-3 bg-white rounded shadow-sm">
                            <p className="text-green-600 font-bold">Save {formatCurrency(calcResult.savings)} in interest</p>
                            <p className="text-gray-600">Finish {Math.round(calcResult.monthsSaved)} months sooner</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between">
                <button onClick={() => onOpenEditModal(debt)} className="flex items-center text-gray-600"><Edit3 className="w-4 h-4 mr-2"/> Edit Debt</button>
                <button onClick={onClose} className="border rounded px-4 py-2">Close</button>
            </div>
        </div>
      </div>
    </>
  );
}