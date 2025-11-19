import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

export default function ReportsDashboard({
  categories,
  transactions,
  debts,
  income,
  savingsGoal,
  onIncomeChange,
  onSavingsChange,
}) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const [income1, setIncome1] = useState(income.source1 === 0 ? '' : income.source1);
  const [income2, setIncome2] = useState(income.source2 === 0 ? '' : income.source2);
  const [goal, setGoal] = useState(savingsGoal === 0 ? '' : savingsGoal);

  useEffect(() => {
    setIncome1(income.source1 === 0 ? '' : income.source1);
    setIncome2(income.source2 === 0 ? '' : income.source2);
    setGoal(savingsGoal === 0 ? '' : savingsGoal);
  }, [income, savingsGoal]);

  const handleFocus = (e) => e.target.select();

  const handleIncomeBlur = (source, value) => {
    const numericValue = parseFloat(value) || 0;
    if (source === 'source1') setIncome1(numericValue === 0 ? '' : numericValue);
    if (source === 'source2') setIncome2(numericValue === 0 ? '' : numericValue);
    onIncomeChange(source, numericValue);
  };

  const handleSavingsBlur = (value) => {
    const numericValue = parseFloat(value) || 0;
    setGoal(numericValue === 0 ? '' : numericValue);
    onSavingsChange(numericValue);
  };

  const subCategoryToCategoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        map[sub.id] = cat.name;
      });
    });
    return map;
  }, [categories]);

  const spendingByCategory = useMemo(() => {
    if (transactions.length === 0) return [];
    const categoryTotals = {};
    transactions.forEach((tx) => {
      if (tx.isIncome) return;
      const categoryName = subCategoryToCategoryMap[tx.subCategoryId];
      if (categoryName) {
        const amount = parseFloat(tx.amount) || 0;
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
      }
    });
    return Object.keys(categoryTotals)
      .map((name) => ({ name, value: categoryTotals[name] }))
      .filter((c) => c.value > 0);
  }, [transactions, subCategoryToCategoryMap]);

  const totalIncome = (income.source1 || 0) + (income.source2 || 0);
  const totalSpent = transactions.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount) || 0;
    return tx.isIncome ? sum - amount : sum + amount;
  }, 0);
  const totalBudgeted = categories.reduce(
    (catSum, cat) => catSum + cat.subcategories.reduce((subSum, sub) => subSum + (sub.budgeted || 0), 0),
    0
  );

  const barChartData = [
    { name: 'Income', value: totalIncome },
    { name: 'Budgeted', value: totalBudgeted },
    { name: 'Spent', value: totalSpent },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-gray-800">Reports</h2>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">Monthly Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Income</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><DollarSign className="h-5 w-5 text-gray-400" /></div>
              <input type="number" value={income1} onChange={(e) => setIncome1(e.target.value)} onFocus={handleFocus} onBlur={(e) => handleIncomeBlur('source1', e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Partner's Income</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><DollarSign className="h-5 w-5 text-gray-400" /></div>
              <input type="number" value={income2} onChange={(e) => setIncome2(e.target.value)} onFocus={handleFocus} onBlur={(e) => handleIncomeBlur('source2', e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Savings Goal</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Target className="h-5 w-5 text-gray-400" /></div>
              <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} onFocus={handleFocus} onBlur={(e) => handleSavingsBlur(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm" placeholder="0.00" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">Spending by Category</h3>
        {spendingByCategory.length === 0 ? (
          <p className="text-gray-500">No spending data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie data={spendingByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {spendingByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">Income vs. Outflow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}