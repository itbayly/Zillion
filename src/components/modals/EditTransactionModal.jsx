import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Trash2, Undo2, Save } from 'lucide-react';
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

      // Find the parent category
      let parentCatId = '';
      if (transaction.subCategoryId) {
        const parent = categories.find(c => c.subcategories.some(s => s.id === transaction.subCategoryId));
        if (parent) parentCatId = parent.id;
      }

      setSelectedCategoryId(parentCatId);
      setSubCategoryId(transaction.subCategoryId || '');

      // Reset return state
      setIsReturnModalOpen(false);
      setReturnAmount(transaction.amount?.toString() || '');
    }
  }, [transaction, categories, isOpen]);

  // --- Cascading Dropdown Logic ---
  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find((cat) => cat.id === selectedCategoryId);
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleMainCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setSubCategoryId('');
  };

  // --- Handlers ---
  const handleSave = (e) => {
    e.preventDefault();
    // Construct the full updated object to send back
    const updatedTransaction = {
      ...transaction,
      amount: parseFloat(amount) || 0,
      date,
      accountId,
      merchant: merchant.trim(),
      notes: notes.trim(),
      isIncome: isIncome,
      subCategoryId: isIncome ? null : subCategoryId,
    };
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
          <form onSubmit={handleSave} className="space-y-4">
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

            <div>
              <label className={labelClass}>{isIncome ? 'To Account' : 'From Account'}</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
                {bankAccounts.map((acc) => (
                  <option value={acc.id} key={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>

            {!isIncome && (
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
            )}

            <InputField label={isIncome ? 'Source (Optional)' : 'Merchant (Optional)'} value={merchant} onChange={(e) => setMerchant(e.target.value)} theme={theme} />
            <InputField label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} theme={theme} />

            <div className={`mt-6 flex justify-between border-t pt-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                {!isIncome && (
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