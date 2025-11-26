import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, FileDown, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
import { formatCurrency, exportTransactionsToCSV } from '../../utils/helpers';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import EditTransactionModal from './EditTransactionModal';
import { Button } from '../ui/Button';
import { ModalWrapper } from '../ui/SharedUI';
import { InputField } from '../ui/InputField';

// --- BULK EDIT CATEGORY MODAL ---
export function BulkEditCategoryModal({ isOpen, onClose, onSave, categories, count, theme = 'light' }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId('');
      setSubCategoryId('');
    }
  }, [isOpen]);

  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const mainCategory = categories.find((cat) => cat.id === selectedCategoryId);
    return mainCategory ? mainCategory.subcategories : [];
  }, [selectedCategoryId, categories]);

  const handleSave = () => {
    if (subCategoryId) {
      onSave(subCategoryId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectClass = `w-full p-3 rounded-lg border bg-transparent outline-none transition-colors ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`;
  const labelClass = `block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title={`Edit ${count} Transactions`} maxWidth="max-w-md" zIndex="z-[70]">
      <div className="space-y-4">
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Select a new category for the selected transactions.
        </p>
        <div>
          <label className={labelClass}>Category</label>
          <select value={selectedCategoryId} onChange={(e) => { setSelectedCategoryId(e.target.value); setSubCategoryId(''); }} className={selectClass}>
            <option value="">Select...</option>
            {categories.map((cat) => <option value={cat.id} key={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sub-Category</label>
          <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className={selectClass} disabled={!selectedCategoryId}>
            <option value="">Select...</option>
            {availableSubCategories.map((sub) => <option value={sub.id} key={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!subCategoryId}>Update All</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// --- EXPORT CHOICE MODAL ---
export function ExportChoiceModal({
  isOpen,
  onClose,
  onExportFiltered,
  onExportAll,
  filterCount,
  totalCount,
  theme = 'light'
}) {
  if (!isOpen) return null;
  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Export Transactions" maxWidth="max-w-md" zIndex="z-[70]">
      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        Export only filtered items or all items from this view?
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="primary" onClick={onExportFiltered} icon={<FileDown className="w-4 h-4" />}>
          Export Filtered ({filterCount} items)
        </Button>
        <Button variant="outline" onClick={onExportAll} icon={<FileDown className="w-4 h-4" />}>
          Export All ({totalCount} items)
        </Button>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </ModalWrapper>
  );
}

// --- HELPER: Transaction List Item ---
const TransactionItem = ({ tx, subCategoryMap, accountMap, onEdit, theme }) => (
  <div className={`flex justify-between items-center p-3 rounded-xl border transition-all group ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${tx.isIncome ? 'bg-zillion-500/10 text-zillion-500' : 'bg-red-500/10 text-red-500'}`}>
         {tx.isIncome ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
      </div>
      <div>
        <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{tx.merchant || (tx.isIncome ? 'Income' : 'Transaction')}</p>
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {tx.isIncome ? tx.notes : subCategoryMap.get(tx.subCategoryId)?.name || 'Uncategorized'}
          {accountMap && ` | ${accountMap.get(tx.accountId)}`}
        </p>
      </div>
    </div>
    <div className="text-right flex items-center gap-3">
      <div>
        <p className={`font-bold text-sm ${tx.isIncome ? 'text-zillion-500' : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
          {tx.isIncome ? '+' : ''}{formatCurrency(tx.amount)}
        </p>
        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{tx.date}</p>
      </div>
      {onEdit && (
        <button onClick={() => onEdit(tx)} className={`p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 ${theme === 'dark' ? 'text-slate-400 hover:text-zillion-400 hover:bg-slate-700' : 'text-slate-400 hover:text-zillion-500 hover:bg-slate-200'}`}>
          <Edit3 className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
);

// --- TRANSACTION DETAIL MODAL ---
export function TransactionDetailModal({ isOpen, onClose, filter, allTransactions, categories, bankAccounts, onSaveTransaction, onDeleteTransaction, onReturnTransaction, theme = 'light' }) {
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Simple filtering logic for the basic modal usage
  const filteredTransactions = useMemo(() => {
    if (!filter) return [];
    
    let relevantTransactions = [];
    if (filter.type === 'account') {
       relevantTransactions = allTransactions.filter(tx => tx.accountId === filter.id);
    } else if (filter.type === 'category') {
       const cat = categories.find(c => c.id === filter.id);
       const subIds = cat ? cat.subcategories.map(s => s.id) : [];
       relevantTransactions = allTransactions.filter(tx => !tx.isIncome && subIds.includes(tx.subCategoryId));
    } else if (filter.type === 'subcategory') {
       relevantTransactions = allTransactions.filter(tx => !tx.isIncome && tx.subCategoryId === filter.id);
    } else {
       relevantTransactions = allTransactions;
    }
    return relevantTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filter, allTransactions, categories]);

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

  if (!isOpen) return null;

  return (
    <>
      <ModalWrapper onClose={onClose} theme={theme} title={`Transactions: ${filter?.name || 'View'}`} maxWidth="max-w-2xl">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[300px]">
             {filteredTransactions.map(tx => <TransactionItem key={tx.id} tx={tx} subCategoryMap={subCategoryMap} accountMap={accountMap} onEdit={setEditingTransaction} theme={theme} />)}
             {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                   <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>No transactions found.</p>
                </div>
             )}
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-slate-700 pt-4">
             <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
      </ModalWrapper>
      
      <EditTransactionModal 
          isOpen={!!editingTransaction} 
          onClose={() => setEditingTransaction(null)} 
          transaction={editingTransaction} 
          categories={categories} 
          bankAccounts={bankAccounts} 
          onSave={onSaveTransaction} 
          onDelete={onDeleteTransaction} 
          onReturn={onReturnTransaction} 
          theme={theme} 
      />
    </>
  );
}

// --- ALL TRANSACTIONS MODAL ---
export function AllTransactionsModal(props) { return <TransactionDetailModal {...props} filter={{ type: 'all', name: 'All' }} />; }

// --- ACCOUNT TRANSACTION MODAL ---
export function AccountTransactionModal({ isOpen, onClose, filter, allTransactions, categories, bankAccounts, onSaveTransaction, onDeleteTransaction, onReturnTransaction, theme = 'light' }) {
    return <TransactionDetailModal 
        isOpen={isOpen} 
        onClose={onClose} 
        filter={{...filter, type: 'account'}} 
        allTransactions={allTransactions} 
        categories={categories} 
        bankAccounts={bankAccounts} 
        onSaveTransaction={onSaveTransaction} 
        onDeleteTransaction={onDeleteTransaction} 
        onReturnTransaction={onReturnTransaction} 
        theme={theme} 
    />;
}

// --- TRANSACTION HISTORY MODAL ---
export function TransactionHistoryModal({ isOpen, onClose, debt, allTransactions, linkedSubCategoryId, theme = 'light' }) {
  const transactions = useMemo(() => {
    if (!linkedSubCategoryId) return [];
    return allTransactions
      .filter((tx) => tx.subCategoryId === linkedSubCategoryId && !tx.isIncome)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTransactions, linkedSubCategoryId]);

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title={`History: ${debt?.name}`} maxWidth="max-w-2xl" zIndex="z-[60]">
        <div className={`grid grid-cols-3 gap-4 mb-2 pb-2 text-xs font-bold uppercase border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'}`}>
          <div>Date</div>
          <div className="text-right">Principal</div>
          <div className="text-right">Interest</div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[200px]">
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No payments found.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className={`grid grid-cols-3 gap-4 p-3 rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{tx.date}</p>
                  <p className="text-[10px] text-slate-500">{tx.merchant || 'Payment'}</p>
                </div>
                <div className={`text-right font-mono text-sm ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>
                  {formatCurrency(tx.principalPaid || tx.amount)}
                </div>
                <div className={`text-right font-mono text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {formatCurrency(tx.interestPaid || 0)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
    </ModalWrapper>
  );
}