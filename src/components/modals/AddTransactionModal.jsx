import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Split, Plus } from 'lucide-react';
import { getTodayDate, formatCurrency } from '../../utils/helpers';

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  bankAccounts,
  defaultAccountId,
  savingsAccountId,
  spentOnDebtsMap,
}) {
  // --- CORE STATE ---
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [accountId, setAccountId] = useState(''); // For single mode
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');

  // --- STATE FOR CASCADING/SPLIT ---
  const [isSplit, setIsSplit] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState(''); // For single mode

  // --- NEW: State for amount validation ---
  const [amountError, setAmountError] = useState('');

  // REQ 3 & 4: Updated splits state
  const [splits, setSplits] = useState([
    {
      id: crypto.randomUUID(),
      subCategoryId: '',
      amount: '',
      accountId: '',
      notes: '',
    },
  ]);

  // --- Create a map for all sub-categories for easy lookup ---
  const allSubCategories = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        map.set(sub.id, sub);
      });
    });
    return map;
  }, [categories]);

  // --- Find the full sub-category object when subCategoryId changes (SINGLE MODE) ---
  const selectedSubCategory = useMemo(() => {
    if (isSplit || !subCategoryId) return null;
    return allSubCategories.get(subCategoryId) || null;
  }, [subCategoryId, allSubCategories, isSplit]);

  // --- REQ 2: Effect to auto-select account (SINGLE MODE) ---
  useEffect(() => {
    if (selectedSubCategory) {
      if (selectedSubCategory.type === 'sinking_fund' && savingsAccountId) {
        setAccountId(savingsAccountId);
      } else {
        setAccountId(defaultAccountId || '');
      }
    }
  }, [selectedSubCategory, savingsAccountId, defaultAccountId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(getTodayDate());
      setAccountId(
        defaultAccountId || (bankAccounts.length > 0 ? bankAccounts[0].id : '')
      );
      setNotes('');
      setMerchant('');
      setIsSplit(false);
      setSubCategoryId('');
      setSelectedCategoryId('');
      setSplits([
        {
          id: crypto.randomUUID(),
          subCategoryId: '',
          amount: '',
          accountId:
            defaultAccountId ||
            (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
          notes: '',
        },
      ]);
      setAmountError('');
    }
  }, [isOpen, bankAccounts, defaultAccountId]);

  // --- NEW: Live validation for debt amounts ---
  useEffect(() => {
    // Clear error first
    setAmountError('');

    const txAmount = parseFloat(amount) || 0;

    // Only run this validation for single, non-debt, positive-amount transactions
    if (
      !isSplit &&
      selectedSubCategory &&
      selectedSubCategory.linkedDebtId &&
      txAmount > 0
    ) {
      const debtId = selectedSubCategory.linkedDebtId;
      const budgeted = selectedSubCategory.budgeted || 0;
      const spent = spentOnDebtsMap.get(debtId) || 0;

      // Use rounding to avoid float math issues
      let remaining = Math.round((budgeted - spent) * 100) / 100;
      if (remaining < 0) remaining = 0;

      if (txAmount > remaining) {
        setAmountError(
          `Amount exceeds remaining budgeted of ${formatCurrency(
            remaining
          )}. Use the "Lump Sum Payment" button for extra payments.`
        );
      }
    }
  }, [amount, selectedSubCategory, isSplit, spentOnDebtsMap]);

  const handleFocus = (e) => e.target.select();

  // --- REQ 1: CASCADING LOGIC ---
  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find(
      (cat) => cat.id === selectedCategoryId
    );
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleMainCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setSubCategoryId(''); // Reset sub-category when main category changes
  };

  // --- SPLIT LOGIC ---
  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [splits]);

  const remainingToSplit = useMemo(() => {
    const total = parseFloat(amount) || 0;
    return Math.round((total - totalSplitAmount) * 100) / 100;
  }, [amount, totalSplitAmount]);

  // REQ 3 & 5: Updated split change handler
  const handleSplitChange = (id, field, value) => {
    if (field === 'subCategoryId') {
      const sub = allSubCategories.get(value);
      let newAccountId = defaultAccountId || '';
      if (sub) {
        if (sub.type === 'sinking_fund' && savingsAccountId) {
          newAccountId = savingsAccountId; // Switch to savings
        }
      }
      // Update both subCategoryId and the auto-selected accountId
      setSplits(
        splits.map((s) =>
          s.id === id
            ? { ...s, subCategoryId: value, accountId: newAccountId }
            : s
        )
      );
    } else {
      // Handle all other changes (amount, notes, manual accountId override)
      setSplits(
        splits.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    }
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      {
        id: crypto.randomUUID(),
        subCategoryId: '',
        amount: '',
        accountId:
          defaultAccountId ||
          (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
        notes: '',
      },
    ]);
  };

  const removeSplit = (id) => {
    setSplits(splits.filter((s) => s.id !== id));
  };

  // --- Validation ---
  const isSaveDisabled = useMemo(() => {
    if (!!amountError) return true;

    const totalAmount = parseFloat(amount) || 0;
    // Basic fields
    if (totalAmount <= 0 || !date) {
      return true;
    }

    // Check split vs. single
    if (isSplit) {
      // Split validation
      if (remainingToSplit !== 0) return true;
      // REQ 3: Check for accountId in each split
      if (
        splits.some(
          (s) =>
            !s.subCategoryId ||
            !s.amount ||
            parseFloat(s.amount) <= 0 ||
            !s.accountId
        )
      ) {
        return true;
      }
    } else {
      // Single validation (REQ 1)
      if (!subCategoryId || !accountId) return true;
    }

    // All checks passed
    return false;
  }, [
    amount,
    date,
    accountId,
    isSplit,
    subCategoryId,
    splits,
    remainingToSplit,
    amountError,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSaveDisabled) {
      console.error('Validation failed. Button should have been disabled.');
      return;
    }

    const totalAmount = parseFloat(amount) || 0;
    let transactionToSave;

    if (isSplit) {
      transactionToSave = {
        id: crypto.randomUUID(), // This is the "parent" ID
        amount: totalAmount,
        date,
        notes, // Main notes
        merchant: merchant.trim(),
        isIncome: false,
        isSplit: true,
        splits: splits.map((s) => ({
          subCategoryId: s.subCategoryId,
          amount: parseFloat(s.amount) || 0,
          accountId: s.accountId,
          notes: s.notes,
        })),
      };
    } else {
      transactionToSave = {
        amount: totalAmount,
        date,
        subCategoryId,
        accountId, // REQ 1: Use main accountId
        notes,
        merchant: merchant.trim(),
        isIncome: false,
        isSplit: false,
      };
    }

    onSave(transactionToSave);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex-shrink-0">
          Add New Transaction
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 flex-1 overflow-y-auto pr-2">
          {/* Amount */}
          <div className="sm:col-span-1">
            <label
              htmlFor="tx-amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                id="tx-amount"
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
            {amountError && (
              <p className="mt-1 text-sm text-red-600">{amountError}</p>
            )}
          </div>

          {/* Date */}
          <div className="sm:col-span-1">
            <label
              htmlFor="tx-date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                id="tx-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Bank Account (Hidden in split mode) */}
          {!isSplit && (
            <div className="sm:col-span-2">
              <label
                htmlFor="tx-account"
                className="block text-sm font-medium text-gray-700"
              >
                From Account
              </label>
              <select
                id="tx-account"
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
          )}

          {/* SPLIT TOGGLE */}
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsSplit(!isSplit)}
              className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ${
                isSplit
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Split className="mr-2 h-4 w-4" />
              {isSplit ? 'Single Category' : 'Split Transaction'}
            </button>
          </div>

          {/* --- CONDITIONAL UI: SINGLE VS SPLIT --- */}
          {isSplit ? (
            <div className="sm:col-span-2 space-y-4">
              {/* Split List */}
              {splits.map((split, index) => (
                <div
                  key={split.id}
                  className="rounded-md border border-gray-300 p-3 grid grid-cols-2 gap-3"
                >
                  {/* Row 1: Category & Amount */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">
                        Category
                      </label>
                      <select
                        id={`split-cat-${split.id}`}
                        value={split.subCategoryId}
                        onChange={(e) =>
                          handleSplitChange(
                            split.id,
                            'subCategoryId',
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        aria-label="Split category"
                      >
                        <option value="">Select a category...</option>
                        {categories.map((cat) => (
                          <optgroup label={cat.name} key={cat.id}>
                            {cat.subcategories.map((sub) => {
                              const isDebt = !!sub.linkedDebtId;
                              let isDisabled = false;
                              let label = sub.name;
                              if (isDebt) {
                                const budgeted = sub.budgeted || 0;
                                const spent =
                                  spentOnDebtsMap.get(sub.linkedDebtId) || 0;
                                if (spent >= budgeted) {
                                  isDisabled = true;
                                  label = `${sub.name} (Monthly amount paid)`;
                                }
                              }
                              return (
                                <option
                                  value={sub.id}
                                  key={sub.id}
                                  disabled={isDisabled}
                                >
                                  {label}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-medium text-gray-500">
                        Amount
                      </label>
                      <input
                        type="number"
                        id={`split-amount-${split.id}`}
                        value={split.amount}
                        onChange={(e) =>
                          handleSplitChange(split.id, 'amount', e.target.value)
                        }
                        onFocus={handleFocus}
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0.00"
                        aria-label="Split amount"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSplit(split.id)}
                      className={`text-gray-400 hover:text-red-600 self-end mb-1 ${
                        splits.length <= 1 ? 'invisible' : ''
                      }`}
                      title="Remove split"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Row 2: Account */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">
                      From Account
                    </label>
                    <select
                      id={`split-account-${split.id}`}
                      value={split.accountId}
                      onChange={(e) =>
                        handleSplitChange(split.id, 'accountId', e.target.value)
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Split account"
                    >
                      <option value="">Select an account...</option>
                      {bankAccounts.map((acc) => (
                        <option value={acc.id} key={acc.id}>
                          {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3: Notes */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      id={`split-notes-${split.id}`}
                      value={split.notes}
                      onChange={(e) =>
                        handleSplitChange(split.id, 'notes', e.target.value)
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Line item note..."
                      aria-label="Split notes"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={addSplit}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </button>
                <div
                  className={`text-sm font-medium ${
                    remainingToSplit === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(remainingToSplit)} Remaining
                </div>
              </div>
            </div>
          ) : (
            /* Single Category */
            <>
              <div className="sm:col-span-1">
                <label
                  htmlFor="tx-main-category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="tx-main-category"
                  value={selectedCategoryId}
                  onChange={handleMainCategoryChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option value={cat.id} key={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="tx-subcategory"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sub-Category
                </label>
                <select
                  id="tx-subcategory"
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                  disabled={!selectedCategoryId}
                >
                  <option value="">Select a sub-category...</option>
                  {availableSubCategories.map((sub) => {
                    const isDebt = !!sub.linkedDebtId;
                    let isDisabled = false;
                    let label = sub.name;
                    if (isDebt) {
                      const budgeted = sub.budgeted || 0;
                      const spent = spentOnDebtsMap.get(sub.linkedDebtId) || 0;
                      if (spent >= budgeted) {
                        isDisabled = true;
                        label = `${sub.name} (Monthly amount paid)`;
                      }
                    }
                    return (
                      <option value={sub.id} key={sub.id} disabled={isDisabled}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {/* Merchant */}
          <div className="sm:col-span-2">
            <label
              htmlFor="tx-merchant"
              className="block text-sm font-medium text-gray-700"
            >
              Merchant (Optional)
            </label>
            <input
              type="text"
              id="tx-merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Kroger, Amazon, etc."
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="tx-notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notes (Optional)
            </label>
            <input
              type="text"
              id="tx-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Weekly groceries"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 flex-shrink-0">
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
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  );
}