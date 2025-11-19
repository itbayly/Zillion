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