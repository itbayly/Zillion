import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, ArrowRight, AlertTriangle, PiggyBank, Landmark } from 'lucide-react';
import { formatCurrency, getTodayDate } from '../../utils/helpers';
import { WizardCurrencyInput } from '../ui/FormInputs';

export default function PaydayModal({
  isOpen,
  onClose,
  payeeName, // "You" or "Partner"
  expectedAmount,
  onConfirm, // Function(actualAmount, surplusAction)
  bankAccounts,
  sinkingFunds, // Object of balances
  categories
}) {
  const [step, setStep] = useState(1);
  const [actualAmount, setActualAmount] = useState('');
  
  // Surplus/Deficit State
  const [difference, setDifference] = useState(0);
  const [actionType, setActionType] = useState(''); // 'savings', 'spending', 'cover'
  const [selectedTargetId, setSelectedTargetId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setActualAmount(expectedAmount || '');
      setDifference(0);
      setActionType('');
      setSelectedTargetId('');
    }
  }, [isOpen, expectedAmount]);

  const handleCheckAmount = () => {
    const actual = parseFloat(actualAmount) || 0;
    const diff = actual - expectedAmount;
    setDifference(diff);

    if (Math.abs(diff) < 1) {
      // Exact match (or close enough)
      onConfirm(actual, null);
      onClose();
    } else {
      // Logic needed
      setStep(2);
    }
  };

  const handleFinalConfirm = () => {
    const actual = parseFloat(actualAmount) || 0;
    onConfirm(actual, {
      type: actionType,
      targetId: selectedTargetId,
      amount: Math.abs(difference)
    });
    onClose();
  };

  const isSurplus = difference > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>

        {/* --- HEADER --- */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            It's {payeeName}'s Payday!
          </h3>
          <p className="text-sm text-gray-500">
            {step === 1 ? "Let's record this income." : isSurplus ? "You got extra money!" : "Income was lower than expected."}
          </p>
        </div>

        {/* --- STEP 1: CONFIRM AMOUNT --- */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Expected Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(expectedAmount)}</p>
            </div>

            <WizardCurrencyInput 
              label="Actual Amount Received" 
              id="actual" 
              value={actualAmount} 
              onChange={setActualAmount} 
            />

            <button 
              onClick={handleCheckAmount} 
              className="w-full rounded-md bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
            >
              Confirm Amount
            </button>
          </div>
        )}

        {/* --- STEP 2: HANDLE DIFFERENCE --- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 text-center border ${isSurplus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-bold ${isSurplus ? 'text-green-800' : 'text-red-800'}`}>
                {isSurplus ? 'Surplus:' : 'Deficit:'} {formatCurrency(Math.abs(difference))}
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700">
              {isSurplus ? "Where should we add the extra money?" : "Where should we cover this from?"}
            </p>

            <div className="space-y-2">
              {/* Options for Surplus */}
              {isSurplus && (
                <>
                  <label className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${actionType === 'sinking' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="act" className="mr-3" checked={actionType === 'sinking'} onChange={() => setActionType('sinking')} />
                      <span>Add to Sinking Fund</span>
                    </div>
                    <PiggyBank className="h-4 w-4 text-gray-400" />
                  </label>

                  {actionType === 'sinking' && (
                     <select className="ml-6 block w-[85%] rounded-md border-gray-300 text-sm" value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)}>
                        <option value="">Select Fund...</option>
                        {categories.flatMap(c => c.subcategories.filter(s => s.type === 'sinking_fund')).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                     </select>
                  )}

                  <label className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${actionType === 'bank' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="act" className="mr-3" checked={actionType === 'bank'} onChange={() => setActionType('bank')} />
                      <span>Keep in Bank (Unassigned)</span>
                    </div>
                    <Landmark className="h-4 w-4 text-gray-400" />
                  </label>
                </>
              )}

              {/* Options for Deficit */}
              {!isSurplus && (
                <>
                  <label className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${actionType === 'cover_bank' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="act" className="mr-3" checked={actionType === 'cover_bank'} onChange={() => setActionType('cover_bank')} />
                      <span>Cover from Bank Account</span>
                    </div>
                    <Landmark className="h-4 w-4 text-gray-400" />
                  </label>
                  
                  {actionType === 'cover_bank' && (
                     <select className="ml-6 block w-[85%] rounded-md border-gray-300 text-sm" value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)}>
                        <option value="">Select Account...</option>
                        {bankAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                        ))}
                     </select>
                  )}
                </>
              )}
            </div>

            <button 
              onClick={handleFinalConfirm} 
              disabled={!actionType || (actionType !== 'bank' && !selectedTargetId)}
              className="mt-4 w-full rounded-md bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Complete Payday
            </button>
          </div>
        )}
      </div>
    </div>
  );
}