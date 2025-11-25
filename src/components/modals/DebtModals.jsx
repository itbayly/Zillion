import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, DollarSign, Trash2, Edit3, History, TrendingDown, Calculator, PiggyBank, Landmark, TrendingUp, ArrowDownWideNarrow, Percent, CalendarCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { GlassCurrencyInput } from '../ui/FormInputs'; // Keep this
import { InputField } from '../ui/InputField';         // Add this
import { Button } from '../ui/Button';
import { ModalWrapper, DebtInfoRow } from '../ui/SharedUI';
import { TransactionHistoryModal } from './TransactionListModals';
import { nanoid } from 'nanoid';

// --- Helper Form ---
export function DebtForm({ onAddDebt, theme = 'light' }) {
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
    
    // Validation
    if (!name.trim() || !debtType || !compoundingFrequency || amountOwed === '' || monthlyPayment === '' || interestRate === '') {
      alert("Please complete all required fields.");
      return;
    }

    // Safe parsing to ensure no NaNs
    const safeStarting = parseFloat(startingAmount) || 0;
    const safeOwed = parseFloat(amountOwed) || 0;
    
    // Logic: If they didn't enter starting, assume it matches owed.
    const finalStarting = safeStarting > 0 ? safeStarting : safeOwed;
    const finalOwed = safeOwed > 0 ? safeOwed : finalStarting;

    onAddDebt({
      id: nanoid(),
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

    // Reset Form
    setName(''); setMonthlyPayment(''); setAmountOwed(''); setStartingAmount('');
    setOriginalTerm(''); setInterestRate(''); setAutoInclude(true);
    setExtraMonthlyPayment(''); setDebtType(''); setCompoundingFrequency(''); setPaymentDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className={`mt-8 p-6 rounded-2xl border shadow-sm transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-white/60'}`}>
      <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Add New Debt</h3>
      
      <div className="space-y-4">
        <InputField label="Debt Name" id="debtName" value={name} onChange={e => setName(e.target.value)} theme={theme} />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
              <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Type</label>
              <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`} value={debtType} onChange={e => setDebtType(e.target.value)}>
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
              <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Compounding</label>
              <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`} value={compoundingFrequency} onChange={e => setCompoundingFrequency(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
              </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <GlassCurrencyInput label="Original Amount" id="starting" value={startingAmount} onChange={setStartingAmount} theme={theme} />
            <GlassCurrencyInput label="Remaining" id="owed" value={amountOwed} onChange={setAmountOwed} theme={theme} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <GlassCurrencyInput label="Monthly Payment" id="pmt" value={monthlyPayment} onChange={setMonthlyPayment} theme={theme} />
            <InputField label="Interest Rate" id="rate" value={interestRate} onChange={e => setInterestRate(e.target.value)} type="number" step="0.0001" theme={theme} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <InputField label="Original Term" id="term" value={originalTerm} onChange={e => setOriginalTerm(e.target.value)} type="number" theme={theme} />
            {compoundingFrequency === 'Monthly' && <InputField label="Due Date" id="due" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} type="number" theme={theme} />}
        </div>
      </div>

      <div className="flex justify-end mt-6">
          <Button type="submit" variant="primary">Save Debt</Button>
      </div>
    </form>
  );
}

// --- Edit Modal ---
export function EditDebtModal({ isOpen, onClose, onSave, debt, theme = 'light' }) {
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
    };
    onSave(updated);
  };

  if (!isOpen) return null;
  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Edit Debt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Name" name="name" value={formState.name || ''} onChange={handleChange} theme={theme} />
        <div className="grid grid-cols-2 gap-4">
            <InputField label="Remaining Balance" name="amountOwed" type="number" value={formState.amountOwed || ''} onChange={handleChange} theme={theme} icon={<DollarSign className="w-4 h-4" />} />
            <InputField label="Interest Rate" name="interestRate" type="number" step="0.01" value={formState.interestRate || ''} onChange={handleChange} theme={theme} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// --- Detail & Calculator Modal ---
export function DebtDetailModal({ isOpen, onClose, debt, onUpdateDebt, allTransactions, categories, onOpenLumpSumModal, onOpenEditModal, theme = 'light' }) {
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

  const calculateAmortization = (P, M, r_monthly) => {
    if (M <= P * r_monthly || M <= 0) return { term: Infinity, totalInterest: Infinity };
    const n = -Math.log(1 - (P * r_monthly) / M) / Math.log(1 + r_monthly);
    const totalPaid = n * M;
    return { term: n, totalInterest: totalPaid - P };
  };

  if (!isOpen || !debt) return null;

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

  const containerClass = theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';

  return (
    <>
      <TransactionHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} debt={debt} allTransactions={allTransactions} linkedSubCategoryId={linkedSubCategoryId} theme={theme} />
      
      <ModalWrapper onClose={onClose} theme={theme} title={debt.name} maxWidth="max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className={`border rounded-xl p-4 ${containerClass}`}>
                        <h4 className={`font-medium mb-4 ${textClass}`}>Snapshot</h4>
                        <DebtInfoRow icon={PiggyBank} label="Remaining:" value={formatCurrency(debt.amountOwed)} isMainValue theme={theme} />
                        <DebtInfoRow icon={TrendingUp} label="Paid Principal:" value={formatCurrency(paidTowardsPrincipal)} theme={theme} />
                        <DebtInfoRow icon={ArrowDownWideNarrow} label="Paid Interest:" value={formatCurrency(paidInInterest)} theme={theme} />
                        <DebtInfoRow icon={Percent} label="Rate:" value={`${debt.interestRate}%`} theme={theme} />
                        <Button variant="outline" onClick={() => setIsHistoryOpen(true)} className="w-full mt-4 text-xs h-8">View History</Button>
                    </div>
                    <div className={`border rounded-xl p-4 ${containerClass}`}>
                        <h4 className={`font-medium mb-2 ${textClass}`}>Actions</h4>
                        <div className="mb-4">
                            <label className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Set Recurring Extra</label>
                            <GlassCurrencyInput value={extraRecurring} onChange={handleSetRecurring} theme={theme} />
                        </div>
                        <Button variant="primary" onClick={() => onOpenLumpSumModal(debt.id)} fullWidth className="bg-zillion-500 hover:bg-zillion-600 border-none text-white shadow-lg shadow-zillion-500/20">Make Lump Sum Payment</Button>
                    </div>
                </div>

                <div className={`border rounded-xl p-4 ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h4 className={`font-medium mb-4 flex items-center ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}><Calculator className="w-5 h-5 mr-2" /> Simulator</h4>
                    <div className="flex gap-2 mb-4">
                         <button onClick={() => setCalcType('monthly')} className={`px-3 py-1 text-sm rounded-lg transition-colors ${calcType === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-500 hover:bg-white/20'}`}>Monthly</button>
                         <button onClick={() => setCalcType('onetime')} className={`px-3 py-1 text-sm rounded-lg transition-colors ${calcType === 'onetime' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-500 hover:bg-white/20'}`}>One-Time</button>
                    </div>
                    <InputField type="number" value={calcPayment} onChange={e => setCalcPayment(e.target.value)} placeholder="Extra Amount" theme={theme} />
                    <Button onClick={handleCalculate} fullWidth className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">Calculate Savings</Button>

                    {calcResult && (
                        <div className={`mt-4 p-3 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                            <p className="text-zillion-500 font-bold">Save {formatCurrency(calcResult.savings)} in interest</p>
                            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Finish {Math.round(calcResult.monthsSaved)} months sooner</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={`mt-6 pt-4 border-t flex justify-between ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <button onClick={() => onOpenEditModal(debt)} className="flex items-center text-slate-400 hover:text-zillion-400 transition-colors"><Edit3 className="w-4 h-4 mr-2"/> Edit Debt</button>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
      </ModalWrapper>
    </>
  );
}