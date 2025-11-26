import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, ArrowRight, Check, Calendar, DollarSign, AlertCircle, ChevronLeft, RefreshCw, User, ShieldCheck, Trash2, ClipboardList, ChevronsUpDown, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getTodayDate, calculatePaydayStats } from '../../utils/helpers';
import { InputField } from '../../components/ui/InputField';
import { Button } from '../../components/ui/Button';
import { AmbientBackground } from '../../components/ui/SharedUI';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { nanoid } from 'nanoid';

// --- Internal Selection Card Component ---
const SelectionCard = ({ selected, onClick, title, description, icon, theme }) => (
  <div 
    onClick={onClick}
    className={`
      cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 flex flex-col items-center text-center h-full justify-center
      ${selected 
        ? 'border-zillion-400 bg-zillion-50/50 dark:bg-zillion-900/20' 
        : `border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-white'}`
      }
    `}
  >
    {icon && (
      <div className={`mb-3 ${selected ? 'text-zillion-500' : 'text-slate-400'}`}>
        {icon}
      </div>
    )}
    <h3 className={`font-bold text-base mb-1 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
      {title}
    </h3>
    {description && (
      <p className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>
    )}
  </div>
);

// --- HELPER: Deduction List Component ---
const DeductionSelector = ({ activeDeductions, onUpdate, theme }) => {
  const [items, setItems] = useState([
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

  useEffect(() => {
    if (activeDeductions && activeDeductions.length > 0) {
      // Pre-populate logic could go here
    }
  }, []);

  const toggle = (id) => {
    const newItems = items.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i);
    setItems(newItems);
    emitChange(newItems);
  };

  const updateAmountVal = (id, val) => {
    const newItems = items.map(i => i.id === id ? { ...i, amount: val } : i);
    setItems(newItems);
    emitChange(newItems);
  };

  const emitChange = (currentItems) => {
    const active = currentItems.filter(i => i.enabled && parseFloat(i.amount) > 0).map(i => ({
      name: i.name,
      amount: parseFloat(i.amount) || 0
    }));
    onUpdate(active);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto pr-2 text-left">
      {items.map(d => (
        <div key={d.id} className={`border rounded-lg p-3 transition-colors ${d.enabled ? 'border-zillion-400 bg-zillion-50 dark:bg-zillion-900/20' : `border-slate-200 hover:border-zillion-300 dark:border-slate-700 dark:hover:border-slate-600`}`}>
          <div className="flex items-center justify-between mb-2">
             <label className="flex items-center cursor-pointer">
               <input type="checkbox" checked={d.enabled} onChange={() => toggle(d.id)} className="h-5 w-5 accent-zillion-400 rounded" />
               <span className={`ml-3 font-medium text-sm ${d.enabled ? 'text-zillion-900 dark:text-zillion-100' : `text-slate-700 dark:text-slate-300`}`}>{d.name}</span>
             </label>
             {d.enabled && <ShieldCheck className="h-4 w-4 text-zillion-500" />}
          </div>
          {d.enabled && (
             <div className="ml-8">
               <InputField label="Amount Per Check" value={d.amount} onChange={(e) => updateAmountVal(d.id, e.target.value)} placeholder="0.00" icon={<DollarSign className="w-3 h-3" />} />
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- WIZARD STEP 2: INCOME ---
export function WizardStep2_Income({ income, totalIncome, onIncomeChange, onSaveIncomeSettings, onSaveDeductions, onNext, onBack, theme, toggleTheme }) {
  const [mode, setMode] = useState('landing'); 
  const [wizardStep, setWizardStep] = useState(1);
  const [stage, setStage] = useState('user'); // 'user' | 'interstitial' | 'partner'
  const [userConfigData, setUserConfigData] = useState(null);

  const safeIncome = income || { source1: 0, source2: 0 };
  const [simpleAmount1, setSimpleAmount1] = useState(safeIncome.source1 || '');
  const [simpleAmount2, setSimpleAmount2] = useState(safeIncome.source2 || '');
  
  const [config, setConfig] = useState({
    type: '', amount: '', frequency: '', anchorDate: '', semiMonth1: '1', semiMonth2: '15', monthlyDay: '1', adjustment: 'before',
    deductions: [] 
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
      const userDeductions = userConfigData?.config.deductions || [];
      const partnerDeductions = (config.deductions || []).map(d => ({ ...d, name: `${d.name} (Partner)` }));
      const allDeductions = [...userDeductions, ...partnerDeductions];
      if (onSaveDeductions && allDeductions.length > 0) onSaveDeductions(allDeductions);
      if (onSaveIncomeSettings && userConfigData) {
        onSaveIncomeSettings({
          user: { ...userConfigData.config, nextPayDay: userConfigData.stats.nextPayDayStr },
          partner: { ...config, nextPayDay: stats?.nextPayDayStr }
        });
      }
      onNext();
    }
  };

  const handleSkipPartner = () => {
    if (onSaveDeductions && userConfigData?.config.deductions.length > 0) onSaveDeductions(userConfigData.config.deductions);
    if (onSaveIncomeSettings && userConfigData) {
      onSaveIncomeSettings({
        user: { ...userConfigData.config, nextPayDay: userConfigData.stats.nextPayDayStr },
        partner: null
      });
    }
    onIncomeChange('source2', 0);
    onNext();
  };

  const handleAddPartner = () => {
    setStage('partner');
    setWizardStep(1);
    setConfig({ type: '', amount: '', frequency: '', anchorDate: '', semiMonth1: '1', semiMonth2: '15', monthlyDay: '1', adjustment: 'before', deductions: [] });
  };

  const whoText = stage === 'partner' ? "Partner's" : "Your";
  const whoSubject = stage === 'partner' ? "they" : "you";

  // --- RENDER ---
  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="wizard-card max-w-2xl">
        
        {mode !== 'landing' && mode !== 'simple' && stage !== 'interstitial' && (
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <button onClick={() => wizardStep === 1 ? (stage === 'partner' ? setStage('interstitial') : setMode('landing')) : setWizardStep(s => s - 1)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronLeft className="h-6 w-6" /></button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stage === 'partner' ? 'PARTNER' : 'YOU'} • Step {wizardStep} of 6</span>
            <div className="w-6" />
          </div>
        )}

        {/* 1. LANDING SELECTION */}
        {mode === 'landing' && (
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
            <h3 className={`text-2xl font-bold mb-8 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>How do you want to enter income?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <SelectionCard 
                onClick={() => setMode('wizard')} 
                title="Detailed Tracking" 
                description="Let Zillion track paydays and automate your month." 
                icon={<ClipboardList size={32} />}
                theme={theme}
              />
              <SelectionCard 
                onClick={() => setMode('simple')} 
                title="Simple Total" 
                description="Just enter your total monthly take-home pay." 
                icon={<DollarSign size={32} />}
                theme={theme}
              />
            </div>
            <Button variant="outline" onClick={onBack} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
          </div>
        )}

        {/* 2. SIMPLE MODE */}
        {mode === 'simple' && (
          <div className="text-center">
            <div className="mb-8">
               <h3 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Total Monthly Income</h3>
               <p className={`mt-2 text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Enter expected Take-Home Pay (Net).</p>
            </div>
            <div className="max-w-xs mx-auto space-y-4">
              <InputField label="Your Monthly Net Income" value={simpleAmount1} onChange={e => setSimpleAmount1(e.target.value)} icon={<DollarSign className="w-4 h-4" />} placeholder="0.00" />
              <InputField label="Partner Monthly Net Income (Optional)" value={simpleAmount2} onChange={e => setSimpleAmount2(e.target.value)} icon={<DollarSign className="w-4 h-4" />} placeholder="0.00" />
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                 <Button variant="outline" onClick={() => setMode('landing')} className="uppercase font-bold text-xs">Back</Button>
                 <Button variant="primary" onClick={handleSimpleSubmit} className="uppercase font-bold text-xs px-8">Next</Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. INTERSTITIAL (ADD PARTNER) */}
        {mode === 'wizard' && stage === 'interstitial' && (
          <div className="text-center">
            <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-zillion-900/20 text-zillion-400' : 'bg-zillion-50 text-zillion-500'}`}><Check className="h-10 w-10" /></div>
            <h3 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Income Set!</h3>
            <p className={`mt-4 text-lg transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Do you want to add a spouse or partner's income?</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
               <Button variant="outline" onClick={handleSkipPartner}>No, I'm Done</Button>
               <Button variant="primary" onClick={handleAddPartner}>Yes, Add Partner</Button>
            </div>
          </div>
        )}

        {/* 4. WIZARD STEPS */}
        {mode === 'wizard' && stage !== 'interstitial' && (
          <>
            {wizardStep === 1 && (
              <div className="text-center">
                <h3 className={`text-xl font-bold mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Is {whoText.toLowerCase()} paycheck amount consistent?</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                   <SelectionCard onClick={() => { handleUpdateConfig('type', 'fixed'); setWizardStep(2); }} title="Consistent" description="Salary or Fixed Pay" icon={<CheckCircle2 size={32} />} theme={theme} />
                   <SelectionCard onClick={() => { handleUpdateConfig('type', 'variable'); setWizardStep(2); }} title="Varying" description="Hourly or Commission" icon={<ChevronsUpDown size={32} />} theme={theme} />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="max-w-sm mx-auto text-center">
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{config.type === 'fixed' ? 'Net Pay Per Check' : 'Typical Take-Home Pay'}</h3>
                <p className={`text-sm mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{config.type === 'fixed' ? 'Income after taxes and deductions.' : 'Enter a conservative estimate.'}</p>
                <InputField label="Amount" value={config.amount} onChange={e => handleUpdateConfig('amount', e.target.value)} icon={<DollarSign className="w-4 h-4" />} placeholder="0.00" autoFocus />
                
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                   <p className="text-xs font-bold uppercase mb-3 text-slate-400">OPTIONAL</p>
                   <Button variant="outline" fullWidth onClick={() => setWizardStep('2.5')} icon={<ShieldCheck className="h-4 w-4" />}>Track Paystub Deductions?</Button>
                </div>
                <Button variant="primary" fullWidth onClick={() => setWizardStep(3)} disabled={!config.amount} className="mt-6 uppercase font-bold text-xs">Next</Button>
              </div>
            )}

            {wizardStep === '2.5' && (
               <div className="text-center">
                  <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Paycheck Deductions</h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Select items to track. These do not affect your spending budget.</p>
                  <DeductionSelector activeDeductions={config.deductions} onUpdate={(list) => handleUpdateConfig('deductions', list)} theme={theme} />
                  <Button variant="primary" fullWidth onClick={() => setWizardStep(2)} className="mt-6 uppercase font-bold text-xs">Done Adding Deductions</Button>
               </div>
            )}

            {wizardStep === 3 && (
              <div className="max-w-sm mx-auto text-center">
                <h3 className={`text-xl font-bold mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>How often do {whoSubject} get paid?</h3>
                <div className="space-y-3">
                  {['weekly', 'biweekly', 'semimonthly', 'monthly', 'fourweeks', 'irregular'].map(opt => (
                    <button key={opt} onClick={() => { if (opt === 'irregular') setMode('simple'); else { handleUpdateConfig('frequency', opt); setWizardStep(4); } }} 
                      className={`w-full p-4 rounded-lg border text-left font-medium capitalize transition-all ${config.frequency === opt ? 'border-zillion-400 bg-zillion-50 dark:bg-zillion-900/20' : `border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}`}>
                      {opt === 'irregular' ? "I don't have a set schedule (Irregular)" : opt.replace('fourweeks', 'Every 4 Weeks')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="max-w-sm mx-auto text-center">
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                   {config.frequency === 'semimonthly' ? 'Which two days?' : config.frequency === 'monthly' ? 'Which day?' : 'When was the most recent paycheck?'}
                </h3>
                
                {['weekly', 'biweekly', 'fourweeks'].includes(config.frequency) && (
                  <InputField type="date" value={config.anchorDate} onChange={e => handleUpdateConfig('anchorDate', e.target.value)} />
                )}
                {config.frequency === 'semimonthly' && (
                  <div className="grid grid-cols-2 gap-4">
                     <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={config.semiMonth1} onChange={e => handleUpdateConfig('semiMonth1', e.target.value)}>{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
                     <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={config.semiMonth2} onChange={e => handleUpdateConfig('semiMonth2', e.target.value)}><option value="last">Last Day</option>{[...Array(30)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
                  </div>
                )}
                {config.frequency === 'monthly' && (
                   <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={config.monthlyDay} onChange={e => handleUpdateConfig('monthlyDay', e.target.value)}><option value="last">Last Day of Month</option>{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}{['st','nd','rd'][i]||'th'}</option>)}</select>
                )}
                <Button variant="primary" fullWidth onClick={() => setWizardStep(5)} className="mt-6 uppercase font-bold text-xs">Next</Button>
              </div>
            )}

            {wizardStep === 5 && (
              <div className="max-w-sm mx-auto text-center">
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Weekend Logic</h3>
                <p className={`mb-6 text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>If payday falls on a weekend, when does the money hit?</p>
                <div className="space-y-3">
                   {['before', 'after', 'none'].map(opt => (
                      <button key={opt} onClick={() => { handleUpdateConfig('adjustment', opt); setWizardStep(6); }} 
                        className={`w-full p-4 rounded-lg border text-left font-bold transition-all duration-300 ${config.adjustment === opt ? 'border-zillion-400 bg-zillion-50 dark:bg-zillion-900/20 text-zillion-600 dark:text-zillion-400' : `border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}`}>
                        {opt === 'before' ? 'Friday Before' : opt === 'after' ? 'Monday After' : 'Actual Day'}
                      </button>
                   ))}
                </div>
              </div>
            )}

            {wizardStep === 6 && stats && (
              <div className="max-w-md mx-auto text-center">
                 <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-zillion-900/20 text-zillion-400' : 'bg-zillion-50 text-zillion-500'}`}><Calendar className="h-8 w-8" /></div>
                 <h3 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Does this look right?</h3>
                 <div className={`mt-6 rounded-lg p-6 border text-left transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="mb-4"><p className="text-xs font-bold uppercase text-slate-400">{whoText.toUpperCase()} MONTHLY INCOME</p><div className="flex items-baseline gap-2">{config.type === 'variable' && <span className="text-xl text-slate-400">~</span>}<span className="text-3xl font-bold text-zillion-500">{formatCurrency(stats.monthlyTotal)}</span></div><p className="text-sm text-slate-500">Based on {stats.payCheckCount} paychecks.</p></div>
                    {config.deductions.length > 0 && (
                       <div className={`border-t pt-4 mb-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><p className="text-xs font-bold uppercase text-slate-400">TRACKING DEDUCTIONS</p><p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{config.deductions.map(d=>d.name).join(', ')}</p></div>
                    )}
                    <div className={`border-t pt-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><p className="text-xs font-bold uppercase text-slate-400">NEXT PAYDAY</p><p className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{stats.nextPayDayStr}</p></div>
                 </div>
                 <div className="mt-8 grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setWizardStep(1)} className="uppercase font-bold text-xs">No, Edit</Button>
                    <Button variant="primary" onClick={handleWizardFinish} className="uppercase font-bold text-xs">Yes, Looks Good</Button>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- WIZARD STEP 3: SAVINGS ---
export function WizardStep3_Savings({ savingsGoal, totalIncome, onSavingsChange, bankAccounts, mainSavingsAccountId, onMainSavingsAccountChange, onNext, onBack, theme, toggleTheme }) {
  const [goal, setGoal] = useState(savingsGoal === 0 ? '' : savingsGoal);
  const internalRemainingAfterSavings = useMemo(() => totalIncome - (parseFloat(goal) || 0), [totalIncome, goal]);
  useEffect(() => { setGoal(savingsGoal === 0 ? '' : savingsGoal); }, [savingsGoal]);
  const handleNext = () => { onSavingsChange(parseFloat(goal) || 0); onNext(); };
  const handleBack = () => { onSavingsChange(parseFloat(goal) || 0); onBack(); };

  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="wizard-card">
        <div className="text-center mb-8">
           <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2">ZILLION</h2>
           <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Set Your Monthly Savings Goal</h1>
        </div>

        <div className="space-y-6">
           <div className={`p-4 rounded-lg flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
              <span className="text-sm font-medium">Total Monthly Income:</span>
              <span className="text-lg font-bold text-zillion-500">{formatCurrency(totalIncome)}</span>
           </div>

           <InputField label="Monthly Savings Goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="0.00" icon={<DollarSign className="w-4 h-4" />} />

           <div>
             <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Which account will this savings go into?</label>
             <div className="relative">
               <select className={`w-full p-3 pl-4 pr-10 rounded-lg border bg-transparent outline-none appearance-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={mainSavingsAccountId || ''} onChange={e => onMainSavingsAccountChange(e.target.value)}>
                  <option value="">Select an account...</option>
                  {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
               </select>
               <ChevronsUpDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
           </div>

           <div className={`p-4 rounded-lg flex justify-between items-center ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
              <span className="text-sm font-medium">Remaining to Budget:</span>
              <span className={`text-lg font-bold ${internalRemainingAfterSavings >= 0 ? 'text-zillion-500' : 'text-red-500'}`}>{formatCurrency(internalRemainingAfterSavings)}</span>
           </div>
        </div>

        <div className={`my-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>

        <div className="flex justify-between">
           <Button variant="outline" onClick={onBack} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
           <Button variant="primary" onClick={handleNext} disabled={!mainSavingsAccountId} className="uppercase font-bold text-xs px-8">Next</Button>
        </div>
      </div>
    </div>
  );
}

// --- WIZARD STEP 6: DEBT SETUP ---
export function WizardStep6_DebtSetup({ debts, onDebtsChange, onBack, onNext, theme, toggleTheme }) {
  const safeDebts = debts || [];
  const [newDebt, setNewDebt] = useState({ name: '', type: '', compounding: '', originalAmount: '', remainingAmount: '', monthlyPayment: '', interestRate: '', originalTerm: '' });

  const handleDeleteDebt = (id) => onDebtsChange(safeDebts.filter((debt) => debt.id !== id));

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.remainingAmount) return;
    onDebtsChange([...safeDebts, {
      id: nanoid(),
      name: newDebt.name,
      debtType: newDebt.type,
      compoundingFrequency: newDebt.compounding || 'Monthly',
      amountOwed: parseFloat(newDebt.remainingAmount) || 0,
      startingAmount: parseFloat(newDebt.originalAmount) || 0,
      monthlyPayment: parseFloat(newDebt.monthlyPayment) || 0,
      interestRate: parseFloat(newDebt.interestRate) || 0,
      originalTerm: parseFloat(newDebt.originalTerm) || 0,
      autoInclude: true,
      extraMonthlyPayment: 0
    }]);
    setNewDebt({ name: '', type: '', compounding: '', originalAmount: '', remainingAmount: '', monthlyPayment: '', interestRate: '', originalTerm: '' });
  };

  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className="wizard-card max-w-2xl">
        <div className="text-center mb-6">
           <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2">ZILLION</h2>
           <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Set Up Debt Tracking</h1>
        </div>

        <div className="space-y-4 mb-8">
           <InputField label="Debt Name" placeholder="e.g. Chase Visa" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Type</label>
                 <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={newDebt.type} onChange={e => setNewDebt({...newDebt, type: e.target.value})}>
                    <option value="">Select...</option><option value="Credit Card">Credit Card</option><option value="Auto Loan">Auto Loan</option><option value="Mortgage">Mortgage</option><option value="Student Loan">Student Loan</option>
                 </select>
              </div>
              <div>
                 <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Compounding</label>
                 <select className={`w-full p-3 rounded-lg border bg-transparent outline-none ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'}`} value={newDebt.compounding} onChange={e => setNewDebt({...newDebt, compounding: e.target.value})}>
                    <option value="">Select...</option><option value="Daily">Daily</option><option value="Monthly">Monthly</option>
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <InputField label="Original Amount" icon={<DollarSign className="w-3 h-3" />} placeholder="0.00" value={newDebt.originalAmount} onChange={e => setNewDebt({...newDebt, originalAmount: e.target.value})} />
              <InputField label="Remaining" icon={<DollarSign className="w-3 h-3" />} placeholder="0.00" value={newDebt.remainingAmount} onChange={e => setNewDebt({...newDebt, remainingAmount: e.target.value})} />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <InputField label="Monthly Payment" icon={<DollarSign className="w-3 h-3" />} placeholder="0.00" value={newDebt.monthlyPayment} onChange={e => setNewDebt({...newDebt, monthlyPayment: e.target.value})} />
              <InputField label="Interest Rate" rightIcon={<span className="text-xs">%</span>} placeholder="0.00" value={newDebt.interestRate} onChange={e => setNewDebt({...newDebt, interestRate: e.target.value})} />
           </div>

           <InputField label="Original Term" placeholder="Months" type="number" value={newDebt.originalTerm} onChange={e => setNewDebt({...newDebt, originalTerm: e.target.value})} />

           <div className="flex justify-end">
              <Button variant="primary" onClick={handleAddDebt} className="px-6">Add Debt</Button>
           </div>
        </div>

        <div className="mb-8">
           <h3 className="text-xs font-bold uppercase mb-3 text-slate-500">Added Debts</h3>
           {safeDebts.length === 0 ? (
             <div className={`text-center py-8 border-b text-sm ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>No debts added yet.</div>
           ) : (
             <div className="space-y-3">
                {safeDebts.map(debt => (
                  <div key={debt.id} className={`p-4 rounded-lg border flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                    <div>
                       <div className="font-bold">{debt.name}</div>
                       <div className="text-xs text-slate-500">${debt.amountOwed} at {debt.interestRate}% - ${debt.monthlyPayment}/mo</div>
                       <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700">Auto-Budget</div>
                    </div>
                    <button onClick={() => handleDeleteDebt(debt.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
             </div>
           )}
        </div>

        <div className={`flex justify-between pt-8 mt-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
           <Button variant="outline" onClick={onBack} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
           <Button variant="primary" onClick={onNext} className="uppercase font-bold text-xs px-8">Next</Button>
        </div>
      </div>
    </div>
  );
}