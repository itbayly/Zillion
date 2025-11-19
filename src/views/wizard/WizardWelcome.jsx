import React, { useState, useEffect } from 'react';
import { Loader2, ClipboardPaste, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export function WizardStep_Welcome({ onStartNew, onStartJoin }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-3xl font-normal text-gray-900">WELCOME TO<br /><span className="text-6xl font-bold text-[#3DDC97]">ZILLION</span></h2>
        <p className="mt-6 text-lg text-gray-700">You're all set! Zillion helps you take control of your money with clarity and confidence.</p>
        <p className="mt-8 text-lg font-medium text-gray-800">What would you like to do today?</p>
        <div className="mt-8 flex flex-col gap-4">
          <button type="button" onClick={onStartNew} className="w-full justify-center rounded-md border border-transparent bg-[#3DDC97] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">START A NEW BUDGET</button>
          <div className="my-2 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="mx-4 flex-shrink text-sm text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
          <button type="button" onClick={onStartJoin} className="w-full justify-center rounded-md border border-[#3DDC97] bg-white px-4 py-3 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">JOIN A SHARED BUDGET</button>
        </div>
      </div>
    </div>
  );
}

export function WizardStep_Join({ onJoin, onBack, message, setMessage, joinBudgetId }) {
  const [budgetIdToJoin, setBudgetIdToJoin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (joinBudgetId) {
      setBudgetIdToJoin(joinBudgetId);
      handleCheckId(joinBudgetId);
    }
  }, [joinBudgetId]);

  const handleCheckId = async (id) => {
    const idToCheck = (id || budgetIdToJoin).trim();
    if (idToCheck === '') { setMessage({ type: 'error', text: 'Please enter a Budget ID.' }); return; }
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const ownerDocRef = doc(db, `/artifacts/zillion-budget-app/users/${idToCheck}/budget/main`);
      const ownerDocSnap = await getDoc(ownerDocRef);
      if (!ownerDocSnap.exists()) throw new Error('No budget found with that ID.');
      const ownerData = ownerDocSnap.data();
      if (ownerData.linkedBudgetId || ownerData.sharedWith) throw new Error('This budget cannot be joined.');
      setOwnerName(ownerData.userName || 'your partner');
      setStep(2);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      if (joinBudgetId) onBack();
    }
    setIsLoading(false);
  };

  const handleConfirmJoin = () => { setIsLoading(true); onJoin(budgetIdToJoin.trim()); };
  const handleBack = () => { setMessage({ type: '', text: '' }); setStep(1); onBack(); };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-3xl font-normal text-gray-900">WELCOME TO<br /><span className="text-6xl font-bold text-[#3DDC97]">ZILLION</span></h2>
        {message.text && <div className={`my-6 rounded-md border ${message.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'} p-3 text-center text-sm`}>{message.text}</div>}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12"><Loader2 className="h-12 w-12 animate-spin text-[#3DDC97]" /><span className="mt-4 text-gray-700">Loading...</span></div>
        ) : step === 1 ? (
          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="joinBudgetId" className="block text-sm font-bold text-gray-700 text-left">Partner's Budget ID</label>
              <div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><ClipboardPaste className="h-5 w-5 text-gray-400" /></div><input type="text" id="joinBudgetId" value={budgetIdToJoin} onChange={e => setBudgetIdToJoin(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="Paste your partner's Budget ID here" /></div>
            </div>
            <button type="button" onClick={() => handleCheckId()} className="w-full justify-center rounded-md border border-transparent bg-[#3DDC97] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">JOIN SHARED BUDGET</button>
            <button type="button" onClick={handleBack} className="w-full justify-center rounded-md border border-[#3DDC97] bg-white px-4 py-3 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50">BACK</button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex"><div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" /></div><div className="ml-3 text-left"><h3 className="text-sm font-medium text-red-800">Warning: This will replace your current budget.</h3><div className="mt-2 text-sm text-red-700"><p>You are about to join {ownerName}'s budget. Your current (empty) budget will be replaced. This cannot be undone.</p></div></div></div>
            </div>
            <button type="button" onClick={handleConfirmJoin} className="w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700">Confirm & Join Budget</button>
            <button type="button" onClick={handleBack} className="w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}