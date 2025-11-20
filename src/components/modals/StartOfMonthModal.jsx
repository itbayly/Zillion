import React, { useState, useMemo, useEffect } from 'react';
import { X, ArrowRight, Check, RefreshCw, Landmark, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function StartOfMonthModal({
  isOpen,
  onClose,
  bankAccounts = [], // Default to empty array
  onUpdateAccounts,
  categories = [],   // Default to empty array
  sinkingFundBalances = {}, // Default to empty object
  defaultAccountId,
  savingsAccountId,
  mainSavingsAccountId,
}) {
  const [step, setStep] = useState(1);
  
  // Initialize with values immediately to prevent "Uncontrolled Input" error
  const [tempBalances, setTempBalances] = useState({});

  // Sync state when modal opens or accounts change
  useEffect(() => {
    if (isOpen && bankAccounts.length > 0) {
      const initial = {};
      bankAccounts.forEach(acc => {
        initial[acc.id] = acc.balance;
      });
      setTempBalances(initial);
      setStep(1);
    }
  }, [isOpen, bankAccounts]);

  const handleBalanceChange = (id, value) => {
    setTempBalances(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  };

  // --- CALCULATIONS ---
  const calculationData = useMemo(() => {
    // 1. Calculate Target for Spending Account
    const totalExpenseBudget = categories.reduce((sum, cat) => {
      return sum + (cat.subcategories || []).reduce((subSum, sub) => {
        return sub.type === 'expense' ? subSum + (sub.budgeted || 0) : subSum;
      }, 0);
    }, 0);

    // 2. Calculate Target for Sinking Funds
    const totalSinkingFunds = Object.values(sinkingFundBalances).reduce((sum, val) => sum + val, 0);

    // 3. Get Current Balances (safely)
    const currentSpending = tempBalances[defaultAccountId] || 0;
    const currentSinking = tempBalances[savingsAccountId] || 0;

    // 4. Calculate Transfers
    const spendingDiff = totalExpenseBudget - currentSpending;
    const sinkingDiff = totalSinkingFunds - currentSinking;

    return {
      totalExpenseBudget,
      totalSinkingFunds,
      spendingDiff,
      sinkingDiff
    };
  }, [categories, sinkingFundBalances, tempBalances, defaultAccountId, savingsAccountId]);

  const handleConfirmBalances = () => {
    const updatedAccounts = bankAccounts.map(acc => ({
      ...acc,
      balance: tempBalances[acc.id] !== undefined ? tempBalances[acc.id] : acc.balance
    }));
    onUpdateAccounts(updatedAccounts);
    setStep(2);
  };

  const getAccountName = (id) => bankAccounts.find(a => a.id === id)?.name || 'Account';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        
        {/* --- HEADER --- */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Step 1: Confirm Bank Balances' : 'Step 2: Monthly Transfers'}
          </h2>
          <p className="text-sm text-gray-500">
            {step === 1 
              ? "Open your banking app and ensure Zillion matches your current real-world balances." 
              : "Based on your budget, here is how you should move your money."}
          </p>
        </div>

        {/* --- STEP 1: RECONCILE --- */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 max-h-[50vh] overflow-y-auto p-1">
              {bankAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border border-gray-200">
                      <Landmark className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{acc.name}</p>
                      <p className="text-xs text-gray-500">
                        {acc.id === defaultAccountId ? 'Spending Account' : 
                         acc.id === savingsAccountId ? 'Sinking Fund Account' : 
                         acc.id === mainSavingsAccountId ? 'Main Income' : 'Other'}
                      </p>
                    </div>
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-bold text-gray-400 ml-1">Current Balance</label>
                    <input
                      type="number"
                      // SAFETY: Fallback to empty string if undefined to keep input "controlled"
                      value={tempBalances[acc.id] !== undefined ? tempBalances[acc.id] : ''}
                      onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end border-t pt-4">
              <button onClick={handleConfirmBalances} className="inline-flex items-center rounded-md bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                Balances Confirmed <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: INSTRUCTIONS --- */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-4">
              
              {/* Spending Account Instruction */}
              <div className="p-4 rounded-lg border border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-blue-900 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Spending Account ({getAccountName(defaultAccountId)})</h4>
                    <p className="text-sm text-blue-700 mt-1">Target: {formatCurrency(calculationData.totalExpenseBudget)} (Your Expense Budget)</p>
                    <p className="text-sm text-blue-600">Current: {formatCurrency(tempBalances[defaultAccountId] || 0)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${calculationData.spendingDiff > 0 ? 'text-blue-700' : 'text-green-700'}`}>
                      {calculationData.spendingDiff > 0 ? 'Add Money' : calculationData.spendingDiff < 0 ? 'Sweep Money' : 'Perfect'}
                    </span>
                  </div>
                </div>
                
                {Math.abs(calculationData.spendingDiff) > 0.01 && (
                  <div className="mt-3 p-3 bg-white rounded border border-blue-100 flex items-center gap-3 shadow-sm">
                    <ArrowLeftRight className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-800">
                      {calculationData.spendingDiff > 0 ? (
                        <>Transfer <strong className="text-lg">{formatCurrency(Math.abs(calculationData.spendingDiff))}</strong> from <strong>{getAccountName(mainSavingsAccountId)}</strong> to <strong>{getAccountName(defaultAccountId)}</strong></>
                      ) : (
                         <>Transfer <strong className="text-lg">{formatCurrency(Math.abs(calculationData.spendingDiff))}</strong> from <strong>{getAccountName(defaultAccountId)}</strong> back to <strong>{getAccountName(mainSavingsAccountId)}</strong></>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sinking Fund Instruction */}
              <div className="p-4 rounded-lg border border-l-4 border-l-emerald-500 bg-emerald-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-emerald-900 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Sinking Funds ({getAccountName(savingsAccountId)})</h4>
                    <p className="text-sm text-emerald-700 mt-1">Target: {formatCurrency(calculationData.totalSinkingFunds)} (Total SF Balances)</p>
                    <p className="text-sm text-emerald-600">Current: {formatCurrency(tempBalances[savingsAccountId] || 0)}</p>
                  </div>
                  <div className="text-right">
                     <span className={`text-lg font-bold ${calculationData.sinkingDiff > 0 ? 'text-blue-700' : 'text-green-700'}`}>
                      {calculationData.sinkingDiff > 0 ? 'Add Money' : calculationData.sinkingDiff < 0 ? 'Sweep Money' : 'Perfect'}
                    </span>
                  </div>
                </div>

                 {Math.abs(calculationData.sinkingDiff) > 0.01 && (
                  <div className="mt-3 p-3 bg-white rounded border border-emerald-100 flex items-center gap-3 shadow-sm">
                    <ArrowLeftRight className="h-5 w-5 text-gray-400" />
                    <div className="text-sm text-gray-800">
                      {calculationData.sinkingDiff > 0 ? (
                        <>Transfer <strong className="text-lg">{formatCurrency(Math.abs(calculationData.sinkingDiff))}</strong> from <strong>{getAccountName(mainSavingsAccountId)}</strong> to <strong>{getAccountName(savingsAccountId)}</strong></>
                      ) : (
                         <>Transfer <strong className="text-lg">{formatCurrency(Math.abs(calculationData.sinkingDiff))}</strong> from <strong>{getAccountName(savingsAccountId)}</strong> back to <strong>{getAccountName(mainSavingsAccountId)}</strong></>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
            
            <div className="mt-6 flex justify-between border-t pt-4">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">Back to Balances</button>
              <button onClick={onClose} className="inline-flex items-center rounded-md bg-gray-800 px-6 py-2 text-sm font-bold text-white hover:bg-gray-900">
                <Check className="mr-2 h-4 w-4" /> I've Made the Transfers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}