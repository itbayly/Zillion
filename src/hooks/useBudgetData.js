import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { 
  getDefaultBudgetData, 
  getYearMonthKey, 
  getNewMonthEntry, 
  calculatePaydayStats 
} from '../utils/helpers';

export function useBudgetData(userId) {
  const appId = 'zillion-budget-app';

  // --- Data State ---
  const [effectiveBudgetId, setEffectiveBudgetId] = useState(userId);
  const [userDoc, setUserDoc] = useState(null);
  const [isUserDocLoaded, setIsUserDocLoaded] = useState(false);
  const [budgetData, setBudgetData] = useState(getDefaultBudgetData());
  const [currentMonthTransactions, setCurrentMonthTransactions] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [viewDate, setViewDate] = useState(getYearMonthKey());
  const [paydayModalData, setPaydayModalData] = useState(null);

  // --- Refs for Automatic Logic ---
  const budgetDataRef = useRef(budgetData);
  budgetDataRef.current = budgetData;
  
  const userDocUnsubscribeRef = useRef(null);
  const budgetDocUnsubscribeRef = useRef(null);

  // --- Core Helper: Update Budget ---
  // Updates local state immediately and writes to Firestore
  const updateBudget = (newData) => {
    const completeNewData = { ...budgetDataRef.current, ...newData };
    setBudgetData(completeNewData);
    budgetDataRef.current = completeNewData;
    
    if (db && effectiveBudgetId) {
      const docPath = `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main`;
      setDoc(doc(db, docPath), completeNewData, { merge: true }).catch(console.error);
    }
  };

  // --- Automatic Logic 1: Daily Compounding ---
  const runDailyCompoundingCatchUp = (currentData) => {
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    let didUpdate = false;
    
    const newDebts = (currentData.debts || []).map((debt) => {
      if (debt.compoundingFrequency === 'Daily' && debt.lastCompoundedDate) {
        const lastDate = new Date(debt.lastCompoundedDate); 
        lastDate.setHours(0, 0, 0, 0);
        const daysToCompound = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysToCompound > 0) {
          didUpdate = true;
          const P = debt.amountOwed;
          const r_daily = (debt.interestRate || 0) / 100 / 365;
          const newPrincipal = P * Math.pow(1 + r_daily, daysToCompound);
          return { 
            ...debt, 
            amountOwed: Math.round(newPrincipal * 100) / 100, 
            lastCompoundedDate: today.toISOString() 
          };
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

  // --- Automatic Logic 2: Monthly Rollover ---
  const handleCreateNewMonth = (currentData, targetMonthKey) => {
    const { monthlyData } = currentData;
    const allMonthKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const latestMonthKey = allMonthKeys[allMonthKeys.length - 1];
    const latestMonth = monthlyData[latestMonthKey];
    
    if (!latestMonth) return;

    const { transactions, categories, sinkingFundBalances } = latestMonth;
    
    // Calculate spent totals from the previous month to determine rollover amounts for sinking funds
    const spentBySubCategory = transactions.reduce((acc, tx) => {
      if (tx.isIncome) return acc;
      acc[tx.subCategoryId] = (acc[tx.subCategoryId] || 0) + (parseFloat(tx.amount) || 0);
      return acc;
    }, {});

    const newSinkingFundBalances = { ...sinkingFundBalances };
    
    // Carry over Sinking Fund balances
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

  // Exposed helper for manual simulation (Dev Tool)
  const simulateRollover = () => {
    const { monthlyData } = budgetDataRef.current;
    const allMonthKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const latestMonthKey = allMonthKeys[allMonthKeys.length - 1];
    const [year, month] = latestMonthKey.split('-').map(Number);
    
    const latestDate = new Date(year, month - 1, 15);
    latestDate.setMonth(latestDate.getMonth() + 1);
    const nextMonthKey = getYearMonthKey(latestDate);

    if (monthlyData[nextMonthKey]) { 
      setViewDate(nextMonthKey); 
      return; 
    }
    handleCreateNewMonth(budgetDataRef.current, nextMonthKey);
  };

  // --- Listener 1: User Doc (Auth/Link Status) ---
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
        // Determine effective budget ID (Own or Linked)
        setEffectiveBudgetId(data.linkedBudgetId || userId);
      });
      
      userDocUnsubscribeRef.current = unsubscribe;
      return () => unsubscribe();
    }
  }, [userId]);

  // --- Listener 2: Budget Doc (Main Data) ---
  useEffect(() => {
    if (db && effectiveBudgetId) {
      if (budgetDocUnsubscribeRef.current) budgetDocUnsubscribeRef.current();
      
      // Only set loading false on initial load switch
      if(!isDataLoaded) setIsDataLoaded(false);
      
      const docPath = `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main`;
      const bDocRef = doc(db, docPath);

      const unsubscribe = onSnapshot(bDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Deep compare simple check to avoid unnecessary compounding runs
          if (JSON.stringify(data) !== JSON.stringify(budgetDataRef.current)) {
            const processedData = runDailyCompoundingCatchUp(data);
            setBudgetData(processedData);
          }
        } else {
          const newDefaultData = getDefaultBudgetData();
          setDoc(bDocRef, newDefaultData)
            .then(() => setBudgetData(newDefaultData))
            .catch(console.error);
        }
        setIsDataLoaded(true);
      });
      
      budgetDocUnsubscribeRef.current = unsubscribe;
      return () => unsubscribe();
    }
  }, [effectiveBudgetId]);

  // --- Listener 3: Transactions Sub-Collection ---
  useEffect(() => {
    if (db && effectiveBudgetId && viewDate) {
      // Query transactions where 'date' string starts with 'YYYY-MM'
      const startStr = viewDate; 
      const endStr = viewDate + '\uf8ff';

      const txCollectionRef = collection(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`);
      const q = query(txCollectionRef, where('date', '>=', startStr), where('date', '<=', endStr));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCurrentMonthTransactions(fetchedTxs);
      });

      return () => unsubscribe();
    }
  }, [effectiveBudgetId, viewDate]);

  // --- Effect: Trigger Rollover ---
  useEffect(() => {
    const isSetupComplete = typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13;
    if (isDataLoaded && isSetupComplete) {
      const currentMonthKey = getYearMonthKey();
      if (!budgetData.monthlyData[currentMonthKey]) {
        handleCreateNewMonth(budgetDataRef.current, currentMonthKey);
      }
    }
  }, [isDataLoaded, budgetData.currentStep, budgetData.monthlyData]);

  // --- Effect: Automated Recurring Payments & Payday ---
  useEffect(() => {
    if (!isDataLoaded) return;

    // 1. Check Recurring Payments
    if (budgetData.recurringTransactions) {
      const today = new Date();
      const currentMonthStr = getYearMonthKey(today);
      const todayDay = today.getDate();
      
      let updatesNeeded = false;
      let newTransactions = [];
      let newRecurringList = [...budgetData.recurringTransactions];
      let newBankAccounts = [...budgetData.bankAccounts];

      newRecurringList = newRecurringList.map(item => {
        // Skip if already paid this month
        if (item.lastPaidMonth === currentMonthStr) return item;

        // Check if due date has arrived
        if (todayDay >= item.dayOfMonth) {
          let amountToPay = 0;

          if (item.isVariable) {
            // For variable, only pay if a pending amount is set
            amountToPay = parseFloat(item.pendingAmount) || 0;
          } else {
            // For fixed, pay the set amount
            amountToPay = parseFloat(item.amount) || 0;
          }

          if (amountToPay > 0) {
            updatesNeeded = true;
            
            // Create Transaction
            const tx = {
              id: crypto.randomUUID(),
              date: getTodayDate(), // Or specific due date? user likely wants "today" if it runs today.
              amount: amountToPay,
              merchant: item.merchant,
              subCategoryId: item.subCategoryId,
              accountId: budgetData.defaultAccountId || (budgetData.bankAccounts[0]?.id), // Default to main spending
              isIncome: false,
              notes: 'Auto-Paid Recurring Transaction'
            };
            newTransactions.push(tx);

            // Update Account Balance
            newBankAccounts = newBankAccounts.map(acc => 
              acc.id === tx.accountId 
                ? { ...acc, balance: (parseFloat(acc.balance) || 0) - amountToPay } 
                : acc
            );

            // Mark as paid and clear pending amount
            return { ...item, lastPaidMonth: currentMonthStr, pendingAmount: 0 };
          }
        }
        return item;
      });

      if (updatesNeeded) {
        // Batch write the new transactions
        const batch = []; 
        // Note: We can't easily do a batch write inside this hook without imports, 
        // so we will piggyback on the updateBudget to trigger a save, 
        // and fire the transactions separately if possible, or just update the lists locally 
        // and let the user see them? 
        // Better approach for this architecture: 
        // We will update the budgetData (accounts/recurring) via updateBudget.
        // We will write the transactions directly to Firestore here.
        
        newTransactions.forEach(tx => {
           const txRef = doc(db, `/artifacts/${appId}/users/${effectiveBudgetId}/budget/main/transactions`, tx.id);
           setDoc(txRef, tx);
        });

        // Update main doc
        updateBudget({ 
          recurringTransactions: newRecurringList,
          bankAccounts: newBankAccounts 
        });
      }
    }

    // 2. Payday Detection
    if (budgetData.incomeSettings) {
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
        // Prevent payday check if user is in setup or already reviewing one
        if (!paydayModalData) { 
          checkPayday('user', 'Your');
          checkPayday('partner', 'Partner');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, budgetData.incomeSettings, paydayModalData]);

  // --- Derived State: Current Month Data (Merged) ---
  const currentMonthData = useMemo(() => {
    const isSetup = typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13;
    const monthKey = isSetup ? viewDate : Object.keys(budgetData.monthlyData)[0];
    
    // Safety check for initialization
    const rawMonthData = budgetData.monthlyData[monthKey] || getNewMonthEntry();
    
    // MERGE: Combine legacy (main doc) array with sub-collection results
    const legacyTransactions = rawMonthData.transactions || [];
    const allTransactions = [...legacyTransactions, ...currentMonthTransactions];
    
    // Deduplicate by ID (Sub-collection takes precedence)
    const uniqueMap = new Map();
    allTransactions.forEach(tx => uniqueMap.set(tx.id, tx));
    const activeTransactions = Array.from(uniqueMap.values());

    return {
        ...rawMonthData,
        transactions: activeTransactions
    };
  }, [budgetData.monthlyData, viewDate, budgetData.currentStep, currentMonthTransactions]);

  return {
    // State
    loading: !isDataLoaded || !isUserDocLoaded,
    userDoc,
    budgetData,
    currentMonthData,
    viewDate,
    paydayModalData,
    effectiveBudgetId,
    
    // Setters / Actions
    setViewDate,
    setPaydayModalData,
    updateBudget,
    simulateRollover
  };
}