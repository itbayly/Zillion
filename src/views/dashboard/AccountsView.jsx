import React, { useState } from 'react';
import { ArrowLeftRight, Plus, Edit3, Trash2, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { AccountForm, EditAccountModal } from '../../components/modals/AccountModals';
import { Button } from '../../components/ui/Button';

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
  theme = 'light'
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

  const CardRow = ({ acc }) => {
    const isDefault = acc.id === defaultAccountId;
    const isSinking = acc.id === savingsAccountId;
    const isMainSavings = acc.id === mainSavingsAccountId;

    return (
      <div key={acc.id} className={`relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border transition-all duration-300 
        ${theme === 'dark' 
          ? 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40' 
          : 'bg-white/70 border-white/60 shadow-sm hover:bg-white/80'
        }`}>
        
        {/* Name & Balance */}
        <div className="flex-grow min-w-0">
          <h3 className={`font-bold text-lg truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{acc.name}</h3>
          <p className={`font-mono text-sm ${theme === 'dark' ? 'text-zillion-400' : 'text-zillion-600'}`}>{formatCurrency(acc.balance)}</p>
        </div>

        {/* Role Toggles */}
        <div className="flex flex-wrap gap-2">
          <button onClick={(e) => { e.stopPropagation(); onSetDefaultAccount(acc.id); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${isDefault ? 'bg-blue-500/10 text-blue-500 border-blue-500/50' : `text-slate-400 border-transparent ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
            Spending {isDefault && <Check className="inline w-3 h-3 ml-1" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSavingsAccountChange(acc.id); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${isSinking ? 'bg-green-500/10 text-green-500 border-green-500/50' : `text-slate-400 border-transparent ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
            Sinking {isSinking && <Check className="inline w-3 h-3 ml-1" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMainSavingsAccountChange(acc.id); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${isMainSavings ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : `text-slate-400 border-transparent ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}`}>
            Income {isMainSavings && <Check className="inline w-3 h-3 ml-1" />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 z-10">
           <button onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); }} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
             <Edit3 className="w-4 h-4" />
           </button>
           <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
             <Trash2 className="w-4 h-4" />
           </button>
        </div>

        {/* Click Area for Details */}
        <button onClick={() => onOpenAccountTransactions({ id: acc.id, name: acc.name })} className="absolute inset-0 w-full h-full z-0" aria-label="View Transactions" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <EditAccountModal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} onSave={handleEditAccount} account={editingAccount} theme={theme} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Bank Accounts</h2>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={onOpenTransferModal} icon={<ArrowLeftRight className="w-4 h-4" />}>Transfer Money</Button>
          <Button variant="primary" onClick={() => setIsFormOpen(!isFormOpen)} icon={<Plus className="w-4 h-4" />}>
             {isFormOpen ? 'Close' : 'Add Account'}
          </Button>
        </div>
      </div>

      {isFormOpen && <AccountForm onAddAccount={handleAddAccount} theme={theme} />}

      <div className="space-y-4">
        {accounts.length > 0 ? (
          accounts.map((acc) => <CardRow key={acc.id} acc={acc} />)
        ) : (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No accounts added yet.</p>
        )}
      </div>
    </div>
  );
}