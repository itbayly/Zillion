import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Edit3,
  ListFilter,
  FileDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { formatCurrency, exportTransactionsToCSV } from '../../utils/helpers';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import EditTransactionModal from './EditTransactionModal';

// --- EXPORT CHOICE MODAL ---
export function ExportChoiceModal({
  isOpen,
  onClose,
  onExportFiltered,
  onExportAll,
  filterCount,
  totalCount,
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Export Transactions
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Export only filtered items or all items from this view?
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={onExportFiltered}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <FileDown className="mr-3 h-5 w-5" />
            Export Filtered ({filterCount} items)
          </button>
          <button
            type="button"
            onClick={onExportAll}
            className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FileDown className="mr-3 h-5 w-5" />
            Export All ({totalCount} items)
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SHARED HELPER FOR FILTERING ---
const useTransactionFilters = (
  allTransactions,
  filterType,
  filterId,
  categories
) => {
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const { availableMonths, availableYears } = useMemo(() => {
    const relevantTx = allTransactions.filter((tx) => {
      if (!filterId) return true;
      if (filterType === 'account') return tx.accountId === filterId;
      // For category/subcategory, filtering happens later or via passed props
      return true;
    });

    const allDates = relevantTx.map((tx) => new Date(tx.date + 'T12:00:00'));
    const months = new Set();
    const years = new Set();
    allDates.forEach((date) => {
      months.add(date.getMonth());
      years.add(date.getFullYear());
    });
    return {
      availableMonths: Array.from(months).sort((a, b) => a - b),
      availableYears: Array.from(years).sort((a, b) => b - a),
    };
  }, [allTransactions, filterType, filterId]);

  return {
    selectedYears,
    setSelectedYears,
    selectedMonths,
    setSelectedMonths,
    availableMonths,
    availableYears,
  };
};

// --- TRANSACTION DETAIL MODAL ---
export function TransactionDetailModal({
  isOpen,
  onClose,
  filter,
  allTransactions,
  categories,
  bankAccounts,
  onSaveTransaction,
  onDeleteTransaction,
  onReturnTransaction,
}) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    selectedYears,
    setSelectedYears,
    selectedMonths,
    setSelectedMonths,
    availableMonths,
    availableYears,
  } = useTransactionFilters(allTransactions, 'category', null);

  // Set defaults
  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      setSelectedYears(
        availableYears.includes(currentYear) ? [currentYear] : []
      );
      setSelectedMonths(
        availableMonths.includes(currentMonth) ? [currentMonth] : []
      );
    } else {
      setEditingTransaction(null);
      setIsExportModalOpen(false);
    }
  }, [isOpen, availableYears, availableMonths]);

  const subCategoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) =>
        map.set(sub.id, { name: sub.name, catName: cat.name })
      );
    });
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map();
    bankAccounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [bankAccounts]);

  const allFilteredTransactions = useMemo(() => {
    if (!filter) return [];
    let subCategoryIds = [];
    if (filter.type === 'category') {
      const cat = categories.find((c) => c.id === filter.id);
      subCategoryIds = cat ? cat.subcategories.map((s) => s.id) : [];
    } else {
      subCategoryIds = [filter.id];
    }
    return allTransactions
      .filter((tx) => !tx.isIncome && subCategoryIds.includes(tx.subCategoryId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filter, allTransactions, categories]);

  const filteredTransactions = useMemo(() => {
    return allFilteredTransactions.filter((tx) => {
      const date = new Date(tx.date + 'T12:00:00');
      const yearMatch =
        selectedYears.length === 0 || selectedYears.includes(date.getFullYear());
      const monthMatch =
        selectedMonths.length === 0 || selectedMonths.includes(date.getMonth());
      return yearMatch && monthMatch;
    });
  }, [allFilteredTransactions, selectedYears, selectedMonths]);

  const handleExport = (filteredOnly) => {
    exportTransactionsToCSV(
      filteredOnly ? filteredTransactions : allFilteredTransactions,
      subCategoryMap,
      accountMap,
      `${filter?.name}-transactions`
    );
    setIsExportModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
        onSave={onSaveTransaction}
        onDelete={onDeleteTransaction}
        onReturn={onReturnTransaction}
      />
      <ExportChoiceModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportFiltered={() => handleExport(true)}
        onExportAll={() => handleExport(false)}
        filterCount={filteredTransactions.length}
        totalCount={allFilteredTransactions.length}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Transactions for: {filter?.name || '...'}
          </h3>
          <div className="flex gap-4 my-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">Year</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      setSelectedYears((prev) =>
                        prev.includes(y)
                          ? prev.filter((i) => i !== y)
                          : [...prev, y]
                      )
                    }
                    className={`px-2 py-1 text-xs rounded ${
                      selectedYears.includes(y)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 border rounded-md"
              >
                <div>
                  <p className="font-medium">{tx.merchant || 'Transaction'}</p>
                  <p className="text-sm text-gray-500">
                    {subCategoryMap.get(tx.subCategoryId)?.name} |{' '}
                    {accountMap.get(tx.accountId)}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <button onClick={() => setEditingTransaction(tx)}>
                    <Edit3 className="h-4 w-4 text-gray-400 hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FileDown className="h-4 w-4 mr-2" /> Export
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- ALL TRANSACTIONS MODAL ---
export function AllTransactionsModal({
  isOpen,
  onClose,
  allTransactions,
  categories,
  bankAccounts,
  onSaveTransaction,
  onDeleteTransaction,
  onReturnTransaction,
}) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [priceFilterMode, setPriceFilterMode] = useState('gt');
  const [priceFilterValue, setPriceFilterValue] = useState('');

  const {
    selectedYears,
    setSelectedYears,
    selectedMonths,
    setSelectedMonths,
    availableMonths,
    availableYears,
  } = useTransactionFilters(allTransactions, 'all', null);

  useEffect(() => {
    if (!isOpen) {
      setEditingTransaction(null);
      setIsExportModalOpen(false);
    }
  }, [isOpen]);

  const subCategoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) =>
      cat.subcategories.forEach((sub) =>
        map.set(sub.id, { name: sub.name, catName: cat.name })
      )
    );
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map();
    bankAccounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [bankAccounts]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  const subCategoryOptions = useMemo(() => {
    if (selectedCategories.length === 0) {
      return categories.flatMap((cat) =>
        cat.subcategories.map((sub) => ({
          id: sub.id,
          name: `${cat.name} / ${sub.name}`,
        }))
      );
    }
    return categories
      .filter((cat) => selectedCategories.includes(cat.id))
      .flatMap((cat) =>
        cat.subcategories.map((sub) => ({ id: sub.id, name: sub.name }))
      );
  }, [categories, selectedCategories]);

  const baseFilteredTransactions = useMemo(() => {
    const priceVal = parseFloat(priceFilterValue) || 0;
    return allTransactions
      .filter((tx) => !tx.isIncome)
      .filter((tx) => {
        if (selectedCategories.length > 0) {
          const subCat = subCategoryMap.get(tx.subCategoryId);
          const parentCat = categories.find((c) => c.name === subCat?.catName);
          if (!parentCat || !selectedCategories.includes(parentCat.id))
            return false;
        }
        if (
          selectedSubCategories.length > 0 &&
          !selectedSubCategories.includes(tx.subCategoryId)
        )
          return false;
        if (priceVal > 0) {
          const amt = parseFloat(tx.amount) || 0;
          return priceFilterMode === 'gt' ? amt > priceVal : amt < priceVal;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    allTransactions,
    selectedCategories,
    selectedSubCategories,
    priceFilterValue,
    priceFilterMode,
    categories,
    subCategoryMap,
  ]);

  const filteredTransactions = useMemo(() => {
    return baseFilteredTransactions.filter((tx) => {
      const date = new Date(tx.date + 'T12:00:00');
      const yearMatch =
        selectedYears.length === 0 || selectedYears.includes(date.getFullYear());
      const monthMatch =
        selectedMonths.length === 0 || selectedMonths.includes(date.getMonth());
      return yearMatch && monthMatch;
    });
  }, [baseFilteredTransactions, selectedYears, selectedMonths]);

  const handleExport = (filteredOnly) => {
    exportTransactionsToCSV(
      filteredOnly ? filteredTransactions : baseFilteredTransactions,
      subCategoryMap,
      accountMap,
      'all-transactions'
    );
    setIsExportModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
        onSave={onSaveTransaction}
        onDelete={onDeleteTransaction}
        onReturn={onReturnTransaction}
      />
      <ExportChoiceModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportFiltered={() => handleExport(true)}
        onExportAll={() => handleExport(false)}
        filterCount={filteredTransactions.length}
        totalCount={baseFilteredTransactions.length}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            All Transactions
          </h3>
          <div className="my-4 p-4 bg-slate-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Category
              </label>
              <MultiSelectDropdown
                options={categoryOptions}
                selectedIds={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="All"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Sub-Category
              </label>
              <MultiSelectDropdown
                options={subCategoryOptions}
                selectedIds={selectedSubCategories}
                onChange={setSelectedSubCategories}
                placeholder="All"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Amount
              </label>
              <div className="flex">
                <select
                  value={priceFilterMode}
                  onChange={(e) => setPriceFilterMode(e.target.value)}
                  className="rounded-l border-gray-300 text-sm"
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <input
                  type="number"
                  value={priceFilterValue}
                  onChange={(e) => setPriceFilterValue(e.target.value)}
                  className="flex-1 rounded-r border-gray-300 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Year
              </label>
              <div className="flex gap-1 flex-wrap">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      setSelectedYears((prev) =>
                        prev.includes(y)
                          ? prev.filter((i) => i !== y)
                          : [...prev, y]
                      )
                    }
                    className={`px-2 py-1 text-xs rounded ${
                      selectedYears.includes(y)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 border rounded-md"
              >
                <div>
                  <p className="font-medium">{tx.merchant}</p>
                  <p className="text-sm text-gray-500">
                    {subCategoryMap.get(tx.subCategoryId)?.name}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <button onClick={() => setEditingTransaction(tx)}>
                    <Edit3 className="h-4 w-4 text-gray-400 hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between">
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={baseFilteredTransactions.length === 0}
              className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4 mr-2" /> Export
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- ACCOUNT TRANSACTION MODAL ---
export function AccountTransactionModal({
  isOpen,
  onClose,
  filter, // { id, name } of account
  allTransactions,
  categories,
  bankAccounts,
  onSaveTransaction,
  onDeleteTransaction,
  onReturnTransaction,
}) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    selectedYears,
    setSelectedYears,
    selectedMonths,
    setSelectedMonths,
    availableMonths,
    availableYears,
  } = useTransactionFilters(allTransactions, 'account', filter?.id);

  // Defaults
  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      setSelectedYears(
        availableYears.includes(currentYear) ? [currentYear] : []
      );
      setSelectedMonths(
        availableMonths.includes(currentMonth) ? [currentMonth] : []
      );
    } else {
      setEditingTransaction(null);
      setIsExportModalOpen(false);
    }
  }, [isOpen, availableYears, availableMonths]);

  const subCategoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) =>
      cat.subcategories.forEach((sub) =>
        map.set(sub.id, { name: sub.name, catName: cat.name })
      )
    );
    return map;
  }, [categories]);

  const allFilteredTransactions = useMemo(() => {
    if (!filter) return [];
    return allTransactions
      .filter((tx) => tx.accountId === filter.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filter, allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allFilteredTransactions.filter((tx) => {
      const date = new Date(tx.date + 'T12:00:00');
      const yearMatch =
        selectedYears.length === 0 || selectedYears.includes(date.getFullYear());
      const monthMatch =
        selectedMonths.length === 0 || selectedMonths.includes(date.getMonth());
      return yearMatch && monthMatch;
    });
  }, [allFilteredTransactions, selectedYears, selectedMonths]);

  const handleExport = (filteredOnly) => {
    const accountMap = new Map(); // Temp map for export helper
    bankAccounts.forEach((acc) => accountMap.set(acc.id, acc.name));
    exportTransactionsToCSV(
      filteredOnly ? filteredTransactions : allFilteredTransactions,
      subCategoryMap,
      accountMap,
      `account-${filter?.name}-transactions`
    );
    setIsExportModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
        onSave={onSaveTransaction}
        onDelete={onDeleteTransaction}
        onReturn={onReturnTransaction}
      />
      <ExportChoiceModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportFiltered={() => handleExport(true)}
        onExportAll={() => handleExport(false)}
        filterCount={filteredTransactions.length}
        totalCount={allFilteredTransactions.length}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            History: {filter?.name}
          </h3>

          {/* Date Filter */}
          <div className="flex gap-4 my-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">Year</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      setSelectedYears((prev) =>
                        prev.includes(y)
                          ? prev.filter((i) => i !== y)
                          : [...prev, y]
                      )
                    }
                    className={`px-2 py-1 text-xs rounded ${
                      selectedYears.includes(y)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  {tx.isIncome ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {tx.merchant || (tx.isIncome ? 'Income' : 'Transaction')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.isIncome
                        ? tx.notes
                        : subCategoryMap.get(tx.subCategoryId)?.name ||
                          'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p
                      className={`font-bold ${
                        tx.isIncome || tx.amount < 0
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {tx.isIncome ? '+' : tx.amount < 0 ? '' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <button onClick={() => setEditingTransaction(tx)}>
                    <Edit3 className="h-4 w-4 text-gray-400 hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FileDown className="h-4 w-4 mr-2" /> Export
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- TRANSACTION HISTORY MODAL (Simple Read-Only for Debts) ---
export function TransactionHistoryModal({
  isOpen,
  onClose,
  debt,
  allTransactions,
  linkedSubCategoryId,
}) {
  const transactions = useMemo(() => {
    if (!linkedSubCategoryId) return [];
    return allTransactions
      .filter((tx) => tx.subCategoryId === linkedSubCategoryId && !tx.isIncome)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTransactions, linkedSubCategoryId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Payment History: {debt?.name}
        </h3>
        <div className="grid grid-cols-4 gap-4 mt-4 border-b pb-2 text-sm font-medium text-gray-500">
          <div className="col-span-2">Details</div>
          <div className="text-right">Principal</div>
          <div className="text-right">Interest</div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No payments found.</p>
          ) : (
            transactions.map((tx) => {
              const isReturn = tx.amount < 0;
              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-4 gap-4 p-3 rounded-md border border-gray-200"
                >
                  <div className="col-span-2">
                    <p
                      className={`font-medium ${
                        isReturn ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {isReturn ? 'Return' : tx.merchant || 'Payment'}
                    </p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                  <div
                    className={`text-right font-medium ${
                      isReturn ? 'text-green-600' : 'text-gray-800'
                    }`}
                  >
                    {formatCurrency(tx.principalPaid || tx.amount)}
                  </div>
                  <div
                    className={`text-right font-medium ${
                      isReturn ? 'text-green-600' : 'text-gray-800'
                    }`}
                  >
                    {formatCurrency(tx.interestPaid || 0)}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}