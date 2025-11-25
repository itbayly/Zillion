import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';

// --- New UI Components ---
import { ThemeToggle } from './components/ui/ThemeToggle';
import { AmbientBackground } from './components/ui/SharedUI';

// --- 1. Config & Utils ---
import { auth, db } from './config/firebase';
import { getDefaultBudgetData, getYearMonthKey, getNewMonthEntry, getTodayDate, calculatePaydayStats } from './utils/helpers';

// --- 2. Auth & Wizard Views ---
import LoginScreen from './views/auth/LoginScreen';
import { WizardStep_Welcome, WizardStep_Join } from './views/wizard/WizardWelcome';
import {
  WizardStep1a_AccountsInfo,
  WizardStep1b_MainSavingsAccount,
  WizardStep1c_DefaultAccount,
  WizardStep1d_SinkingFundAccount,
  WizardStep1e_AccountSummary
} from './views/wizard/WizardBankAccounts';
import {
  WizardStep2_Income,
  WizardStep3_Savings,
  WizardStep6_DebtSetup
} from './views/wizard/WizardFinancials';
import {
  WizardStep4_Categories,
  WizardStep_LinkDebts,
  WizardStep5_AssignBudgets,
  WizardStep7_Complete
} from './views/wizard/WizardCategorization';

// --- 3. Dashboard Views ---
import BudgetView from './views/dashboard/BudgetView';
import ReportsDashboard from './views/dashboard/ReportsView';
import DebtsView from './views/dashboard/DebtsView';
import AccountsView from './views/dashboard/AccountsView';
import SettingsView from './views/dashboard/SettingsView';
import TransactionsView from './views/dashboard/TransactionsView';

// --- 4. Layout & Widgets ---
import Sidebar from './components/layout/Sidebar';
import { HeaderBar, HeroBar } from './components/layout/Headers';
import { RecentActivityCard, UpcomingBillsCard } from './components/cards/Widgets';
import RecurringTransactionsWidget from './components/cards/RecurringWidget';

// --- 5. Modals ---
import { JoinBudgetModal, ConfirmLeaveModal, ConfirmRemoveModal } from './components/modals/SharingModals';
import { RebalanceBudgetModal } from './components/modals/BudgetAdjustmentModals';
import AddTransactionModal from './components/modals/AddTransactionModal';
import { AddIncomeModal, AddTransferModal, LumpSumPaymentModal } from './components/modals/TransferModals';
import { TransactionDetailModal, AllTransactionsModal, AccountTransactionModal } from './components/modals/TransactionListModals';
import { DebtDetailModal, EditDebtModal } from './components/modals/DebtModals';
import StartOfMonthModal from './components/modals/StartOfMonthModal';
import PaydayModal from './components/modals/PaydayModal';

// ========================================================================
// MAIN BUDGET APP LOGIC
// ========================================================================
function BudgetApp({ userId, onSignOut, joinBudgetId }) {
  const appId = 'zillion-budget-app';

  // --- Theme State ---
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- Data State ---
  const [effectiveBudgetId, setEffectiveBudgetId] = useState(userId);
  const [userDoc, setUserDoc] = useState(null);
  const [isUserDocLoaded, setIsUserDocLoaded] = useState(false);
  const [budgetData, setBudgetData] = useState(getDefaultBudgetData());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [viewDate, setViewDate] = useState(getYearMonthKey());
  const [activeTab, setActiveTab] = useState('budget');

  // --- Modal States ---
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false);
  const [transactionModalFilter, setTransactionModalFilter] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalFilter, setAccountModalFilter] = useState(null);

  const [isDebtDetailModalOpen, setIsDebtDetailModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);
  const [isLumpSumModalOpen, setIsLumpSumModalOpen] = useState(false);
  const [lumpSumDebtId, setLumpSumDebtId] = useState(null);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinModalMessage, setJoinModalMessage] = useState({ type: '', text: '' });
  const [pendingJoinId, setPendingJoinId] = useState(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [sharingMessage, setSharingMessage] = useState({ type: '', text: '' });
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  const [isStartMonthModalOpen, setIsStartMonthModalOpen] = useState(false);
  const [paydayModalData, setPaydayModalData] = useState(null);

  // --- Refs ---
  const budgetDataRef = useRef(budgetData);
  budgetDataRef.current = budgetData;
  const userDocRef = useRef(userDoc);
  userDocRef.current = userDoc;
  const userDocUnsubscribeRef = useRef(null);
  const budgetDocUnsubscribeRef = useRef(null);

  // --- Effects ---

  // 1. URL Join Handler
  useEffect(() => {
    if (joinBudgetId && isUserDocLoaded && !userDocRef.current?.linkedBudgetId) {
      setPendingJoinId(joinBudgetId);
      setIsJoinModalOpen(true);
    }
  }, [joinBudgetId, isUserDocLoaded]);

  // 2. User Doc Listener
  useEffect(() => {
    if (db && userId) {
      if (userDocUnsubscribeRef.current) userDocUnsubscribeRef.current();
      const docPath = `/artifacts/${appId}/users/${userId}/budget/main`;
      const uDocRef = doc(db, docPath);

      const unsubscribe = onSnapshot(uDocRef, (snap) => {
        let data;
        if (snap.exists()) {
          data = snap.data();
        } else {
          data = getDefaultBudgetData();
          if (auth.currentUser?.displayName) data.userName = auth.currentUser.displayName;
          setDoc(uDocRef, data).catch(console.error);
        }
        setUserDoc(data);
        setIsUserDocLoaded(true);
        setEffectiveBudgetId(data.linkedBudgetId || userId);
      });
      userDocUnsubscribeRef.current = unsubscribe;
      return () => unsubscribe();
    }
  }, [userId]);

  // 3. Budget Doc Listener
  useEffect(() => {
    if (db && effectiveBudgetId) {
      if (budgetDocUnsubscribeRef.current) budgetDocUnsubscribeRef.current();
      setIsDataLoaded(false);
      const docPath = `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main`;
      const bDocRef = doc(db, docPath);

      const unsubscribe = onSnapshot(bDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (JSON.stringify(data) !== JSON.stringify(budgetDataRef.current)) {
            const processedData = runDailyCompoundingCatchUp(data);
            setBudgetData(processedData);
          }
        } else {
          const newDefaultData = getDefaultBudgetData();
          setDoc(bDocRef, newDefaultData).then(() => setBudgetData(newDefaultData)).catch(console.error);
        }
        setIsDataLoaded(true);
      });
      budgetDocUnsubscribeRef.current = unsubscribe;
      return () => unsubscribe();
    }
  }, [effectiveBudgetId]);

  // 4. Rollover Check
  useEffect(() => {
    const isSetupComplete = typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13;
    if (isDataLoaded && isSetupComplete) {
      const currentMonthKey = getYearMonthKey();
      if (!budgetData.monthlyData[currentMonthKey]) {
        handleCreateNewMonth(budgetDataRef.current, currentMonthKey);
      }
    }
  }, [isDataLoaded, budgetData.currentStep, budgetData.monthlyData]);

  // 5. Payday Check
  useEffect(() => {
    if (isDataLoaded && budgetData.incomeSettings) {
      const checkPayday = (role, defaultName) => {
        const settings = budgetData.incomeSettings[role];
        if (!settings || !settings.nextPayDay) return;

        const stats = calculatePaydayStats(settings);
        if (!stats || !stats.nextDateObj) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextPay = new Date(stats.nextDateObj);
        nextPay.setHours(0, 0, 0, 0);

        if (today.getTime() >= nextPay.getTime()) {
          let displayName = defaultName;
          if (role === 'user' && budgetData.userName) {
            displayName = budgetData.userName.split(' ')[0];
          } else if (role === 'partner' && userDoc?.sharedWith?.name) {
            displayName = userDoc.sharedWith.name.split(' ')[0];
          }
          setPaydayModalData({
            name: displayName,
            amount: parseFloat(settings.amount),
            role: role,
            settings: settings
          });
        }
      };
      const timer = setTimeout(() => {
        if (!paydayModalData && !isStartMonthModalOpen) {
          checkPayday('user', 'Your');
          checkPayday('partner', 'Partner');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, budgetData.incomeSettings, paydayModalData, isStartMonthModalOpen]);

  // --- Core Logic Functions ---

  const updateBudget = (newData) => {
    const completeNewData = { ...budgetDataRef.current, ...newData };
    setBudgetData(completeNewData);
    budgetDataRef.current = completeNewData;
    if (db && effectiveBudgetId) {
      const docPath = `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main`;
      setDoc(doc(db, docPath), completeNewData, { merge: true }).catch(console.error);
    }
  };

  const runDailyCompoundingCatchUp = (currentData) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let didUpdate = false;
    const newDebts = (currentData.debts || []).map((debt) => {
      if (debt.compoundingFrequency === 'Daily' && debt.lastCompoundedDate) {
        const lastDate = new Date(debt.lastCompoundedDate); lastDate.setHours(0, 0, 0, 0);
        const daysToCompound = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (daysToCompound > 0) {
          didUpdate = true;
          const P = debt.amountOwed;
          const r_daily = (debt.interestRate || 0) / 100 / 365;
          const newPrincipal = P * Math.pow(1 + r_daily, daysToCompound);
          return { ...debt, amountOwed: Math.round(newPrincipal * 100) / 100, lastCompoundedDate: today.toISOString() };
        }
      }
      return debt;
    });
    if (didUpdate) {
      updateBudget({ debts: newDebts });
      return { ...currentData, debts: newDebts };
    }
    return currentData;
  };

  const handleCreateNewMonth = (currentData, targetMonthKey) => {
    const { monthlyData } = currentData;
    const allMonthKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const latestMonthKey = allMonthKeys[allMonthKeys.length - 1];
    const latestMonth = monthlyData[latestMonthKey];
    if (!latestMonth) return;

    const { transactions, categories, sinkingFundBalances } = latestMonth;
    const spentBySubCategory = transactions.reduce((acc, tx) => {
      if (tx.isIncome) return acc;
      acc[tx.subCategoryId] = (acc[tx.subCategoryId] || 0) + (parseFloat(tx.amount) || 0);
      return acc;
    }, {});

    const newSinkingFundBalances = { ...sinkingFundBalances };
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        if (sub.type === 'sinking_fund') {
          const spent = spentBySubCategory[sub.id] || 0;
          const budgeted = sub.budgeted || 0;
          const oldBalance = newSinkingFundBalances[sub.id] || 0;
          newSinkingFundBalances[sub.id] = oldBalance + budgeted - spent;
        }
      });
    });

    const newMonthEntry = getNewMonthEntry(categories);
    newMonthEntry.sinkingFundBalances = newSinkingFundBalances;
    const newMonthlyData = { ...monthlyData, [targetMonthKey]: newMonthEntry };
    updateBudget({ monthlyData: newMonthlyData });
    setViewDate(targetMonthKey);
  };

  const handleSimulateRollover = () => {
    const { monthlyData } = budgetDataRef.current;
    const allMonthKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const latestMonthKey = allMonthKeys[allMonthKeys.length - 1];
    const [year, month] = latestMonthKey.split('-').map(Number);
    const latestDate = new Date(year, month - 1, 15);
    latestDate.setMonth(latestDate.getMonth() + 1);
    const nextMonthKey = getYearMonthKey(latestDate);

    if (monthlyData[nextMonthKey]) { setViewDate(nextMonthKey); return; }
    handleCreateNewMonth(budgetDataRef.current, nextMonthKey);
  };

  // --- Handlers for Data Updates ---
  const handleStepChange = (step) => updateBudget({ currentStep: step });
  const handleBankAccountsChange = (newAccounts) => updateBudget({ bankAccounts: newAccounts });
  const handleSetDefaultAccount = (accountId) => updateBudget({ defaultAccountId: accountId });
  const handleSavingsAccountChange = (accountId) => updateBudget({ savingsAccountId: accountId || null });
  const handleMainSavingsAccountChange = (accountId) => updateBudget({ mainSavingsAccountId: accountId || null });
  const handleDebtsChange = (newDebts) => updateBudget({ debts: newDebts });

  const getWriteKey = () => {
    const isSetup = budgetData.currentStep > 13;
    return isSetup ? viewDate : Object.keys(budgetData.monthlyData)[0];
  };

  const handleIncomeChange = (source, value) => {
    const monthKey = getWriteKey();
    const newMonthlyData = JSON.parse(JSON.stringify(budgetDataRef.current.monthlyData));
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
    const newMonthlyData = JSON.parse(JSON.stringify(budgetDataRef.current.monthlyData));
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

  // --- Recurring Transactions Logic ---
  const handleAddRecurring = (item) => {
    const newList = [...(budgetData.recurringTransactions || []), { ...item, id: nanoid() }];
    updateBudget({ recurringTransactions: newList });
  };

  const handleDeleteRecurring = (id) => {
    const newList = (budgetData.recurringTransactions || []).filter(i => i.id !== id);
    updateBudget({ recurringTransactions: newList });
  };

  // --- Transaction Handlers ---
  const handleSaveTransaction = (newTransaction) => {
    let newDebts = [...(budgetData.debts || [])];
    let newBankAccounts = [...budgetData.bankAccounts];
    const newMonthlyData = { ...budgetData.monthlyData };
    const month = newMonthlyData[viewDate] || getNewMonthEntry(currentMonthData.categories);
    let newTransactionsList = [...month.transactions];

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
      const deductionsByAccount = {};
      newTransaction.splits.forEach(split => {
        const amt = parseFloat(split.amount) || 0;
        deductionsByAccount[split.accountId] = (deductionsByAccount[split.accountId] || 0) + amt;
      });
      newBankAccounts = newBankAccounts.map(acc => {
        const deduction = deductionsByAccount[acc.id];
        return deduction ? { ...acc, balance: (parseFloat(acc.balance) || 0) - deduction } : acc;
      });
      newTransaction.splits.forEach(split => {
        if (split.amount > 0 && split.subCategoryId) {
          const { principalPaid, interestPaid } = processPayment(split.amount, split.subCategoryId, newTransaction.date);
          newTransactionsList.push({
            id: crypto.randomUUID(),
            amount: split.amount,
            subCategoryId: split.subCategoryId,
            date: newTransaction.date,
            accountId: split.accountId,
            merchant: newTransaction.merchant,
            notes: [newTransaction.notes, split.notes].filter(Boolean).join(' | '),
            isIncome: false,
            splitGroupId: newTransaction.id,
            principalPaid, interestPaid
          });
        }
      });
    } else {
      let singleTx = { ...newTransaction, id: newTransaction.id || crypto.randomUUID() };
      if (!singleTx.isIncome) {
        const amt = parseFloat(singleTx.amount) || 0;
        const { principalPaid, interestPaid } = processPayment(amt, singleTx.subCategoryId, singleTx.date);
        singleTx.principalPaid = principalPaid;
        singleTx.interestPaid = interestPaid;
      }
      newTransactionsList.push(singleTx);
      newBankAccounts = newBankAccounts.map(acc => acc.id === newTransaction.accountId ? { ...acc, balance: (parseFloat(acc.balance) || 0) - (parseFloat(newTransaction.amount) || 0) } : acc);
    }
    newMonthlyData[viewDate] = { ...month, transactions: newTransactionsList };
    updateBudget({ monthlyData: newMonthlyData, bankAccounts: newBankAccounts, debts: newDebts });
    setIsTransactionModalOpen(false);
  };

  const handleSaveIncome = (newIncome) => {
    const newBankAccounts = budgetData.bankAccounts.map(acc => acc.id === newIncome.accountId ? { ...acc, balance: (parseFloat(acc.balance) || 0) + (parseFloat(newIncome.amount) || 0) } : acc);
    const newMonthlyData = { ...budgetData.monthlyData };
    const month = newMonthlyData[viewDate] || getNewMonthEntry();
    const newTransactions = [...month.transactions, { ...newIncome, id: crypto.randomUUID() }];
    newMonthlyData[viewDate] = { ...month, transactions: newTransactions };
    updateBudget({ monthlyData: newMonthlyData, bankAccounts: newBankAccounts });
    setIsIncomeModalOpen(false);
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
    const tx1 = { id: crypto.randomUUID(), amount, date, subCategoryId: null, accountId: fromId, merchant: `Transfer to ${toName}`, notes: `Transfer from ${fromName}`, isIncome: false };
    const tx2 = { id: crypto.randomUUID(), amount, date, subCategoryId: null, accountId: toId, merchant: `Transfer from ${fromName}`, notes: `Transfer to ${toName}`, isIncome: true };
    const newMonthlyData = { ...budgetData.monthlyData };
    const month = newMonthlyData[viewDate] || getNewMonthEntry();
    newMonthlyData[viewDate] = { ...month, transactions: [...month.transactions, tx1, tx2] };
    updateBudget({ monthlyData: newMonthlyData, bankAccounts: newBankAccounts });
    setIsTransferModalOpen(false);
  };

  const handlePaydayConfirm = (actualAmount, diffAction) => {
    const incomeTx = {
      id: crypto.randomUUID(),
      date: getTodayDate(),
      amount: actualAmount,
      merchant: `${paydayModalData.name}'s Paycheck`,
      accountId: budgetData.mainSavingsAccountId || (budgetData.bankAccounts[0] ? budgetData.bankAccounts[0].id : ''),
      isIncome: true,
      notes: 'Auto-detected Payday'
    };
    handleSaveIncome(incomeTx);
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
    setPaydayModalData(null);
  };

  const handleJoinBudget = async (ownerId) => {
    if (!ownerId || ownerId === userId) { setJoinModalMessage({ type: 'error', text: 'Cannot join own budget.' }); return; }
    try {
      const ownerDocRef = doc(db, `/artifacts/${appId}/users/${ownerId}/budget/main`);
      const memberDocRef = doc(db, `/artifacts/${appId}/users/${userId}/budget/main`);
      const snap = await getDoc(ownerDocRef);
      if (!snap.exists()) throw new Error('Budget not found.');
      const ownerData = snap.data();
      if (ownerData.linkedBudgetId || ownerData.sharedWith) throw new Error('Budget not available.');
      await setDoc(ownerDocRef, { sharedWith: { userId, email: auth.currentUser.email, name: auth.currentUser.displayName, permissions: 'edit' } }, { merge: true });
      await setDoc(memberDocRef, { linkedBudgetId: ownerId }, { merge: true });
      setIsJoinModalOpen(false); setPendingJoinId(null);
    } catch (error) { setJoinModalMessage({ type: 'error', text: error.message }); }
  };

  const handleLeaveBudget = async () => {
    if (!userDoc?.linkedBudgetId) return;
    const ownerId = userDoc.linkedBudgetId;
    try {
      await setDoc(doc(db, `/artifacts/${appId}/users/${ownerId}/budget/main`), { sharedWith: null }, { merge: true });
      await setDoc(doc(db, `/artifacts/${appId}/users/${userId}/budget/main`), { linkedBudgetId: null }, { merge: true });
      setIsLeaveModalOpen(false); setSharingMessage({ type: 'success', text: 'You left the budget.' });
    } catch (e) { setSharingMessage({ type: 'error', text: 'Error leaving budget.' }); }
  };

  const handleRemovePartner = async () => {
    if (!userDoc?.sharedWith) return;
    const memberId = userDoc.sharedWith.userId;
    try {
      await setDoc(doc(db, `/artifacts/${appId}/users/${userId}/budget/main`), { sharedWith: null }, { merge: true });
      await setDoc(doc(db, `/artifacts/${appId}/users/${memberId}/budget/main`), { linkedBudgetId: null }, { merge: true });
      setIsRemoveModalOpen(false); setSharingMessage({ type: 'success', text: 'Partner removed.' });
    } catch (e) { setSharingMessage({ type: 'error', text: 'Error removing partner.' }); }
  };

  // --- Render Helpers ---
  const currentMonthData = useMemo(() => {
    const monthKey = (typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13) ? viewDate : Object.keys(budgetData.monthlyData)[0];
    return budgetData.monthlyData[monthKey] || getNewMonthEntry();
  }, [budgetData.monthlyData, viewDate, budgetData.currentStep]);

  const monthlyDataKeys = useMemo(() => Object.keys(budgetData.monthlyData), [budgetData.monthlyData]);

  const totalIncome = (currentMonthData.income.source1 || 0) + (currentMonthData.income.source2 || 0);
  const remainingAfterSavings = totalIncome - (currentMonthData.savingsGoal || 0);
  const totalBudgeted = (currentMonthData.categories || []).reduce((acc, cat) => acc + cat.subcategories.reduce((sAcc, sub) => {
    if (sub.linkedDebtId) {
      const debt = budgetData.debts.find(d => d.id === sub.linkedDebtId);
      return sAcc + (debt ? (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0) : 0);
    }
    if (sub.type === 'deduction') return sAcc;
    return sAcc + (sub.budgeted || 0);
  }, 0), 0);
  const remainingToBudget = totalIncome - (currentMonthData.savingsGoal || 0) - totalBudgeted;

  const spentOnDebtsMap = useMemo(() => {
    const debtMap = new Map();
    const debtSubIds = new Set();
    currentMonthData.categories.forEach(cat => cat.subcategories.forEach(sub => { if (sub.linkedDebtId) debtSubIds.add(sub.id); }));
    currentMonthData.transactions.forEach(tx => {
      if (debtSubIds.has(tx.subCategoryId) && !tx.isIncome) {
        const sub = currentMonthData.categories.flatMap(c => c.subcategories).find(s => s.id === tx.subCategoryId);
        if (sub) debtMap.set(sub.linkedDebtId, (debtMap.get(sub.linkedDebtId) || 0) + (parseFloat(tx.amount) || 0));
      }
    });
    return debtMap;
  }, [currentMonthData.categories, currentMonthData.transactions]);


  if (!isUserDocLoaded || !isDataLoaded) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /><span className="ml-4 text-lg text-gray-700">Loading Data...</span></div>;

  const isSetupComplete = typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13;

  return (
    <>
      <JoinBudgetModal isOpen={isJoinModalOpen} onClose={() => { setIsJoinModalOpen(false); setPendingJoinId(null); }} onJoin={handleJoinBudget} initialBudgetId={pendingJoinId} message={joinModalMessage} setMessage={setJoinModalMessage} theme={theme} />
      <ConfirmLeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onConfirm={handleLeaveBudget} theme={theme} />
      <ConfirmRemoveModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} onConfirm={handleRemovePartner} partnerName={userDoc?.sharedWith?.name} theme={theme} />
      <RebalanceBudgetModal isOpen={isRebalanceModalOpen} onClose={() => setIsRebalanceModalOpen(false)} rebalanceData={rebalanceData} onSave={(newCats) => { handleCategoriesChange(newCats); setIsRebalanceModalOpen(false); }} theme={theme} />

      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={handleSaveTransaction} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} spentOnDebtsMap={spentOnDebtsMap} theme={theme} />
      <AddIncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSave={handleSaveIncome} bankAccounts={budgetData.bankAccounts} theme={theme} />
      <AddTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSave={handleSaveTransfer} bankAccounts={budgetData.bankAccounts} theme={theme} />

      <TransactionDetailModal isOpen={isTransactionDetailModalOpen} onClose={() => setIsTransactionDetailModalOpen(false)} filter={transactionModalFilter} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={() => { }} onDeleteTransaction={() => { }} onReturnTransaction={() => { }} theme={theme} />
      <AllTransactionsModal isOpen={isAllTransactionsModalOpen} onClose={() => setIsAllTransactionsModalOpen(false)} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={() => { }} onDeleteTransaction={() => { }} onReturnTransaction={() => { }} theme={theme} />
      <AccountTransactionModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} filter={accountModalFilter} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={() => { }} onDeleteTransaction={() => { }} onReturnTransaction={() => { }} theme={theme} />

      <DebtDetailModal isOpen={isDebtDetailModalOpen} onClose={() => setIsDebtDetailModalOpen(false)} debt={selectedDebt} onUpdateDebt={() => { }} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} onOpenLumpSumModal={(id) => { setLumpSumDebtId(id); setIsLumpSumModalOpen(true); setIsDebtDetailModalOpen(false); }} onOpenEditModal={(debt) => { setEditingDebt(debt); setIsDebtDetailModalOpen(false); }} theme={theme} />
      <LumpSumPaymentModal isOpen={isLumpSumModalOpen} onClose={() => { setIsLumpSumModalOpen(false); setLumpSumDebtId(null); }} onSave={() => { }} debts={budgetData.debts} bankAccounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} initialDebtId={lumpSumDebtId} theme={theme} />
      <EditDebtModal isOpen={!!editingDebt} onClose={() => setEditingDebt(null)} onSave={() => { }} debt={editingDebt} theme={theme} />

      <StartOfMonthModal isOpen={isStartMonthModalOpen} onClose={() => setIsStartMonthModalOpen(false)} bankAccounts={budgetData.bankAccounts} onUpdateAccounts={handleBankAccountsChange} categories={currentMonthData.categories} sinkingFundBalances={currentMonthData.sinkingFundBalances} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} mainSavingsAccountId={budgetData.mainSavingsAccountId} theme={theme} />
      <PaydayModal isOpen={!!paydayModalData} onClose={() => setPaydayModalData(null)} payeeName={paydayModalData?.name} expectedAmount={paydayModalData?.amount} onConfirm={handlePaydayConfirm} bankAccounts={budgetData.bankAccounts} categories={currentMonthData.categories} sinkingFunds={currentMonthData.sinkingFundBalances} theme={theme} />

      <div className={`min-h-screen w-full font-sans transition-colors duration-1000 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <AmbientBackground theme={theme} />
        {isSetupComplete && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
        
        <div className="mx-auto w-full">
          <main>
            {isSetupComplete ? (
              <div className="grid min-h-screen w-full grid-cols-[280px_1fr_450px] gap-8 p-6">
                <div><Sidebar activeTab={activeTab} onTabClick={setActiveTab} theme={theme} /></div>
                <div className="flex flex-col pt-2">
                  <HeaderBar userName={budgetData.userName} viewDate={viewDate} monthlyDataKeys={monthlyDataKeys} setViewDate={setViewDate} onSimulateRollover={handleSimulateRollover} onOpenTransactionModal={() => setIsTransactionModalOpen(true)} theme={theme} />
                  {activeTab === 'budget' && <HeroBar categories={currentMonthData.categories} transactions={currentMonthData.transactions} income={currentMonthData.income} savingsGoal={currentMonthData.savingsGoal} theme={theme} />}

                  <div className="mt-8 w-full">
                    {activeTab === 'budget' && (
                      <BudgetView
                        categories={currentMonthData.categories}
                        transactions={currentMonthData.transactions}
                        sinkingFundBalances={currentMonthData.sinkingFundBalances}
                        onCategoriesChange={handleCategoriesChange}
                        debts={budgetData.debts}
                        onOpenTransactionDetails={(filter) => { setTransactionModalFilter(filter); setIsTransactionDetailModalOpen(true); }}
                        onOpenAllTransactionsModal={() => setIsAllTransactionsModalOpen(true)}
                        onFundSinkingFunds={() => { }}
                        onOpenStartMonthModal={() => setIsStartMonthModalOpen(true)}
                        theme={theme}
                      />
                    )}
                    {activeTab === 'reports' && <ReportsDashboard categories={currentMonthData.categories} transactions={currentMonthData.transactions} debts={budgetData.debts} income={currentMonthData.income} savingsGoal={currentMonthData.savingsGoal} onIncomeChange={handleIncomeChange} onSavingsChange={handleSavingsChange} theme={theme} />}
                    {activeTab === 'debts' && <DebtsView debts={budgetData.debts} onDebtsChange={handleDebtsChange} onOpenDebtDetails={(debt) => { setSelectedDebt(debt); setIsDebtDetailModalOpen(true); }} onOpenLumpSumModal={() => { setLumpSumDebtId(null); setIsLumpSumModalOpen(true); }} theme={theme} />}
                    {activeTab === 'accounts' && <AccountsView accounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} onAccountsChange={handleBankAccountsChange} onSetDefaultAccount={handleSetDefaultAccount} savingsAccountId={budgetData.savingsAccountId} onSavingsAccountChange={handleSavingsAccountChange} mainSavingsAccountId={budgetData.mainSavingsAccountId} onMainSavingsAccountChange={handleMainSavingsAccountChange} onOpenAccountTransactions={(filter) => { setAccountModalFilter(filter); setIsAccountModalOpen(true); }} onOpenTransferModal={() => setIsTransferModalOpen(true)} theme={theme} />}
                    {activeTab === 'settings' && <SettingsView onSignOut={onSignOut} budgetId={userId} updateBudget={updateBudget} userDoc={userDoc} effectiveBudgetId={effectiveBudgetId} onOpenJoinModal={() => setIsJoinModalOpen(true)} onOpenLeaveModal={() => setIsLeaveModalOpen(true)} onOpenRemoveModal={() => setIsRemoveModalOpen(true)} sharingMessage={sharingMessage} setSharingMessage={setSharingMessage} setActiveTab={setActiveTab} theme={theme} />}
                    
                    {activeTab === 'transactions' && <TransactionsView transactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={handleSaveTransaction} onDeleteTransaction={() => {}} onReturnTransaction={() => {}} theme={theme} />}

                    {['savings', 'account'].includes(activeTab) && <div className={`flex h-64 items-center justify-center rounded-3xl border-2 border-dashed transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}><p className="text-lg">This view is coming soon.</p></div>}
                  </div>
                </div>

                <aside className="sticky top-6 h-[calc(100vh-48px)] overflow-y-auto no-scrollbar pt-2">
                  <div className="flex flex-col gap-6">
                    {activeTab === 'transactions' ? (
                      <RecurringTransactionsWidget 
                        recurringTransactions={budgetData.recurringTransactions} 
                        onAdd={handleAddRecurring} 
                        onDelete={handleDeleteRecurring}
                        categories={currentMonthData.categories}
                        theme={theme}
                      />
                    ) : (
                      <>
                        <RecentActivityCard transactions={currentMonthData.transactions} categories={currentMonthData.categories} theme={theme} />
                        <UpcomingBillsCard debts={budgetData.debts} theme={theme} />
                      </>
                    )}
                  </div>
                </aside>
              </div>
            ) : (
              <>
                {budgetData.currentStep === 0 && <WizardStep_Welcome onStartNew={() => handleStepChange(2)} onStartJoin={() => handleStepChange(1)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 1 && <WizardStep_Join onJoin={handleJoinBudget} onBack={() => handleStepChange(0)} message={joinModalMessage} setMessage={setJoinModalMessage} joinBudgetId={joinBudgetId} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 2 && <WizardStep1a_AccountsInfo onBack={() => handleStepChange(0)} onNext={() => handleStepChange(3)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 3 && <WizardStep1b_MainSavingsAccount budgetData={budgetData} onAccountsChange={handleBankAccountsChange} onMainSavingsAccountChange={handleMainSavingsAccountChange} onBack={() => handleStepChange(2)} onNext={() => handleStepChange(4)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 4 && <WizardStep1c_DefaultAccount budgetData={budgetData} onAccountsChange={handleBankAccountsChange} onSetDefaultAccount={handleSetDefaultAccount} onBack={() => handleStepChange(3)} onNext={() => handleStepChange(5)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 5 && <WizardStep1d_SinkingFundAccount budgetData={budgetData} onAccountsChange={handleBankAccountsChange} onSavingsAccountChange={handleSavingsChange} onBack={() => handleStepChange(4)} onNext={() => handleStepChange(6)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 6 && <WizardStep1e_AccountSummary budgetData={budgetData} onAccountsChange={handleBankAccountsChange} onSetDefaultAccount={handleSetDefaultAccount} onMainSavingsAccountChange={handleMainSavingsAccountChange} onSavingsAccountChange={handleSavingsAccountChange} onBack={() => handleStepChange(5)} onNext={() => handleStepChange(7)} theme={theme} toggleTheme={toggleTheme} />}

                {/* STEP 7: Combined Income + Deductions */}
                {budgetData.currentStep === 7 && <WizardStep2_Income budgetData={budgetData} income={currentMonthData.income} totalIncome={totalIncome} onIncomeChange={handleIncomeChange} onSaveIncomeSettings={handleSaveIncomeSettings} onSaveDeductions={handleSaveDeductions} onNext={() => handleStepChange(8)} onBack={() => handleStepChange(6)} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 8: Savings (Renumbered) */}
                {budgetData.currentStep === 8 && <WizardStep3_Savings budgetData={budgetData} savingsGoal={currentMonthData.savingsGoal} totalIncome={totalIncome} remainingAfterSavings={remainingAfterSavings} onSavingsChange={handleSavingsChange} bankAccounts={budgetData.bankAccounts} mainSavingsAccountId={budgetData.mainSavingsAccountId} onMainSavingsAccountChange={handleMainSavingsAccountChange} onNext={() => handleStepChange(9)} onBack={() => handleStepChange(7)} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 9: Debts */}
                {budgetData.currentStep === 9 && <WizardStep6_DebtSetup budgetData={budgetData} debts={budgetData.debts} onDebtsChange={handleDebtsChange} onBack={() => handleStepChange(8)} onNext={() => handleStepChange(10)} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 10: Categories */}
                {budgetData.currentStep === 10 && <WizardStep4_Categories budgetData={budgetData} categories={currentMonthData.categories} onCategoriesChange={handleCategoriesChange} onNext={() => handleStepChange(11)} onBack={() => handleStepChange(9)} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 11: Link Debts */}
                {budgetData.currentStep === 11 && <WizardStep_LinkDebts budgetData={budgetData} categories={currentMonthData.categories} debts={budgetData.debts} onCategoriesChange={handleCategoriesChange} onBack={() => handleStepChange(10)} onNext={() => handleStepChange(12)} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 12: Assign Budget */}
                {budgetData.currentStep === 12 && <WizardStep5_AssignBudgets budgetData={budgetData} categories={currentMonthData.categories} remainingToBudget={remainingToBudget} onCategoriesChange={handleCategoriesChange} debts={budgetData.debts} onBack={() => handleStepChange(11)} bankAccounts={budgetData.bankAccounts} onFinishSetup={() => handleStepChange('dashboard')} onUpdateBankAccounts={handleBankAccountsChange} onUpdateDebts={handleDebtsChange} sinkingFundBalances={currentMonthData.sinkingFundBalances} onUpdateSinkingFundBalances={handleSinkingFundBalancesChange} savingsAccountId={budgetData.savingsAccountId} theme={theme} toggleTheme={toggleTheme} />}

                {/* Step 13: Complete */}
                {budgetData.currentStep === 13 && <WizardStep7_Complete onGoToDashboard={() => handleStepChange('dashboard')} onStartOver={() => updateBudget(getDefaultBudgetData())} theme={theme} toggleTheme={toggleTheme} />}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
// ========================================================================
// ROOT APP COMPONENT
// ========================================================================
export default function App() {
  console.log('App.jsx: App component rendering');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Check for URL join param
  const params = new URLSearchParams(window.location.search);
  const joinId = params.get('join');

  return (
    <BudgetApp
      userId={user.uid}
      onSignOut={handleSignOut}
      joinBudgetId={joinId}
    />
  );
}
