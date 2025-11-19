import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// --- 1. Update Profile Modal ---
export function UpdateProfileModal({ isOpen, onClose, onSave, currentUser }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Update Profile</h3>
        {error && <div className="my-4 rounded-md border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="pt-4 border-t">
            <h4 className="text-md font-medium text-gray-800">Change Password</h4>
            <p className="text-sm text-gray-500 mb-2">Leave blank to keep current password.</p>
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

// --- 2. Confirm Sign Out ---
export function ConfirmSignOutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4 mt-0 text-left">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Sign Out</h3>
            <p className="mt-2 text-sm text-gray-500">Are you sure you want to sign out?</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// --- 3. Confirm Reset ---
export function ConfirmResetModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4 mt-0 text-left">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Reset Budget</h3>
            <p className="mt-2 text-sm text-gray-500">Are you sure? This will permanently delete all data. This cannot be undone.</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end space-x-3">
          <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Yes, Reset</button>
        </div>
      </div>
    </div>
  );
}