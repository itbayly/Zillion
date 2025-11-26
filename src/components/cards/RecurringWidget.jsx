import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calendar, RefreshCw, Save, Clock, Check, X, DollarSign } from 'lucide-react';
import { formatCurrency, getTodayDate } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { GlassCurrencyInput } from '../ui/FormInputs';
import { InputField } from '../ui/InputField';
import { ModalWrapper } from '../ui/SharedUI';
import { nanoid } from 'nanoid';

// --- MODAL: ADD / EDIT / HISTORY ---
function RecurringDetailModal({ isOpen, onClose, item, isEditing, onSave, onDelete, categories, transactions, theme }) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    merchant: '', amount: '', day: '1', categoryId: '', subCategoryId: '', isVariable: false
  });

  // Populate form on open
  useEffect(() => {
    if (isOpen) {
      if (isEditing && item) {
        const parentCat = categories.find(c => c.subcategories.some(s => s.id === item.subCategoryId));
        setFormData({
          merchant: item.merchant,
          amount: item.amount || '',
          day: item.dayOfMonth,
          categoryId: parentCat ? parentCat.id : '',
          subCategoryId: item.subCategoryId,
          isVariable: item.isVariable
        });
        setActiveTab('details');
      } else {
        setFormData({ merchant: '', amount: '', day: '1', categoryId: '', subCategoryId: '', isVariable: false });
        setActiveTab('details');
      }
    }
  }, [isOpen, item, isEditing, categories]);

  const availableSubCategories = useMemo(() => {
    if (!formData.categoryId) return [];
    const cat = categories.find(c => c.id === formData.categoryId);
    return cat ? cat.subcategories : [];
  }, [formData.categoryId, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.merchant || !formData.day || !formData.subCategoryId) return;
    
    const payload = {
      ...item,
      merchant: formData.merchant,
      amount: formData.isVariable ? 0 : parseFloat(formData.amount) || 0,
      dayOfMonth: parseInt(formData.day),
      subCategoryId: formData.subCategoryId,
      isVariable: formData.isVariable
    };
    onSave(payload);
    onClose();
  };

  const historyTransactions = useMemo(() => {
    if (!item || !transactions) return [];
    return transactions
      .filter(tx => tx.subCategoryId === item.subCategoryId && !tx.isIncome)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [item, transactions]);

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title={isEditing ? item.merchant : "Add Recurring"}>
      {isEditing && (
        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
           <button onClick={() => setActiveTab('details')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-zillion-400 text-zillion-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Details</button>
           <button onClick={() => setActiveTab('history')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-zillion-400 text-zillion-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>History</button>
        </div>
      )}

      {activeTab === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Description" value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})} placeholder="e.g. Netflix" theme={theme} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Day of Month</label>
                <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
            </div>
            
            <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value, subCategoryId: ''})} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sub-Category</label>
                <select value={formData.subCategoryId} onChange={e => setFormData({...formData, subCategoryId: e.target.value})} disabled={!formData.categoryId} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                    <option value="">Select...</option>
                    {availableSubCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Amount</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isVariable} onChange={e => setFormData({...formData, isVariable: e.target.checked})} className="accent-zillion-400" />
                      <span className="text-[10px] text-slate-400">Variable?</span>
                    </label>
                </div>
                <GlassCurrencyInput value={formData.amount} onChange={val => setFormData({...formData, amount: val})} disabled={formData.isVariable} placeholder={formData.isVariable ? "Varies" : "0.00"} theme={theme} />
              </div>
          </div>

          <div className="mt-6 flex justify-between items-center pt-4 border-t border-transparent">
            {isEditing ? (
               <button type="button" onClick={() => { onDelete(item.id); onClose(); }} className="text-xs text-red-500 hover:text-red-600 flex items-center"><Trash2 className="w-4 h-4 mr-1"/> Delete</button>
            ) : <div></div>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary">Save</Button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
          {historyTransactions.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No past payments found for this category.</p>
          ) : (
            historyTransactions.map(tx => (
              <div key={tx.id} className={`flex justify-between p-3 rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200'}`}>
                 <div>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{tx.date}</p>
                    <p className="text-xs text-slate-500">{tx.merchant}</p>
                 </div>
                 <p className={`text-sm font-mono font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatCurrency(tx.amount)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </ModalWrapper>
  );
}

// --- MAIN WIDGET ---
export default function RecurringTransactionsWidget({ recurringTransactions, onAdd, onUpdate, onDelete, categories, transactions, onSaveTransaction, bankAccounts, defaultAccountId, theme = 'light' }) {
  const [modalMode, setModalMode] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [payAmounts, setPayAmounts] = useState({}); 

  const getCatName = (subId) => {
    for (const c of categories) {
       const s = c.subcategories.find(sub => sub.id === subId);
       if (s) return s.name;
    }
    return 'Unknown';
  };

  const sortedItems = useMemo(() => {
    return [...(recurringTransactions || [])].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [recurringTransactions]);

  const handlePayVariable = (item) => {
     const amount = parseFloat(payAmounts[item.id]) || 0;
     if (amount <= 0) return;

     const tx = {
        id: crypto.randomUUID(),
        date: getTodayDate(),
        amount: amount,
        merchant: item.merchant,
        subCategoryId: item.subCategoryId,
        accountId: defaultAccountId || (bankAccounts[0]?.id),
        isIncome: false,
        notes: 'Recurring Variable Payment'
     };
     onSaveTransaction(tx);
     setPayAmounts(prev => ({ ...prev, [item.id]: '' })); 
  };

  return (
    <>
      <RecurringDetailModal 
        isOpen={!!modalMode} 
        onClose={() => { setModalMode(null); setSelectedItem(null); }} 
        item={selectedItem}
        isEditing={modalMode === 'edit'}
        onSave={modalMode === 'edit' ? onUpdate : onAdd}
        onDelete={onDelete}
        categories={categories}
        transactions={transactions}
        theme={theme}
      />
      
      <div className={`
        h-full min-h-[317px] w-full rounded-3xl p-6 backdrop-blur-md transition-all duration-500 border flex flex-col
        ${theme === 'dark' 
          ? 'bg-slate-900/40 border-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]' 
          : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}
      `}>
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Recurring Payments</h3>
            <button onClick={() => setModalMode('add')} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <Plus className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {sortedItems.length === 0 ? (
                <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recurring payments set up.</p>
                </div>
            ) : (
                sortedItems.map(item => (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border group transition-all gap-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40' : 'border-slate-100 bg-white/50 hover:bg-white/80'}`}>
                       
                       {/* Clickable Info Area */}
                       <div className="flex items-center gap-3 flex-grow cursor-pointer w-full" onClick={() => { setSelectedItem(item); setModalMode('edit'); }}>
                           <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex flex-col items-center justify-center text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                               <span className="text-[9px] uppercase opacity-70">Day</span>
                               <span>{item.dayOfMonth}</span>
                           </div>
                           <div className="min-w-0 flex-grow">
                               <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{item.merchant}</p>
                               <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{getCatName(item.subCategoryId)}</p>
                           </div>
                       </div>

                       {/* Right Side: Amount or Input */}
                       <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                           {item.isVariable ? (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className={`flex-grow sm:w-32 h-9 rounded-lg border flex items-center px-2 transition-colors focus-within:border-zillion-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                   <span className="text-xs text-slate-500 mr-1">$</span>
                                   <input 
                                      className="w-full bg-transparent text-xs outline-none font-mono"
                                      placeholder="Amount"
                                      type="number"
                                      value={payAmounts[item.id] || ''}
                                      onChange={(e) => setPayAmounts({...payAmounts, [item.id]: e.target.value})}
                                   />
                                </div>
                                <button 
                                  onClick={() => handlePayVariable(item)}
                                  disabled={!payAmounts[item.id]}
                                  className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all ${
                                    !payAmounts[item.id] 
                                      ? (theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                                      : (theme === 'dark' ? 'bg-zillion-500/20 border-zillion-500 text-zillion-400 hover:bg-zillion-500/30' : 'bg-zillion-50 border-zillion-200 text-zillion-600 hover:bg-zillion-100')
                                  }`}
                                >
                                   <Check className="w-4 h-4" />
                                </button>
                              </div>
                           ) : (
                              <span className={`text-sm font-mono font-bold ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>
                                  {formatCurrency(item.amount)}
                              </span>
                           )}
                       </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </>
  );
}