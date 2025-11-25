import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AddBankAccountModal } from '../../components/modals/AccountModals';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { AmbientBackground } from '../../components/ui/SharedUI';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

// --- Internal Helper Component for consistent layout ---
const BankSetupStep = ({ title, description, nickname, setNickname, bankName, setBankName, lastFour, setLastFour, balance, setBalance, onBack, onNext, isNextDisabled, theme, toggleTheme }) => (
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
      animate-in fade-in slide-in-from-right-8 duration-500
    `}>
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
        <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h1>
      </div>

      <p className={`text-center text-sm mb-10 max-w-xs mx-auto transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
        {description}
      </p>

      <div className="space-y-5">
        <InputField
          label="Account Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g., Savings"
        />
        <InputField
          label="Bank Name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g., Chase"
        />
        <InputField
          label="Last 4 Digits"
          value={lastFour}
          onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="####"
          maxLength={4}
        />
        <InputField
          label="Current Balance"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
          icon={<DollarSign className="w-4 h-4" />}
          type="number"
        />
      </div>

      <div className={`my-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>

      <div className="flex justify-between items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="px-6 uppercase text-xs font-bold tracking-wide border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400"
        >
          BACK
        </Button>
        <Button 
          variant="primary" 
          onClick={onNext} 
          disabled={isNextDisabled} 
          className="px-10 uppercase text-xs font-bold tracking-wide"
        >
          NEXT
        </Button>
      </div>
    </div>
  </div>
);

// Step 2
export function WizardStep1a_AccountsInfo({ onNext, onBack, theme, toggleTheme }) {
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
        animate-in fade-in slide-in-from-right-8 duration-500
      `}>
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Let's Get Your Bank Accounts Set Up</h1>
        </div>
        <div className={`text-sm space-y-4 mb-8 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          <p>This app uses a simple three-account method to give every dollar a clear job. If you do not have three bank accounts yet, we recommend pausing here to open any you are missing.</p>
          <p>We will help you assign a role to three of your bank accounts:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>A central <span className="text-zillion-400 font-bold">Savings</span> account</li>
            <li>A <span className="text-zillion-400 font-bold">Spending</span> account for your monthly spending</li>
            <li>A <span className="text-zillion-400 font-bold">Sinking Fund</span> account for your goals</li>
          </ol>
          <p className="mt-4">When you have your three bank accounts ready, click "Next".</p>
        </div>
        <div className={`my-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
        <div className="flex justify-between">
           <Button variant="outline" onClick={onBack} className="uppercase font-bold text-xs border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">Back</Button>
           <Button variant="primary" onClick={onNext} rightIcon={<ArrowRight size={16} />} className="uppercase font-bold text-xs">Next</Button>
        </div>
      </div>
    </div>
  );
}

// Step 3
export function WizardStep1b_MainSavingsAccount({ budgetData, onAccountsChange, onMainSavingsAccountChange, onNext, onBack, theme, toggleTheme }) {
  const [nickname, setNickname] = useState(''); const [bankName, setBankName] = useState(''); const [lastFour, setLastFour] = useState(''); const [balance, setBalance] = useState(''); const [existingAccountId, setExistingAccountId] = useState(null);

  useEffect(() => {
    if (budgetData.mainSavingsAccountId) {
      const existingAccount = budgetData.bankAccounts.find(acc => acc.id === budgetData.mainSavingsAccountId);
      if (existingAccount) { setExistingAccountId(existingAccount.id); setNickname(existingAccount.name); setBankName(existingAccount.bankName || ''); setLastFour(existingAccount.lastFour || ''); setBalance(existingAccount.balance || ''); return; }
    }
    setNickname('Savings');
  }, [budgetData]);

  const handleNext = () => {
    const newAccountData = { id: existingAccountId || crypto.randomUUID(), name: nickname.trim(), bankName: bankName.trim(), lastFour: lastFour.trim(), balance: parseFloat(balance) || 0 };
    const newAccountsList = existingAccountId ? budgetData.bankAccounts.map(acc => acc.id === existingAccountId ? newAccountData : acc) : [...budgetData.bankAccounts, newAccountData];
    onAccountsChange(newAccountsList); onMainSavingsAccountChange(newAccountData.id); onNext();
  };

  const isNextDisabled = !nickname || !bankName || !lastFour || balance === '';

  return (
    <BankSetupStep
      title='The "Savings" Account'
      description="This account will be your financial hub. All your paychecks should be deposited here."
      nickname={nickname} setNickname={setNickname}
      bankName={bankName} setBankName={setBankName}
      lastFour={lastFour} setLastFour={setLastFour}
      balance={balance} setBalance={setBalance}
      onBack={onBack} onNext={handleNext} isNextDisabled={isNextDisabled}
      theme={theme} toggleTheme={toggleTheme}
    />
  );
}

// Step 4
export function WizardStep1c_DefaultAccount({ budgetData, onAccountsChange, onSetDefaultAccount, onNext, onBack, theme, toggleTheme }) {
  const [nickname, setNickname] = useState(''); const [bankName, setBankName] = useState(''); const [lastFour, setLastFour] = useState(''); const [balance, setBalance] = useState(''); const [existingAccountId, setExistingAccountId] = useState(null);

  useEffect(() => {
    if (budgetData.defaultAccountId && budgetData.defaultAccountId !== budgetData.mainSavingsAccountId) {
      const existingAccount = budgetData.bankAccounts.find(acc => acc.id === budgetData.defaultAccountId);
      if (existingAccount) { setExistingAccountId(existingAccount.id); setNickname(existingAccount.name); setBankName(existingAccount.bankName || ''); setLastFour(existingAccount.lastFour || ''); setBalance(existingAccount.balance || ''); return; }
    }
    setNickname('Spending');
  }, [budgetData]);

  const handleNext = () => {
    const newAccountData = { id: existingAccountId || crypto.randomUUID(), name: nickname.trim(), bankName: bankName.trim(), lastFour: lastFour.trim(), balance: parseFloat(balance) || 0 };
    if (newAccountData.id === budgetData.mainSavingsAccountId) { alert('Spending account must be different from your Savings account.'); return; }
    const newAccountsList = existingAccountId ? budgetData.bankAccounts.map(acc => acc.id === existingAccountId ? newAccountData : acc) : [...budgetData.bankAccounts, newAccountData];
    onAccountsChange(newAccountsList); onSetDefaultAccount(newAccountData.id); onNext();
  };

  const isNextDisabled = !nickname || !bankName || !lastFour || balance === '';

  return (
    <BankSetupStep
      title='The "Spending" Account'
      description="This is your monthly spending account. It pays for fixed expenses like groceries and gas."
      nickname={nickname} setNickname={setNickname}
      bankName={bankName} setBankName={setBankName}
      lastFour={lastFour} setLastFour={setLastFour}
      balance={balance} setBalance={setBalance}
      onBack={onBack} onNext={handleNext} isNextDisabled={isNextDisabled}
      theme={theme} toggleTheme={toggleTheme}
    />
  );
}

// Step 5
export function WizardStep1d_SinkingFundAccount({ budgetData, onAccountsChange, onSavingsAccountChange, onNext, onBack, theme, toggleTheme }) {
  const [nickname, setNickname] = useState(''); const [bankName, setBankName] = useState(''); const [lastFour, setLastFour] = useState(''); const [balance, setBalance] = useState(''); const [existingAccountId, setExistingAccountId] = useState(null);

  useEffect(() => {
    if (budgetData.savingsAccountId && budgetData.savingsAccountId !== budgetData.mainSavingsAccountId && budgetData.savingsAccountId !== budgetData.defaultAccountId) {
      const existingAccount = budgetData.bankAccounts.find(acc => acc.id === budgetData.savingsAccountId);
      if (existingAccount) { setExistingAccountId(existingAccount.id); setNickname(existingAccount.name); setBankName(existingAccount.bankName || ''); setLastFour(existingAccount.lastFour || ''); setBalance(existingAccount.balance || ''); return; }
    }
    setNickname('Sinking Fund');
  }, [budgetData]);

  const handleNext = () => {
    const newAccountData = { id: existingAccountId || crypto.randomUUID(), name: nickname.trim(), bankName: bankName.trim(), lastFour: lastFour.trim(), balance: parseFloat(balance) || 0 };
    if (newAccountData.id === budgetData.mainSavingsAccountId) { alert('Sinking Fund account must be different from your Savings account.'); return; }
    if (newAccountData.id === budgetData.defaultAccountId) { alert('Sinking Fund account must be different from your Spending account.'); return; }
    const newAccountsList = existingAccountId ? budgetData.bankAccounts.map(acc => acc.id === existingAccountId ? newAccountData : acc) : [...budgetData.bankAccounts, newAccountData];
    onAccountsChange(newAccountsList); onSavingsAccountChange(newAccountData.id); onNext();
  };

  const isNextDisabled = !nickname || !bankName || !lastFour || balance === '';

  return (
    <BankSetupStep
      title='The "Sinking Fund" Account'
      description="This is your account for goals and future expenses (Vacations, Car Repairs, etc.)."
      nickname={nickname} setNickname={setNickname}
      bankName={bankName} setBankName={setBankName}
      lastFour={lastFour} setLastFour={setLastFour}
      balance={balance} setBalance={setBalance}
      onBack={onBack} onNext={handleNext} isNextDisabled={isNextDisabled}
      theme={theme} toggleTheme={toggleTheme}
    />
  );
}

// Step 6 (Summary)
export function WizardStep1e_AccountSummary({ budgetData, onAccountsChange, onSetDefaultAccount, onMainSavingsAccountChange, onSavingsAccountChange, onNext, onBack, theme, toggleTheme }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const displayAccounts = budgetData.bankAccounts;

  const handleAddAccount = (newAccount) => onAccountsChange([...budgetData.bankAccounts, newAccount]);

  const handleDeleteAccount = (idToDelete) => {
    const updatedAccounts = budgetData.bankAccounts.filter(acc => acc.id !== idToDelete);
    onAccountsChange(updatedAccounts);
    if (budgetData.defaultAccountId === idToDelete) onSetDefaultAccount(null);
    if (budgetData.mainSavingsAccountId === idToDelete) onMainSavingsAccountChange(null);
    if (budgetData.savingsAccountId === idToDelete) onSavingsAccountChange(null);
  };

  const handleRoleChange = (accountId, roleType) => {
    if (roleType === 'mainSavings') onMainSavingsAccountChange(accountId);
    else if (roleType === 'default') onSetDefaultAccount(accountId);
    else if (roleType === 'sinkingFund') onSavingsAccountChange(accountId);
  };

  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <AddBankAccountModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddAccount={handleAddAccount} />
      
      <div className={`
        w-full max-w-2xl p-8 sm:p-10 rounded-3xl transition-all duration-500
        ${theme === 'dark'
          ? 'bg-slate-900/40 border border-white/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] backdrop-blur-xl'
          : 'bg-white/70 border border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-md'
        }
        animate-in fade-in duration-700
      `}>
        <div className="text-center mb-8">
           <h2 className="text-sm font-bold tracking-[0.2em] text-zillion-400 uppercase mb-2 transition-colors duration-300">ZILLION</h2>
           <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Bank Accounts</h1>
           <p className={`text-sm mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Great job. You've set up the three core accounts.</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`text-xs uppercase border-b ${theme === 'dark' ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'}`}>
              <tr>
                <th className="py-3 px-2">Account Name</th>
                <th className="py-3 px-2 text-center w-24">Savings</th>
                <th className="py-3 px-2 text-center w-24">Spending</th>
                <th className="py-3 px-2 text-center w-24">Sinking</th>
                <th className="py-3 px-2 text-right">Balance</th>
                <th className="py-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayAccounts.map((account) => (
                <tr key={account.id} className={`border-b last:border-0 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  <td className="py-4 px-2 font-medium">
                    {account.name} <span className={`font-normal ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>({account.lastFour || '----'})</span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex justify-center">
                      <input type="radio" name="mainSavingsRole" checked={budgetData.mainSavingsAccountId === account.id} onChange={() => handleRoleChange(account.id, 'mainSavings')} className="w-4 h-4 accent-zillion-400" />
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex justify-center">
                      <input type="radio" name="defaultRole" checked={budgetData.defaultAccountId === account.id} onChange={() => handleRoleChange(account.id, 'default')} className="w-4 h-4 accent-zillion-400" />
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <div className="flex justify-center">
                      <input type="radio" name="sinkingFundRole" checked={budgetData.savingsAccountId === account.id} onChange={() => handleRoleChange(account.id, 'sinkingFund')} className="w-4 h-4 accent-zillion-400" />
                    </div>
                  </td>
                  <td className={`py-4 px-2 text-right font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatCurrency(account.balance)}</td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => handleDeleteAccount(account.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
           {displayAccounts.map((acc) => (
             <div key={acc.id} className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex justify-between items-start mb-3">
                   <div>
                      <div className="font-bold text-base">{acc.name}</div>
                      <div className="text-xs text-slate-500">**** {acc.lastFour}</div>
                   </div>
                   <div className={`font-mono text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatCurrency(acc.balance)}</div>
                </div>
                <div className="flex gap-2 text-xs flex-wrap">
                   <label className={`flex items-center gap-1 px-2 py-1 rounded border ${budgetData.mainSavingsAccountId === acc.id ? 'bg-zillion-500 text-white border-zillion-500' : 'border-slate-300 text-slate-500'}`}>
                      <input type="radio" name="mainSavingsRole" checked={budgetData.mainSavingsAccountId === acc.id} onChange={() => handleRoleChange(acc.id, 'mainSavings')} className="hidden" />
                      Savings
                   </label>
                   <label className={`flex items-center gap-1 px-2 py-1 rounded border ${budgetData.defaultAccountId === acc.id ? 'bg-zillion-500 text-white border-zillion-500' : 'border-slate-300 text-slate-500'}`}>
                      <input type="radio" name="defaultRole" checked={budgetData.defaultAccountId === acc.id} onChange={() => handleRoleChange(acc.id, 'default')} className="hidden" />
                      Spending
                   </label>
                   <label className={`flex items-center gap-1 px-2 py-1 rounded border ${budgetData.savingsAccountId === acc.id ? 'bg-zillion-500 text-white border-zillion-500' : 'border-slate-300 text-slate-500'}`}>
                      <input type="radio" name="sinkingFundRole" checked={budgetData.savingsAccountId === acc.id} onChange={() => handleRoleChange(acc.id, 'sinkingFund')} className="hidden" />
                      Sinking
                   </label>
                </div>
                <div className="flex justify-end mt-2">
                   <button onClick={() => handleDeleteAccount(acc.id)} className="text-red-400 text-xs flex items-center"><Trash2 size={12} className="mr-1" /> Remove</button>
                </div>
             </div>
           ))}
        </div>

        <div className={`my-8 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
           <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="uppercase text-xs font-bold tracking-wide text-zillion-500 border-zillion-400 hover:bg-zillion-50 dark:hover:bg-zillion-900/20">ADD NEW ACCOUNT</Button>
           
           <div className="flex gap-3">
             <Button variant="outline" onClick={onBack} className="uppercase text-xs font-bold tracking-wide border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400">BACK</Button>
             <Button variant="primary" onClick={onNext} className="uppercase text-xs font-bold tracking-wide bg-zillion-400 text-white hover:bg-zillion-500 px-6">NEXT: INCOME</Button>
           </div>
        </div>
      </div>
    </div>
  );
}