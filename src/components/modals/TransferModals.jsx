import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign } from 'lucide-react';
import { getTodayDate, formatCurrency } from '../../utils/helpers';
import { WizardTextInput } from '../ui/FormInputs';

export function AddIncomeModal({ isOpen, onClose, onSave, bankAccounts }) {
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

  const handleFocus = (e) => e.target.select();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Add New Income
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={handleFocus}
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                autoFocus
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              To Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select an account...</option>
              {bankAccounts.map((acc) => (
                <option value={acc.id} key={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Source (Optional)
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Paycheck, Venmo, etc."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Side hustle"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Save Income
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddTransferModal({ isOpen, onClose, onSave, bankAccounts }) {
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

  const handleFocus = (e) => e.target.select();

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0 || !fromId || !toId || fromId === toId) {
      alert('Please check inputs. Amount must be positive and accounts different.');
      return;
    }
    onSave({ amount: numericAmount, date, fromId, toId });
  };

  const isSaveDisabled =
    !amount || !fromId || !toId || fromId === toId || parseFloat(amount) <= 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Make a Transfer
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={handleFocus}
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                autoFocus
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              From Account
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select account...</option>
              {bankAccounts.map((acc) => (
                <option value={acc.id} key={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              To Account
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select account...</option>
              {bankAccounts.map((acc) => (
                <option value={acc.id} key={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaveDisabled}
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            Save Transfer
          </button>
        </div>
      </form>
    </div>
  );
}

export function LumpSumPaymentModal({
  isOpen,
  onClose,
  onSave,
  debts,
  bankAccounts,
  defaultAccountId,
  savingsAccountId,
  initialDebtId,
}) {
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
    return bankAccounts.filter(
      (acc) => acc.id !== defaultAccountId && acc.id !== savingsAccountId
    );
  }, [bankAccounts, defaultAccountId, savingsAccountId]);

  const selectedAccount = useMemo(() => {
    return bankAccounts.find((acc) => acc.id === selectedAccountId);
  }, [bankAccounts, selectedAccountId]);

  const handleAmountChange = (e) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    const numericAmount = parseFloat(newAmount) || 0;
    if (selectedAccount && numericAmount > selectedAccount.balance) {
      setError(
        `Cannot pay more than account balance: ${formatCurrency(
          selectedAccount.balance
        )}`
      );
    } else {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (isSaveDisabled) return;
    onSave({
      debtId: selectedDebtId,
      accountId: selectedAccountId,
      amount: numericAmount,
      date: getTodayDate(),
    });
  };

  const isSaveDisabled =
    !selectedDebtId ||
    !selectedAccountId ||
    !amount ||
    parseFloat(amount) <= 0 ||
    !!error;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Make Lump Sum Payment
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Debt to Pay
            </label>
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              disabled={!!initialDebtId}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">Select a debt...</option>
              {debts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name} ({formatCurrency(debt.amountOwed)} remaining)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              From Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            >
              <option value="">Select an account...</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Only accounts not used for Spending or Sinking Funds are shown.
            </p>
          </div>
          <div>
            <WizardTextInput
              label="Payment Amount"
              id="lump-amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              type="number"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaveDisabled}
            className="rounded-md border border-transparent bg-[#3DDC97] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300"
          >
            Make Payment
          </button>
        </div>
      </form>
    </div>
  );
}