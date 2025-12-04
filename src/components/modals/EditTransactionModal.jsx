import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Trash2, Undo2, Save, Split, Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { getTodayDate, formatCurrency } from '../../utils/helpers';
import { ModalWrapper } from '../ui/SharedUI';
import { InputField } from '../ui/InputField';
import { GlassCurrencyInput } from '../ui/FormInputs';
import { Button } from '../ui/Button';

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  bankAccounts,
  onSave,
  onDelete,
  onReturn,
  theme = 'light'
}) {
  // --- Form State ---
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [isIncome, setIsIncome] = useState(false);

  // --- Split State ---
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState([]);
  const [amountError, setAmountError] = useState('');

  // --- Return State ---
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAmount, setReturnAmount] = useState('');

  // --- Populate form ---
  useEffect(() => {
    if (transaction && isOpen) {
      // Force 2 decimal places on init
      const formattedAmount = transaction.amount !== undefined && transaction.amount !== null 
        ? Number(transaction.amount).toFixed(2) 
        : '';
      setAmount(formattedAmount);

      setDate(transaction.date || getTodayDate());
      setAccountId(transaction.accountId || '');
      setMerchant(transaction.merchant || '');
      setNotes(transaction.notes || '');
      setIsIncome(transaction.isIncome || false);

      // Handle Splits Population
      if (transaction.isSplit && transaction.splits) {
         setIsSplit(true);
         setSplits(transaction.splits);
         setSelectedCategoryId('');
         setSubCategoryId('');
      } else {
         setIsSplit(false);
         
         // Find the parent category for standard tx
         let parentCatId = '';
         if (transaction.subCategoryId) {
            const parent = categories.find(c => c.subcategories.some(s => s.id === transaction.subCategoryId));
            if (parent) parentCatId = parent.id;
         }
         setSelectedCategoryId(parentCatId);
         setSubCategoryId(transaction.subCategoryId || '');

         // Reset splits to default single line if not split
         setSplits([{
            id: nanoid(),
            subCategoryId: '',
            amount: '',
            accountId: transaction.accountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
            notes: '',
         }]);
      }

      // Reset return state
      setIsReturnModalOpen(false);
      setReturnAmount(transaction.amount?.toString() || '');
      setAmountError('');
    }
  }, [transaction, categories, isOpen, bankAccounts]);

  // --- Helpers for Splits ---
  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [splits]);

  const remainingToSplit = useMemo(() => {
    const total = parseFloat(amount) || 0;
    return Math.round((total - totalSplitAmount) * 100) / 100;
  }, [amount, totalSplitAmount]);

  const allSubCategories = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        map.set(sub.id, sub);
      });
    });
    return map;
  }, [categories]);

  // --- Handlers ---

  const handleMainCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setSubCategoryId('');
  };

  const handleSplitChange = (id, field, value) => {
    if (field === 'subCategoryId') {
      // Basic account logic could go here if we passed defaultAccountId
      setSplits(splits.map((s) => s.id === id ? { ...s, subCategoryId: value } : s));
    } else {
      setSplits(splits.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    }
  };

  const addSplit = () => {
    setSplits([...splits, {
      id: nanoid(),
      subCategoryId: '',
      amount: '',
      accountId: accountId || (bankAccounts.length > 0 ? bankAccounts[0].id : ''),
      notes: '',
    }]);
  };

  const removeSplit = (id) => {
    setSplits(splits.filter((s) => s.id !== id));
  };

  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find((cat) => cat.id === selectedCategoryId);
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleSave = (e) => {
    e.preventDefault();

    const totalAmount = parseFloat(amount) || 0;

    // Validation
    if (isSplit && remainingToSplit !== 0) {
        setAmountError(`Splits must equal total. Remaining: ${formatCurrency(remainingToSplit)}`);
        return;
    }

    let updatedTransaction = {
      ...transaction,
      amount: totalAmount,
      date,
      accountId, // Main account ID (used for balance logic if single, or primary reference)
      merchant: merchant.trim(),
      notes: notes.trim(),
      isIncome: isIncome,
      isSplit: isSplit
    };

    if (isSplit) {
      updatedTransaction.splits = splits.map((s) => ({
          subCategoryId: s.subCategoryId,
          amount: parseFloat(s.amount) || 0,
          accountId: s.accountId,
          notes: s.notes,
      }));
      updatedTransaction.subCategoryId = null; // Clear single category
    } else {
      updatedTransaction.subCategoryId = isIncome ? null : subCategoryId;
      updatedTransaction.splits = null; // Clear splits
    }

    onSave(updatedTransaction);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      onDelete(transaction);
      onClose();
    }
  };

  const handleProcessReturn = (e) => {
    e.preventDefault();
    const numericReturnAmount = parseFloat(returnAmount) || 0;
    if (numericReturnAmount > 0) {
      onReturn(transaction, numericReturnAmount);
    }
    setIsReturnModalOpen(false);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  // Style Helpers
  const labelClass = `block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`;
  const selectClass = `w-full p-3 rounded-lg border bg-transparent outline-none transition-colors ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`;

  return (
    <>
      {/* --- Main Edit Form --- */}
      {!isReturnModalOpen && (
        <ModalWrapper onClose={onClose} theme={theme} title={`Edit ${isIncome ? 'Income' : 'Transaction'}`}>
          <form onSubmit={handleSave} className="space-y-4 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar" style={{ maxHeight: '60vh' }}>
                <div className="grid grid-cols-2 gap-4">
                <GlassCurrencyInput
                    label="Amount"
                    value={amount}
                    onChange={setAmount}
                    theme={theme}
                />
                <InputField
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    theme={theme}
                />
                </div>

                {!isSplit && (
                    <div>
                    <label className={labelClass}>{isIncome ? 'To Account' : 'From Account'}</label>
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
                        {bankAccounts.map((acc) => (
                        <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                        ))}
                    </select>
                    </div>
                )}
                
                {!isIncome && (
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setIsSplit(!isSplit)} className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${isSplit ? 'bg-zillion-100 text-zillion-600 dark:bg-zillion-900/30 dark:text-zillion-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <Split className="mr-2 h-4 w-4" /> {isSplit ? 'Switch to Single' : 'Split Transaction'}
                        </button>
                    </div>
                )}

                {isSplit ? (
                    <div className="space-y-4">
                        {amountError && <p className="text-xs text-red-500 font-bold">{amountError}</p>}
                        {splits.map((split) => (
                            <div key={split.id} className={`rounded-xl border p-3 grid grid-cols-2 gap-3 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="col-span-2 flex items-center gap-2">
                                <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                                <select value={split.subCategoryId} onChange={(e) => handleSplitChange(split.id, 'subCategoryId', e.target.value)} className={`block w-full rounded-md border p-2 text-sm bg-transparent outline-none ${theme === 'dark' ? 'border-slate-600 text-slate-200' : 'border-slate-300'}`}>
                                    <option value="">Select...</option>
                                    {categories.map((cat) => (
                                    <optgroup label={cat.name} key={cat.id} className={theme === 'dark' ? 'bg-slate-800' : ''}>
                                        {cat.subcategories.map((sub) => (
                                            <option value={sub.id} key={sub.id}>{sub.name}</option>
                                        ))}
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
                    !isIncome && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className={labelClass}>Category</label>
                            <select value={selectedCategoryId} onChange={handleMainCategoryChange} className={selectClass}>
                                <option value="">Select...</option>
                                {categories.map((cat) => (
                                <option value={cat.id} key={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            </div>
                            <div>
                            <label className={labelClass}>Sub-Category</label>
                            <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className={selectClass} disabled={!selectedCategoryId}>
                                <option value="">Select...</option>
                                {availableSubCategories.map((sub) => (
                                <option value={sub.id} key={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                            </div>
                        </div>
                    )
                )}

                <InputField label={isIncome ? 'Source (Optional)' : 'Merchant (Optional)'} value={merchant} onChange={(e) => setMerchant(e.target.value)} theme={theme} />
                <InputField label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} theme={theme} />
            </div>

            <div className={`mt-auto flex justify-between border-t pt-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                {!isIncome && !isSplit && (
                    <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(true)} icon={<Undo2 className="w-4 h-4" />}>Return</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>Save</Button>
              </div>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* --- Return Amount Mini-Modal --- */}
      {isReturnModalOpen && (
        <ModalWrapper onClose={() => setIsReturnModalOpen(false)} theme={theme} title="Process Return" maxWidth="max-w-sm">
          <form onSubmit={handleProcessReturn} className="space-y-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              How much was returned? This will be added back to your account.
            </p>
            
            <GlassCurrencyInput label="Return Amount" value={returnAmount} onChange={setReturnAmount} autoFocus theme={theme} />
            
            <button type="button" onClick={() => setReturnAmount(transaction.amount)} className="text-xs text-zillion-500 hover:text-zillion-600 underline -mt-2 mb-4 block">
              Set to full amount ({formatCurrency(transaction.amount)})
            </button>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" icon={<Undo2 className="w-4 h-4" />}>Process Return</Button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </>
  );
}