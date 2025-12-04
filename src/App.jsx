import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// --- Custom Hooks (Controller Layer) ---
import { useBudgetData } from './hooks/useBudgetData';
import { useBudgetActions } from './hooks/useBudgetActions';

// --- Config & Context ---
import { auth } from './config/firebase';
import { BudgetProvider } from './context/BudgetContext';
import { getDefaultBudgetData } from './utils/helpers';

// --- UI Components ---
import { ThemeToggle } from './components/ui/ThemeToggle';
import { AmbientBackground } from './components/ui/SharedUI';

// --- Views & Components (Static Imports for Critical Path) ---
import LoginScreen from './views/auth/LoginScreen';
import Sidebar from './components/layout/Sidebar';
import { HeaderBar, HeroBar } from './components/layout/Headers';
import { RecentActivityCard, UpcomingBillsCard, TopMerchantsCard } from './components/cards/Widgets';
import RecurringTransactionsWidget from './components/cards/RecurringWidget';
import { CalendarWidget } from './components/cards/CalendarWidget';

// --- Wizard Views (Grouped Lazy Load could be applied here too, but keeping static for stability during setup) ---
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

// --- Dashboard Views (Lazy Loaded) ---
const BudgetView = lazy(() => import('./views/dashboard/BudgetView'));
const ReportsDashboard = lazy(() => import('./views/dashboard/ReportsView'));
const DebtsView = lazy(() => import('./views/dashboard/DebtsView'));
const AccountsView = lazy(() => import('./views/dashboard/AccountsView'));
const SettingsView = lazy(() => import('./views/dashboard/SettingsView'));
const TransactionsView = lazy(() => import('./views/dashboard/TransactionsView'));

// --- Modals ---
import { JoinBudgetModal, ConfirmLeaveModal, ConfirmRemoveModal } from './components/modals/SharingModals';
import { RebalanceBudgetModal } from './components/modals/BudgetAdjustmentModals';
import AddTransactionModal from './components/modals/AddTransactionModal';
import { AddIncomeModal, AddTransferModal, LumpSumPaymentModal } from './components/modals/TransferModals';
import { TransactionDetailModal, AllTransactionsModal, AccountTransactionModal } from './components/modals/TransactionListModals';
import { DebtDetailModal, EditDebtModal } from './components/modals/DebtModals';
import StartOfMonthModal from './components/modals/StartOfMonthModal';
import PaydayModal from './components/modals/PaydayModal';

// ========================================================================
// MAIN BUDGET APP LOGIC (Controller)
// ========================================================================
function BudgetApp({ userId, onSignOut, joinBudgetId }) {
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

  // --- 1. Hook: Data Layer ---
  const data = useBudgetData(userId);
  const { 
    loading, 
    userDoc, 
    budgetData, 
    currentMonthData, 
    viewDate, 
    paydayModalData, 
    effectiveBudgetId 
  } = data;

  // --- 2. Hook: Actions Layer ---
  const actions = useBudgetActions({
    userId,
    effectiveBudgetId,
    budgetData,
    currentMonthData,
    currentMonthTransactions: currentMonthData.transactions,
    viewDate,
    updateBudget: data.updateBudget,
    userDoc
  });

  // --- 3. View State (Router / Modals) ---
  const [activeTab, setActiveTab] = useState('budget');
  
  // Modal States
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
  const [calendarDayFilter, setCalendarDayFilter] = useState(null);

  const [isStartMonthModalOpen, setIsStartMonthModalOpen] = useState(false);

  // --- Effect: Handle URL Join Param ---
  useEffect(() => {
    if (joinBudgetId && !loading && !userDoc?.linkedBudgetId) {
      setPendingJoinId(joinBudgetId);
      setIsJoinModalOpen(true);
    }
  }, [joinBudgetId, loading, userDoc]);

  // --- Derived Calculations for Wizard ---
  const monthlyDataKeys = Object.keys(budgetData.monthlyData);
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

  // --- Context Value ---
  const contextValue = {
    budgetData,
    currentMonthData,
    viewDate,
    theme,
    userDoc,
    effectiveBudgetId,
    actions: {
      ...actions, // Spread all action handlers
      setViewDate: data.setViewDate,
      // UI Modals triggers
      openTransactionModal: () => setIsTransactionModalOpen(true),
      openTransactionDetails: (filter) => { setTransactionModalFilter(filter); setIsTransactionDetailModalOpen(true); },
      openAllTransactionsModal: () => setIsAllTransactionsModalOpen(true),
      openStartMonthModal: () => setIsStartMonthModalOpen(true),
      openDebtDetails: (debt) => { setSelectedDebt(debt); setIsDebtDetailModalOpen(true); },
      openLumpSumModal: (id) => { setLumpSumDebtId(id); setIsLumpSumModalOpen(true); },
      openEditDebtModal: (debt) => { setEditingDebt(debt); setIsDebtDetailModalOpen(false); },
      openAccountTransactions: (filter) => { setAccountModalFilter(filter); setIsAccountModalOpen(true); },
      openTransferModal: () => setIsTransferModalOpen(true),
      onFundSinkingFunds: () => { /* Placeholder logic if needed */ },
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /><span className="ml-4 text-lg text-gray-700">Loading Data...</span></div>;

  const isSetupComplete = typeof budgetData.currentStep !== 'number' || budgetData.currentStep > 13;

  return (
    <BudgetProvider value={contextValue}>
      <div className={`min-h-screen w-full font-sans transition-colors duration-1000 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <AmbientBackground theme={theme} />
        {isSetupComplete && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
        
        <div className="mx-auto w-full">
          <main>
            {isSetupComplete ? (
              <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_400px] gap-6 p-4 lg:p-6">
                <div className="hidden lg:block"><Sidebar activeTab={activeTab} onTabClick={setActiveTab} theme={theme} /></div>
                <div className={`flex flex-col ${activeTab === 'transactions' ? 'pt-0' : 'pt-2'} min-w-0`}>
                  {activeTab !== 'transactions' && (
                    <HeaderBar userName={budgetData.userName} viewDate={viewDate} monthlyDataKeys={monthlyDataKeys} setViewDate={data.setViewDate} onSimulateRollover={data.simulateRollover} onOpenTransactionModal={() => setIsTransactionModalOpen(true)} theme={theme} />
                  )}
                  {activeTab === 'budget' && <HeroBar categories={currentMonthData.categories} transactions={currentMonthData.transactions} income={currentMonthData.income} savingsGoal={currentMonthData.savingsGoal} debts={budgetData.debts} theme={theme} />}

                  <div className={`${activeTab === 'transactions' ? 'mt-0' : 'mt-8'} w-full`}>
                    <Suspense fallback={
                      <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-zillion-400" />
                      </div>
                    }>
                      {activeTab === 'budget' && <BudgetView />}
                      {activeTab === 'reports' && <ReportsDashboard categories={currentMonthData.categories} transactions={currentMonthData.transactions} debts={budgetData.debts} income={currentMonthData.income} savingsGoal={currentMonthData.savingsGoal} onIncomeChange={actions.handleIncomeChange} onSavingsChange={actions.handleSavingsChange} theme={theme} />}
                      {activeTab === 'debts' && <DebtsView debts={budgetData.debts} onDebtsChange={actions.handleDebtsChange} onOpenDebtDetails={(debt) => { setSelectedDebt(debt); setIsDebtDetailModalOpen(true); }} onOpenLumpSumModal={() => { setLumpSumDebtId(null); setIsLumpSumModalOpen(true); }} theme={theme} />}
                      {activeTab === 'accounts' && <AccountsView accounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} onAccountsChange={actions.handleBankAccountsChange} onSetDefaultAccount={actions.handleSetDefaultAccount} savingsAccountId={budgetData.savingsAccountId} onSavingsAccountChange={actions.handleSavingsAccountChange} mainSavingsAccountId={budgetData.mainSavingsAccountId} onMainSavingsAccountChange={actions.handleMainSavingsAccountChange} onOpenAccountTransactions={(filter) => { setAccountModalFilter(filter); setIsAccountModalOpen(true); }} onOpenTransferModal={() => setIsTransferModalOpen(true)} theme={theme} />}
                      {activeTab === 'settings' && <SettingsView onSignOut={onSignOut} budgetId={userId} updateBudget={data.updateBudget} userDoc={userDoc} effectiveBudgetId={effectiveBudgetId} onOpenJoinModal={() => setIsJoinModalOpen(true)} onOpenLeaveModal={() => setIsLeaveModalOpen(true)} onOpenRemoveModal={() => setIsRemoveModalOpen(true)} sharingMessage={sharingMessage} setSharingMessage={setSharingMessage} setActiveTab={setActiveTab} theme={theme} />}
                      {activeTab === 'transactions' && <TransactionsView transactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={actions.handleUpdateTransaction} onBulkSave={actions.handleBulkAddTransactions} onDeleteTransaction={actions.handleDeleteTransaction} onReturnTransaction={actions.handleReturnTransaction} onOpenTransactionModal={() => setIsTransactionModalOpen(true)} onBulkDelete={actions.handleBulkDeleteTransactions} onBulkCategoryUpdate={actions.handleBulkCategoryUpdate} theme={theme} />}
                      {['savings', 'account'].includes(activeTab) && <div className={`flex h-64 items-center justify-center rounded-3xl border-2 border-dashed transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}><p className="text-lg">This view is coming soon.</p></div>}
                    </Suspense>
                  </div>
                </div>

                <aside className="hidden xl:block sticky top-6 h-[calc(100vh-48px)] overflow-y-auto no-scrollbar pt-2 pb-6">
                  <div className="flex flex-col gap-6">
                    {activeTab === 'transactions' ? (
                      <div className="flex flex-col gap-6">
                        {/* Recurring Widget: Removed flex-1 constraint to allow natural stacking */}
                        <div className="h-[400px] flex-shrink-0">
                          <RecurringTransactionsWidget 
                            recurringTransactions={budgetData.recurringTransactions} 
                            onAdd={actions.handleAddRecurring} 
                            onUpdate={actions.handleUpdateRecurring}
                            onDelete={actions.handleDeleteRecurring}
                            handleUpdateRecurringField={actions.handleUpdateRecurringField}
                            categories={currentMonthData.categories}
                            transactions={currentMonthData.transactions}
                            onSaveTransaction={actions.handleSaveTransaction}
                            bankAccounts={budgetData.bankAccounts}
                            defaultAccountId={budgetData.defaultAccountId}
                            theme={theme}
                          />
                        </div>
                        
                        <CalendarWidget 
                            transactions={currentMonthData.transactions} 
                            onDayClick={setCalendarDayFilter} 
                            theme={theme} 
                        />
                        
                        <TopMerchantsCard 
                            transactions={currentMonthData.transactions} 
                            excludedMerchants={budgetData.excludedMerchants || []}
                            onUpdateExclusions={actions.handleUpdateExcludedMerchants}
                            theme={theme} 
                        />
                      </div>
                    ) : (
                      <>
                        <RecentActivityCard transactions={currentMonthData.transactions} categories={currentMonthData.categories} theme={theme} />
                        <UpcomingBillsCard 
                          recurringTransactions={budgetData.recurringTransactions} 
                          categories={currentMonthData.categories}
                          theme={theme} 
                        />
                      </>
                    )}
                  </div>
                </aside>
              </div>
            ) : (
              <>
                {budgetData.currentStep === 0 && <WizardStep_Welcome onStartNew={() => actions.handleStepChange(2)} onStartJoin={() => actions.handleStepChange(1)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 1 && <WizardStep_Join onJoin={actions.handleJoinBudget} onBack={() => actions.handleStepChange(0)} message={joinModalMessage} setMessage={setJoinModalMessage} joinBudgetId={joinBudgetId} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 2 && <WizardStep1a_AccountsInfo onBack={() => actions.handleStepChange(0)} onNext={() => actions.handleStepChange(3)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 3 && <WizardStep1b_MainSavingsAccount budgetData={budgetData} onAccountsChange={actions.handleBankAccountsChange} onMainSavingsAccountChange={actions.handleMainSavingsAccountChange} onBack={() => actions.handleStepChange(2)} onNext={() => actions.handleStepChange(4)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 4 && <WizardStep1c_DefaultAccount budgetData={budgetData} onAccountsChange={actions.handleBankAccountsChange} onSetDefaultAccount={actions.handleSetDefaultAccount} onBack={() => actions.handleStepChange(3)} onNext={() => actions.handleStepChange(5)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 5 && <WizardStep1d_SinkingFundAccount budgetData={budgetData} onAccountsChange={actions.handleBankAccountsChange} onSavingsAccountChange={actions.handleSavingsAccountChange} onBack={() => actions.handleStepChange(4)} onNext={() => actions.handleStepChange(6)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 6 && <WizardStep1e_AccountSummary budgetData={budgetData} onAccountsChange={actions.handleBankAccountsChange} onSetDefaultAccount={actions.handleSetDefaultAccount} onMainSavingsAccountChange={actions.handleMainSavingsAccountChange} onSavingsAccountChange={actions.handleSavingsAccountChange} onBack={() => actions.handleStepChange(5)} onNext={() => actions.handleStepChange(7)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 7 && <WizardStep2_Income budgetData={budgetData} income={currentMonthData.income} totalIncome={totalIncome} onIncomeChange={actions.handleIncomeChange} onSaveIncomeSettings={actions.handleSaveIncomeSettings} onSaveDeductions={actions.handleSaveDeductions} onNext={() => actions.handleStepChange(8)} onBack={() => actions.handleStepChange(6)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 8 && <WizardStep3_Savings budgetData={budgetData} savingsGoal={currentMonthData.savingsGoal} totalIncome={totalIncome} remainingAfterSavings={remainingAfterSavings} onSavingsChange={actions.handleSavingsChange} bankAccounts={budgetData.bankAccounts} mainSavingsAccountId={budgetData.mainSavingsAccountId} onMainSavingsAccountChange={actions.handleMainSavingsAccountChange} onNext={() => actions.handleStepChange(9)} onBack={() => actions.handleStepChange(7)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 9 && <WizardStep6_DebtSetup budgetData={budgetData} debts={budgetData.debts} onDebtsChange={actions.handleDebtsChange} onBack={() => actions.handleStepChange(8)} onNext={() => actions.handleStepChange(10)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 10 && <WizardStep4_Categories budgetData={budgetData} categories={currentMonthData.categories} onCategoriesChange={actions.handleCategoriesChange} onNext={() => actions.handleStepChange(11)} onBack={() => actions.handleStepChange(9)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 11 && <WizardStep_LinkDebts budgetData={budgetData} categories={currentMonthData.categories} debts={budgetData.debts} onCategoriesChange={actions.handleCategoriesChange} onBack={() => actions.handleStepChange(10)} onNext={() => actions.handleStepChange(12)} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 12 && <WizardStep5_AssignBudgets budgetData={budgetData} categories={currentMonthData.categories} remainingToBudget={remainingToBudget} onCategoriesChange={actions.handleCategoriesChange} debts={budgetData.debts} onBack={() => actions.handleStepChange(11)} bankAccounts={budgetData.bankAccounts} onFinishSetup={() => actions.handleStepChange(14)} onUpdateBankAccounts={actions.handleBankAccountsChange} onUpdateDebts={actions.handleDebtsChange} sinkingFundBalances={currentMonthData.sinkingFundBalances} onUpdateSinkingFundBalances={actions.handleSinkingFundBalancesChange} savingsAccountId={budgetData.savingsAccountId} theme={theme} toggleTheme={toggleTheme} />}
                {budgetData.currentStep === 13 && <WizardStep7_Complete onGoToDashboard={() => actions.handleStepChange(14)} onStartOver={() => data.updateBudget(getDefaultBudgetData())} theme={theme} toggleTheme={toggleTheme} />}
              </>
            )}
          </main>
        </div>
        
        {/* Modals */}
        <JoinBudgetModal isOpen={isJoinModalOpen} onClose={() => { setIsJoinModalOpen(false); setPendingJoinId(null); }} onJoin={actions.handleJoinBudget} initialBudgetId={pendingJoinId} message={joinModalMessage} setMessage={setJoinModalMessage} theme={theme} />
        <ConfirmLeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onConfirm={actions.handleLeaveBudget} theme={theme} />
        <ConfirmRemoveModal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} onConfirm={actions.handleRemovePartner} partnerName={userDoc?.sharedWith?.name} theme={theme} />
        <RebalanceBudgetModal isOpen={isRebalanceModalOpen} onClose={() => setIsRebalanceModalOpen(false)} rebalanceData={rebalanceData} onSave={(newCats) => { actions.handleCategoriesChange(newCats); setIsRebalanceModalOpen(false); }} theme={theme} />

        <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={actions.handleSaveTransaction} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} spentOnDebtsMap={spentOnDebtsMap} theme={theme} />
        <AddIncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSave={actions.handleSaveIncome} bankAccounts={budgetData.bankAccounts} theme={theme} />
        <AddTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSave={actions.handleSaveTransfer} bankAccounts={budgetData.bankAccounts} theme={theme} />

        {/* Calendar Drill-down Modal */}
        <TransactionDetailModal 
            isOpen={!!calendarDayFilter} 
            onClose={() => setCalendarDayFilter(null)} 
            filter={calendarDayFilter ? { type: 'date', date: calendarDayFilter, name: calendarDayFilter } : null}
            allTransactions={currentMonthData.transactions}
            categories={currentMonthData.categories}
            bankAccounts={budgetData.bankAccounts}
            onSaveTransaction={actions.handleUpdateTransaction}
            onDeleteTransaction={actions.handleDeleteTransaction}
            onReturnTransaction={actions.handleReturnTransaction}
            theme={theme}
        />

        <TransactionDetailModal isOpen={isTransactionDetailModalOpen} onClose={() => setIsTransactionDetailModalOpen(false)} filter={transactionModalFilter} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={actions.handleUpdateTransaction} onDeleteTransaction={actions.handleDeleteTransaction} onReturnTransaction={actions.handleReturnTransaction} theme={theme} />
        <AllTransactionsModal isOpen={isAllTransactionsModalOpen} onClose={() => setIsAllTransactionsModalOpen(false)} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={actions.handleUpdateTransaction} onDeleteTransaction={actions.handleDeleteTransaction} onReturnTransaction={actions.handleReturnTransaction} theme={theme} />
        <AccountTransactionModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} filter={accountModalFilter} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} bankAccounts={budgetData.bankAccounts} onSaveTransaction={actions.handleUpdateTransaction} onDeleteTransaction={actions.handleDeleteTransaction} onReturnTransaction={actions.handleReturnTransaction} theme={theme} />

        <DebtDetailModal isOpen={isDebtDetailModalOpen} onClose={() => setIsDebtDetailModalOpen(false)} debt={selectedDebt} onUpdateDebt={() => { }} allTransactions={currentMonthData.transactions} categories={currentMonthData.categories} onOpenLumpSumModal={(id) => { setLumpSumDebtId(id); setIsLumpSumModalOpen(true); setIsDebtDetailModalOpen(false); }} onOpenEditModal={(debt) => { setEditingDebt(debt); setIsDebtDetailModalOpen(false); }} theme={theme} />
        <LumpSumPaymentModal isOpen={isLumpSumModalOpen} onClose={() => { setIsLumpSumModalOpen(false); setLumpSumDebtId(null); }} onSave={() => { }} debts={budgetData.debts} bankAccounts={budgetData.bankAccounts} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} initialDebtId={lumpSumDebtId} theme={theme} />
        <EditDebtModal isOpen={!!editingDebt} onClose={() => setEditingDebt(null)} onSave={() => { }} debt={editingDebt} theme={theme} />

        <StartOfMonthModal isOpen={isStartMonthModalOpen} onClose={() => setIsStartMonthModalOpen(false)} bankAccounts={budgetData.bankAccounts} onUpdateAccounts={actions.handleBankAccountsChange} categories={currentMonthData.categories} sinkingFundBalances={currentMonthData.sinkingFundBalances} defaultAccountId={budgetData.defaultAccountId} savingsAccountId={budgetData.savingsAccountId} mainSavingsAccountId={budgetData.mainSavingsAccountId} theme={theme} />
        <PaydayModal 
          isOpen={!!paydayModalData} 
          onClose={() => data.setPaydayModalData(null)} 
          payeeName={paydayModalData?.name} 
          expectedAmount={paydayModalData?.amount} 
          onConfirm={(amt, diff) => actions.handlePaydayConfirm(amt, diff, paydayModalData)} 
          bankAccounts={budgetData.bankAccounts} 
          categories={currentMonthData.categories} 
          sinkingFunds={currentMonthData.sinkingFundBalances} 
          theme={theme} 
        />
      </div>
    </BudgetProvider>
  );
}

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