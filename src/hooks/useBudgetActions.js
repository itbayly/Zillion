import { useCallback } from 'react';
import { doc, setDoc, deleteDoc, writeBatch, collection, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { nanoid } from 'nanoid';
import { getTodayDate, getNewMonthEntry, calculatePaydayStats } from '../utils/helpers';

export function useBudgetActions({ 
  userId, 
  effectiveBudgetId, 
  budgetData, 
  currentMonthData, 
  currentMonthTransactions,
  viewDate, 
  updateBudget,
  userDoc 
}) {
  const appId = 'zillion-budget-app';

  // --- Simple Setters ---
  const handleStepChange = (step) => updateBudget({ currentStep: step });
  const handleBankAccountsChange = (newAccounts) => updateBudget({ bankAccounts: newAccounts });
  const handleSetDefaultAccount = (accountId) => updateBudget({ defaultAccountId: accountId });
  const handleSavingsAccountChange = (accountId) => updateBudget({ savingsAccountId: accountId || null });
  const handleMainSavingsAccountChange = (accountId) => updateBudget({ mainSavingsAccountId: accountId || null });
  const handleDebtsChange = (newDebts) => updateBudget({ debts: newDebts });
  const handleUpdateExcludedMerchants = (list) => updateBudget({ excludedMerchants: list });

  // --- Helper to get Write Key ---
  const getWriteKey = () => {
    const isSetup = budgetData.currentStep > 13;
    return isSetup ? viewDate : Object.keys(budgetData.monthlyData)[0];
  };

  // --- Income & Categories ---
  const handleIncomeChange = (source, value) => {
    const monthKey = getWriteKey();
    const newMonthlyData = JSON.parse(JSON.stringify(budgetData.monthlyData));
    const currentMonth = newMonthlyData[monthKey] || getNewMonthEntry();
    if (!currentMonth.income) currentMonth.income = { source1: 0, source2: 0 };
    currentMonth.income[source] = parseFloat(value) || 0;
    newMonthlyData[monthKey] = currentMonth;
    updateBudget({ monthlyData: newMonthlyData });
  };

  const handleSaveDeductions = (deductionsList) => {
    const monthKey = getWriteKey();
    const newMonthlyData = { ...budgetData.monthlyData };
    const currentMonth = newMonthlyData[monthKey] || getNewMonthEntry();
    let newCategories = [...currentMonth.categories];

    let dedCatIndex = newCategories.findIndex(c => c.name === "Paycheck Deductions");
    if (dedCatIndex === -1) {
      const newCat = { id: crypto.randomUUID(), name: "Paycheck Deductions", subcategories: [] };
      newCategories.push(newCat);
      dedCatIndex = newCategories.length - 1;
    }

    const dedCat = newCategories[dedCatIndex];
    dedCat.subcategories = deductionsList.map(d => ({
      id: crypto.randomUUID(),
      name: d.name,
      type: 'deduction',
      budgeted: d.amount,
      linkedDebtId: null
    }));

    newMonthlyData[monthKey] = { ...currentMonth, categories: newCategories };
    updateBudget({ monthlyData: newMonthlyData });
  };

  const handleSaveIncomeSettings = (settings) => {
    updateBudget({ incomeSettings: settings });
  };

  const handleSavingsChange = (value) => {
    const monthKey = getWriteKey();
    const newMonthlyData = JSON.parse(JSON.stringify(budgetData.monthlyData));
    const currentMonth = newMonthlyData[monthKey] || getNewMonthEntry();
    currentMonth.savingsGoal = parseFloat(value) || 0;
    newMonthlyData[monthKey] = currentMonth;
    updateBudget({ monthlyData: newMonthlyData });
  };

  const handleCategoriesChange = (newCategories) => {
    const monthKey = getWriteKey();
    const newMonthlyData = { ...budgetData.monthlyData };
    const currentMonth = newMonthlyData[monthKey] || getNewMonthEntry();
    newMonthlyData[monthKey] = { ...currentMonth, categories: newCategories };
    updateBudget({ monthlyData: newMonthlyData });
  };

  const handleSinkingFundBalancesChange = (newBalances) => {
    const monthKey = getWriteKey();
    const newMonthlyData = { ...budgetData.monthlyData };
    const currentMonth = newMonthlyData[monthKey] || getNewMonthEntry();
    newMonthlyData[monthKey] = { ...currentMonth, sinkingFundBalances: newBalances };
    updateBudget({ monthlyData: newMonthlyData });
  };

  // --- Recurring Transactions ---
  const handleAddRecurring = (item) => {
    const newList = [...(budgetData.recurringTransactions || []), { ...item, id: nanoid() }];
    updateBudget({ recurringTransactions: newList });
  };

  const handleUpdateRecurring = (updatedItem) => {
    const newList = (budgetData.recurringTransactions || []).map(i => i.id === updatedItem.id ? updatedItem : i);
    updateBudget({ recurringTransactions: newList });
  };

  const handleDeleteRecurring = (id) => {
    const newList = (budgetData.recurringTransactions || []).filter(i => i.id !== id);
    updateBudget({ recurringTransactions: newList });
  };

  // Updates a single field (e.g. pendingAmount) for automation
  const handleUpdateRecurringField = (id, field, value) => {
    const newList = (budgetData.recurringTransactions || []).map(i => 
      i.id === id ? { ...i, [field]: value } : i
    );
    updateBudget({ recurringTransactions: newList });
  };

  // --- Transaction Handlers ---
  const handleSaveTransaction = async (newTransaction) => {
    try {
      let newDebts = [...(budgetData.debts || [])];
      let newBankAccounts = [...budgetData.bankAccounts];
      
      const txCollectionRef = collection(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`);
      const batch = writeBatch(db);

      const processPayment = (txAmount, subCategoryId, txDate) => {
        const debt = newDebts.find((d) => {
          for (const cat of currentMonthData.categories) {
            const sub = cat.subcategories.find((s) => s.id === subCategoryId && s.linkedDebtId === d.id);
            if (sub) return true;
          }
          return false;
        });

        if (debt && txAmount > 0) {
          let interestPortion = 0;
          let principalPortion = 0;
          if (debt.compoundingFrequency === 'Monthly') {
            const r = (debt.interestRate || 0) / 100 / 12;
            const interestDue = (debt.amountOwed || 0) * r;
            interestPortion = Math.min(txAmount, interestDue);
            principalPortion = txAmount - interestPortion;
          } else {
            interestPortion = 0;
            principalPortion = txAmount;
          }
          debt.amountOwed = debt.amountOwed - principalPortion;
          return { principalPaid: principalPortion, interestPaid: interestPortion };
        }
        return { principalPaid: 0, interestPaid: 0 };
      };

      if (newTransaction.isSplit && newTransaction.splits) {
        // 1. Calculate Deductions per Account
        const deductionsByAccount = {};
        newTransaction.splits.forEach(split => {
          const amt = parseFloat(split.amount) || 0;
          deductionsByAccount[split.accountId] = (deductionsByAccount[split.accountId] || 0) + amt;
        });

        // 2. Update Local Bank Accounts
        newBankAccounts = newBankAccounts.map(acc => {
          const deduction = deductionsByAccount[acc.id];
          return deduction ? { ...acc, balance: (parseFloat(acc.balance) || 0) - deduction } : acc;
        });

        // 3. Process Debt Payments within Splits
        const processedSplits = newTransaction.splits.map(split => {
           if (split.amount > 0 && split.subCategoryId) {
              const { principalPaid, interestPaid } = processPayment(split.amount, split.subCategoryId, newTransaction.date);
              return { ...split, principalPaid, interestPaid };
           }
           return split;
        });

        // 4. Save as ONE Document
        // Ensure the main document has the total amount and primary account ID (usually the first split's account or default)
        const mainTxId = newTransaction.id || nanoid();
        const mainTx = {
           ...newTransaction,
           id: mainTxId,
           splits: processedSplits, // Save the processed splits array inside
           isSplit: true,
           isIncome: false
        };
        
        const txDocRef = doc(txCollectionRef, mainTxId);
        batch.set(txDocRef, mainTx);

      } else {
        let singleTx = { ...newTransaction, id: newTransaction.id || nanoid() };
        if (!singleTx.isIncome) {
          const amt = parseFloat(singleTx.amount) || 0;
          const { principalPaid, interestPaid } = processPayment(amt, singleTx.subCategoryId, singleTx.date);
          singleTx.principalPaid = principalPaid;
          singleTx.interestPaid = interestPaid;
        }
        const txDocRef = doc(txCollectionRef, singleTx.id);
        batch.set(txDocRef, singleTx);
        
        const txAmount = parseFloat(singleTx.amount) || 0;
        newBankAccounts = newBankAccounts.map(acc => acc.id === newTransaction.accountId ? { ...acc, balance: (parseFloat(acc.balance) || 0) - txAmount } : acc);
      }

      await batch.commit();
      updateBudget({ bankAccounts: newBankAccounts, debts: newDebts });
      return true; // Success
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Please check the console for details.");
      return false; 
    }
  };

  const handleUpdateTransaction = async (updatedTx) => {
    const originalTx = currentMonthTransactions.find(t => t.id === updatedTx.id);
    if (!originalTx) return;

    let newBankAccounts = [...budgetData.bankAccounts];
    
    // Reverse Original
    if (!originalTx.isSplit) {
        const amount = parseFloat(originalTx.amount) || 0;
        newBankAccounts = newBankAccounts.map(acc => {
            if (acc.id === originalTx.accountId) {
                return { ...acc, balance: acc.balance + (originalTx.isIncome ? -amount : amount) };
            }
            return acc;
        });
    }

    // Apply New
    if (!updatedTx.isSplit) {
        const amount = parseFloat(updatedTx.amount) || 0;
        newBankAccounts = newBankAccounts.map(acc => {
            if (acc.id === updatedTx.accountId) {
                return { ...acc, balance: acc.balance + (updatedTx.isIncome ? amount : -amount) };
            }
            return acc;
        });
    }

    const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, updatedTx.id);
    await setDoc(txRef, updatedTx);
    updateBudget({ bankAccounts: newBankAccounts });
  };

  const handleDeleteTransaction = async (txToDelete) => {
    let newBankAccounts = [...budgetData.bankAccounts];
    if (!txToDelete.isSplit) {
        const amount = parseFloat(txToDelete.amount) || 0;
        newBankAccounts = newBankAccounts.map(acc => {
            if (acc.id === txToDelete.accountId) {
                return { ...acc, balance: acc.balance + (txToDelete.isIncome ? -amount : amount) };
            }
            return acc;
        });
    }

    const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, txToDelete.id);
    await deleteDoc(txRef);
    updateBudget({ bankAccounts: newBankAccounts });
  };

  const handleBulkDeleteTransactions = (ids) => {
    // Note: The original implementation in App.jsx only handled legacy array transactions for bulk delete.
    // For sub-collections, we need to iterate and delete. 
    // This implementation adapts the logic to update balances first, then delete docs.
    
    const newMonthlyData = { ...budgetData.monthlyData };
    const month = newMonthlyData[viewDate]; // Still needed for legacy safety, but we mainly work with sub-collection now.
    
    let newBankAccounts = [...budgetData.bankAccounts];
    
    // We use currentMonthTransactions because we need to find the transaction to reverse balance
    const txsToDelete = currentMonthTransactions.filter(t => ids.includes(t.id));

    txsToDelete.forEach(tx => {
       if (!tx.isSplit) {
           const amount = parseFloat(tx.amount) || 0;
           newBankAccounts = newBankAccounts.map(acc => {
               if (acc.id === tx.accountId) {
                   return { ...acc, balance: acc.balance + (tx.isIncome ? -amount : amount) };
               }
               return acc;
           });
       }
    });

    // Delete from Firestore
    const batch = writeBatch(db);
    ids.forEach(id => {
       const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, id);
       batch.delete(txRef);
    });
    
    batch.commit().catch(console.error);

    // Also update legacy if present to prevent ghosts
    if (month && month.transactions) {
        const newTransactions = month.transactions.filter(t => !ids.includes(t.id));
        newMonthlyData[viewDate] = { ...month, transactions: newTransactions };
        updateBudget({ monthlyData: newMonthlyData, bankAccounts: newBankAccounts });
    } else {
        updateBudget({ bankAccounts: newBankAccounts });
    }
  };

  const handleBulkCategoryUpdate = async (ids, newSubCategoryId) => {
    // Sub-collection batch update
    const batch = writeBatch(db);
    ids.forEach(id => {
        const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, id);
        // Only update non-income transactions? Logic check from original code:
        // "if (ids.includes(tx.id) && !tx.isIncome)"
        // Since we are blindly updating by ID here, we assume the UI filtered valid ones.
        // Or we can check currentMonthTransactions.
        const tx = currentMonthTransactions.find(t => t.id === id);
        if (tx && !tx.isIncome) {
            batch.update(txRef, { subCategoryId: newSubCategoryId });
        }
    });
    
    await batch.commit();

    // Legacy fallback
    const newMonthlyData = { ...budgetData.monthlyData };
    const month = newMonthlyData[viewDate];
    if (month && month.transactions.length > 0) {
        const newTransactions = month.transactions.map(tx => {
           if (ids.includes(tx.id) && !tx.isIncome) {
              return { ...tx, subCategoryId: newSubCategoryId };
           }
           return tx;
        });
        newMonthlyData[viewDate] = { ...month, transactions: newTransactions };
        updateBudget({ monthlyData: newMonthlyData });
    }
  };

  const handleSaveIncome = (newIncome) => {
    const newBankAccounts = budgetData.bankAccounts.map(acc => acc.id === newIncome.accountId ? { ...acc, balance: (parseFloat(acc.balance) || 0) + (parseFloat(newIncome.amount) || 0) } : acc);
    
    // Save to sub-collection
    const txId = crypto.randomUUID();
    const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, txId);
    setDoc(txRef, { ...newIncome, id: txId });

    updateBudget({ bankAccounts: newBankAccounts });
  };

  const handleReturnTransaction = (originalTx, returnAmount) => {
    const returnTx = {
        id: crypto.randomUUID(),
        date: getTodayDate(),
        amount: returnAmount,
        accountId: originalTx.accountId,
        merchant: `Return: ${originalTx.merchant}`,
        subCategoryId: originalTx.subCategoryId, 
        isIncome: true, 
        notes: `Return for transaction on ${originalTx.date}`
    };
    handleSaveIncome(returnTx);
  };

  const handleSaveTransfer = (transferData) => {
    const { amount, date, fromId, toId } = transferData;
    const newBankAccounts = budgetData.bankAccounts.map(acc => {
      if (acc.id === fromId) return { ...acc, balance: (parseFloat(acc.balance) || 0) - amount };
      if (acc.id === toId) return { ...acc, balance: (parseFloat(acc.balance) || 0) + amount };
      return acc;
    });
    
    const fromName = budgetData.bankAccounts.find(a => a.id === fromId)?.name || 'Unknown';
    const toName = budgetData.bankAccounts.find(a => a.id === toId)?.name || 'Unknown';
    
    const batch = writeBatch(db);
    const colRef = collection(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`);
    
    const tx1 = { id: crypto.randomUUID(), amount, date, subCategoryId: null, accountId: fromId, merchant: `Transfer to ${toName}`, notes: `Transfer from ${fromName}`, isIncome: false };
    const tx2 = { id: crypto.randomUUID(), amount, date, subCategoryId: null, accountId: toId, merchant: `Transfer from ${fromName}`, notes: `Transfer to ${toName}`, isIncome: true };
    
    batch.set(doc(colRef, tx1.id), tx1);
    batch.set(doc(colRef, tx2.id), tx2);
    
    batch.commit();
    updateBudget({ bankAccounts: newBankAccounts });
  };

  const handlePaydayConfirm = (actualAmount, diffAction, paydayModalData) => {
    const incomeTx = {
      id: crypto.randomUUID(),
      date: getTodayDate(),
      amount: actualAmount,
      merchant: `${paydayModalData.name}'s Paycheck`,
      accountId: budgetData.mainSavingsAccountId || (budgetData.bankAccounts[0] ? budgetData.bankAccounts[0].id : ''),
      isIncome: true,
      notes: 'Auto-detected Payday'
    };
    handleSaveIncome(incomeTx); // This updates accounts too

    if (diffAction && diffAction.type === 'sinking' && diffAction.targetId) {
      const newBalances = { ...currentMonthData.sinkingFundBalances };
      newBalances[diffAction.targetId] = (newBalances[diffAction.targetId] || 0) + diffAction.amount;
      handleSinkingFundBalancesChange(newBalances);
    }
    
    const newSettings = { ...budgetData.incomeSettings };
    const roleSettings = newSettings[paydayModalData.role];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tempConfig = { ...roleSettings, anchorDate: tomorrow.toISOString().split('T')[0] };
    const nextStats = calculatePaydayStats(tempConfig);
    
    if (nextStats && nextStats.nextPayDayStr) {
      newSettings[paydayModalData.role] = {
        ...roleSettings,
        anchorDate: tomorrow.toISOString().split('T')[0],
        nextPayDay: nextStats.nextPayDayStr
      };
      updateBudget({ incomeSettings: newSettings });
    }
  };

  // --- Sharing Handlers ---
  const handleJoinBudget = async (ownerId) => {
    if (!ownerId || ownerId === userId) { throw new Error('Cannot join own budget.'); }
    
    const ownerDocRef = doc(db, `/artifacts/${appId}/users/${ownerId}/budget/main`);
    const memberDocRef = doc(db, `/artifacts/${appId}/users/${userId}/budget/main`);
    
    const snap = await getDoc(ownerDocRef);
    if (!snap.exists()) throw new Error('Budget not found.');
    const ownerData = snap.data();
    if (ownerData.linkedBudgetId || ownerData.sharedWith) throw new Error('Budget not available.');
    
    await setDoc(ownerDocRef, { sharedWith: { userId, email: auth.currentUser.email, name: auth.currentUser.displayName, permissions: 'edit' } }, { merge: true });
    await setDoc(memberDocRef, { linkedBudgetId: ownerId }, { merge: true });
  };

  const handleLeaveBudget = async () => {
    if (!userDoc?.linkedBudgetId) return;
    const ownerId = userDoc.linkedBudgetId;
    await setDoc(doc(db, `/artifacts/${appId}/users/${ownerId}/budget/main`), { sharedWith: null }, { merge: true });
    await setDoc(doc(db, `/artifacts/${appId}/users/${userId}/budget/main`), { linkedBudgetId: null }, { merge: true });
  };

  const handleRemovePartner = async () => {
    if (!userDoc?.sharedWith) return;
    const memberId = userDoc.sharedWith.userId;
    await setDoc(doc(db, `/artifacts/${appId}/users/${userId}/budget/main`), { sharedWith: null }, { merge: true });
    await setDoc(doc(db, `/artifacts/${appId}/users/${memberId}/budget/main`), { linkedBudgetId: null }, { merge: true });
  };

  return {
    handleStepChange,
    handleBankAccountsChange,
    handleSetDefaultAccount,
    handleSavingsAccountChange,
    handleMainSavingsAccountChange,
    handleDebtsChange,
    handleUpdateExcludedMerchants,
    handleIncomeChange,
    handleSaveDeductions,
    handleSaveIncomeSettings,
    handleSavingsChange,
    handleCategoriesChange,
    handleSinkingFundBalancesChange,
    handleAddRecurring,
    handleUpdateRecurring,
    handleDeleteRecurring,
    handleUpdateRecurringField,
    handleSaveTransaction,
    handleUpdateTransaction,
    handleDeleteTransaction,
    handleBulkDeleteTransactions,
    handleBulkCategoryUpdate,
    handleBulkAddTransactions: async (newTransactions) => {
        if (!newTransactions || newTransactions.length === 0) return;
        
        const batch = writeBatch(db);
        const txCollectionRef = collection(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`);
        let newBankAccounts = [...budgetData.bankAccounts];
        
        // We need to update account balances for these new transactions
        // Group by account to minimize iteration
        const accountImpacts = {};

        newTransactions.forEach(tx => {
            const txRef = doc(txCollectionRef, tx.id);
            batch.set(txRef, tx);

            // Calculate balance impact
            const amt = parseFloat(tx.amount) || 0;
            const accId = tx.accountId;
            if (accId) {
                if (tx.isIncome) {
                    accountImpacts[accId] = (accountImpacts[accId] || 0) + amt;
                } else {
                    accountImpacts[accId] = (accountImpacts[accId] || 0) - amt;
                }
            }
        });

        // Apply impacts to local bank accounts state
        newBankAccounts = newBankAccounts.map(acc => {
            if (accountImpacts[acc.id]) {
                return { ...acc, balance: acc.balance + accountImpacts[acc.id] };
            }
            return acc;
        });

        await batch.commit();
        updateBudget({ bankAccounts: newBankAccounts });
    },
    handleReturnTransaction,
    handleSaveIncome,
    handleSaveTransfer,
    handlePaydayConfirm,
    handleJoinBudget,
    handleLeaveBudget,
    handleRemovePartner
  };
}