import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, ArrowRight, Check, Calendar, DollarSign, AlertCircle, ChevronLeft, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { formatCurrency, getTodayDate, calculatePaydayStats } from '../../utils/helpers';
import { WizardCurrencyInput, WizardTextInput } from '../../components/ui/FormInputs';
import { DebtForm } from '../../components/modals/DebtModals';

// --- SUB-COMPONENTS FOR WIZARD ---

const QuestionType = ({ onSelect }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <button onClick={() => onSelect('fixed')} className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 hover:border-[#3DDC97] hover:bg-emerald-50">
      <RefreshCw className="mb-3 h-8 w-8 text-gray-400" />
      <span className="text-lg font-bold text-gray-700">Consistent Amount</span>
      <span className="text-xs text-gray-500">Salary or Fixed Pay</span>
    </button>
    <button onClick={() => onSelect('variable')} className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 hover:border-[#3DDC97] hover:bg-emerald-50">
      <DollarSign className="mb-3 h-8 w-8 text-gray-400" />
      <span className="text-lg font-bold text-gray-700">Varying Amount</span>
      <span className="text-xs text-gray-500">Hourly or Commission</span>
    </button>
  </div>
);

const QuestionFrequency = ({ onSelect }) => {
  const options = [
    { id: 'weekly', label: 'Weekly (Every 7 Days)' },
    { id: 'biweekly', label: 'Bi-Weekly (Every 14 Days)' },
    { id: 'semimonthly', label: 'Semi-Monthly (2x Month)' },
    { id: 'monthly', label: 'Monthly (1x Month)' },
    { id: 'fourweeks', label: 'Every 4 Weeks' },
  ];
  return (
    <div className="space-y-3">
      {options.map(opt => (
        <button key={opt.id} onClick={() => onSelect(opt.id)} className="w-full rounded-lg border border-gray-200 p-4 text-left font-medium text-gray-700 hover:border-[#3DDC97] hover:bg-emerald-50">
          {opt.label}
        </button>
      ))}
      <button onClick={() => onSelect('irregular')} className="w-full rounded-lg border border-dashed border-gray-300 p-4 text-left text-gray-500 hover:bg-gray-50">
        I don't have a set schedule (Irregular)
      </button>
    </div>
  );
};

// --- STEP 2A: INCOME WIZARD ---
export function WizardStep2_Income({ income, totalIncome, onIncomeChange, onSaveIncomeSettings, onNext, onBack, budgetData }) {
  const [mode, setMode] = useState('landing'); 
  const [wizardStep, setWizardStep] = useState(1);
  const [stage, setStage] = useState('user');
  const [userConfigData, setUserConfigData] = useState(null);

  const safeIncome = income || { source1: 0, source2: 0 };
  const [simpleAmount1, setSimpleAmount1] = useState(safeIncome.source1 || '');
  const [simpleAmount2, setSimpleAmount2] = useState(safeIncome.source2 || '');
  
  const [config, setConfig] = useState({
    type: '', amount: '', frequency: '', anchorDate: '', semiMonth1: '1', semiMonth2: '15', monthlyDay: '1', adjustment: 'before'
  });

  const stats = useMemo(() => {
    if (wizardStep === 6) return calculatePaydayStats(config);
    return null;
  }, [config, wizardStep]);

  const handleUpdateConfig = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleSimpleSubmit = () => {
    onIncomeChange('source1', parseFloat(simpleAmount1) || 0);
    onIncomeChange('source2', parseFloat(simpleAmount2) || 0);
    onNext();
  };

  const handleWizardFinish = () => {
    if (stage === 'user') {
      setUserConfigData({ config: { ...config }, stats: { ...stats } });
      onIncomeChange('source1', stats?.monthlyTotal || 0);
      setStage('interstitial');
    } else if (stage === 'partner') {
      onIncomeChange('source2', stats?.monthlyTotal || 0);
      if (onSaveIncomeSettings && userConfigData) {
        onSaveIncomeSettings({
          user: { ...userConfigData.config, nextPayDay: userConfigData.stats.nextPayDayStr },
          partner: { ...config, nextPayDay: stats?.nextPayDayStr }
        });
      }
      onNext();
    }
  };

  const handleAddPartner = () => {
    setStage('partner');
    setWizardStep(1);
    setConfig({ type: '', amount: '', frequency: '', anchorDate: '', semiMonth1: '1', semiMonth2: '15', monthlyDay: '1', adjustment: 'before' });
  };

  const handleSkipPartner = () => {
    if (onSaveIncomeSettings && userConfigData) {
      onSaveIncomeSettings({
        user: { ...userConfigData.config, nextPayDay: userConfigData.stats.nextPayDayStr },
        partner: null
      });
    }
    onIncomeChange('source2', 0);
    onNext();
  };

  const whoText = stage === 'partner' ? "Partner's" : "Your";
  const whoSubject = stage === 'partner' ? "they" : "you";

  if (mode === 'landing') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">How do you want to enter income?</h3>
        <div className="mt-8 grid gap-4">
          <button onClick={() => setMode('wizard')} className="w-full rounded-lg border-2 border-[#3DDC97] bg-emerald-50 p-5 text-left transition-all hover:shadow-md">
            <span className="text-lg font-bold text-[#3DDC97]">Detailed Tracking</span>
            <p className="mt-1 text-sm text-emerald-800">Let Zillion track paydays and automate your month.</p>
          </button>
          <button onClick={() => setMode('simple')} className="w-full rounded-lg border border-gray-200 bg-white p-5 text-left hover:bg-gray-50">
            <span className="text-lg font-bold text-gray-700">Simple Total</span>
            <p className="mt-1 text-sm text-gray-500">Just enter your total monthly take-home pay.</p>
          </button>
        </div>
        <button onClick={onBack} className="mt-8 text-sm text-gray-400 hover:text-gray-600">Back</button>
      </div>
    );
  }

  if (mode === 'simple') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-800">Total Monthly Income</h3>
          <p className="mt-2 text-sm text-gray-500">Enter expected Take-Home Pay (Net).</p>
        </div>
        <div className="mt-8 max-w-md mx-auto space-y-4">
          <WizardCurrencyInput label="Your Monthly Net Income" id="s1" value={simpleAmount1} onChange={setSimpleAmount1} />
          <WizardCurrencyInput label="Partner Monthly Net Income (Optional)" id="s2" value={simpleAmount2} onChange={setSimpleAmount2} />
          <div className="mt-8 flex justify-between border-t pt-6">
             <button onClick={() => setMode('landing')} className="text-gray-500 hover:text-gray-700">Back</button>
             <button onClick={handleSimpleSubmit} className="rounded-md bg-[#3DDC97] px-6 py-2 text-white font-bold">Next</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'wizard' && stage === 'interstitial') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
           <UserPlus className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Income Set!</h3>
        <p className="mt-4 text-lg text-gray-600">Do you want to add a spouse or partner's income to the budget?</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
           <button onClick={handleSkipPartner} className="rounded-md border border-gray-300 py-3 font-medium text-gray-600 hover:bg-gray-50">No, I'm Done</button>
           <button onClick={handleAddPartner} className="rounded-md bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700">Yes, Add Partner</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <button onClick={() => wizardStep === 1 ? (stage === 'partner' ? setStage('interstitial') : setMode('landing')) : setWizardStep(s => s - 1)} className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-6 w-6" /></button>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{stage === 'partner' ? 'PARTNER' : 'YOU'} • Step {wizardStep} of 6</span>
        <div className="w-6" />
      </div>

      {wizardStep === 1 && (
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Is {whoText.toLowerCase()} paycheck amount consistent?</h3>
          <QuestionType onSelect={(val) => { handleUpdateConfig('type', val); setWizardStep(2); }} />
        </div>
      )}

      {wizardStep === 2 && (
        <div className="max-w-sm mx-auto text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{config.type === 'fixed' ? 'Net Pay Per Check' : 'Typical Take-Home Pay'}</h3>
          <p className="text-sm text-gray-500 mb-6">{config.type === 'fixed' ? 'Income after taxes and deductions.' : 'Enter a conservative estimate.'}</p>
          <WizardCurrencyInput label="Amount" id="wizAmt" value={config.amount} onChange={(val) => handleUpdateConfig('amount', val)} autoFocus />
          <button onClick={() => setWizardStep(3)} disabled={!config.amount} className="mt-6 w-full rounded-md bg-[#3DDC97] py-2 font-bold text-white disabled:bg-gray-300">Next</button>
        </div>
      )}

      {wizardStep === 3 && (
        <div className="max-w-sm mx-auto text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6">How often do {whoSubject} get paid?</h3>
          <QuestionFrequency onSelect={(val) => { if (val === 'irregular') { setMode('simple'); } else { handleUpdateConfig('frequency', val); setWizardStep(4); } }} />
        </div>
      )}

      {wizardStep === 4 && (
        <div className="max-w-sm mx-auto text-center">
          {['weekly', 'biweekly', 'fourweeks'].includes(config.frequency) && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4">When was the most recent paycheck?</h3>
              <input type="date" className="w-full rounded-md border-gray-300 p-3 shadow-sm focus:border-[#3DDC97] focus:ring-[#3DDC97]" onChange={(e) => handleUpdateConfig('anchorDate', e.target.value)} />
            </>
          )}
          {config.frequency === 'semimonthly' && (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Which two days?</h3>
              <div className="grid grid-cols-2 gap-4">
                 <select className="rounded-md border-gray-300" value={config.semiMonth1} onChange={e => handleUpdateConfig('semiMonth1', e.target.value)}>{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
                 <select className="rounded-md border-gray-300" value={config.semiMonth2} onChange={e => handleUpdateConfig('semiMonth2', e.target.value)}><option value="last">Last Day</option>{[...Array(30)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
              </div>
            </>
          )}
          {config.frequency === 'monthly' && (
            <>
               <h3 className="text-xl font-bold text-gray-900 mb-4">Which day?</h3>
               <select className="w-full rounded-md border-gray-300 p-3" value={config.monthlyDay} onChange={e => handleUpdateConfig('monthlyDay', e.target.value)}><option value="last">Last Day of Month</option>{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
            </>
          )}
          <button onClick={() => setWizardStep(5)} className="mt-6 w-full rounded-md bg-[#3DDC97] py-2 font-bold text-white">Next</button>
        </div>
      )}

      {wizardStep === 5 && (
        <div className="max-w-sm mx-auto text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Weekend Logic</h3>
          <p className="mb-6 text-sm text-gray-500">If payday falls on a weekend, when does the money hit?</p>
          <div className="space-y-3">
             <button onClick={() => { handleUpdateConfig('adjustment', 'before'); setWizardStep(6); }} className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-[#3DDC97] hover:bg-emerald-50"><span className="font-bold block text-gray-800">Friday Before</span></button>
             <button onClick={() => { handleUpdateConfig('adjustment', 'after'); setWizardStep(6); }} className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-[#3DDC97] hover:bg-emerald-50"><span className="font-bold block text-gray-800">Monday After</span></button>
             <button onClick={() => { handleUpdateConfig('adjustment', 'none'); setWizardStep(6); }} className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-[#3DDC97] hover:bg-emerald-50"><span className="font-bold block text-gray-800">Actual Day</span></button>
          </div>
        </div>
      )}

      {wizardStep === 6 && stats && (
        <div className="max-w-md mx-auto text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#3DDC97]"><Calendar className="h-8 w-8" /></div>
           <h3 className="text-2xl font-bold text-gray-900">Does this look right?</h3>
           <div className="mt-6 rounded-lg bg-slate-50 p-6 border border-gray-200 text-left">
              <div className="mb-4"><p className="text-xs font-bold uppercase text-gray-400">{whoText.toUpperCase()} MONTHLY INCOME</p><div className="flex items-baseline gap-2">{config.type === 'variable' && <span className="text-xl text-gray-400">~</span>}<span className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.monthlyTotal)}</span></div><p className="text-sm text-gray-500">Based on {stats.payCheckCount} paychecks this month.</p></div>
              <div className="border-t pt-4"><p className="text-xs font-bold uppercase text-gray-400">NEXT PAYDAY</p><p className="text-xl font-bold text-gray-800">{stats.nextPayDayStr}</p></div>
           </div>
           <div className="mt-8 grid grid-cols-2 gap-4">
              <button onClick={() => setWizardStep(1)} className="rounded-md border border-gray-300 py-3 font-medium text-gray-600 hover:bg-gray-50">No, Edit</button>
              <button onClick={handleWizardFinish} className="rounded-md bg-[#3DDC97] py-3 font-bold text-white hover:bg-emerald-600">Yes, Looks Good</button>
           </div>
        </div>
      )}
    </div>
  );
}

// --- STEP 2B: DEDUCTIONS WIZARD ---
export function WizardStep2b_Deductions({ onNext, onBack, onSaveDeductions }) {
  const [deductions, setDeductions] = useState([
    { id: 'health', name: 'Health Insurance', enabled: false, amount: '' },
    { id: 'dental', name: 'Dental Insurance', enabled: false, amount: '' },
    { id: 'vision', name: 'Vision Insurance', enabled: false, amount: '' },
    { id: 'life', name: 'Life Insurance', enabled: false, amount: '' },
    { id: 'disability', name: 'Disability Insurance', enabled: false, amount: '' },
    { id: '401k', name: '401K Contribution', enabled: false, amount: '' },
    { id: 'roth', name: 'Roth 401K', enabled: false, amount: '' },
    { id: 'fsa', name: 'FSA', enabled: false, amount: '' },
    { id: 'hsa', name: 'HSA', enabled: false, amount: '' },
    { id: 'union', name: 'Union Dues', enabled: false, amount: '' },
    { id: 'other', name: 'Other Benefits', enabled: false, amount: '' },
  ]);

  const toggleDeduction = (id) => {
    setDeductions(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  };

  const updateAmount = (id, val) => {
    setDeductions(prev => prev.map(d => d.id === id ? { ...d, amount: val } : d));
  };

  const handleNext = () => {
    const activeDeductions = deductions.filter(d => d.enabled && parseFloat(d.amount) > 0).map(d => ({
       name: d.name,
       amount: parseFloat(d.amount) || 0
    }));
    onSaveDeductions(activeDeductions);
    onNext();
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-3xl mx-auto">
      <div className="mx-auto max-w-lg text-center mb-8">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Paycheck Deductions</h3>
        <p className="mt-4 text-gray-500 text-sm">Do you want to track items taken out of your paycheck? These won't affect your spending budget.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
        {deductions.map(d => (
          <div key={d.id} className={`border rounded-lg p-4 transition-colors ${d.enabled ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
            <div className="flex items-center justify-between mb-2">
               <label className="flex items-center cursor-pointer">
                 <input type="checkbox" checked={d.enabled} onChange={() => toggleDeduction(d.id)} className="h-5 w-5 text-indigo-600 rounded" />
                 <span className={`ml-3 font-medium ${d.enabled ? 'text-indigo-900' : 'text-gray-700'}`}>{d.name}</span>
               </label>
               {d.enabled && <ShieldCheck className="h-5 w-5 text-indigo-600" />}
            </div>
            {d.enabled && (
               <div className="ml-8">
                 <WizardCurrencyInput label="Amount Per Check" id={`amt-${d.id}`} value={d.amount} onChange={(v) => updateAmount(d.id, v)} placeholder="0.00" />
               </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-8 mt-8 border-t max-w-lg mx-auto">
        <button onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button onClick={handleNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT</button>
      </div>
    </div>
  );
}

// Step 8
export function WizardStep3_Savings({ savingsGoal, totalIncome, onSavingsChange, bankAccounts, mainSavingsAccountId, onMainSavingsAccountChange, onNext, onBack }) {
  const [goal, setGoal] = useState(savingsGoal === 0 ? '' : savingsGoal);
  const internalRemainingAfterSavings = useMemo(() => totalIncome - (parseFloat(goal) || 0), [totalIncome, goal]);
  useEffect(() => { setGoal(savingsGoal === 0 ? '' : savingsGoal); }, [savingsGoal]);
  const handleNext = () => { onSavingsChange(parseFloat(goal) || 0); onNext(); };
  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center"><h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2><h3 className="mt-4 text-3xl font-semibold text-gray-800">Set Your Monthly Savings Goal</h3></div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 flex items-center justify-between"><span className="text-lg font-medium text-gray-800">Total Monthly Income:</span><span className="text-2xl font-semibold text-emerald-600">{formatCurrency(totalIncome)}</span></div>
        <WizardCurrencyInput label="Monthly Savings Goal" id="savingsGoal" value={goal} onChange={setGoal} placeholder="0.00" />
        <div><label className="block text-sm font-medium text-gray-700">Which account will this savings go into?</label><select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" value={mainSavingsAccountId || ''} onChange={e => onMainSavingsAccountChange(e.target.value)}><option value="">Select an account...</option>{bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-lg font-medium text-gray-800">Remaining to Budget:</span><span className="text-2xl font-semibold text-emerald-600">{formatCurrency(internalRemainingAfterSavings)}</span></div></div>
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto"><button onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button><button onClick={handleNext} disabled={!mainSavingsAccountId} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300">NEXT</button></div>
    </div>
  );
}

// Step 9
export function WizardStep6_DebtSetup({ debts, onDebtsChange, onBack, onNext }) {
  const handleDeleteDebt = (id) => onDebtsChange(debts.filter((debt) => debt.id !== id));
  const handleAddDebt = (newDebt) => onDebtsChange([...debts, newDebt]);
  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center"><h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2><h3 className="mt-4 text-3xl font-semibold text-gray-800">Set Up Debt Tracking</h3></div>
      <DebtForm onAddDebt={handleAddDebt} />
      <div className="mt-8 max-w-md mx-auto space-y-3"><h4 className="text-sm font-medium text-gray-500">Added Debts</h4>{debts.length === 0 ? <p className="text-center text-sm text-gray-500">No debts added yet.</p> : debts.map((debt) => (<div key={debt.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 shadow-sm"><div className="flex-1"><span className="font-medium text-gray-900">{debt.name}</span>{debt.autoInclude && <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">Auto-Budget</span>}<p className="text-sm text-gray-600">{formatCurrency(debt.amountOwed)} at {debt.interestRate}% - {formatCurrency(debt.monthlyPayment)}/mo</p></div><button type="button" onClick={() => handleDeleteDebt(debt.id)} className="ml-4 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>))}</div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto"><button onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button><button onClick={onNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT</button></div>
    </div>
  );
}