import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { WizardTextInput } from '../../components/ui/FormInputs';
import { AddBankAccountModal } from '../../components/modals/AccountModals';

// Step 2
export function WizardStep1a_AccountsInfo({ onNext, onBack }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Let's Get Your Bank Accounts Set Up</h3>
      </div>
      <div className="mt-8 text-gray-700 space-y-5 text-base">
        <p>This app uses a simple three-account method to give every dollar a clear job. If you do not have three bank accounts yet, we recommend pausing here to open any you are missing.</p>
        <p>We will help you assign a role to three of your bank accounts:</p>
        <ul className="list-decimal pl-8 space-y-2">
          <li>A central <strong className="text-[#3DDC97]">Savings</strong> account</li>
          <li>A <strong className="text-[#3DDC97]">Spending</strong> account for your monthly spending</li>
          <li>A <strong className="text-[#3DDC97]">Sinking Fund</strong> account for your goals</li>
        </ul>
        <p className="pt-4">When you have your three bank accounts ready, click "Next".</p>
      </div>
      <div className="flex justify-between pt-8 mt-6 border-t">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><ChevronLeft className="-ml-1 mr-2 h-5 w-5" /> Back</button>
        <button type="button" onClick={onNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">Next <ArrowRight className="ml-2 h-5 w-5" /></button>
      </div>
    </div>
  );
}

// Step 3
export function WizardStep1b_MainSavingsAccount({ budgetData, onAccountsChange, onMainSavingsAccountChange, onNext, onBack }) {
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
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">The "Savings" Account</h3>
        <p className="mt-6 text-sm text-gray-700">This account will be your financial hub. All your paychecks should be deposited here.</p>
      </div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <WizardTextInput label="Account Nickname" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g., Savings" />
        <WizardTextInput label="Bank Name" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., Chase" />
        <WizardTextInput label="Last 4 Digits" id="lastFour" value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="####" />
        <WizardTextInput label="Current Balance" id="balance" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" type="number" />
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={handleNext} disabled={isNextDisabled} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300">NEXT</button>
      </div>
    </div>
  );
}

// Step 4
export function WizardStep1c_DefaultAccount({ budgetData, onAccountsChange, onSetDefaultAccount, onNext, onBack }) {
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
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">The "Spending" Account</h3>
        <p className="mt-6 text-sm text-gray-700">This is your monthly spending account. It pays for fixed expenses like groceries and gas.</p>
      </div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <WizardTextInput label="Account Nickname" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g., Spending" />
        <WizardTextInput label="Bank Name" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., Chase" />
        <WizardTextInput label="Last 4 Digits" id="lastFour" value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="####" />
        <WizardTextInput label="Current Balance" id="balance" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" type="number" />
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={handleNext} disabled={isNextDisabled} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300">NEXT</button>
      </div>
    </div>
  );
}

// Step 5
export function WizardStep1d_SinkingFundAccount({ budgetData, onAccountsChange, onSavingsAccountChange, onNext, onBack }) {
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
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-2xl mx-auto">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">The "Sinking Fund" Account</h3>
        <p className="mt-6 text-sm text-gray-700">This is your account for goals and future expenses (Vacations, Car Repairs, etc.).</p>
      </div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <WizardTextInput label="Account Nickname" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g., Sinking Fund" />
        <WizardTextInput label="Bank Name" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., Ally" />
        <WizardTextInput label="Last 4 Digits" id="lastFour" value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="####" />
        <WizardTextInput label="Current Balance" id="balance" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" type="number" />
      </div>
      <div className="flex justify-between pt-8 mt-8 border-t max-w-md mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
        <button type="button" onClick={handleNext} disabled={isNextDisabled} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:bg-gray-300">NEXT</button>
      </div>
    </div>
  );
}

// Step 6
export function WizardStep1e_AccountSummary({ budgetData, onAccountsChange, onSetDefaultAccount, onMainSavingsAccountChange, onSavingsAccountChange, onNext, onBack }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const assignedAccounts = useMemo(() => {
    const defaultAcc = budgetData.bankAccounts.find(acc => acc.id === budgetData.defaultAccountId);
    const mainSavingsAcc = budgetData.bankAccounts.find(acc => acc.id === budgetData.mainSavingsAccountId);
    const sinkingFundAcc = budgetData.bankAccounts.find(acc => acc.id === budgetData.savingsAccountId);

    const accounts = [];
    if (mainSavingsAcc) accounts.push({ ...mainSavingsAcc, role: 'mainSavings' });
    if (defaultAcc && defaultAcc.id !== mainSavingsAcc?.id) accounts.push({ ...defaultAcc, role: 'default' });
    if (sinkingFundAcc && sinkingFundAcc.id !== mainSavingsAcc?.id && sinkingFundAcc.id !== defaultAcc?.id) accounts.push({ ...sinkingFundAcc, role: 'sinkingFund' });

    const assignedIds = new Set(accounts.map(acc => acc.id));
    const unassignedAccounts = budgetData.bankAccounts.filter(acc => !assignedIds.has(acc.id));
    return [...accounts, ...unassignedAccounts];
  }, [budgetData.bankAccounts, budgetData.defaultAccountId, budgetData.mainSavingsAccountId, budgetData.savingsAccountId]);

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
    <div className="rounded-lg bg-white p-6 shadow-md sm:p-8 max-w-4xl mx-auto">
      <AddBankAccountModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddAccount={handleAddAccount} />
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-2xl font-bold uppercase text-[#3DDC97] tracking-widest">ZILLION</h2>
        <h3 className="mt-4 text-3xl font-semibold text-gray-800">Bank Accounts</h3>
        <p className="mt-6 text-sm text-gray-700">Great job. You've set up the three core accounts.</p>
      </div>
      <div className="mt-8">
        <div className="min-w-full overflow-hidden align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Account Name</th><th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Savings Account</th><th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Spending Account</th><th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Sinking Funds</th><th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Balance</th><th className="relative px-6 py-3"></th></tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {assignedAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{account.name} <span className="text-gray-500">({account.lastFour})</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500"><input type="radio" name={`role-${account.id}`} checked={budgetData.mainSavingsAccountId === account.id} onChange={() => handleRoleChange(account.id, 'mainSavings')} className="h-4 w-4 text-[#3DDC97]" /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500"><input type="radio" name={`role-${account.id}`} checked={budgetData.defaultAccountId === account.id} onChange={() => handleRoleChange(account.id, 'default')} className="h-4 w-4 text-[#3DDC97]" /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500"><input type="radio" name={`role-${account.id}`} checked={budgetData.savingsAccountId === account.id} onChange={() => handleRoleChange(account.id, 'sinkingFund')} className="h-4 w-4 text-[#3DDC97]" /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(account.balance)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"><button onClick={() => handleDeleteAccount(account.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between pt-8 mt-6 border-t">
        <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center rounded-md border border-[#3DDC97] bg-white px-4 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50">ADD NEW ACCOUNT</button>
        <div className="flex space-x-4">
          <button type="button" onClick={onBack} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-10 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-gray-50">BACK</button>
          <button type="button" onClick={onNext} className="inline-flex items-center rounded-md border border-transparent bg-[#3DDC97] px-10 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">NEXT: INCOME</button>
        </div>
      </div>
    </div>
  );
}