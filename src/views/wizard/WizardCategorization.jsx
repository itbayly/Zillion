import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Link2, X, Check, ArrowRight, AlertTriangle, ArrowDownCircle, FileEdit } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AddFromSuggestionsModal, CreateCustomCategoryModal, AddSubCategoryModal } from '../../components/modals/CategoryModals';
import { AssignRemainingModal } from '../../components/modals/BudgetAdjustmentModals';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { AmbientBackground } from '../../components/ui/SharedUI';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

// --- STEP 10: CATEGORIES ---
export function WizardStep4_Categories({ categories, onCategoriesChange, onNext, onBack, isModal = false, theme, toggleTheme }) {
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

  const content = (
    <>
      <div className="text-center mb-6 flex-shrink-0">
        <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
        <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Build Your Budget</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-shrink-0">
        <Button variant="outline" fullWidth onClick={() => setIsSuggestionsOpen(true)} icon={<Plus size={16} />} className="text-zillion-500 border-zillion-400 hover:bg-zillion-50 dark:hover:bg-zillion-900/20">ADD SUGGESTIONS</Button>
        <Button variant="outline" fullWidth onClick={() => setIsCustomCatOpen(true)} icon={<FileEdit size={16} />} className="text-zillion-500 border-zillion-400 hover:bg-zillion-50 dark:hover:bg-zillion-900/20">CREATE CUSTOM</Button>
      </div>

      <div className="flex-grow overflow-y-auto min-h-[300px] pr-2">
        {categories.length === 0 ? (
          <div className={`h-full border-2 border-dashed rounded-xl flex items-center justify-center text-sm ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-400'}`}>
            No categories added
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(cat => (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{cat.name}</h3>
                  <div className="flex gap-2">
                      <button onClick={() => { setCurrentCatId(cat.id); setIsCustomSubOpen(true); }} className="p-1 text-zillion-400 hover:bg-zillion-50 dark:hover:bg-zillion-900 rounded"><Plus size={16} /></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
                    {cat.subcategories.length === 0 && <div className="p-4 text-xs text-center text-slate-400">No sub-categories</div>}
                    {cat.subcategories.map((sub, idx) => (
                      <div key={sub.id} className={`p-3 flex justify-between items-center ${idx !== cat.subcategories.length - 1 ? `border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}` : ''}`}>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{sub.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${sub.type === 'expense' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>{sub.type === 'expense' ? 'Expense' : 'Sinking Fund'}</span>
                        </div>
                        <button onClick={() => handleDeleteSubCategory(cat.id, sub.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isModal && (
        <div className={`mt-6 pt-6 border-t flex justify-between flex-shrink-0 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button variant="outline" onClick={onBack} className="px-8 uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">BACK</Button>
            <Button variant="primary" onClick={onNext} disabled={categories.length === 0} className="px-8 uppercase font-bold text-xs">NEXT</Button>
        </div>
      )}
    </>
  );

  if (isModal) return <div className="h-full flex flex-col">{content}</div>;

  return (
    <>
      <AddFromSuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} onAdd={handleAddFromSuggestions} theme={theme} />
      <CreateCustomCategoryModal isOpen={isCustomCatOpen} onClose={() => setIsCustomCatOpen(false)} onAdd={handleAddCustomCategory} theme={theme} />
      {isCustomSubOpen && <AddSubCategoryModal isOpen={isCustomSubOpen} onClose={() => setIsCustomSubOpen(false)} onAdd={handleAddCustomSubCategory} theme={theme} />}

      <div className={`
        min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
        ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
      `}>
        <AmbientBackground theme={theme} />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="wizard-card max-w-2xl flex flex-col h-[80vh]">
          {content}
        </div>
      </div>
    </>
  );
}

// --- STEP 11: LINK DEBTS ---
export function WizardStep_LinkDebts({ categories, debts, onCategoriesChange, onBack, onNext, theme, toggleTheme }) {
  const [linkModes, setLinkModes] = useState({});
  const debtsToLink = React.useMemo(() => debts.filter((debt) => debt.autoInclude), [debts]);

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
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="wizard-card max-w-2xl flex flex-col h-[80vh]">
        <div className="text-center mb-8 flex-shrink-0">
          <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Link Debts to Budget</h1>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {debtsToLink.length === 0 ? (
            <div className={`rounded-lg border-2 border-dashed p-8 text-center ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
              <p>No debts marked for auto-include.</p>
            </div>
          ) : (
            debtsToLink.map((debt) => {
              const linkedSubCategory = categories.flatMap((c) => c.subcategories).find((sub) => sub.linkedDebtId === debt.id);
              const linkedCategory = linkedSubCategory ? categories.find((c) => c.subcategories.some((sub) => sub.id === linkedSubCategory.id)) : null;
              const mode = linkModes[debt.id] || 'existing';
              
              return (
                <div key={debt.id} className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
                  <div className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className={`font-bold text-base ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{debt.name}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-sm text-slate-500">{formatCurrency(debt.monthlyPayment)} / mo</span>
                    </div>
                    {linkedSubCategory ? (
                      <div className="flex items-center text-sm font-medium text-zillion-500">
                        <Link2 className="w-4 h-4 mr-1" /> Linked to: {linkedCategory?.name} / {linkedSubCategory.name}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic">Not linked yet</div>
                    )}
                  </div>
                  <div className="p-4">
                    {linkedSubCategory ? (
                      <div className="flex justify-end">
                        <button onClick={() => handleUnlinkDebt(debt.id)} className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
                          <X className="mr-1.5 h-4 w-4" /> Unlink
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-center sm:justify-start">
                          <span className="isolate inline-flex rounded-md shadow-sm">
                            <button type="button" onClick={() => toggleMode(debt.id, 'existing')} className={`relative inline-flex items-center rounded-l-md border px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'existing' ? 'border-zillion-400 bg-zillion-50 text-zillion-600 z-10 dark:bg-zillion-900/20 dark:text-zillion-400' : 'border-slate-300 bg-transparent text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800'}`}>Select Existing</button>
                            <button type="button" onClick={() => toggleMode(debt.id, 'create')} className={`relative -ml-px inline-flex items-center rounded-r-md border px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'create' ? 'border-zillion-400 bg-zillion-50 text-zillion-600 z-10 dark:bg-zillion-900/20 dark:text-zillion-400' : 'border-slate-300 bg-transparent text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800'}`}>Create New</button>
                          </span>
                        </div>
                        <div>
                          {mode === 'create' ? (
                            <select className={`block w-full rounded-md border shadow-sm p-2 text-sm bg-transparent outline-none ${theme === 'dark' ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-800'}`} onChange={(e) => handleCreateAndLink(debt.id, e.target.value)}>
                              <option value="">Select Main Category...</option>
                              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                          ) : (
                            <select className={`block w-full rounded-md border shadow-sm p-2 text-sm bg-transparent outline-none ${theme === 'dark' ? 'border-slate-600 text-slate-200' : 'border-slate-300 text-slate-800'}`} onChange={(e) => handleLinkExisting(debt.id, e.target.value)}>
                              <option value="">Select existing sub-category...</option>
                              {categories.map((cat) => (
                                <optgroup label={cat.name} key={cat.id} className={theme === 'dark' ? 'bg-slate-800 text-slate-200' : ''}>
                                  {cat.subcategories.map((sub) => <option key={sub.id} value={sub.id} disabled={!!sub.linkedDebtId}>{sub.name} {sub.linkedDebtId ? '(Linked)' : ''}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`mt-6 pt-6 border-t flex justify-between flex-shrink-0 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button variant="outline" onClick={onBack} className="px-8 uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">BACK</Button>
          <Button variant="primary" onClick={onNext} className="px-8 uppercase font-bold text-xs">NEXT</Button>
        </div>
      </div>
    </div>
  );
}

// --- STEP 12: ASSIGN BUDGET ---
export function WizardStep5_AssignBudgets({ categories, remainingToBudget, onCategoriesChange, debts, onBack, bankAccounts, onUpdateBankAccounts, onFinishSetup, onUpdateDebts, sinkingFundBalances, onUpdateSinkingFundBalances, savingsAccountId, theme, toggleTheme }) {
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
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <AssignRemainingModal isOpen={isAssignRemainingOpen} onClose={() => setIsAssignRemainingOpen(false)} remainingAmount={remainingRounded} bankAccounts={bankAccounts} onAssign={handleAssignRemaining} debts={debts} categories={categories} />

      <div className="wizard-card max-w-2xl flex flex-col h-[80vh]">
        <div className="text-center mb-4 flex-shrink-0">
          <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-1 transition-colors duration-300">ZILLION</h2>
          <h1 className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Assign Your Budget</h1>
        </div>

        {/* Sticky Header */}
        <div className={`sticky top-0 z-10 p-3 rounded-lg mb-4 flex justify-between items-center shadow-md border ${remainingRounded >= 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
           <span className="text-sm font-bold">Remaining to Budget:</span>
           <span className="text-lg font-mono font-bold">{formatCurrency(remainingToBudget)}</span>
           {remainingRounded > 0 && <span className="text-[10px] opacity-70 hidden sm:inline">You have money left to assign!</span>}
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
           {categories.map(cat => (
             <div key={cat.id} className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-slate-700 bg-slate-900/20' : 'border-slate-200 bg-white'}`}>
                <div className={`px-4 py-2 font-bold text-sm ${theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>{cat.name}</div>
                <div>
                   {cat.subcategories.map((sub, idx) => {
                     const isLinked = !!sub.linkedDebtId;
                     const budgetValue = isLinked ? (debts.find((d) => d.id === sub.linkedDebtId)?.monthlyPayment || 0) + (debts.find((d) => d.id === sub.linkedDebtId)?.extraMonthlyPayment || 0) : sub.budgeted;
                     
                     return (
                       <div key={sub.id} className={`p-3 flex justify-between items-center ${idx !== cat.subcategories.length - 1 ? `border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}` : ''}`}>
                           <div>
                              <div className="flex items-center gap-2">
                                {isLinked && <Link2 size={10} className="text-zillion-500" />}
                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{sub.name}</span>
                              </div>
                              <span className={`text-[9px] uppercase px-1 rounded ${sub.type === 'expense' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{sub.type === 'expense' ? 'Expense' : 'Sinking Fund'} {isLinked && '• Linked to Debt'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">$</span>
                              <input 
                                type="number" 
                                className={`w-24 text-right p-1 rounded border bg-transparent outline-none focus:border-zillion-400 ${theme === 'dark' ? 'border-slate-600 text-white' : 'border-slate-300 text-slate-800'}`} 
                                placeholder="0.00"
                                value={budgetValue}
                                onChange={(e) => !isLinked && handleBudgetChange(cat.id, sub.id, parseFloat(e.target.value) || 0)}
                                disabled={isLinked}
                              />
                           </div>
                       </div>
                     );
                   })}
                </div>
             </div>
           ))}
        </div>

        <div className={`mt-4 pt-4 border-t flex justify-between flex-shrink-0 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
             <Button variant="outline" onClick={onBack} className="px-6 uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">BACK</Button>
             <Button variant="primary" onClick={handleFinishClick} disabled={remainingRounded < 0} className="uppercase font-bold text-xs bg-zillion-400 text-white hover:bg-zillion-500 px-6 flex items-center gap-2">
                {remainingRounded > 0 ? <>ASSIGN REMAINING <ArrowRight size={14}/></> : <>FINISH SETUP <Check size={14}/></>}
             </Button>
         </div>
      </div>
    </div>
  );
}

// --- STEP 13: COMPLETE ---
export function WizardStep7_Complete({ onGoToDashboard, onStartOver, theme, toggleTheme }) {
  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="wizard-card text-center">
        <div className="mx-auto h-20 w-20 bg-zillion-100 dark:bg-zillion-900/30 rounded-full flex items-center justify-center mb-6">
           <Check className="h-10 w-10 text-zillion-500" />
        </div>
        <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Budget Setup Complete!</h2>
        <p className={`mb-8 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>You've successfully set up your budget. You can now move on to tracking your expenses.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onStartOver} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Start Over</Button>
          <Button variant="primary" onClick={onGoToDashboard} className="uppercase font-bold text-xs flex items-center gap-2">Go to Dashboard <ArrowRight size={14} /></Button>
        </div>
      </div>
    </div>
  );
}