import React, { useState, useMemo, useEffect } from 'react';
import { Edit3, FileDown, ArrowUpCircle, ArrowDownCircle, Search, Filter, X } from 'lucide-react';
import { formatCurrency, exportTransactionsToCSV } from '../../utils/helpers';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';
import { Button } from '../../components/ui/Button';
import EditTransactionModal from '../../components/modals/EditTransactionModal';
import { ExportChoiceModal } from '../../components/modals/TransactionListModals';

// --- SHARED HELPER FOR FILTERING ---
const useTransactionFilters = (allTransactions) => {
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const { availableMonths, availableYears } = useMemo(() => {
    const allDates = allTransactions.map((tx) => new Date(tx.date + 'T12:00:00'));
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
  }, [allTransactions]);

  return { selectedYears, setSelectedYears, selectedMonths, setSelectedMonths, availableMonths, availableYears };
};

export default function TransactionsView({
  transactions: allTransactions,
  categories,
  bankAccounts,
  onSaveTransaction,
  onDeleteTransaction,
  onReturnTransaction,
  theme = 'light'
}) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [priceFilterMode, setPriceFilterMode] = useState('gt');
  const [priceFilterValue, setPriceFilterValue] = useState('');

  const { selectedYears, setSelectedYears, availableYears } = useTransactionFilters(allTransactions);

  // Set default year to current if available
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    if (availableYears.includes(currentYear) && selectedYears.length === 0) {
      setSelectedYears([currentYear]);
    }
  }, [availableYears]);

  const subCategoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => cat.subcategories.forEach((sub) => map.set(sub.id, { name: sub.name, catName: cat.name })));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map();
    bankAccounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [bankAccounts]);

  const categoryOptions = useMemo(() => categories.map((c) => ({ id: c.id, name: c.name })), [categories]);
  const subCategoryOptions = useMemo(() => {
    if (selectedCategories.length === 0) {
      return categories.flatMap((cat) => cat.subcategories.map((sub) => ({ id: sub.id, name: `${cat.name} / ${sub.name}` })));
    }
    return categories.filter((cat) => selectedCategories.includes(cat.id)).flatMap((cat) => cat.subcategories.map((sub) => ({ id: sub.id, name: sub.name })));
  }, [categories, selectedCategories]);

  const filteredTransactions = useMemo(() => {
    const priceVal = parseFloat(priceFilterValue) || 0;
    const lowerSearch = searchQuery.toLowerCase();

    return allTransactions
      .filter((tx) => {
        // Search
        if (searchQuery) {
          const merchantMatch = (tx.merchant || '').toLowerCase().includes(lowerSearch);
          const notesMatch = (tx.notes || '').toLowerCase().includes(lowerSearch);
          const subCat = subCategoryMap.get(tx.subCategoryId);
          const catMatch = (subCat?.name || '').toLowerCase().includes(lowerSearch);
          if (!merchantMatch && !notesMatch && !catMatch) return false;
        }

        // Filters
        if (selectedCategories.length > 0) {
          const subCat = subCategoryMap.get(tx.subCategoryId);
          const parentCat = categories.find((c) => c.name === subCat?.catName);
          if (!parentCat || !selectedCategories.includes(parentCat.id)) return false;
        }
        if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(tx.subCategoryId)) return false;
        if (priceVal > 0) {
          const amt = parseFloat(tx.amount) || 0;
          return priceFilterMode === 'gt' ? amt > priceVal : amt < priceVal;
        }
        if (selectedYears.length > 0) {
          const year = new Date(tx.date + 'T12:00:00').getFullYear();
          if (!selectedYears.includes(year)) return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTransactions, searchQuery, selectedCategories, selectedSubCategories, priceFilterValue, priceFilterMode, selectedYears, subCategoryMap, categories]);

  const handleExport = (filteredOnly) => {
    exportTransactionsToCSV(filteredOnly ? filteredTransactions : allTransactions, subCategoryMap, accountMap, 'transactions-export');
    setIsExportModalOpen(false);
  };

  // Styles
  const cardClass = `rounded-3xl border backdrop-blur-md transition-all duration-500 overflow-hidden ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-lg' : 'bg-white/70 border-white/60 shadow-lg'}`;
  const headerText = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="space-y-6">
      <EditTransactionModal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} transaction={editingTransaction} categories={categories} bankAccounts={bankAccounts} onSave={onSaveTransaction} onDelete={onDeleteTransaction} onReturn={onReturnTransaction} theme={theme} />
      <ExportChoiceModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExportFiltered={() => handleExport(true)} onExportAll={() => handleExport(false)} filterCount={filteredTransactions.length} totalCount={allTransactions.length} theme={theme} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className={`text-2xl font-semibold ${headerText}`}>Transactions</h2>
        <div className="flex gap-3">
           <div className={`relative flex items-center px-3 py-2 rounded-xl border ${inputBg} w-full sm:w-64`}>
              <Search className="w-4 h-4 mr-2 opacity-50" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-opacity-50"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>}
           </div>
           <Button variant="outline" onClick={() => setIsExportModalOpen(true)} icon={<FileDown className="w-4 h-4" />}>Export</Button>
        </div>
      </div>

      <div className={cardClass}>
         {/* Filters Header */}
         <div className={`p-5 border-b grid grid-cols-1 md:grid-cols-4 gap-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
            <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Category</label>
                <MultiSelectDropdown options={categoryOptions} selectedIds={selectedCategories} onChange={setSelectedCategories} placeholder="All Categories" theme={theme} />
            </div>
            <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Sub-Category</label>
                <MultiSelectDropdown options={subCategoryOptions} selectedIds={selectedSubCategories} onChange={setSelectedSubCategories} placeholder="All Sub-Categories" theme={theme} />
            </div>
            <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Amount</label>
                <div className="flex">
                    <select value={priceFilterMode} onChange={e => setPriceFilterMode(e.target.value)} className={`rounded-l-lg border-r-0 border px-2 text-sm outline-none ${inputBg}`}>
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                    </select>
                    <input type="number" value={priceFilterValue} onChange={e => setPriceFilterValue(e.target.value)} className={`w-full rounded-r-lg border px-3 py-2 text-sm outline-none ${inputBg}`} placeholder="0.00" />
                </div>
            </div>
            <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Year</label>
                <div className="flex flex-wrap gap-2">
                    {availableYears.map(y => (
                        <button key={y} onClick={() => setSelectedYears(prev => prev.includes(y) ? prev.filter(i => i !== y) : [...prev, y])} className={`px-2 py-1 text-xs rounded border transition-colors ${selectedYears.includes(y) ? 'bg-zillion-500 text-white border-zillion-500' : `border-transparent ${inputBg}`}`}>{y}</button>
                    ))}
                </div>
            </div>
         </div>

         {/* Transaction List */}
         <div className="max-h-[600px] overflow-y-auto p-2 space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                 <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>
                    <Filter className="h-8 w-8" />
                 </div>
                 <p className={subText}>No transactions match your filters.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all group ${theme === 'dark' ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${tx.isIncome ? 'bg-zillion-500/10 text-zillion-500' : 'bg-red-500/10 text-red-500'}`}>
                       {tx.isIncome ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${headerText}`}>{tx.merchant || (tx.isIncome ? 'Income' : 'Transaction')}</p>
                      <p className={`text-xs ${subText}`}>
                        {tx.isIncome ? tx.notes : `${subCategoryMap.get(tx.subCategoryId)?.catName} • ${subCategoryMap.get(tx.subCategoryId)?.name}`}
                        <span className="mx-2 opacity-50">|</span>
                        {accountMap.get(tx.accountId)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className={`font-bold text-sm ${tx.isIncome ? 'text-zillion-500' : headerText}`}>
                        {tx.isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className={`text-xs ${subText}`}>{tx.date}</p>
                    </div>
                    <button onClick={() => setEditingTransaction(tx)} className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
}