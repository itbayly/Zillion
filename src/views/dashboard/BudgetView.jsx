import React, { useState, useMemo } from 'react';
import { PiggyBank, Settings, PlayCircle } from 'lucide-react';
import CategoryCard from '../../components/cards/CategoryCard';
import { EditBudgetStructureModal } from '../../components/modals/CategoryModals';

export default function BudgetView({
  categories,
  transactions,
  sinkingFundBalances,
  onCategoriesChange,
  onOpenTransactionDetails,
  onOpenAllTransactionsModal,
  onFundSinkingFunds,
  debts,
  onOpenStartMonthModal,
}) {
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

  // Calculate total spent for each sub-category
  const spentBySubCategory = useMemo(() => {
    const spentMap = {};
    transactions.forEach((tx) => {
      if (tx.isIncome) return;
      const amount = parseFloat(tx.amount) || 0;
      spentMap[tx.subCategoryId] = (spentMap[tx.subCategoryId] || 0) + amount;
    });
    return spentMap;
  }, [transactions]);

  return (
    <>
      <EditBudgetStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        categories={categories}
        onCategoriesChange={onCategoriesChange}
      />

      <div className="space-y-0">
        {/* Action Buttons - UPDATED Width to 924px */}
        {/* Action Buttons - UPDATED Width to 924px */}
        <div className="mb-8 flex justify-between items-center w-full max-w-[924px]">

          {/* Left Side: Start Month Button */}
          <button
            type="button"
            onClick={onOpenStartMonthModal}
            className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100"
          >
            <PlayCircle className="-ml-1 mr-2 h-4 w-4" />
            Start Month Flow
          </button>

          {/* Right Side: Existing Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onFundSinkingFunds}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <PiggyBank className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Fund Sinking Funds
            </button>
            <button
              type="button"
              onClick={() => setIsStructureModalOpen(true)}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Settings className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
              Edit Categories
            </button>
          </div>
        </div>

        {/* Category Cards */}
        <div className="flex flex-col gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              spentBySubCategory={spentBySubCategory}
              sinkingFundBalances={sinkingFundBalances}
              debts={debts}
              onOpenTransactionDetails={onOpenTransactionDetails}
            />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="w-full max-w-[924px] p-12 text-center rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-400 font-montserrat">
              No categories set up yet.
            </p>
          </div>
        )}
      </div>
    </>
  );
}