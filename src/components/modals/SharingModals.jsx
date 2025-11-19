import React, { useState, useEffect } from 'react';
import { X, ClipboardList, ClipboardPaste, Check, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// --- 1. Share Budget Modal ---
export function ShareBudgetModal({ isOpen, onClose, budgetId }) {
  const [hasCopied, setHasCopied] = useState(false);
  useEffect(() => { if (isOpen) setHasCopied(false); }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(budgetId);
    setHasCopied(true);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Share Your Budget</h3>
        <p className="mt-2 text-sm text-gray-600">To share this budget, have your partner sign in with the same Budget ID.</p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Your Budget ID</label>
          <div className="flex mt-1">
            <input type="text" readOnly value={budgetId} className="block w-full rounded-l-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm" />
            <button type="button" onClick={handleCopy} className={`inline-flex items-center rounded-r-md border border-l-0 px-3 py-2 text-sm font-medium ${hasCopied ? 'border-green-300 bg-green-100 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
              {hasCopied ? <Check className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Done</button>
        </div>
      </div>
    </div>
  );
}

// --- 2. Invite Partner Modal ---
export function InviteModal({ isOpen, onClose, budgetId, userName }) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState('edit');
  const [inviteLink, setInviteLink] = useState('');
  const APP_URL = 'https://zillion-budgeting.firebaseapp.com'; // Updated with generic FB URL for now

  useEffect(() => { if (isOpen) { setEmail(''); setPermissions('edit'); setInviteLink(''); } }, [isOpen]);

  const generateLink = () => {
    if (!email) return;
    const url = `${APP_URL}?join=${budgetId}`;
    const subject = `You're invited to join ${userName}'s budget!`;
    const body = `Hello!\n\n${userName} has invited you to join their budget on Zillion.\n\nJoin now: ${url}\n\nOr manually join using ID: ${budgetId}`;
    setInviteLink(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Invite Partner</h3>
        {!inviteLink ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">Enter your partner's email to generate an invite link.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm" placeholder="partner@example.com" />
            <button onClick={generateLink} disabled={!email} className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300">Generate Invite Link</button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">Your invite is ready!</p>
            <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"><Mail className="mr-3 h-5 w-5" /> Open Email Invite</a>
            <div className="mt-6 flex justify-between pt-4 border-t">
                <button onClick={() => setInviteLink('')} className="text-sm text-indigo-600">Back</button>
                <button onClick={onClose} className="text-sm text-gray-600">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. Join Budget Modal ---
export function JoinBudgetModal({ isOpen, onClose, onJoin, initialBudgetId, message, setMessage }) {
  const [budgetId, setBudgetId] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialBudgetId) {
        setBudgetId(initialBudgetId);
        handleCheckId(initialBudgetId);
      } else {
        setBudgetId(''); setStep(1);
      }
      setIsLoading(false); setOwnerName(''); setMessage({ type: '', text: '' });
    }
  }, [isOpen, initialBudgetId]);

  const handleCheckId = async (id) => {
    const idToCheck = id || budgetId.trim();
    if (!idToCheck) { setMessage({ type: 'error', text: 'Please enter a Budget ID.' }); return; }
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const docRef = doc(db, `/artifacts/zillion-budget-app/users/${idToCheck}/budget/main`);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('No budget found with that ID.');
      const data = snap.data();
      if (data.linkedBudgetId || data.sharedWith) throw new Error('This budget cannot be joined.');
      setOwnerName(data.userName || 'your partner');
      setStep(2);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsLoading(false);
  };

  const handleConfirmJoin = () => onJoin(budgetId.trim());
  const handleClose = () => { setMessage({ type: '', text: '' }); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        <h3 className="text-lg font-medium leading-6 text-gray-900">{step === 1 ? "Join a Budget" : `Join ${ownerName}'s Budget?`}</h3>
        {message.text && <div className={`my-4 rounded-md border p-3 text-center text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'}`}>{message.text}</div>}
        
        {step === 1 && (
          <div className="mt-4 space-y-4">
            <div className="relative mt-1">
                <input type="text" value={budgetId} onChange={e => setBudgetId(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 shadow-sm" placeholder="Budget ID" />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><ClipboardPaste className="h-5 w-5 text-gray-400" /></div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={handleClose} className="border rounded px-4 py-2">Cancel</button>
                <button onClick={() => handleCheckId()} disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-indigo-300">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find Budget'}</button>
            </div>
          </div>
        )}

        {step === 2 && (
            <div className="mt-4 space-y-4">
                <div className="rounded-md bg-red-50 p-4 flex">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="ml-3 text-sm text-red-700"><p>Warning: Joining {ownerName}'s budget will replace your current budget. This cannot be undone.</p></div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setStep(1)} className="border rounded px-4 py-2">Back</button>
                    <button onClick={handleConfirmJoin} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Join Budget</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// --- 4. Confirm Leave ---
export function ConfirmLeaveModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-medium text-gray-900">Leave Budget</h3>
          <p className="mt-2 text-sm text-gray-500">Are you sure you want to leave this shared budget?</p>
          <div className="mt-5 flex justify-end space-x-3">
            <button onClick={onClose} className="border rounded px-4 py-2">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 text-white rounded px-4 py-2">Yes, Leave</button>
          </div>
        </div>
      </div>
    );
}

// --- 5. Confirm Remove Partner ---
export function ConfirmRemoveModal({ isOpen, onClose, onConfirm, partnerName }) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-medium text-gray-900">Remove Partner</h3>
          <p className="mt-2 text-sm text-gray-500">Are you sure you want to remove {partnerName || 'your partner'}?</p>
          <div className="mt-5 flex justify-end space-x-3">
            <button onClick={onClose} className="border rounded px-4 py-2">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 text-white rounded px-4 py-2">Yes, Remove</button>
          </div>
        </div>
      </div>
    );
}