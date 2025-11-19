import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { SUGGESTED_CATEGORIES } from '../../utils/constants';

// --- 1. Add From Suggestions ---
export function AddFromSuggestionsModal({ isOpen, onClose, onAdd }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        {modalStep === 1 ? (
          <>
            <h3 className="text-lg font-medium text-gray-900">Add from Suggestions (1/2)</h3>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
              {SUGGESTED_CATEGORIES.map((cat) => (
                <label key={cat.id} className={`flex cursor-pointer items-center justify-between rounded-md border p-4 ${selectedCatIds[cat.id] ? 'border-[#3DDC97] bg-emerald-50' : 'border-gray-300'}`}>
                  <div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <p className="text-sm text-gray-500">{cat.subcategories.map((s) => s.name).join(', ')}</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-[#3DDC97]" checked={!!selectedCatIds[cat.id]} onChange={() => handleCatToggle(cat.id)} />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end border-t pt-4">
              <button onClick={goToStep2} disabled={selectedCount === 0} className="inline-flex items-center rounded-md bg-[#3DDC97] px-4 py-2 text-white hover:bg-emerald-600 disabled:bg-gray-300">
                Next ({selectedCount}) <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-900">Customize Sub-categories (2/2)</h3>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
              {Object.keys(groupedSubCategories).map((catName) => (
                <div key={catName} className="rounded-md border border-gray-200">
                  <h4 className="bg-slate-50 px-4 py-2 text-sm font-medium text-gray-800 border-b">{catName}</h4>
                  <ul className="divide-y divide-gray-200 p-2">
                    {groupedSubCategories[catName].map((sub) => (
                      <li key={sub.id} className="flex items-center gap-3 py-2">
                        <input type="checkbox" checked={sub.isSelected} onChange={() => handleSubCategoryToggle(sub.id)} className="h-5 w-5 text-[#3DDC97]" />
                        <input type="text" value={sub.name} onChange={(e) => handleNameChange(sub.id, e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" disabled={!sub.isSelected} />
                        <select value={sub.type} onChange={(e) => handleTypeChange(sub.id, e.target.value)} className="border rounded px-2 py-1 text-sm" disabled={!sub.isSelected}>
                          <option value="expense">Expense</option>
                          <option value="sinking_fund">Sinking Fund</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between border-t pt-4">
              <button onClick={() => setModalStep(1)} className="border rounded px-4 py-2">Back</button>
              <button onClick={handleSubmit} className="bg-[#3DDC97] text-white rounded px-4 py-2">Add Selected</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- 2. Create Custom Category ---
export function CreateCustomCategoryModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); onAdd(name); setName(''); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900">Create Custom Category</h3>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-4 w-full border rounded p-2" autoFocus />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border rounded px-4 py-2">Cancel</button>
          <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2">Create</button>
        </div>
      </form>
    </div>
  );
}

// --- 3. Add Sub Category ---
export function AddSubCategoryModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const handleSubmit = (e) => { e.preventDefault(); onAdd(name, type); setName(''); setType('expense'); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900">Add Sub-category</h3>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-4 w-full border rounded p-2" autoFocus placeholder="Name" />
        <div className="mt-4 space-y-2">
          <label className="flex items-center"><input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="mr-2" /> Expense</label>
          <label className="flex items-center"><input type="radio" name="type" value="sinking_fund" checked={type === 'sinking_fund'} onChange={() => setType('sinking_fund')} className="mr-2" /> Sinking Fund</label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border rounded px-4 py-2">Cancel</button>
          <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2">Add</button>
        </div>
      </form>
    </div>
  );
}

// --- 4. Edit Budget Structure ---
export function EditBudgetStructureModal({ isOpen, onClose, categories, onCategoriesChange }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Budget Structure</h3>
          <button onClick={onClose}><X className="h-6 w-6 text-gray-400" /></button>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center border p-3 rounded bg-gray-50">
              <span className="font-medium">{cat.name}</span>
              <span className="text-sm text-gray-500">{cat.subcategories.length} subcategories</span>
            </div>
          ))}
          {categories.length === 0 && <p className="text-gray-500 text-center py-4">No categories found.</p>}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700">Done</button>
        </div>
      </div>
    </div>
  );
}