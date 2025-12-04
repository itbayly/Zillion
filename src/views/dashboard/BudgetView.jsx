import React, { useState, useMemo } from 'react';
import { PiggyBank, Settings, PlayCircle } from 'lucide-react';
import CategoryCard from '../../components/cards/CategoryCard';
import { EditBudgetStructureModal } from '../../components/modals/CategoryModals';
import { Button } from '../../components/ui/Button';
import { calculateSpentBySubCategory } from '../../utils/budgetSelectors';
import { useBudget } from '../../context/BudgetContext';

export default function BudgetView() {
  const { currentMonthData, budgetData, theme, actions } = useBudget();
  const { categories, transactions } = currentMonthData;
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

  // Calculate total spent for each sub-category
  const spentBySubCategory = useMemo(() => {
    return calculateSpentBySubCategory(transactions);
  }, [transactions]);

  return (
    <>
      <EditBudgetStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        categories={categories}
        onCategoriesChange={actions.onCategoriesChange}
        theme={theme}
      />

      <div className="space-y-0">
        {/* Action Buttons */}
        <div className="mb-8 flex justify-between items-center w-full max-w-[924px]">

          {/* Left Side: Start Month Button */}
          <Button
            variant="primary"
            onClick={actions.openStartMonthModal}
            icon={<PlayCircle className="w-4 h-4" />}
            className="shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Start Month Flow
          </Button>

          {/* Right Side: Existing Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={actions.onFundSinkingFunds}
              icon={<PiggyBank className="w-4 h-4" />}
              className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Fund Sinking Funds
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsStructureModalOpen(true)}
              icon={<Settings className="w-4 h-4" />}
              className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Edit Categories
            </Button>
          </div>
        </div>

        {/* Category Cards */}
        <div className="flex flex-col gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              spentBySubCategory={spentBySubCategory}
              // sinkingFundBalances and debts are now consumed internally by CategoryCard
            />
          ))}
        </div>

        {categories.length === 0 && (
          <div className={`w-full max-w-[924px] p-12 text-center rounded-3xl border-2 border-dashed transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
            <p className="font-sans">
              No categories set up yet.
            </p>
          </div>
        )}
      </div>
    </>
  );
}