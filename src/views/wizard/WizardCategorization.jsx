import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Link2, X, Check, ArrowRight, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AddFromSuggestionsModal, CreateCustomCategoryModal, AddSubCategoryModal } from '../../components/modals/CategoryModals';
import { AssignRemainingModal } from '../../components/modals/BudgetAdjustmentModals';
import { BudgetInput } from '../../components/ui/FormInputs';

// Step 10
export function WizardStep4_Categories({ categories, onCategoriesChange, onNext, onBack, isModal = false }) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isCustomCatOpen, setIsCustomCatOpen] = useState(false);
  const [isCustomSubOpen, setIsCustomSubOpen] = useState(false);
  const [currentCatId, setCurrentCatId] = useState(null);

  const handleAddCustomCategory = (name) => {
    if (name.trim() === '') return;
    onCategoriesChange([...categories, { id: crypto.randomUUID(), name: name.trim(), subcategories: [] }]);
    setIsCustomCatOpen(false);
  };

  const handleDeleteCategory = (catId) => onCategoriesChange(categories.filter(cat => cat.id !== catId));

  const handleAddCustomSubCategory = (name, type) => {
    if (name.trim() === '' || !currentCatId) return;
    const newCategories = categories.map(cat => {
      if (cat.id === currentCatId) return { ...cat, subcategories: [...cat.subcategories, { id: crypto.randomUUID(), name: name.trim(), type: type, budgeted: 0, linkedDebtId: null }] };
      return cat;
    });
    onCategoriesChange(newCategories); setIsCustomSubOpen(false); setCurrentCatId(null);
  };

  const handleDeleteSubCategory = (catId, subId) => {
    const newCategories = categories.map(cat => {
      if (cat.id === catId) return { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== subId) };
      return cat;
    });
    onCategoriesChange(newCategories);
  };

  const handleAddFromSuggestions = (selectedItems) => {
    const newStructure = [...categories];
    selectedItems.forEach((selectedSub) => {
      let targetCat = newStructure.find(cat => cat.name.toLowerCase() === selectedSub.originalCatName.toLowerCase());
      if (!targetCat) { targetCat = { id: crypto.randomUUID(), name: selectedSub.originalCatName, subcategories: [] }; newStructure.push(targetCat); }
      const subExists = targetCat.subcategories.some(sub => sub.name.toLowerCase() === selectedSub.name.toLowerCase());
      if (!subExists) targetCat.subcategories.push({ id: crypto.randomUUID(), name: selectedSub.name, type: selectedSub.type, budgeted: 0, linkedDebtId: null });
    });
    onCategoriesChange(newStructure); setIsSuggestionsOpen(false);
  };

  const containerClasses = isModal ? 'p-1' : 'rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-3xl mx-auto';

  return (
    <>
      <AddFromSuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} onAdd={handleAddFromSuggestions} />
      <CreateCustomCategoryModal isOpen={isCustomCatOpen} onClose={() => setIsCustomCatOpen(false)} onAdd={handleAddCustomCategory} />
      {isCustomSubOpen && <AddSubCategoryModal isOpen={isCustomSubOpen} onClose={() => setIsCustomSubOpen(false)} onAdd={handleAddCustomSubCategory} />}

      <div className={containerClasses}>
        {!isModal ? (
          <div className="mx-auto max-w-lg text-center mb-8">
            <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
            <h3 className="mt-4 text-3xl font-semibold text-gray-800">Build Your Budget</h3>
          </div>
        ) : (
          <div className="mb-4"><p className="text-sm text-gray-500">Add or remove categories to adjust your budget structure.</p></div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => setIsSuggestionsOpen(true)} className="inline-flex w-full justify-center items-center rounded-md border border-[#3DDC97] bg-white px-6 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50 sm:w-auto"><Plus className="-ml-1 mr-2 h-5 w-5" /> ADD SUGGESTIONS</button>
          <button type="button" onClick={() => setIsCustomCatOpen(true)} className="inline-flex w-full justify-center items-center rounded-md border border-[#3DDC97] bg-white px-6 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50 sm:w-auto"><Edit className="-ml-1 mr-2 h-5 w-5" /> CREATE CUSTOM</button>
        </div>

        <div className={`space-y-6 ${isModal ? 'max-h-[50vh] overflow-y-auto pr-2' : ''}`}>
          {categories.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center"><h3 className="mt-2 text-sm font-medium text-gray-900">No categories added</h3></div>}
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-gray-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => { setCurrentCatId(category.id); setIsCustomSubOpen(true); }} className="rounded-full bg-emerald-50 p-1 text-emerald-600 hover:bg-emerald-100"><Plus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleDeleteCategory(category.id)} className="rounded-full bg-red-50 p-1 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {category.subcategories.length === 0 ? <p className="text-sm text-gray-500">No sub-categories yet.</p> : (
                  <ul className="space-y-3">
                    {category.subcategories.map((sub) => (
                      <li key={sub.id} className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-800">{sub.name}</span>
                          <span className={`ml-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sub.type === 'expense' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{sub.type === 'expense' ? 'Expense' : 'Sinking Fund'}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteSubCategory(category.id, sub.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isModal && (
          <div className="flex justify-between pt-8 mt-8 border-t max-w-lg mx-auto">
            <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
            <button type="button" onClick={onNext} disabled={categories.length === 0} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300">NEXT</button>
          </div>
        )}
      </div>
    </>
  );
}

// Step 11
export function WizardStep_LinkDebts({ categories, debts, onCategoriesChange, onBack, onNext }) {
  const [linkModes, setLinkModes] = useState({});
  const debtsToLink = useMemo(() => debts.filter((debt) => debt.autoInclude), [debts]);

  const toggleMode = (debtId, mode) => setLinkModes((prev) => ({ ...prev, [debtId]: mode }));

  const handleCreateAndLink = (debtId, categoryId) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt || !categoryId) return;
    const newSubCategory = { id: crypto.randomUUID(), name: debt.name, type: 'expense', budgeted: debt.monthlyPayment, linkedDebtId: debt.id };
    const newCategories = categories.map((cat) => cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, newSubCategory] } : cat);
    onCategoriesChange(newCategories);
  };

  const handleLinkExisting = (debtId, subCategoryId) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt || !subCategoryId) return;
    const newCategories = categories.map((cat) => ({ ...cat, subcategories: cat.subcategories.map((sub) => {
        if (sub.id === subCategoryId) return { ...sub, linkedDebtId: debtId, budgeted: debt.monthlyPayment };
        if (sub.linkedDebtId === debtId) return { ...sub, linkedDebtId: null };
        return sub;
    }) }));
    onCategoriesChange(newCategories);
  };

  const handleUnlinkDebt = (debtId) => {
    const newCategories = categories.map((cat) => ({ ...cat, subcategories: cat.subcategories.map((sub) => sub.linkedDebtId === debtId ? { ...sub, linkedDebtId: null } : sub) }));
    onCategoriesChange(newCategories);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-3xl mx-auto">
      <div className="mx-auto max-w-lg text-center mb-8">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Link Debts to Budget</h3>
      </div>
      <div className="space-y-6">
        {debtsToLink.length === 0 ? <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center"><p className="text-gray-500">No debts marked for auto-include.</p></div> : debtsToLink.map((debt) => {
            const linkedSubCategory = categories.flatMap((c) => c.subcategories).find((sub) => sub.linkedDebtId === debt.id);
            const linkedCategory = linkedSubCategory ? categories.find((c) => c.subcategories.some((sub) => sub.id === linkedSubCategory.id)) : null;
            const mode = linkModes[debt.id] || 'existing';
            return (
              <div key={debt.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50 px-4 py-3 border-b border-gray-200">
                  <div><span className="font-bold text-gray-900">{debt.name}</span><span className="mx-2 text-gray-400">|</span><span className="text-sm text-gray-600">{formatCurrency(debt.monthlyPayment)} / mo</span></div>
                  {linkedSubCategory ? <div className="flex items-center text-sm font-medium text-[#3DDC97]"><Link2 className="w-4 h-4 mr-1" /> Linked to: {linkedCategory?.name} / {linkedSubCategory.name}</div> : <div className="text-sm text-gray-400 italic">Not linked yet</div>}
                </div>
                <div className="p-4">
                  {linkedSubCategory ? (
                    <div className="flex justify-end"><button type="button" onClick={() => handleUnlinkDebt(debt.id)} className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"><X className="mr-1.5 h-4 w-4" /> Unlink</button></div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-center sm:justify-start">
                        <span className="isolate inline-flex rounded-md shadow-sm">
                          <button type="button" onClick={() => toggleMode(debt.id, 'existing')} className={`relative inline-flex items-center rounded-l-md border px-3 py-1.5 text-xs font-medium ${mode === 'existing' ? 'border-[#3DDC97] bg-emerald-50 text-[#3DDC97] z-10' : 'border-gray-300 bg-white text-gray-700'}`}>Select Existing</button>
                          <button type="button" onClick={() => toggleMode(debt.id, 'create')} className={`relative -ml-px inline-flex items-center rounded-r-md border px-3 py-1.5 text-xs font-medium ${mode === 'create' ? 'border-[#3DDC97] bg-emerald-50 text-[#3DDC97] z-10' : 'border-gray-300 bg-white text-gray-700'}`}>Create New</button>
                        </span>
                      </div>
                      <div>
                        {mode === 'create' ? (
                          <select className="block w-full rounded-md border-gray-300 shadow-sm" onChange={(e) => handleCreateAndLink(debt.id, e.target.value)}>
                            <option value="">Select Main Category...</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        ) : (
                          <select className="block w-full rounded-md border-gray-300 shadow-sm" onChange={(e) => handleLinkExisting(debt.id, e.target.value)}>
                            <option value="">Select existing sub-category...</option>
                            {categories.map((cat) => <optgroup label={cat.name} key={cat.id}>{cat.subcategories.map((sub) => <option key={sub.id} value={sub.id} disabled={!!sub.linkedDebtId}>{sub.name} {sub.linkedDebtId ? '(Linked)' : ''}</option>)}</optgroup>)}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
        })}
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-lg mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={onNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT</button>
      </div>
    </div>
  );
}

// Step 12
export function WizardStep5_AssignBudgets({ categories, remainingToBudget, onCategoriesChange, debts, onBack, bankAccounts, onUpdateBankAccounts, onFinishSetup, onUpdateDebts, sinkingFundBalances, onUpdateSinkingFundBalances, savingsAccountId }) {
  const [isAssignRemainingOpen, setIsAssignRemainingOpen] = useState(false);
  const remainingRounded = Math.round(remainingToBudget * 100) / 100;

  const handleBudgetChange = (catId, subId, value) => {
    const newCategories = categories.map((cat) => {
      if (cat.id === catId) return { ...cat, subcategories: cat.subcategories.map((sub) => sub.id === subId ? { ...sub, budgeted: value } : sub) };
      return cat;
    });
    onCategoriesChange(newCategories);
  };

  const handleFinishClick = () => {
    if (remainingRounded > 0) setIsAssignRemainingOpen(true);
    else if (remainingRounded === 0) onFinishSetup();
  };

  const handleAssignRemaining = (accountAssignments, debtAssignments, sinkingFundAssignments) => {
    const newDebts = debts.map((debt) => {
      const assignedAmount = parseFloat(debtAssignments[debt.id]) || 0;
      return assignedAmount > 0 ? { ...debt, amountOwed: (parseFloat(debt.amountOwed) || 0) - assignedAmount } : debt;
    });
    onUpdateDebts(newDebts);

    let totalAssignedToSinkingFunds = 0;
    const newSinkingFundBalances = { ...sinkingFundBalances };
    for (const subCatId in sinkingFundAssignments) {
      const assignedAmount = parseFloat(sinkingFundAssignments[subCatId]) || 0;
      if (assignedAmount > 0) {
        totalAssignedToSinkingFunds += assignedAmount;
        newSinkingFundBalances[subCatId] = (parseFloat(newSinkingFundBalances[subCatId]) || 0) + assignedAmount;
      }
    }
    onUpdateSinkingFundBalances(newSinkingFundBalances);

    const newAccounts = bankAccounts.map((acc) => {
      let newBalance = parseFloat(acc.balance) || 0;
      newBalance += parseFloat(accountAssignments[acc.id]) || 0;
      if (acc.id === savingsAccountId) newBalance += totalAssignedToSinkingFunds;
      return { ...acc, balance: newBalance };
    });
    onUpdateBankAccounts(newAccounts);

    setIsAssignRemainingOpen(false);
    onFinishSetup();
  };

  return (
    <>
      <AssignRemainingModal isOpen={isAssignRemainingOpen} onClose={() => setIsAssignRemainingOpen(false)} remainingAmount={remainingRounded} bankAccounts={bankAccounts} onAssign={handleAssignRemaining} debts={debts} categories={categories} />

      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-4xl mx-auto">
        <div className="mx-auto max-w-lg text-center mb-6">
          <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
          <h3 className="mt-4 text-3xl font-semibold text-gray-800">Assign Your Budget</h3>
        </div>

        <div className="sticky top-0 z-20 -mx-6 -mt-2 border-b border-gray-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur-sm sm:-mx-8 sm:px-8">
          <div className={`rounded-lg border p-4 transition-colors duration-300 ${remainingRounded < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-[#3DDC97]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <span className={`text-lg font-bold ${remainingRounded < 0 ? 'text-red-800' : 'text-emerald-800'}`}>Remaining to Budget:</span>
                <span className={`text-3xl font-bold ${remainingRounded < 0 ? 'text-red-600' : 'text-[#3DDC97]'}`}>{formatCurrency(remainingToBudget)}</span>
              </div>
              <div className="text-sm font-medium text-right">
                {remainingRounded > 0 && <span className="text-emerald-700 flex items-center justify-end"><ArrowDownCircle className="w-4 h-4 mr-1" /> You have money left to assign!</span>}
                {remainingRounded < 0 && <span className="text-red-700 flex items-center justify-end"><AlertTriangle className="w-4 h-4 mr-1" /> You've budgeted too much.</span>}
                {remainingRounded === 0 && <span className="text-[#3DDC97] flex items-center justify-end"><Check className="w-5 h-5 mr-1" /> Perfect! Every dollar has a job.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-gray-200 overflow-hidden">
              <h3 className="bg-slate-50 px-4 py-3 text-lg font-semibold text-gray-900 border-b border-gray-200">{category.name}</h3>
              <ul className="divide-y divide-gray-200 p-0 bg-white">
                {category.subcategories.map((sub) => {
                  const isLinked = !!sub.linkedDebtId;
                  const budgetValue = isLinked ? debts.find((d) => d.id === sub.linkedDebtId)?.monthlyPayment || 0 : sub.budgeted;
                  return (
                    <li key={sub.id} className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center">{isLinked && <Link2 className="mr-2 h-4 w-4 text-[#3DDC97]" />}<span className="text-base font-medium text-gray-800">{sub.name}</span></div>
                        <div className="mt-1"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sub.type === 'expense' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{sub.type === 'expense' ? 'Expense' : 'Sinking Fund'}</span>{isLinked && <span className="ml-2 text-xs text-gray-400 italic">Linked to Debt</span>}</div>
                      </div>
                      <div className="w-full sm:w-auto sm:max-w-xs">
                        <BudgetInput value={isLinked ? (debts.find((d) => d.id === sub.linkedDebtId)?.monthlyPayment || 0) + (debts.find((d) => d.id === sub.linkedDebtId)?.extraMonthlyPayment || 0) : budgetValue} onChange={(newValue) => handleBudgetChange(category.id, sub.id, newValue)} disabled={isLinked} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-8 mt-8 border-t">
          <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
          <button type="button" onClick={handleFinishClick} disabled={remainingRounded < 0} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
            {remainingRounded > 0 ? <>ASSIGN REMAINING <ArrowRight className="ml-2 h-5 w-5" /></> : <>FINISH SETUP <Check className="ml-2 h-5 w-5" /></>}
          </button>
        </div>
      </div>
    </>
  );
}

// Step 13
export function WizardStep7_Complete({ onGoToDashboard, onStartOver }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 text-center">
      <Check className="mx-auto h-16 w-16 text-green-500 bg-green-100 rounded-full p-2" />
      <h2 className="mt-6 mb-4 text-2xl font-semibold text-gray-800">Budget Setup Complete!</h2>
      <p className="mb-8 text-gray-600">You've successfully set up your budget. You can now move on to tracking your expenses.</p>
      <div className="flex justify-center gap-4">
        <button type="button" onClick={onStartOver} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Start Over (Reset)</button>
        <button type="button" onClick={onGoToDashboard} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" /></button>
      </div>
    </div>
  );
}