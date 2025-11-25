import React, { useState, useEffect, useMemo } from 'react';
import { getTodayDate, formatCurrency } from '../../utils/helpers';
import { GlassCurrencyInput } from '../ui/FormInputs'; // Correct import
import { InputField } from '../ui/InputField';         // Correct import
import { Button } from '../ui/Button';
import { ModalWrapper } from '../ui/SharedUI';

export function AddIncomeModal({ isOpen, onClose, onSave, bankAccounts, theme = 'light' }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [merchant, setMerchant] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(getTodayDate());
      setAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
      setNotes('');
      setMerchant('');
    }
  }, [isOpen, bankAccounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    onSave({
      amount: parseFloat(amount) || 0,
      date,
      accountId,
      notes,
      merchant: merchant.trim(),
      isIncome: true,
    });
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Add New Income">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <GlassCurrencyInput label="Amount" value={amount} onChange={setAmount} autoFocus theme={theme} />
          <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} theme={theme} />
        </div>
        
        <div>
            <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>To Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
              <option value="">Select an account...</option>
              {bankAccounts.map((acc) => <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
            </select>
        </div>

        <InputField label="Source (Optional)" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Paycheck" theme={theme} />
        <InputField label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Bonus" theme={theme} />
        
        <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-transparent">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Income</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

export function AddTransferModal({ isOpen, onClose, onSave, bankAccounts, theme = 'light' }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(getTodayDate());
      setFromId('');
      setToId('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0 || !fromId || !toId || fromId === toId) {
      alert('Please check inputs. Amount must be positive and accounts different.');
      return;
    }
    onSave({ amount: numericAmount, date, fromId, toId });
  };

  const isSaveDisabled = !amount || !fromId || !toId || fromId === toId || parseFloat(amount) <= 0;

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Make a Transfer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <GlassCurrencyInput label="Amount" value={amount} onChange={setAmount} autoFocus theme={theme} />
          <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} theme={theme} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>From</label>
                <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                <option value="">Select...</option>
                {bankAccounts.map((acc) => <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
            </div>
            <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>To</label>
                <select value={toId} onChange={(e) => setToId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                <option value="">Select...</option>
                {bankAccounts.map((acc) => <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
            </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-transparent">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaveDisabled} variant="primary">Save Transfer</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

export function LumpSumPaymentModal({ isOpen, onClose, onSave, debts, bankAccounts, defaultAccountId, savingsAccountId, initialDebtId, theme = 'light' }) {
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDebtId) setSelectedDebtId(initialDebtId);
    else setSelectedDebtId('');
    setSelectedAccountId('');
    setAmount('');
    setError('');
  }, [isOpen, initialDebtId]);

  const availableAccounts = useMemo(() => {
    return bankAccounts.filter((acc) => acc.id !== defaultAccountId && acc.id !== savingsAccountId);
  }, [bankAccounts, defaultAccountId, savingsAccountId]);

  const selectedAccount = useMemo(() => bankAccounts.find((acc) => acc.id === selectedAccountId), [bankAccounts, selectedAccountId]);

  const handleAmountChange = (val) => {
    setAmount(val);
    const numericAmount = parseFloat(val) || 0;
    if (selectedAccount && numericAmount > selectedAccount.balance) {
      setError(`Cannot pay more than account balance: ${formatCurrency(selectedAccount.balance)}`);
    } else {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (isSaveDisabled) return;
    onSave({ debtId: selectedDebtId, accountId: selectedAccountId, amount: numericAmount, date: getTodayDate() });
  };

  const isSaveDisabled = !selectedDebtId || !selectedAccountId || !amount || parseFloat(amount) <= 0 || !!error;

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Make Lump Sum Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Debt to Pay</label>
            <select value={selectedDebtId} onChange={(e) => setSelectedDebtId(e.target.value)} disabled={!!initialDebtId} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
              <option value="">Select a debt...</option>
              {debts.map((debt) => <option key={debt.id} value={debt.id}>{debt.name} ({formatCurrency(debt.amountOwed)} remaining)</option>)}
            </select>
        </div>
        <div>
            <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>From Account</label>
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
              <option value="">Select an account...</option>
              {availableAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
            </select>
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Only accounts not used for Spending or Sinking Funds are shown.</p>
        </div>
        
        <GlassCurrencyInput label="Payment Amount" value={amount} onChange={handleAmountChange} placeholder="0.00" theme={theme} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-transparent">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaveDisabled} variant="primary">Make Payment</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}