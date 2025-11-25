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
import { GlassCurrencyInput } from '../../components/ui/FormInputs';

export default function ReportsDashboard({
  categories,
  transactions,
  debts,
  income,
  savingsGoal,
  onIncomeChange,
  onSavingsChange,
  theme = 'light'
}) {
  // Zillion Theme Colors
  const COLORS = ['#34d399', '#818cf8', '#f472b6', '#fbbf24', '#60a5fa'];

  const [income1, setIncome1] = useState(income.source1 === 0 ? '' : income.source1);
  const [income2, setIncome2] = useState(income.source2 === 0 ? '' : income.source2);
  const [goal, setGoal] = useState(savingsGoal === 0 ? '' : savingsGoal);

  useEffect(() => {
    setIncome1(income.source1 === 0 ? '' : income.source1);
    setIncome2(income.source2 === 0 ? '' : income.source2);
    setGoal(savingsGoal === 0 ? '' : savingsGoal);
  }, [income, savingsGoal]);

  const handleIncomeChangeInternal = (source, value) => {
    const numericValue = parseFloat(value) || 0;
    if (source === 'source1') setIncome1(numericValue === 0 ? '' : numericValue);
    if (source === 'source2') setIncome2(numericValue === 0 ? '' : numericValue);
    onIncomeChange(source, numericValue);
  };

  const handleSavingsChangeInternal = (value) => {
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

  // Style Classes
  const cardClass = `p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-lg shadow-black/20' : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}`;
  const textMain = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-8">
      <h2 className={`text-3xl font-semibold ${textMain}`}>Reports</h2>

      <div className={cardClass}>
        <h3 className={`mb-6 text-xl font-bold ${textMain}`}>Monthly Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCurrencyInput 
            label="Your Income" 
            value={income1} 
            onChange={(val) => handleIncomeChangeInternal('source1', val)} 
            placeholder="0.00" 
            theme={theme} 
          />
          <GlassCurrencyInput 
            label="Partner's Income" 
            value={income2} 
            onChange={(val) => handleIncomeChangeInternal('source2', val)} 
            placeholder="0.00" 
            theme={theme} 
          />
          <GlassCurrencyInput 
            label="Monthly Savings Goal" 
            value={goal} 
            onChange={handleSavingsChangeInternal} 
            placeholder="0.00" 
            theme={theme} 
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={`mb-4 text-xl font-bold ${textMain}`}>Spending by Category</h3>
        {spendingByCategory.length === 0 ? (
          <p className={`text-center py-12 ${textSub}`}>No spending data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie 
                data={spendingByCategory} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                outerRadius={100} 
                fill="#8884d8" 
                dataKey="value" 
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                stroke={theme === 'dark' ? '#0f172a' : '#fff'}
                strokeWidth={2}
              >
                {spendingByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '12px', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={cardClass}>
        <h3 className={`mb-4 text-xl font-bold ${textMain}`}>Income vs. Outflow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${value}`} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
            <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '12px', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="value" fill="#8884d8" radius={[6, 6, 0, 0]}>
               {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#34d399' : index === 1 ? '#60a5fa' : '#f472b6'} />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}