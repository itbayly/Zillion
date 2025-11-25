import React, { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { GlassCurrencyInput } from '../ui/FormInputs'; // Correct import
import { InputField } from '../ui/InputField';         // Correct import
import { Button } from '../ui/Button';
import { ModalWrapper } from '../ui/SharedUI';

// Reusable Form Component (for Dashboard)
export function AccountForm({ onAddAccount, theme = 'light' }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === '') return;

    const newAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      balance: parseFloat(balance) || 0,
    };

    onAddAccount(newAccount);
    setName('');
    setBalance('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-4 rounded-2xl border p-6 mb-8 transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-white/60'}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 w-full">
          <InputField 
            label="Account Name" 
            id="accountName" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g., Checking" 
            theme={theme} 
            containerClassName="mb-0"
          />
        </div>
        <div className="flex-1 w-full">
          <GlassCurrencyInput 
            label="Current Balance" 
            id="accountBalance" 
            value={balance} 
            onChange={setBalance} 
            placeholder="0.00" 
            theme={theme} 
          />
        </div>
        <div className="mt-0 sm:mt-7">
          <Button
            type="submit"
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
          >
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}

// Modal for editing an account
export function EditAccountModal({ isOpen, onClose, onSave, account, theme = 'light' }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBalance(account.balance);
    }
  }, [account]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === '') return;
    onSave({
      ...account,
      name: name.trim(),
      balance: parseFloat(balance) || 0,
    });
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Edit Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField 
          label="Account Name" 
          id="editAccountName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          theme={theme} 
        />
        <GlassCurrencyInput 
          label="Current Balance" 
          id="editAccountBalance" 
          value={balance} 
          onChange={setBalance} 
          theme={theme} 
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// Simple Modal wrapper for Adding (Used in Wizard)
export function AddBankAccountModal({ isOpen, onClose, onAddAccount, theme = 'light' }) {
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [balance, setBalance] = useState('');

  const handleAdd = () => {
    if (!nickname || !bankName || !lastFour) {
      alert('Please fill in all account details.');
      return;
    }
    const newAccount = {
      id: crypto.randomUUID(),
      name: nickname.trim(),
      bankName: bankName.trim(),
      lastFour: lastFour.trim(),
      balance: parseFloat(balance) || 0,
    };
    onAddAccount(newAccount);
    setNickname('');
    setBankName('');
    setLastFour('');
    setBalance('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Add New Bank Account">
      <div className="space-y-4">
         <InputField label="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Savings" theme={theme} />
         <InputField label="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Chase" theme={theme} />
         <InputField label="Last 4 Digits" value={lastFour} onChange={e => setLastFour(e.target.value)} placeholder="1234" maxLength={4} theme={theme} />
         <GlassCurrencyInput label="Current Balance" value={balance} onChange={setBalance} placeholder="0.00" theme={theme} />
         
         <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Add Account</Button>
         </div>
      </div>
    </ModalWrapper>
  );
}