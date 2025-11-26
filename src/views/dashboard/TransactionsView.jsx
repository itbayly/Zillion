import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Edit3, FileDown, ArrowUpCircle, ArrowDownCircle, Search, Filter, X, Plus, Calendar, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { formatCurrency, exportTransactionsToCSV } from '../../utils/helpers';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import EditTransactionModal from '../../components/modals/EditTransactionModal';
import { ExportChoiceModal } from '../../components/modals/TransactionListModals';
import { ModalWrapper } from '../../components/ui/SharedUI';

// --- INTERNAL COMPONENT: Date Filter Dropdown ---
const DateFilterDropdown = ({ allTransactions, dateFilter, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [expandedYears, setExpandedYears] = useState(new Set());

  // Analyze available dates from transactions
  const { years, monthsByYear } = useMemo(() => {
    const map = {};
    const uniqueYears = new Set();
    allTransactions.forEach(tx => {
        const d = new Date(tx.date + 'T12:00:00');
        const y = d.getFullYear();
        const m = d.getMonth(); // 0-11
        uniqueYears.add(y);
        if (!map[y]) map[y] = new Set();
        map[y].add(m);
    });
    
    const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a);
    const sortedMap = {};
    sortedYears.forEach(y => {
        sortedMap[y] = Array.from(map[y]).sort((a, b) => a - b);
    });
    
    return { years: sortedYears, monthsByYear: sortedMap };
  }, [allTransactions]);

  // Auto-expand the most recent year on mount if closed
  useEffect(() => {
      if (years.length > 0 && expandedYears.size === 0) {
          setExpandedYears(new Set([years[0]]));
      }
  }, [years]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleYearExpand = (e, year) => {
      e.stopPropagation();
      const newSet = new Set(expandedYears);
      if (newSet.has(year)) newSet.delete(year);
      else newSet.add(year);
      setExpandedYears(newSet);
  };

  const isMonthSelected = (year, month) => dateFilter.selection.has(`${year}-${month}`);
  
  const isYearSelected = (year) => {
     const months = monthsByYear[year] || [];
     return months.length > 0 && months.every(m => isMonthSelected(year, m));
  };
  
  const isYearIndeterminate = (year) => {
      const months = monthsByYear[year] || [];
      const selectedCount = months.filter(m => isMonthSelected(year, m)).length;
      return selectedCount > 0 && selectedCount < months.length;
  };

  const toggleMonth = (year, month) => {
      const key = `${year}-${month}`;
      const newSelection = new Set(dateFilter.selection);
      if (newSelection.has(key)) newSelection.delete(key);
      else newSelection.add(key);
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };

  const toggleYear = (year) => {
      const months = monthsByYear[year] || [];
      const allSelected = isYearSelected(year);
      const newSelection = new Set(dateFilter.selection);
      
      months.forEach(m => {
          const key = `${year}-${m}`;
          if (allSelected) newSelection.delete(key);
          else newSelection.add(key);
      });
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };

  const selectAll = () => {
      const newSelection = new Set();
      years.forEach(y => {
          monthsByYear[y].forEach(m => newSelection.add(`${y}-${m}`));
      });
      onChange({ ...dateFilter, type: 'manual', selection: newSelection });
  };

  const clearAll = () => {
      onChange({ ...dateFilter, type: 'manual', selection: new Set() });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Styles
  const baseClass = theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
  const dropdownClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-gray-900';
  const checkboxClass = `w-4 h-4 rounded border cursor-pointer ${theme === 'dark' ? 'border-slate-500 bg-slate-700 accent-zillion-400' : 'border-slate-300 accent-zillion-500'}`;

  // Display Text Logic
  let labelText = "Select Date";
  if (dateFilter.type === 'range') {
     labelText = "Custom Range";
     if (dateFilter.range.start && dateFilter.range.end) {
        labelText = `${new Date(dateFilter.range.start).toLocaleDateString()} - ${new Date(dateFilter.range.end).toLocaleDateString()}`;
     }
  } else {
     // If only 1 year exists, show months. If multiple, show years.
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
                <button onClick={() => { setIsOpen(false); onChange({...dateFilter, modalOpen: true}); }} className={`w-full text-left px-4 py-3 text-sm font-medium border-b hover:bg-zillion-50 dark:hover:bg-slate-700 ${theme === 'dark' ? 'border-slate-700 text-zillion-400' : 'border-slate-100 text-zillion-600'}`}>
                    Custom Date Range...
                </button>
                
                <div className={`px-4 py-2 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button onClick={selectAll} className="text-xs font-medium text-slate-500 hover:text-zillion-500">Select All</button>
                    <button onClick={clearAll} className="text-xs font-medium text-slate-500 hover:text-red-500">Clear</button>
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                    {/* SINGLE YEAR VIEW */}
                    {years.length === 1 ? (
                        <div className="space-y-1">
                            {monthsByYear[years[0]].map(m => (
                                <label key={m} className={`flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700`}>
                                    <input type="checkbox" className={checkboxClass} checked={isMonthSelected(years[0], m)} onChange={() => toggleMonth(years[0], m)} />
                                    <span className="ml-2 text-sm">{monthNames[m]}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        // MULTI YEAR VIEW (Tree)
                        <div className="space-y-1">
                            {years.map(year => (
                                <div key={year}>
                                    <div className="flex items-center px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <button onClick={(e) => toggleYearExpand(e, year)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 mr-1">
                                            {expandedYears.has(year) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                        <input 
                                            type="checkbox" 
                                            className={checkboxClass} 
                                            checked={isYearSelected(year)} 
                                            ref={input => { if (input) input.indeterminate = isYearIndeterminate(year); }}
                                            onChange={() => toggleYear(year)} 
                                        />
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

// --- INTERNAL COMPONENT: Custom Range Modal ---
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
  
  // New Date Filter State
  const [dateFilter, setDateFilter] = useState({
      type: 'manual', // 'manual' | 'range'
      selection: new Set(), // Set of "YYYY-M" strings
      range: { start: null, end: null },
      modalOpen: false
  });

  // Initialize default selection (current year)
  useEffect(() => {
      if (allTransactions.length > 0 && dateFilter.selection.size === 0 && dateFilter.type === 'manual') {
          const currentYear = new Date().getFullYear();
          const newSet = new Set();
          let hasCurrentYear = false;
          
          allTransactions.forEach(tx => {
             const d = new Date(tx.date + 'T12:00:00');
             if (d.getFullYear() === currentYear) {
                 hasCurrentYear = true;
                 newSet.add(`${currentYear}-${d.getMonth()}`);
             }
          });

          // If no tx in current year, add all from latest year available
          if (!hasCurrentYear && allTransactions.length > 0) {
              // Find latest year
              const latestYear = Math.max(...allTransactions.map(t => new Date(t.date).getFullYear()));
              allTransactions.forEach(tx => {
                  const d = new Date(tx.date + 'T12:00:00');
                  if (d.getFullYear() === latestYear) newSet.add(`${latestYear}-${d.getMonth()}`);
              });
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
        
        // DATE FILTERS
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
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTransactions, searchQuery, selectedCategories, selectedSubCategories, priceFilterValue, priceFilterMode, dateFilter, subCategoryMap, categories]);

  const handleExport = (filteredOnly) => {
    exportTransactionsToCSV(filteredOnly ? filteredTransactions : allTransactions, subCategoryMap, accountMap, 'transactions-export');
    setIsExportModalOpen(false);
  };

  // Styles
  const cardClass = `rounded-3xl border backdrop-blur-md transition-all duration-500 overflow-hidden flex flex-col flex-grow ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-lg' : 'bg-white/70 border-white/60 shadow-lg'}`;
  const headerText = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <EditTransactionModal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} transaction={editingTransaction} categories={categories} bankAccounts={bankAccounts} onSave={onSaveTransaction} onDelete={onDeleteTransaction} onReturn={onReturnTransaction} theme={theme} />
      <ExportChoiceModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExportFiltered={() => handleExport(true)} onExportAll={() => handleExport(false)} filterCount={filteredTransactions.length} totalCount={allTransactions.length} theme={theme} />
      <CustomDateRangeModal 
         isOpen={dateFilter.modalOpen} 
         onClose={() => setDateFilter({...dateFilter, modalOpen: false})} 
         theme={theme} 
         onApply={(start, end) => setDateFilter({ type: 'range', range: { start, end }, selection: new Set(), modalOpen: false })}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0 px-5">
        <h2 className={`text-2xl font-semibold ${headerText}`}>Transactions</h2>
        <div className="flex gap-3">
           <div className={`relative flex items-center px-3 py-2 rounded-xl border ${inputBg} w-full sm:w-64 h-[42px]`}>
              <Search className="w-4 h-4 mr-2 opacity-50" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-opacity-50"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>}
           </div>
           <Button variant="outline" onClick={() => setIsExportModalOpen(true)} icon={<FileDown className="w-4 h-4" />} className="h-[42px]">Export</Button>
           <Button variant="primary" onClick={onOpenTransactionModal} className="w-[42px] h-[42px] px-0 flex items-center justify-center shadow-lg shadow-zillion-400/20"><Plus className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className={cardClass}>
         {/* Filters Header */}
         <div className={`p-5 border-b grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
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
                    <select value={priceFilterMode} onChange={e => setPriceFilterMode(e.target.value)} className={`rounded-l-lg border-r-0 border px-3 py-3 text-sm outline-none ${inputBg}`}>
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                    </select>
                    <input type="number" value={priceFilterValue} onChange={e => setPriceFilterValue(e.target.value)} className={`w-full rounded-r-lg border px-3 py-3 text-sm outline-none ${inputBg}`} placeholder="0.00" />
                </div>
            </div>
            <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${subText}`}>Date</label>
                <DateFilterDropdown 
                    allTransactions={allTransactions} 
                    dateFilter={dateFilter} 
                    onChange={setDateFilter}
                    theme={theme} 
                />
            </div>
         </div>

         {/* Transaction List */}
         <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
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