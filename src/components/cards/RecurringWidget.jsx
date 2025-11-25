import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { formatCurrency, getTodayDate } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { InputField, GlassCurrencyInput } from '../ui/FormInputs';
import { ModalWrapper } from '../ui/SharedUI';
import { nanoid } from 'nanoid';

// --- Add Recurring Modal ---
function AddRecurringModal({ isOpen, onClose, onSave, categories, theme }) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  
  const [isVariable, setIsVariable] = useState(false); // If true, amount is 0/null

  const availableSubCategories = useMemo(() => {
    if (!categoryId) return [];
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.subcategories : [];
  }, [categoryId, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant || !day || !subCategoryId) return;
    onSave({
      merchant,
      amount: isVariable ? 0 : parseFloat(amount) || 0,
      dayOfMonth: parseInt(day),
      subCategoryId,
      isVariable
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Add Recurring Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Description" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Netflix, Mortgage" theme={theme} />
        
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Day of Month</label>
              <select value={day} onChange={e => setDay(e.target.value)} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                 {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
           </div>
           
           {/* Category Select */}
           <div>
              <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                 <option value="">Select...</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sub-Category</label>
               <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-slate-200 bg-slate-800/50' : 'border-slate-300 text-slate-800'}`}>
                  <option value="">Select...</option>
                  {availableSubCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
            <div>
               <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Amount</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isVariable} onChange={e => setIsVariable(e.target.checked)} className="accent-zillion-400" />
                    <span className="text-[10px] text-slate-400">Variable?</span>
                  </label>
               </div>
               <GlassCurrencyInput value={amount} onChange={setAmount} disabled={isVariable} placeholder={isVariable ? "Varies" : "0.00"} theme={theme} />
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Recurring</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// --- MAIN WIDGET ---
export default function RecurringTransactionsWidget({ recurringTransactions, onAdd, onDelete, categories, theme = 'light' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to get category name
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

  return (
    <>
      <AddRecurringModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAdd} categories={categories} theme={theme} />
      
      <div className={`
        h-full min-h-[317px] w-full rounded-3xl p-6 backdrop-blur-md transition-all duration-500 border flex flex-col
        ${theme === 'dark' 
          ? 'bg-slate-900/40 border-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]' 
          : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}
      `}>
        <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Recurring Payments</h3>
            <button onClick={() => setIsModalOpen(true)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <Plus className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {sortedItems.length === 0 ? (
                <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recurring payments set up.</p>
                </div>
            ) : (
                sortedItems.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border group transition-all ${theme === 'dark' ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-white/50'}`}>
                       <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                               {item.dayOfMonth}
                           </div>
                           <div>
                               <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{item.merchant}</p>
                               <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{getCatName(item.subCategoryId)}</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-3">
                           <span className={`text-sm font-mono font-bold ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>
                               {item.isVariable ? 'Var' : formatCurrency(item.amount)}
                           </span>
                           <button onClick={() => onDelete(item.id)} className={`opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                               <Trash2 className="w-4 h-4" />
                           </button>
                       </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </>
  );
}
