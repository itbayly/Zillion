import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Trash2, Undo2, Save } from 'lucide-react';
import { getTodayDate, formatCurrency } from '../../utils/helpers';

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  bankAccounts,
  onSave,
  onDelete,
  onReturn,
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
    if (transaction) {
      setAmount(transaction.amount || '');
      setDate(transaction.date || getTodayDate());
      setAccountId(transaction.accountId || '');
      setMerchant(transaction.merchant || '');
      setNotes(transaction.notes || '');
      setIsIncome(transaction.isIncome || false);

      // Find the parent category
      const subCat = categories
        .flatMap((c) => c.subcategories)
        .find((s) => s.id === transaction.subCategoryId);
      const parentCat = categories.find((c) =>
        c.subcategories.some((s) => s.id === transaction.subCategoryId)
      );

      setSelectedCategoryId(parentCat ? parentCat.id : '');
      setSubCategoryId(subCat ? subCat.id : '');

      // Reset return state
      setIsReturnModalOpen(false);
      setReturnAmount(transaction.amount || '');
    }
  }, [transaction, categories]);

  // --- Cascading Dropdown Logic ---
  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find(
      (cat) => cat.id === selectedCategoryId
    );
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleMainCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setSubCategoryId(''); // Reset sub-category
  };

  // --- Handlers ---
  const handleSave = (e) => {
    e.preventDefault();
    const updatedData = {
      amount: parseFloat(amount) || 0,
      date,
      accountId,
      merchant: merchant.trim(),
      notes: notes.trim(),
      isIncome: isIncome,
      subCategoryId: isIncome ? null : subCategoryId,
    };
    onSave(transaction, updatedData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction);
    onClose();
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      {/* --- Main Edit Form --- */}
      {!isReturnModalOpen && (
        <form
          onSubmit={handleSave}
          className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Edit {isIncome ? 'Income' : 'Transaction'}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div className="sm:col-span-1">
              <label
                htmlFor="edit-tx-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  id="edit-tx-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="sm:col-span-1">
              <label
                htmlFor="edit-tx-date"
                className="block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <input
                type="date"
                id="edit-tx-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Bank Account */}
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-tx-account"
                className="block text-sm font-medium text-gray-700"
              >
                {isIncome ? 'To Account' : 'From Account'}
              </label>
              <select
                id="edit-tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {bankAccounts.map((acc) => (
                  <option value={acc.id} key={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* --- CONDITIONAL FIELDS --- */}
            {!isIncome ? (
              <>
                {/* Category */}
                <div className="sm:col-span-1">
                  <label
                    htmlFor="edit-tx-main-category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <select
                    id="edit-tx-main-category"
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

                {/* Sub-Category */}
                <div className="sm:col-span-1">
                  <label
                    htmlFor="edit-tx-subcategory"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sub-Category
                  </label>
                  <select
                    id="edit-tx-subcategory"
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={!selectedCategoryId}
                  >
                    <option value="">Select a sub-category...</option>
                    {availableSubCategories.map((sub) => (
                      <option value={sub.id} key={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 h-0" />
            )}

            {/* Merchant / Source */}
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-tx-merchant"
                className="block text-sm font-medium text-gray-700"
              >
                {isIncome ? 'Source (Optional)' : 'Merchant (Optional)'}
              </label>
              <input
                type="text"
                id="edit-tx-merchant"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-tx-notes"
                className="block text-sm font-medium text-gray-700"
              >
                Notes (Optional)
              </label>
              <input
                type="text"
                id="edit-tx-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between border-t border-gray-200 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                <Trash2 className="-ml-1 mr-2 h-5 w-5" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                disabled={isIncome}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 className="-ml-1 mr-2 h-5 w-5" />
                Return
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* --- Return Amount Mini-Modal --- */}
      {isReturnModalOpen && (
        <form
          onSubmit={handleProcessReturn}
          className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Process Return
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            How much was returned? This will be added back to your account and
            budget category.
          </p>
          <div className="mt-4">
            <label
              htmlFor="return-amount"
              className="block text-sm font-medium text-gray-700"
            >
              Return Amount
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                id="return-amount"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoFocus
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReturnAmount(transaction.amount)}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Set to full amount ({formatCurrency(transaction.amount)})
            </button>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Undo2 className="-ml-1 mr-2 h-5 w-5" />
              Process Return
            </button>
          </div>
        </form>
      )}
    </div>
  );
}