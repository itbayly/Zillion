import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import { nanoid } from 'nanoid';
import { SUGGESTED_CATEGORIES } from '../../utils/constants';
import { Button } from '../ui/Button';
import { InputField } from '../ui/InputField';

// --- Helper: Modal Wrapper ---
const ModalWrapper = ({ children, onClose, theme, maxWidth = 'max-w-2xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
    <div 
      className={`w-full ${maxWidth} p-6 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-slate-900/95 border border-white/10 text-slate-100' 
        : 'bg-white/95 border border-white/60 text-slate-800'
      } backdrop-blur-xl`}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onClose} 
        className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
      >
        <X className="h-5 w-5" />
      </button>
      {children}
    </div>
  </div>
);

// --- 1. Add From Suggestions ---
export function AddFromSuggestionsModal({ isOpen, onClose, onAdd, theme }) {
  const [modalStep, setModalStep] = useState(1);
  const [selectedCatIds, setSelectedCatIds] = useState({});
  const [subCategoriesData, setSubCategoriesData] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setModalStep(1);
      setSelectedCatIds({});
      setSubCategoriesData([]);
    }
  }, [isOpen]);

  const goToStep2 = () => {
    const initialSubData = [];
    SUGGESTED_CATEGORIES.forEach((cat) => {
      if (selectedCatIds[cat.id]) {
        cat.subcategories.forEach((sub) => {
          initialSubData.push({
            id: sub.id,
            name: sub.name,
            type: sub.type,
            originalCatName: cat.name,
            isSelected: true,
          });
        });
      }
    });
    setSubCategoriesData(initialSubData);
    setModalStep(2);
  };

  const handleCatToggle = (catId) => {
    setSelectedCatIds((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSubCategoryToggle = (subId) => {
    setSubCategoriesData((prev) =>
      prev.map((sub) =>
        sub.id === subId ? { ...sub, isSelected: !sub.isSelected } : sub
      )
    );
  };

  const handleNameChange = (subId, newName) => {
    setSubCategoriesData((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, name: newName } : sub))
    );
  };

  const handleTypeChange = (subId, newType) => {
    setSubCategoriesData((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, type: newType } : sub))
    );
  };

  const handleSubmit = () => {
    const selectedSubs = subCategoriesData.filter((sub) => sub.isSelected);
    onAdd(selectedSubs);
  };

  const groupedSubCategories = useMemo(() => {
    return subCategoriesData.reduce((acc, sub) => {
      if (!acc[sub.originalCatName]) acc[sub.originalCatName] = [];
      acc[sub.originalCatName].push(sub);
      return acc;
    }, {});
  }, [subCategoriesData]);

  if (!isOpen) return null;
  const selectedCount = Object.values(selectedCatIds).filter(Boolean).length;

  return (
    <ModalWrapper onClose={onClose} theme={theme}>
      {modalStep === 1 ? (
        <>
          <h3 className="text-xl font-bold mb-1">Add from Suggestions</h3>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Step 1 of 2: Select Categories</p>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {SUGGESTED_CATEGORIES.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => handleCatToggle(cat.id)}
                className={`
                  flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                  ${selectedCatIds[cat.id] 
                    ? 'border-zillion-400 bg-zillion-50 dark:bg-zillion-900/20' 
                    : `border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`
                  }
                `}
              >
                <div>
                  <span className={`font-bold block ${selectedCatIds[cat.id] ? 'text-zillion-700 dark:text-zillion-300' : ''}`}>{cat.name}</span>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{cat.subcategories.map((s) => s.name).join(', ')}</p>
                </div>
                <div className={`
                  w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                  ${selectedCatIds[cat.id] ? 'bg-zillion-400 border-zillion-400' : 'border-slate-300 dark:border-slate-600'}
                `}>
                  {selectedCatIds[cat.id] && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-6 pt-6 border-t flex justify-end ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button onClick={goToStep2} disabled={selectedCount === 0} className="px-8 uppercase font-bold text-xs" rightIcon={<ArrowRight size={16} />}>
              Next ({selectedCount})
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold mb-1">Customize Sub-categories</h3>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Step 2 of 2: Refine your selection</p>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {Object.keys(groupedSubCategories).map((catName) => (
              <div key={catName} className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <h4 className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{catName}</h4>
                <div className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {groupedSubCategories[catName].map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3">
                      <input 
                        type="checkbox" 
                        checked={sub.isSelected} 
                        onChange={() => handleSubCategoryToggle(sub.id)} 
                        className="h-5 w-5 accent-zillion-400 rounded cursor-pointer" 
                      />
                      <input 
                        type="text" 
                        value={sub.name} 
                        onChange={(e) => handleNameChange(sub.id, e.target.value)} 
                        disabled={!sub.isSelected}
                        className={`flex-1 bg-transparent border-b border-transparent focus:border-zillion-400 outline-none text-sm py-1 ${!sub.isSelected && 'opacity-50'}`} 
                      />
                      <select 
                        value={sub.type} 
                        onChange={(e) => handleTypeChange(sub.id, e.target.value)} 
                        disabled={!sub.isSelected}
                        className={`text-xs bg-transparent border rounded px-2 py-1 outline-none ${theme === 'dark' ? 'border-slate-600' : 'border-slate-300'} ${!sub.isSelected && 'opacity-50'}`}
                      >
                        <option value="expense">Expense</option>
                        <option value="sinking_fund">Sinking Fund</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-6 pt-6 border-t flex justify-between ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button variant="outline" onClick={() => setModalStep(1)} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
            <Button onClick={handleSubmit} className="uppercase font-bold text-xs px-8">Add Selected</Button>
          </div>
        </>
      )}
    </ModalWrapper>
  );
}

// --- 2. Create Custom Category ---
export function CreateCustomCategoryModal({ isOpen, onClose, onAdd, theme }) {
  const [name, setName] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onAdd(name); setName(''); };
  if (!isOpen) return null;
  
  return (
    <ModalWrapper onClose={onClose} theme={theme} maxWidth="max-w-md">
      <h3 className="text-xl font-bold mb-6">Create Custom Category</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField 
          label="Category Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          autoFocus 
          placeholder="e.g., Pets"
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Create</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// --- 3. Add Sub Category ---
export function AddSubCategoryModal({ isOpen, onClose, onAdd, theme }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const handleSubmit = (e) => { e.preventDefault(); onAdd(name, type); setName(''); setType('expense'); };
  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} maxWidth="max-w-md">
      <h3 className="text-xl font-bold mb-6">Add Sub-category</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField 
          label="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          autoFocus 
          placeholder="e.g., Dog Food"
        />
        
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="type" 
                value="expense" 
                checked={type === 'expense'} 
                onChange={() => setType('expense')} 
                className="w-4 h-4 accent-zillion-400" 
              />
              <span className="text-sm">Expense</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="type" 
                value="sinking_fund" 
                checked={type === 'sinking_fund'} 
                onChange={() => setType('sinking_fund')} 
                className="w-4 h-4 accent-zillion-400" 
              />
              <span className="text-sm">Sinking Fund</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Add</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// --- 4. Edit Budget Structure (Placeholder for future use if needed) ---
export function EditBudgetStructureModal({ isOpen, onClose, categories, theme }) {
  if (!isOpen) return null;
  return (
    <ModalWrapper onClose={onClose} theme={theme}>
      <h3 className="text-xl font-bold mb-4">Edit Budget Structure</h3>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {categories.map(cat => (
          <div key={cat.id} className={`flex justify-between items-center p-3 rounded border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            <span className="font-medium">{cat.name}</span>
            <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{cat.subcategories.length} subcategories</span>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center py-4 opacity-50">No categories found.</p>}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </ModalWrapper>
  );
}