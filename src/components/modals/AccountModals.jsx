import React, { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';

// Reusable Form Component
export function AccountForm({ onAddAccount }) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const handleFocus = (e) => e.target.select();

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
      className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="accountName"
          className="block text-sm font-medium text-gray-700"
        >
          Account Name
        </label>
        <input
          type="text"
          id="accountName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., Checking"
        />
      </div>
      <div className="flex-1">
        <label
          htmlFor="accountBalance"
          className="block text-sm font-medium text-gray-700"
        >
          Current Balance
        </label>
        <div className="relative mt-1">
          <input
            type="number"
            id="accountBalance"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            onFocus={handleFocus}
            className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Plus className="-ml-1 mr-2 h-5 w-5" />
        Add
      </button>
    </form>
  );
}

// Modal for editing an account
export function EditAccountModal({ isOpen, onClose, onSave, account }) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Edit Account
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="editAccountName"
              className="block text-sm font-medium text-gray-700"
            >
              Account Name
            </label>
            <input
              type="text"
              id="editAccountName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="editAccountBalance"
              className="block text-sm font-medium text-gray-700"
            >
              Current Balance
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                id="editAccountBalance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// Simple Modal wrapper for Adding (Used in Wizard)
export function AddBankAccountModal({ isOpen, onClose, onAddAccount }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
       {/* Inner content similar to above, simplified for brevity in this paste since it was in your main file */}
       <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">ADD NEW BANK ACCOUNT</h3>
          <div className="space-y-4">
             <input type="text" className="w-full border p-2 rounded" placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
             <input type="text" className="w-full border p-2 rounded" placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} />
             <input type="text" className="w-full border p-2 rounded" placeholder="Last 4" value={lastFour} onChange={e => setLastFour(e.target.value)} />
             <input type="number" className="w-full border p-2 rounded" placeholder="Balance" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
             <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
             <button onClick={handleAdd} className="px-4 py-2 bg-green-500 text-white rounded">Add</button>
          </div>
       </div>
    </div>
  );
}