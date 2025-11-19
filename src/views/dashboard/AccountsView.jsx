import React, { useState } from 'react';
import { ArrowLeftRight, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AccountForm, EditAccountModal } from '../../components/modals/AccountModals';

export default function AccountsView({
  accounts,
  defaultAccountId,
  onAccountsChange,
  onSetDefaultAccount,
  onOpenAccountTransactions,
  savingsAccountId,
  onSavingsAccountChange,
  mainSavingsAccountId,
  onMainSavingsAccountChange,
  onOpenTransferModal,
}) {
  const [editingAccount, setEditingAccount] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddAccount = (newAccount) => {
    const newAccounts = [...accounts, newAccount];
    onAccountsChange(newAccounts);
    if (newAccounts.length === 1 && !defaultAccountId) {
      onSetDefaultAccount(newAccount.id);
    }
    setIsFormOpen(false);
  };

  const handleDeleteAccount = (id) => {
    const newAccounts = accounts.filter((acc) => acc.id !== id);
    onAccountsChange(newAccounts);
    if (id === defaultAccountId) onSetDefaultAccount(newAccounts.length > 0 ? newAccounts[0].id : null);
    if (id === savingsAccountId) onSavingsAccountChange(null);
    if (id === mainSavingsAccountId) onMainSavingsAccountChange(null);
  };

  const handleEditAccount = (updatedAccount) => {
    onAccountsChange(accounts.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc)));
    setEditingAccount(null);
  };

  return (
    <>
      <EditAccountModal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} onSave={handleEditAccount} account={editingAccount} />
      
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Bank Accounts</h2>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button type="button" onClick={onOpenTransferModal} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              <ArrowLeftRight className="-ml-1 mr-2 h-5 w-5" /> Transfer Money
            </button>
            <button type="button" onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isFormOpen && <AccountForm onAddAccount={handleAddAccount} />}

        <div className="space-y-4 mt-6">
          {accounts.length > 0 && (
            <>
              <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 sm:px-3">
                <div className="sm:col-span-4 font-medium text-xs text-gray-500 uppercase tracking-wider">Account Name</div>
                <div className="sm:col-span-2 text-center font-medium text-xs text-gray-500 uppercase tracking-wider">Default (Expenses)</div>
                <div className="sm:col-span-2 text-center font-medium text-xs text-gray-500 uppercase tracking-wider">Sinking Funds</div>
                <div className="sm:col-span-2 text-center font-medium text-xs text-gray-500 uppercase tracking-wider">Main Savings</div>
                <div className="sm:col-span-2"></div>
              </div>

              {accounts.map((acc) => (
                <div key={acc.id} className={`relative grid grid-cols-1 sm:grid-cols-12 gap-y-2 sm:gap-4 items-center rounded-md border p-3 shadow-sm ${acc.id === defaultAccountId ? 'bg-indigo-50 border-indigo-200' : ''} ${acc.id === savingsAccountId ? 'bg-green-50 border-green-200' : ''} ${acc.id === mainSavingsAccountId ? 'bg-yellow-50 border-yellow-200' : ''} ${acc.id !== defaultAccountId && acc.id !== savingsAccountId && acc.id !== mainSavingsAccountId ? 'bg-white border-gray-200' : ''}`}>
                  <div className="sm:col-span-4 font-medium text-gray-900">{acc.name}</div>
                  <div className="sm:col-span-2 flex items-center justify-center"><input type="radio" name="default-account-main" checked={acc.id === defaultAccountId} onChange={() => onSetDefaultAccount(acc.id)} onClick={e => e.stopPropagation()} className="h-5 w-5 text-indigo-600 z-10" /></div>
                  <div className="sm:col-span-2 flex items-center justify-center"><input type="radio" name="savings-account-main" checked={acc.id === savingsAccountId} onChange={() => onSavingsAccountChange(acc.id)} onClick={e => e.stopPropagation()} className="h-5 w-5 text-green-600 z-10" /></div>
                  <div className="sm:col-span-2 flex items-center justify-center"><input type="radio" name="main-savings-account-main" checked={acc.id === mainSavingsAccountId} onChange={() => onMainSavingsAccountChange(acc.id)} onClick={e => e.stopPropagation()} className="h-5 w-5 text-yellow-600 z-10" /></div>
                  <div className="sm:col-span-2 flex items-center justify-end space-x-3 z-10">
                    <span className="text-gray-700 text-sm sm:text-base">{formatCurrency(acc.balance)}</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); }} className="rounded-full p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }} className="rounded-full p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => onOpenAccountTransactions({ id: acc.id, name: acc.name })} className="absolute inset-0 z-0 w-full h-full rounded-md transition-colors hover:bg-gray-50/50"></button>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-2 sm:gap-4 items-center rounded-md border border-dashed border-gray-300 p-3">
                  <div className="sm:col-span-4 font-medium text-gray-500 italic">No Specific Account</div>
                  <div className="sm:col-span-2"></div>
                  <div className="sm:col-span-2 flex items-center justify-center"><input type="radio" name="savings-account-main" checked={!savingsAccountId} onChange={() => onSavingsAccountChange(null)} className="h-5 w-5 text-gray-400" /></div>
                  <div className="sm:col-span-2 flex items-center justify-center"><input type="radio" name="main-savings-account-main" checked={!mainSavingsAccountId} onChange={() => onMainSavingsAccountChange(null)} className="h-5 w-5 text-gray-400" /></div>
                  <div className="sm:col-span-2"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}