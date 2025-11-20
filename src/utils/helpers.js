import { auth } from '../config/firebase'; // Importing auth for the userName logic

// Helper function to get current date as YYYY-MM
export const getYearMonthKey = (date = new Date()) => {
  return date.toISOString().split('T')[0].slice(0, 7); // "YYYY-MM"
};

// Helper function to get current date as YYYY-MM-DD
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// NEW: Default state for a new *monthlyData* entry
export const getNewMonthEntry = (copyCategories = []) => ({
  income: {
    source1: 0,
    source2: 0,
  },
  savingsGoal: 0,
  categories: copyCategories.map((cat) => ({
    ...cat,
    subcategories: cat.subcategories.map((sub) => ({
      ...sub,
      // Reset budgeted amount for expenses, keep for sinking funds/debts
      budgeted:
        sub.type === 'sinking_fund' || sub.linkedDebtId ? sub.budgeted : 0,
    })),
  })),
  transactions: [],
  sinkingFundBalances: {}, // Balances will be rolled over by reset function
});

// NEW: Default state for a new *user document*
// This is now a function to dynamically set the current month
export const getDefaultBudgetData = () => {
  const currentMonthKey = getYearMonthKey(); // "YYYY-MM"

  return {
    currentStep: 0, // <-- CHANGE THIS FROM 1 to 0
    userName: '', // <-- ADD THIS LINE
    bankAccounts: [],
    defaultAccountId: null,
    savingsAccountId: null,
    mainSavingsAccountId: null,
    debts: [],
    hasMigratedV2: true, // Flag for this new data structure

    // --- NEW FIELDS FOR SHARING ---
    linkedBudgetId: null, // If set, this user is a "member" listening to another budget
    sharedWith: null, // If set, this user is an "owner" sharing their budget
    // --------------------------------

    // NEW: All monthly data is nested
    monthlyData: {
      [currentMonthKey]: getNewMonthEntry(), // Create entry for the current month
    },

    // DEPRECATED (will be removed by migration)
    // income: ...,
    // savingsGoal: ...,
    // categories: ...,
    // transactions: ...,
    // sinkingFundBalances: ...,
    // lastResetDate: ...,
  };
};

// Formats a number to USD currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Helper function to export transactions to CSV
export const exportTransactionsToCSV = (
  transactions,
  subCategoryMap,
  accountMap,
  filename
) => {
  // 1. Create CSV Header
  const headers = [
    'Date',
    'Merchant',
    'Amount',
    'Category',
    'Sub-Category',
    'Account',
    'Notes',
    'PrincipalPaid',
    'InterestPaid',
  ];
  const csvRows = [headers.join(',')];

  // 2. Create Data Rows
  for (const tx of transactions) {
    const subCatInfo = subCategoryMap.get(tx.subCategoryId) || {
      name: 'N/A',
      catName: tx.isIncome ? 'Income' : 'N/A',
    };
    const accountName = accountMap.get(tx.accountId) || 'N/A';

    const row = [
      `"${tx.date}"`,
      `"${tx.merchant || ''}"`,
      tx.amount || 0,
      `"${subCatInfo.catName}"`,
      `"${subCatInfo.name}"`,
      `"${accountName}"`,
      `"${tx.notes || ''}"`,
      tx.principalPaid || 0,
      tx.interestPaid || 0,
    ];
    csvRows.push(row.join(','));
  }

  // 3. Create Blob and Download Link
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// --- PAYDAY CALCULATOR ---
export const calculatePaydayStats = (config) => {
  if (!config) return null;
  const { frequency, amount, anchorDate, semiMonth1, semiMonth2, monthlyDay, adjustment } = config;
  const numAmount = parseFloat(amount) || 0;
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize today
  
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let payDates = [];
  let nextPayDate = null;

  // Helper to adjust for weekends
  const adjustDate = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (adjustment === 'before') {
      if (day === 0) d.setDate(d.getDate() - 2); // Sun -> Fri
      if (day === 6) d.setDate(d.getDate() - 1); // Sat -> Fri
    } else if (adjustment === 'after') {
      if (day === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
      if (day === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
    }
    return d;
  };

  if (frequency === 'weekly' || frequency === 'biweekly' || frequency === 'fourweeks') {
    if (!anchorDate) return { nextPayDayStr: 'Unknown', monthlyTotal: 0, payCheckCount: 0, nextDateObj: null };
    
    const interval = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 28;
    const parts = anchorDate.split('-');
    if (parts.length !== 3) return { nextPayDayStr: 'Invalid Date', monthlyTotal: 0, payCheckCount: 0, nextDateObj: null };
    
    let iterDate = new Date(anchorDate + 'T12:00:00'); 
    
    // Catch up to current year/month
    let loops = 0;
    const lookahead = new Date(currentYear, currentMonth + 2, 1); // Limit lookahead
    while (iterDate < lookahead && loops < 1000) {
      const adjusted = adjustDate(new Date(iterDate));
      
      // If it's in current month, count it
      if (iterDate.getMonth() === currentMonth && iterDate.getFullYear() === currentYear) {
        payDates.push(adjusted);
      }
      
      // If it's today or future, and we haven't found next yet, set it
      // We compare using the adjusted date to allow for "Today is payday"
      if (!nextPayDate) {
        const todayTime = today.getTime();
        const adjTime = adjusted.setHours(0,0,0,0);
        if (adjTime >= todayTime) {
           nextPayDate = adjusted;
        }
      }
      
      iterDate.setDate(iterDate.getDate() + interval);
      loops++;
    }

  } else if (frequency === 'semimonthly') {
    const d1 = parseInt(semiMonth1) || 1;
    const d2 = semiMonth2 === 'last' ? new Date(currentYear, currentMonth + 1, 0).getDate() : (parseInt(semiMonth2) || 15);
    
    // Check this month and next month to find next payday
    const datesToCheck = [
      new Date(currentYear, currentMonth, d1),
      new Date(currentYear, currentMonth, d2),
      new Date(currentYear, currentMonth + 1, d1)
    ];
    
    const adjustedDates = datesToCheck.map(d => adjustDate(d));
    
    // Current Month Stats
    adjustedDates.slice(0, 2).forEach(d => {
       if (d.getMonth() === currentMonth) payDates.push(d);
    });
    
    // Find next
    nextPayDate = adjustedDates.find(d => d.setHours(0,0,0,0) >= today.getTime());
    
  } else if (frequency === 'monthly') {
    const d = monthlyDay === 'last' ? new Date(currentYear, currentMonth + 1, 0).getDate() : (parseInt(monthlyDay) || 1);
    
    const thisMonthDate = new Date(currentYear, currentMonth, d);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, d);
    
    const adjThis = adjustDate(thisMonthDate);
    const adjNext = adjustDate(nextMonthDate);
    
    if (adjThis.getMonth() === currentMonth) payDates.push(adjThis);
    
    nextPayDate = adjThis.setHours(0,0,0,0) >= today.getTime() ? adjThis : adjNext;
  }

  const totalMonthlyIncome = payDates.length * numAmount;
  
  return {
    nextPayDayStr: nextPayDate ? nextPayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Unknown',
    nextDateObj: nextPayDate,
    monthlyTotal: totalMonthlyIncome,
    payCheckCount: payDates.length
  };
};