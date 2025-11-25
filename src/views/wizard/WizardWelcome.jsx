import React, { useState, useEffect } from 'react';
import { Loader2, Clipboard, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Button } from '../../components/ui/Button';
import { AmbientBackground } from '../../components/ui/SharedUI';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export function WizardStep_Welcome({ onStartNew, onStartJoin, theme, toggleTheme }) {
  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className={`
        w-full max-w-md p-8 sm:p-10 rounded-3xl transition-all duration-500
        ${theme === 'dark'
          ? 'bg-slate-900/40 border border-white/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] backdrop-blur-xl'
          : 'bg-white/70 border border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-md'
        }
        text-center animate-in fade-in duration-700
      `}>
        <h2 className={`text-2xl font-medium mb-1 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>WELCOME TO</h2>
        <h1 className="text-5xl font-bold tracking-tight text-zillion-400 mb-6 transition-colors duration-300">ZILLION</h1>
        
        <p className={`mb-8 text-sm leading-relaxed max-w-md mx-auto transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          You're all set! Zillion helps you take control of your money with clarity and confidence.
        </p>

        <p className={`mb-6 font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          What would you like to do today?
        </p>

        <div className="space-y-4 max-w-sm mx-auto">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onStartNew}
            className="uppercase tracking-wide font-bold py-4 shadow-xl shadow-zillion-400/20"
          >
            Start a New Budget
          </Button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
            </div>
            <span className={`relative px-4 text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500 bg-slate-900/0' : 'text-slate-400 bg-white/0'}`}>OR</span>
          </div>

          <Button 
            variant="outline" 
            fullWidth 
            onClick={onStartJoin}
            className="uppercase tracking-wide font-bold py-4 border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400"
          >
            Join a Shared Budget
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WizardStep_Join({ onJoin, onBack, message, setMessage, joinBudgetId, theme, toggleTheme }) {
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
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className={`
        w-full max-w-md p-8 sm:p-10 rounded-3xl transition-all duration-500
        ${theme === 'dark'
          ? 'bg-slate-900/40 border border-white/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] backdrop-blur-xl'
          : 'bg-white/70 border border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-md'
        }
        text-center animate-in fade-in duration-700
      `}>
        <h2 className={`text-2xl font-medium mb-1 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>WELCOME TO</h2>
        <h1 className="text-5xl font-bold tracking-tight text-zillion-400 mb-8 transition-colors duration-300">ZILLION</h1>
        
        {message.text && (
          <div className={`mb-6 rounded-md border p-3 text-center text-sm ${message.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="max-w-xs mx-auto text-left mb-6">
               <label className={`block text-xs font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Partner's Budget ID</label>
               <div className={`flex items-center border rounded-lg px-3 py-2 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                 <Clipboard className="w-4 h-4 text-slate-400 mr-2" />
                 <input 
                    className={`bg-transparent w-full text-sm outline-none placeholder-slate-400 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                    placeholder="Paste your partner's Budget ID here" 
                    value={budgetIdToJoin}
                    onChange={(e) => setBudgetIdToJoin(e.target.value)}
                 />
               </div>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
               <Button variant="primary" fullWidth isLoading={isLoading} onClick={() => handleCheckId()} className="uppercase font-bold">Find Budget</Button>
               <Button variant="outline" fullWidth onClick={handleBack} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-6">
            <div className="rounded-md bg-red-50 p-4 text-left border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning: Irreversible Action</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>You are about to join <strong>{ownerName}'s</strong> budget. Your current (empty) budget will be replaced. This cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="danger" fullWidth onClick={handleConfirmJoin} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 uppercase font-bold">Confirm & Join</Button>
              <Button variant="outline" fullWidth onClick={handleBack} className="uppercase font-bold text-xs">Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}