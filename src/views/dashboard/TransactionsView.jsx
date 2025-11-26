import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Edit3, FileDown, ArrowUpCircle, ArrowDownCircle, Search, Filter, X, Plus, Calendar, ChevronRight, ChevronDown, Check, RotateCcw, Trash2, FolderEdit, ArrowUpDown } from 'lucide-react';
import { formatCurrency, exportTransactionsToCSV } from '../../utils/helpers';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import EditTransactionModal from '../../components/modals/EditTransactionModal';
import { ExportChoiceModal, BulkEditCategoryModal } from '../../components/modals/TransactionListModals';
import { ModalWrapper } from '../../components/ui/SharedUI';

// --- Date Filter Dropdown (Same as before) ---
const DateFilterDropdown = ({ allTransactions, dateFilter, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [expandedYears, setExpandedYears] = useState(new Set());

  const { years, monthsByYear } = useMemo(() => {
    const map = {};
    const uniqueYears = new Set();
    allTransactions.forEach(tx => {
        const d = new Date(tx.date + 'T12:00:00');
        const y = d.getFullYear();
        const m = d.getMonth();
        uniqueYears.add(y);
        if (!map[y]) map[y] = new Set();
        map[y].add(m);
    });
    const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a);
    const sortedMap = {};
    sortedYears.forEach(y => { sortedMap[y] = Array.from(map[y]).sort((a, b) => a - b); });
    return { years: sortedYears, monthsByYear: sortedMap };
  }, [allTransactions]);

  useEffect(() => {
      if (years.length > 0 && expandedYears.size === 0) { setExpandedYears(new Set([years[0]])); }
  }, [years]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleYearExpand = (e, year) => {
      e.stopPropagation();
      const newSet = new Set(expandedYears);
      if (newSet.has(year)) newSet.delete(year); else newSet.add(year);
      setExpandedYears(newSet);
  };

  const isMonthSelected = (year, month) => dateFilter.selection.has(`${year}-${month}`);
  const isYearSelected = (year) => {
     const months = monthsByYear[year] || [];
     return months.length > 0 && months.every(m => isMonthSelected(year, m));
  };
  const toggleMonth = (year, month) => {
      const key = `${year}-${month}`;
      const newSelection = new Set(dateFilter.selection);
      if (newSelection.has(key)) newSelection.delete(key); else newSelection.add(key);
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };
  const toggleYear = (year) => {
      const months = monthsByYear[year] || [];
      const allSelected = isYearSelected(year);
      const newSelection = new Set(dateFilter.selection);
      months.forEach(m => {
          const key = `${year}-${m}`;
          if (allSelected) newSelection.delete(key); else newSelection.add(key);
      });
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };
  const selectAll = () => {
      const newSelection = new Set();
      years.forEach(y => { monthsByYear[y].forEach(m => newSelection.add(`${y}-${m}`)); });
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };
  const clearAll = () => { onChange({ ...dateFilter, type: 'manual', selection: new Set() }); };
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const baseClass = theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
  const dropdownClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-gray-900';
  const checkboxClass = `w-4 h-4 rounded border cursor-pointer ${theme === 'dark' ? 'border-slate-500 bg-slate-700 accent-zillion-400' : 'border-slate-300 accent-zillion-500'}`;

  let labelText = "Select Date";
  if (dateFilter.type === 'range') {
     labelText = "Custom Range";
     if (dateFilter.range.start && dateFilter.range.end) labelText = `${new Date(dateFilter.range.start).toLocaleDateString()} - ${new Date(dateFilter.range.end).toLocaleDateString()}`;
  } else {
     const totalMonths = years.reduce((sum, y) => sum + (monthsByYear[y]?.length || 0), 0);
     if (dateFilter.selection.size === 0) labelText = "None selected";
     else if (dateFilter.selection.size === totalMonths) labelText = "All Dates";
     else labelText = `${dateFilter.selection.size} months selected`;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className={`relative w-full cursor-pointer rounded-lg border py-3 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-zillion-400 sm:text-sm transition-colors duration-300 ${baseClass}`}>
            <span className="block truncate">{labelText}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <Calendar className={`h-4 w-4 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />
            </span>
        </button>
        {isOpen && (
            <div className={`absolute z-20 mt-1 w-64 overflow-hidden rounded-lg border shadow-xl ${dropdownClass}`}>
                <button onClick={() => { setIsOpen(false); onChange({...dateFilter, modalOpen: true}); }} className={`w-full text-left px-4 py-3 text-sm font-medium border-b hover:bg-zillion-50 dark:hover:bg-slate-700 ${theme === 'dark' ? 'border-slate-700 text-zillion-400' : 'border-slate-100 text-zillion-600'}`}>Custom Date Range...</button>
                <div className={`px-4 py-2 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button onClick={selectAll} className="text-xs font-medium text-slate-500 hover:text-zillion-500">Select All</button>
                    <button onClick={clearAll} className="text-xs font-medium text-slate-500 hover:text-red-500">Clear</button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                    {years.length === 1 ? (
                        <div className="space-y-1">{monthsByYear[years[0]].map(m => (
                                <label key={m} className={`flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700`}>
                                    <input type="checkbox" className={checkboxClass} checked={isMonthSelected(years[0], m)} onChange={() => toggleMonth(years[0], m)} />
                                    <span className="ml-2 text-sm">{monthNames[m]}</span>
                                </label>
                            ))}</div>
                    ) : (
                        <div className="space-y-1">{years.map(year => (
                                <div key={year}>
                                    <div className="flex items-center px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <button onClick={(e) => toggleYearExpand(e, year)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 mr-1">{expandedYears.has(year) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                                        <input type="checkbox" className={checkboxClass} checked={isYearSelected(year)} onChange={() => toggleYear(year)} />
                                        <span className="ml-2 text-sm font-bold">{year}</span>
                                    </div>
                                    {expandedYears.has(year) && (
                                        <div className="ml-6 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-2 mt-1">
                                            {monthsByYear[year].map(m => (
                                                <label key={`${year}-${m}`} className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                                                    <input type="checkbox" className={checkboxClass} checked={isMonthSelected(year, m)} onChange={() => toggleMonth(year, m)} />
                                                    <span className="ml-2 text-sm">{monthNames[m]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}</div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

const CustomDateRangeModal = ({ isOpen, onClose, onApply, theme }) => {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    if (!isOpen) return null;
    return (
        <ModalWrapper onClose={onClose} theme={theme} title="Select Date Range" maxWidth="max-w-sm">
            <div className="space-y-4">
                <InputField label="From" type="date" value={start} onChange={e => setStart(e.target.value)} theme={theme} />
                <InputField label="To" type="date" value={end} onChange={e => setEnd(e.target.value)} theme={theme} />
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={() => onApply(start, end)} disabled={!start || !end}>Apply Filter</Button>
                </div>
            </div>
        </ModalWrapper>
    );
};

// --- MAIN COMPONENT ---
export default function TransactionsView({
  transactions: allTransactions,
  categories,
  bankAccounts,
  onSaveTransaction,
  onDeleteTransaction,
  onReturnTransaction,
  onOpenTransactionModal,
  onBulkDelete,
  onBulkCategoryUpdate,
  theme = 'light'
}) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [priceFilterMode, setPriceFilterMode] = useState('gt');
  const [priceFilterValue, setPriceFilterValue] = useState('');
  const [dateFilter, setDateFilter] = useState({ type: 'manual', selection: new Set(), range: { start: null, end: null }, modalOpen: false });

  // Sort & Selection
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
      if (allTransactions.length > 0 && dateFilter.selection.size === 0 && dateFilter.type === 'manual') {
          const currentYear = new Date().getFullYear();
          const newSet = new Set();
          let hasCurrentYear = false;
          allTransactions.forEach(tx => {
             const d = new Date(tx.date + 'T12:00:00');
             if (d.getFullYear() === currentYear) { hasCurrentYear = true; newSet.add(`${currentYear}-${d.getMonth()}`); }
          });
          if (!hasCurrentYear && allTransactions.length > 0) {
              const latestYear = Math.max(...allTransactions.map(t => new Date(t.date).getFullYear()));
              allTransactions.forEach(tx => { if (new Date(tx.date + 'T12:00:00').getFullYear() === latestYear) newSet.add(`${latestYear}-${new Date(tx.date).getMonth()}`); });
          }
          setDateFilter(prev => ({ ...prev, selection: newSet }));
      }
  }, [allTransactions]);

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
    if (selectedCategories.length === 0) return categories.flatMap((cat) => cat.subcategories.map((sub) => ({ id: sub.id, name: `${cat.name} / ${sub.name}` })));
    return categories.filter((cat) => selectedCategories.includes(cat.id)).flatMap((cat) => cat.subcategories.map((sub) => ({ id: sub.id, name: sub.name })));
  }, [categories, selectedCategories]);

  const filteredTransactions = useMemo(() => {
    const priceVal = parseFloat(priceFilterValue) || 0;
    const lowerSearch = searchQuery.toLowerCase();

    let result = allTransactions.filter((tx) => {
        if (searchQuery) {
          const merchantMatch = (tx.merchant || '').toLowerCase().includes(lowerSearch);
          const notesMatch = (tx.notes || '').toLowerCase().includes(lowerSearch);
          const subCat = subCategoryMap.get(tx.subCategoryId);
          const catMatch = (subCat?.name || '').toLowerCase().includes(lowerSearch);
          if (!merchantMatch && !notesMatch && !catMatch) return false;
        }
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
        const txDate = new Date(tx.date + 'T12:00:00');
        if (dateFilter.type === 'range') {
            if (!dateFilter.range.start || !dateFilter.range.end) return true;
            const start = new Date(dateFilter.range.start); start.setHours(0,0,0,0);
            const end = new Date(dateFilter.range.end); end.setHours(23,59,59,999);
            return txDate >= start && txDate <= end;
        } else {
            const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
            return dateFilter.selection.has(key);
        }
    });

    // SORTING LOGIC
    result.sort((a, b) => {
       let valA, valB;
       if (sortConfig.key === 'amount') { valA = parseFloat(a.amount); valB = parseFloat(b.amount); }
       else if (sortConfig.key === 'merchant') { valA = (a.merchant || '').toLowerCase(); valB = (b.merchant || '').toLowerCase(); }
       else if (sortConfig.key === 'category') { valA = subCategoryMap.get(a.subCategoryId)?.name || ''; valB = subCategoryMap.get(b.subCategoryId)?.name || ''; }
       else { valA = new Date(a.date); valB = new Date(b.date); }

       if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
       if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
       return 0;
    });

    return result;
  }, [allTransactions, searchQuery, selectedCategories, selectedSubCategories, priceFilterValue, priceFilterMode, dateFilter, subCategoryMap, categories, sortConfig]);

  // Handlers
  const handleExport = (filteredOnly) => {
    exportTransactionsToCSV(filteredOnly ? filteredTransactions : allTransactions, subCategoryMap, accountMap, 'transactions-export');
    setIsExportModalOpen(false);
  };
  const handleSort = (key) => {
     setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };
  const handleSelectAll = () => {
     if (selectedIds.size === filteredTransactions.length) setSelectedIds(new Set());
     else setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
  };
  const handleToggleSelect = (id) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };
  const handleBulkDelete = () => {
     if (window.confirm(`Delete ${selectedIds.size} items?`)) {
        onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
     }
  };
  const handleResetFilters = () => {
     setSearchQuery(''); setSelectedCategories([]); setSelectedSubCategories([]); setPriceFilterValue('');
     const currentYear = new Date().getFullYear();
     const newSet = new Set();
     allTransactions.forEach(tx => { if (new Date(tx.date).getFullYear() === currentYear) newSet.add(`${currentYear}-${new Date(tx.date).getMonth()}`); });
     setDateFilter({ type: 'manual', selection: newSet, range: { start: null, end: null }, modalOpen: false });
  };

  // Stats
  const stats = useMemo(() => {
      let total = 0;
      filteredTransactions.forEach(tx => { const val = parseFloat(tx.amount) || 0; if (tx.isIncome) total += val; else total -= val; });
      return { count: filteredTransactions.length, total };
  }, [filteredTransactions]);
  const isFilterActive = searchQuery !== '' || selectedCategories.length > 0 || selectedSubCategories.length > 0 || priceFilterValue !== '';

  // CSS
  const cardClass = `rounded-3xl border backdrop-blur-md transition-all duration-500 overflow-hidden flex flex-col flex-grow ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-lg' : 'bg-white/70 border-white/60 shadow-lg'}`;
  const headerText = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800';
  const gridClass = "grid grid-cols-[50px_110px_1.5fr_1.5fr_1fr_50px] gap-4 items-center px-4 py-3";
  const checkboxClass = `w-4 h-4 rounded border cursor-pointer ${theme === 'dark' ? 'border-slate-500 bg-slate-700 accent-zillion-400' : 'border-slate-300 accent-zillion-500'}`;

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <EditTransactionModal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} transaction={editingTransaction} categories={categories} bankAccounts={bankAccounts} onSave={onSaveTransaction} onDelete={onDeleteTransaction} onReturn={onReturnTransaction} theme={theme} />
      <ExportChoiceModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExportFiltered={() => handleExport(true)} onExportAll={() => handleExport(false)} filterCount={filteredTransactions.length} totalCount={allTransactions.length} theme={theme} />
      <CustomDateRangeModal 
         isOpen={dateFilter.modalOpen} 
         onClose={() => setDateFilter({...dateFilter, modalOpen: false})} 
         theme={theme} 
         onApply={(start, end) => setDateFilter({ type: 'range', range: { start, end }, selection: new Set(), modalOpen: false })}
      />
      <BulkEditCategoryModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onSave={(catId) => { onBulkCategoryUpdate(Array.from(selectedIds), catId); setSelectedIds(new Set()); }} categories={categories} count={selectedIds.size} theme={theme} />

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-6 flex-shrink-0 px-5">
        <h2 className={`text-2xl font-semibold ${headerText}`}>Transactions</h2>
        <div className="flex gap-3">
           <div className={`relative flex items-center px-3 py-2 rounded-xl border ${inputBg} w-full sm:w-64 h-[42px]`}>
              <Search className="w-4 h-4 mr-2 opacity-50" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-sm w-full placeholder-opacity-50" />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>}
           </div>
           <Button variant="outline" onClick={() => setIsExportModalOpen(true)} icon={<FileDown className="w-4 h-4" />} className="h-[42px]">Export</Button>
           <Button variant="primary" onClick={onOpenTransactionModal} className="w-[42px] h-[42px] px-0 flex items-center justify-center shadow-lg shadow-zillion-400/20"><Plus className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className={cardClass}>
         {/* FILTERS */}
         <div className={`p-5 border-b grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
            <div><label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Category</label><MultiSelectDropdown options={categoryOptions} selectedIds={selectedCategories} onChange={setSelectedCategories} placeholder="All Categories" theme={theme} /></div>
            <div><label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Sub-Category</label><MultiSelectDropdown options={subCategoryOptions} selectedIds={selectedSubCategories} onChange={setSelectedSubCategories} placeholder="All Sub-Categories" theme={theme} /></div>
            <div><label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Amount</label><div className="flex h-[42px]"><select value={priceFilterMode} onChange={e => setPriceFilterMode(e.target.value)} className={`h-full rounded-l-lg border-r-0 border px-3 py-3 text-sm outline-none ${inputBg}`}><option value="gt">&gt;</option><option value="lt">&lt;</option></select><input type="number" value={priceFilterValue} onChange={e => setPriceFilterValue(e.target.value)} className={`h-full w-full rounded-r-lg border px-3 py-3 text-sm outline-none ${inputBg}`} placeholder="0.00" /></div></div>
            <div><label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Date</label><DateFilterDropdown allTransactions={allTransactions} dateFilter={dateFilter} onChange={setDateFilter} theme={theme} /></div>
         </div>

         {/* SUMMARY BAR */}
         {isFilterActive && (
            <div className={`flex justify-between items-center px-5 py-3 border-b flex-shrink-0 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-200'}`}>
               <div className="flex gap-4 text-sm"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Showing <strong>{stats.count}</strong> transactions</span><span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Total: {formatCurrency(stats.total)}</span></div>
               <button onClick={handleResetFilters} className={`text-xs font-medium flex items-center gap-1 transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}><RotateCcw size={12} /> Reset Filters</button>
            </div>
         )}

         {/* SORTABLE HEADER ROW */}
         <div className={`${gridClass} border-b text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
             <div><input type="checkbox" className={checkboxClass} checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0} onChange={handleSelectAll} /></div>
             <div onClick={() => handleSort('date')} className="cursor-pointer flex items-center hover:text-zillion-500">Date <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
             <div onClick={() => handleSort('merchant')} className="cursor-pointer flex items-center hover:text-zillion-500">Merchant <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
             <div onClick={() => handleSort('category')} className="cursor-pointer flex items-center hover:text-zillion-500">Category <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
             <div onClick={() => handleSort('amount')} className="cursor-pointer flex items-center justify-end hover:text-zillion-500">Amount <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
             <div className="text-right">Action</div>
         </div>

         {/* ROWS */}
         <div className="flex-grow overflow-y-auto custom-scrollbar">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20"><div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300'}`}><Filter className="h-8 w-8" /></div><p className={subText}>No transactions match.</p></div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className={`${gridClass} border-b last:border-0 transition-colors ${selectedIds.has(tx.id) ? (theme === 'dark' ? 'bg-zillion-900/20' : 'bg-zillion-50') : (theme === 'dark' ? 'hover:bg-slate-800/30 border-slate-800' : 'hover:bg-slate-50 border-slate-100')}`}>
                   <div><input type="checkbox" className={checkboxClass} checked={selectedIds.has(tx.id)} onChange={() => handleToggleSelect(tx.id)} /></div>
                   <div className={`text-sm ${headerText}`}>{tx.date}</div>
                   <div className={`text-sm font-medium truncate ${headerText}`}>{tx.merchant || 'Unknown'}</div>
                   <div className="truncate"><div className={`text-sm ${headerText}`}>{subCategoryMap.get(tx.subCategoryId)?.name}</div><div className={`text-xs ${subText}`}>{accountMap.get(tx.accountId)}</div></div>
                   <div className={`text-sm font-bold font-mono text-right ${tx.isIncome ? 'text-zillion-500' : headerText}`}>{tx.isIncome ? '+' : ''}{formatCurrency(tx.amount)}</div>
                   <div className="text-right"><button onClick={() => setEditingTransaction(tx)} className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><Edit3 className="h-4 w-4" /></button></div>
                </div>
              ))
            )}
         </div>

         {/* BULK ACTION FLOATING BAR */}
         {selectedIds.size > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
               <div className={`flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
                  <span className={`text-sm font-bold ${headerText}`}>{selectedIds.size} selected</span>
                  <div className={`h-4 w-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                  <button onClick={() => setIsBulkEditModalOpen(true)} className={`flex items-center gap-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}><FolderEdit size={16} /> Categorize</button>
                  <button onClick={handleBulkDelete} className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"><Trash2 size={16} /> Delete</button>
                  <button onClick={() => setSelectedIds(new Set())} className={`ml-2 p-1 rounded-full ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}><X size={14} /></button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}