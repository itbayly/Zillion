import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalWrapper } from '../ui/SharedUI';
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';

// --- 1. Update Profile Modal ---
export function UpdateProfileModal({ isOpen, onClose, onSave, currentUser, theme = 'light' }) {
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) setName(currentUser.displayName || '');
    setError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  }, [isOpen, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword && !currentPassword) {
      setError('Please enter your current password to set a new one.');
      return;
    }
    onSave(name, currentPassword, newPassword);
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Update Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500">{error}</div>}
        
        <InputField label="Full Name" value={name} onChange={e => setName(e.target.value)} theme={theme} />
        
        <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <h4 className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Change Password</h4>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Leave blank to keep current password.</p>
            
            <div className="space-y-4">
                <InputField type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} theme={theme} />
                <InputField type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} theme={theme} />
                <InputField type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} theme={theme} />
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// --- 2. Confirm Sign Out ---
export function ConfirmSignOutModal({ isOpen, onClose, onConfirm, theme = 'light' }) {
  if (!isOpen) return null;
  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Sign Out" maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center">
            <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Are you sure you want to sign out?</p>
            <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
                <Button variant="primary" onClick={onConfirm} fullWidth className="bg-red-600 hover:bg-red-700 border-red-600 shadow-red-500/20">Sign Out</Button>
            </div>
        </div>
    </ModalWrapper>
  );
}

// --- 3. Confirm Reset ---
export function ConfirmResetModal({ isOpen, onClose, onConfirm, theme = 'light' }) {
  if (!isOpen) return null;
  return (
    <ModalWrapper onClose={onClose} theme={theme} title="Reset Budget" maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
               <AlertTriangle className="h-8 w-8" />
            </div>
            <p className={`mb-2 font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>This action is permanent.</p>
            <p className={`mb-6 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>This will delete all transactions, accounts, and debts. This cannot be undone.</p>
            <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
                <Button variant="primary" onClick={onConfirm} fullWidth className="bg-red-600 hover:bg-red-700 border-red-600 shadow-red-500/20">Yes, Reset Everything</Button>
            </div>
        </div>
    </ModalWrapper>
  );
}