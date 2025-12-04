import { formatCurrency } from './helpers';

// --- INCOME CALCULATIONS ---
export const calculateTotalIncome = (income) => {
  return (income?.source1 || 0) + (income?.source2 || 0);
};

// --- SPENDING CALCULATIONS ---
export const calculateTotalSpent = (transactions) => {
  return transactions.reduce((sum, tx) => {
    const amt = parseFloat(tx.amount) || 0;
    return tx.isIncome ? sum : sum + amt; // Income transactions don't count towards spending
  }, 0);
};

// --- BUDGETING CALCULATIONS ---
export const calculateTotalBudgeted = (categories, debts) => {
  return categories.reduce((acc, cat) => {
    return acc + cat.subcategories.reduce((subAcc, sub) => {
      // If linked to debt, use the debt payment amount, otherwise use budgeted amount
      if (sub.linkedDebtId && debts) {
        const debt = debts.find((d) => d.id === sub.linkedDebtId);
        if (debt) {
           return subAcc + (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
        }
      }
      return subAcc + (sub.budgeted || 0);
    }, 0);
  }, 0);
};

// --- AGGREGATE SELECTORS ---

// Returns the "Safe to Spend" number (Income - Actual Spent - Savings)
export const calculateSafeToSpend = (income, transactions, savingsGoal) => {
  const totalIncome = calculateTotalIncome(income);
  const totalSpent = calculateTotalSpent(transactions);
  return totalIncome - totalSpent - (savingsGoal || 0);
};

// Returns a map { subCategoryId: amountSpent } for the Budget View cards
export const calculateSpentBySubCategory = (transactions) => {
  const spentMap = {};
  transactions.forEach((tx) => {
    if (tx.isIncome) return;
    
    if (tx.isSplit && tx.splits) {
      // Iterate through splits
      tx.splits.forEach(split => {
        const amt = parseFloat(split.amount) || 0;
        if (split.subCategoryId) {
           spentMap[split.subCategoryId] = (spentMap[split.subCategoryId] || 0) + amt;
        }
      });
    } else {
      // Normal transaction
      const amount = parseFloat(tx.amount) || 0;
      if (tx.subCategoryId) {
         spentMap[tx.subCategoryId] = (spentMap[tx.subCategoryId] || 0) + amount;
      }
    }
  });
  return spentMap;
};

// Returns array for Pie Charts [{ name: "Food", value: 500 }, ...]
// --- CATEGORY LEVEL CALCULATIONS ---
export const calculateCategoryTotals = (category, spentBySubCategory, debts = []) => {
  let budgeted = 0;
  let spent = 0;

  category.subcategories.forEach((sub) => {
    if (sub.type === 'deduction') return;

    let subBudgeted = sub.budgeted || 0;
    
    // Override with Debt Payment if linked
    if (sub.linkedDebtId) {
      const debt = debts.find((d) => d.id === sub.linkedDebtId);
      if (debt) {
        subBudgeted = (debt.monthlyPayment || 0) + (debt.extraMonthlyPayment || 0);
      }
    }

    budgeted += subBudgeted;
    spent += spentBySubCategory[sub.id] || 0;
  });

  return {
    totalBudgeted: budgeted,
    totalSpent: spent,
    remaining: budgeted - spent
  };
};

export const calculateSpendingByCategory = (transactions, categories) => {
  if (!transactions || transactions.length === 0) return [];
  
  // 1. Map subCategoryId -> Category Name
  const subCategoryToCategoryMap = {};
  categories.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      subCategoryToCategoryMap[sub.id] = cat.name;
    });
  });

  // 2. Aggregate
  const categoryTotals = {};
  transactions.forEach((tx) => {
    if (tx.isIncome) return;
    
    if (tx.isSplit && tx.splits) {
       tx.splits.forEach(split => {
          const categoryName = subCategoryToCategoryMap[split.subCategoryId];
          if (categoryName) {
             const amount = parseFloat(split.amount) || 0;
             categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
          }
       });
    } else {
       const categoryName = subCategoryToCategoryMap[tx.subCategoryId];
       if (categoryName) {
          const amount = parseFloat(tx.amount) || 0;
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
       }
    }
  });

  // 3. Format
  return Object.keys(categoryTotals)
    .map((name) => ({ name, value: categoryTotals[name] }))
    .filter((c) => c.value > 0);
};