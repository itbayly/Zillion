import React, { useState, useEffect, useMemo } from 'react';
import { Split, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { getTodayDate, formatCurrency } from '../../utils/helpers';
import { GlassCurrencyInput } from '../ui/FormInputs'; 
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';
import { ModalWrapper } from '../ui/SharedUI';

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  categories,
  bankAccounts,
  defaultAccountId,
  savingsAccountId,
  spentOnDebtsMap,
  theme = 'light'
}) {
  // --- CORE STATE ---
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [accountId, setAccountId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');

  // --- STATE FOR CASCADING/SPLIT ---
  const [isSplit, setIsSplit] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [amountError, setAmountError] = useState('');

  // Initialize with nanoid() instead of crypto.randomUUID()
  const [splits, setSplits] = useState([
    {
      id: nanoid(),
      subCategoryId: '',
      amount: '',
      accountId: '',
      notes: '',
    },
  ]);

  const allSubCategories = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        map.set(sub.id, sub);
      });
    });
    return map;
  }, [categories]);

  const selectedSubCategory = useMemo(() => {
    if (isSplit || !subCategoryId) return null;
    return allSubCategories.get(subCategoryId) || null;
  }, [subCategoryId, allSubCategories, isSplit]);

  useEffect(() => {
    if (selectedSubCategory) {
      if (selectedSubCategory.type === 'sinking_fund' && savingsAccountId) {
        setAccountId(savingsAccountId);
      } else {
        setAccountId(defaultAccountId || '');
      }
    }
  }, [selectedSubCategory, savingsAccountId, defaultAccountId]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(getTodayDate());
      setAccountId(defaultAccountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''));
      setNotes('');
      setMerchant('');
      setIsSplit(false);
      setSubCategoryId('');
      setSelectedCategoryId('');
      setSplits([{
        id: nanoid(),
        subCategoryId: '',
        amount: '',
        accountId: defaultAccountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
        notes: '',
      }]);
      setAmountError('');
    }
  }, [isOpen, bankAccounts, defaultAccountId]);

  useEffect(() => {
    setAmountError('');
    const txAmount = parseFloat(amount) || 0;

    if (!isSplit && selectedSubCategory && selectedSubCategory.linkedDebtId && txAmount > 0) {
      const debtId = selectedSubCategory.linkedDebtId;
      const budgeted = selectedSubCategory.budgeted || 0;
      const spent = spentOnDebtsMap.get(debtId) || 0;
      let remaining = Math.round((budgeted - spent) * 100) / 100;
      if (remaining < 0) remaining = 0;

      if (txAmount > remaining) {
        setAmountError(`Amount exceeds remaining budgeted of ${formatCurrency(remaining)}. Use the "Lump Sum Payment" button for extra payments.`);
      }
    }
  }, [amount, selectedSubCategory, isSplit, spentOnDebtsMap]);

  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find((cat) => cat.id === selectedCategoryId);
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleMainCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setSubCategoryId('');
  };

  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [splits]);

  const remainingToSplit = useMemo(() => {
    const total = parseFloat(amount) || 0;
    return Math.round((total - totalSplitAmount) * 100) / 100;
  }, [amount, totalSplitAmount]);

  const handleSplitChange = (id, field, value) => {
    if (field === 'subCategoryId') {
      const sub = allSubCategories.get(value);
      let newAccountId = defaultAccountId || '';
      if (sub && sub.type === 'sinking_fund' && savingsAccountId) {
        newAccountId = savingsAccountId;
      }
      setSplits(splits.map((s) => s.id === id ? { ...s, subCategoryId: value, accountId: newAccountId } : s));
    } else {
      setSplits(splits.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }
  };

  const addSplit = () => {
    setSplits([...splits, {
      id: nanoid(),
      subCategoryId: '',
      amount: '',
      accountId: defaultAccountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
      notes: '',
    }]);
  };

  const removeSplit = (id) => {
    setSplits(splits.filter((s) => s.id !== id));
  };

  const isSaveDisabled = useMemo(() => {
    if (!!amountError) return true;
    const totalAmount = parseFloat(amount) || 0;
    if (totalAmount <= 0 || !date) return true;

    if (isSplit) {
      if (remainingToSplit !== 0) return true;
      if (splits.some((s) => !s.subCategoryId || !s.amount || parseFloat(s.amount) <= 0 || !s.accountId)) return true;
    } else {
      if (!subCategoryId || !accountId) return true;
    }
    return false;
  }, [amount, date, accountId, isSplit, subCategoryId, splits, remainingToSplit, amountError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaveDisabled) return;

    const totalAmount = parseFloat(amount) || 0;
    let transactionToSave;

    if (isSplit) {
      transactionToSave = {
        id: nanoid(),
        amount: totalAmount,
        date,
        notes,
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
        id: nanoid(), // Ensure ID is generated here if not editing
        amount: totalAmount,
        date,
        subCategoryId,
        accountId,
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
    <ModalWrapper onClose={onClose} theme={theme} title="Add New Transaction">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <GlassCurrencyInput 
              label="Amount" 
              id="tx-amount" 
              value={amount} 
              onChange={setAmount} 
              autoFocus 
              theme={theme}
            />
            <InputField 
              label="Date" 
              id="tx-date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              theme={theme}
            />
          </div>
          {amountError && <p className="text-xs text-red-500 -mt-3 mb-2">{amountError}</p>}

          {!isSplit && (
            <div>
              <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>From Account</label>
              <select id="tx-account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                <option value="">Select an account...</option>
                {bankAccounts.map((acc) => (
                  <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={() => setIsSplit(!isSplit)} className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${isSplit ? 'bg-zillion-100 text-zillion-600 dark:bg-zillion-900/30 dark:text-zillion-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              <Split className="mr-2 h-4 w-4" /> {isSplit ? 'Single Category' : 'Split Transaction'}
            </button>
          </div>

          {isSplit ? (
            <div className="space-y-4">
              {splits.map((split) => (
                <div key={split.id} className={`rounded-xl border p-3 grid grid-cols-2 gap-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                      <select value={split.subCategoryId} onChange={(e) => handleSplitChange(split.id, 'subCategoryId', e.target.value)} className={`block w-full rounded-md border p-2 text-sm bg-transparent outline-none ${theme === 'dark' ? 'border-slate-600 text-slate-200' : 'border-slate-300'}`}>
                        <option value="">Select...</option>
                        {categories.map((cat) => (
                          <optgroup label={cat.name} key={cat.id} className={theme === 'dark' ? 'bg-slate-800' : ''}>
                            {cat.subcategories.map((sub) => {
                              const isDebt = !!sub.linkedDebtId;
                              let isDisabled = false;
                              let label = sub.name;
                              if (isDebt) {
                                const budgeted = sub.budgeted || 0;
                                const spent = spentOnDebtsMap.get(sub.linkedDebtId) || 0;
                                if (spent >= budgeted) { isDisabled = true; label = `${sub.name} (Monthly amount paid)`; }
                              }
                              return <option value={sub.id} key={sub.id} disabled={isDisabled}>{label}</option>;
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                      <GlassCurrencyInput 
                        value={split.amount} 
                        onChange={(val) => handleSplitChange(split.id, 'amount', val)} 
                        placeholder="0.00" 
                        theme={theme}
                      />
                    </div>
                    <button type="button" onClick={() => removeSplit(split.id)} className={`text-slate-400 hover:text-red-500 self-end mb-2 ${splits.length <= 1 ? 'invisible' : ''}`}><Trash2 className="h-5 w-5" /></button>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">From Account</label>
                    <select value={split.accountId} onChange={(e) => handleSplitChange(split.id, 'accountId', e.target.value)} className={`block w-full rounded-md border p-2 text-sm bg-transparent outline-none ${theme === 'dark' ? 'border-slate-600 text-slate-200' : 'border-slate-300'}`}>
                      <option value="">Select account...</option>
                      {bankAccounts.map((acc) => <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" onClick={addSplit} icon={<Plus className="w-4 h-4" />} className="text-xs py-2 h-auto">Add Line</Button>
                <div className={`text-sm font-bold ${remainingToSplit === 0 ? 'text-zillion-500' : 'text-red-500'}`}>{formatCurrency(remainingToSplit)} Remaining</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
                <select id="tx-main-category" value={selectedCategoryId} onChange={handleMainCategoryChange} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                  <option value="">Select...</option>
                  {categories.map((cat) => <option value={cat.id} key={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sub-Category</label>
                <select id="tx-subcategory" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`} disabled={!selectedCategoryId}>
                  <option value="">Select...</option>
                  {availableSubCategories.map((sub) => {
                    const isDebt = !!sub.linkedDebtId;
                    let isDisabled = false;
                    let label = sub.name;
                    if (isDebt) {
                      const budgeted = sub.budgeted || 0;
                      const spent = spentOnDebtsMap.get(sub.linkedDebtId) || 0;
                      if (spent >= budgeted) { isDisabled = true; label = `${sub.name} (Monthly amount paid)`; }
                    }
                    return <option value={sub.id} key={sub.id} disabled={isDisabled}>{label}</option>;
                  })}
                </select>
              </div>
            </div>
          )}

          <InputField label="Merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Kroger" theme={theme} />
          <InputField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" theme={theme} />
        </div>

        <div className={`mt-6 pt-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaveDisabled}>Save Transaction</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}