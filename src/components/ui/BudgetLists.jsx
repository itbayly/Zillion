import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import { BudgetInput } from './FormInputs';
import { ProgressBar } from './SharedUI';

export function CategoryBudgetList({
  categories,
  spentBySubCategory,
  sinkingFundBalances,
  debts,
  onCategoriesChange,
  onOpenTransactionDetails,
}) {
  // Handle live editing of budgeted amounts
  const handleBudgetChange = (catId, subId, value) => {
    const newCategories = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) =>
            sub.id === subId ? { ...sub, budgeted: value } : sub
          ),
        };
      }
      return cat;
    });
    onCategoriesChange(newCategories);
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        // Calculate category-level totals
        const categoryBudgeted = category.subcategories.reduce(
          (sum, sub) => sum + (sub.budgeted || 0),
          0
        );
        const categorySpent = category.subcategories.reduce(
          (sum, sub) => sum + (spentBySubCategory[sub.id] || 0),
          0
        );
        const categoryRemaining = categoryBudgeted - categorySpent;

        return (
          <div
            key={category.id}
            className="rounded-lg border border-gray-200 bg-white shadow-md"
          >
            {/* Category Header - NOW A BUTTON */}
            <button
              type="button"
              onClick={() =>
                onOpenTransactionDetails({
                  type: 'category',
                  id: category.id,
                  name: category.name,
                })
              }
              className="flex w-full flex-col justify-between gap-2 rounded-t-lg bg-slate-50 px-4 py-4 text-left transition-colors hover:bg-slate-100 sm:flex-row sm:items-center sm:px-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {category.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">
                  Spent:{' '}
                  <span className="font-medium text-gray-700">
                    {formatCurrency(categorySpent)}
                  </span>
                </span>
                <span
                  className={`font-medium ${
                    categoryRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(categoryRemaining)} Remaining
                </span>
              </div>
            </button>

            {/* Sub-Categories List */}
            <ul className="divide-y divide-gray-200 p-0">
              {category.subcategories.map((sub) => {
                const isSinkingFund = sub.type === 'sinking_fund';
                const budgeted = sub.budgeted || 0;
                const spent = spentBySubCategory[sub.id] || 0;

                // Math Logic
                const rolloverBalance = isSinkingFund
                  ? sinkingFundBalances[sub.id] || 0
                  : 0;

                const totalAvailable = isSinkingFund
                  ? rolloverBalance + budgeted
                  : budgeted;

                const effectiveRemaining = totalAvailable - spent;

                const progressDenominator = totalAvailable;
                const progress =
                  progressDenominator > 0
                    ? (spent / progressDenominator) * 100
                    : 0;

                return (
                  <li key={sub.id}>
                    <div className="relative p-4 sm:px-6">
                      {/* Clickable overlay button */}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenTransactionDetails({
                            type: 'subcategory',
                            id: sub.id,
                            name: sub.name,
                          })
                        }
                        className="absolute inset-0 z-0 h-full w-full rounded-lg text-left transition-colors hover:bg-gray-50"
                        aria-label={`View transactions for ${sub.name}`}
                      ></button>

                      {/* Content Wrapper */}
                      <div className="relative z-10">
                        {/* Top Row: Name and Main Amount */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          {/* Left Side: Name, Type, Budget Input */}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-800">
                              {sub.name}
                            </span>
                            <span
                              className={`ml-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                isSinkingFund
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isSinkingFund ? 'Sinking Fund' : 'Expense'}
                            </span>

                            {/* Budgeted Input (moved to left side) */}
                            <div
                              className="mt-2 flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label className="text-sm text-gray-500">
                                {isSinkingFund ? 'Add:' : 'Budgeted:'}
                              </label>
                              <div className="w-28">
                                <BudgetInput
                                  value={
                                    sub.linkedDebtId
                                      ? (debts.find(
                                          (d) => d.id === sub.linkedDebtId
                                        )?.monthlyPayment || 0) +
                                        (debts.find(
                                          (d) => d.id === sub.linkedDebtId
                                        )?.extraMonthlyPayment || 0)
                                      : budgeted
                                  }
                                  onChange={(newValue) =>
                                    handleBudgetChange(
                                      category.id,
                                      sub.id,
                                      newValue
                                    )
                                  }
                                  disabled={!!sub.linkedDebtId}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Main Amount Display */}
                          <div className="flex-shrink-0 text-right">
                            <div
                              className={`text-2xl font-semibold ${
                                effectiveRemaining >= 0
                                  ? isSinkingFund
                                    ? 'text-gray-800'
                                    : 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(effectiveRemaining)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {isSinkingFund ? (
                                <>
                                  <span>Total Balance</span>
                                  <div
                                    className="text-xs text-gray-400"
                                    title={`(Balance: ${formatCurrency(
                                      rolloverBalance
                                    )} + Added: ${formatCurrency(
                                      budgeted
                                    )} - Spent: ${formatCurrency(spent)})`}
                                  >
                                    (Bal: {formatCurrency(rolloverBalance)} +{' '}
                                    {formatCurrency(budgeted)} -{' '}
                                    {formatCurrency(spent)})
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span>Remaining</span>
                                  <div className="text-xs text-gray-400">
                                    ({formatCurrency(spent)} spent)
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Progress Bar */}
                        <div className="relative z-10 mt-2">
                          <ProgressBar progress={progress} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}