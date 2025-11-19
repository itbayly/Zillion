import React, { useState, useEffect } from 'react';
import { User, UserPlus, Users, Unlink, Edit, Share2, LogOut, RefreshCw, Wallet, Banknote, Target, CreditCard, ClipboardList } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { updateProfile, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UpdateProfileModal, ConfirmSignOutModal, ConfirmResetModal } from '../../components/modals/SettingsModals';
import { ShareBudgetModal, InviteModal } from '../../components/modals/SharingModals';
import { getDefaultBudgetData } from '../../utils/helpers';

export default function SettingsView({
  onSignOut,
  budgetId,
  updateBudget,
  userDoc,
  effectiveBudgetId,
  onOpenJoinModal,
  onOpenLeaveModal,
  onOpenRemoveModal,
  sharingMessage,
  setSharingMessage,
}) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isUpdateBudgetOpen, setIsUpdateBudgetOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  
  const currentUser = auth.currentUser;
  const isLinked = !!userDoc?.linkedBudgetId;
  const isOwner = !isLinked && !!userDoc?.sharedWith;
  const isSolo = !isLinked && !isOwner;

  useEffect(() => {
    if (sharingMessage.type === 'success') {
      const timer = setTimeout(() => setSharingMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [sharingMessage, setSharingMessage]);

  const handleUpdateProfile = async (newName, currentPassword, newPassword) => {
    if (!currentUser) return;
    setProfileMessage({ type: '', text: '' });
    try {
      if (newName && newName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: newName });
        if (!isLinked) {
          const userDocRef = doc(db, `/artifacts/zillion-budget-app/users/${budgetId}/budget/main`);
          await setDoc(userDocRef, { userName: newName }, { merge: true });
        }
      }
      if (currentPassword && newPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
      }
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsProfileModalOpen(false);
    } catch (error) {
      let errorText = 'An error occurred. Please try again.';
      if (error.code === 'auth/wrong-password') errorText = 'Your current password was incorrect.';
      else if (error.code === 'auth/weak-password') errorText = 'Your new password is too weak.';
      setProfileMessage({ type: 'error', text: errorText });
    }
  };

  const handleResetBudget = () => {
    const newDefaultData = getDefaultBudgetData();
    updateBudget({
      bankAccounts: [],
      defaultAccountId: null,
      savingsAccountId: null,
      mainSavingsAccountId: null,
      debts: [],
      monthlyData: newDefaultData.monthlyData,
    });
    setIsResetModalOpen(false);
    setSharingMessage({ type: 'success', text: 'Your budget has been fully reset.' });
  };

  const UpdateBudgetCard = ({ icon: Icon, title, onClick }) => (
    <button onClick={onClick} className="flex items-center p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-left w-full">
        <div className="bg-indigo-100 p-3 rounded-full mr-4"><Icon className="h-6 w-6 text-indigo-600" /></div>
        <span className="font-medium text-gray-700">{title}</span>
    </button>
  );

  return (
    <>
      <UpdateProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} currentUser={currentUser} />
      <ShareBudgetModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} budgetId={budgetId} />
      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} budgetId={budgetId} userName={currentUser?.displayName || 'Your Partner'} />
      <ConfirmSignOutModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={onSignOut} />
      <ConfirmResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetBudget} />

      <div className="space-y-8">
        {sharingMessage.text && <div className={`rounded-md p-4 text-sm ${sharingMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{sharingMessage.text}</div>}

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
          {profileMessage.text && <div className={`rounded-md p-4 text-sm mb-4 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{profileMessage.text}</div>}
          <div className="space-y-2 text-gray-700">
            <p><strong>Name:</strong> {currentUser?.displayName || 'Not set'}</p>
            <p><strong>Email:</strong> {currentUser?.email || 'Not set'}</p>
          </div>
          <button onClick={() => { setProfileMessage({ type: '', text: '' }); setIsProfileModalOpen(true); }} className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><User className="-ml-1 mr-2 h-5 w-5" /> Update Profile</button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Budget Sharing</h3>
          {isSolo && (
            <>
              <p className="text-sm text-gray-600 mb-4">Invite someone to share your budget or join an existing budget.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setIsInviteModalOpen(true)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><UserPlus className="-ml-1 mr-2 h-5 w-5" /> Invite Someone</button>
                <button onClick={onOpenJoinModal} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><Users className="-ml-1 mr-2 h-5 w-5" /> Join a Budget</button>
              </div>
            </>
          )}
          {isLinked && (
            <>
              <p className="text-sm text-gray-600 mb-4">You are currently a member of a shared budget.</p>
              <button onClick={onOpenLeaveModal} className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"><Unlink className="-ml-1 mr-2 h-5 w-5" /> Leave Budget</button>
            </>
          )}
          {isOwner && (
            <>
              <p className="text-sm text-gray-600 mb-4">You are sharing your budget with:</p>
              <div className="text-gray-700 space-y-2 p-4 border rounded-md bg-slate-50">
                <p><strong>Name:</strong> {userDoc.sharedWith.name || 'N/A'}</p>
                <p><strong>Email:</strong> {userDoc.sharedWith.email || 'N/A'}</p>
                <p><strong>Permissions:</strong> {userDoc.sharedWith.permissions || 'N/A'}</p>
              </div>
              <button onClick={onOpenRemoveModal} className="mt-4 inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"><Unlink className="-ml-1 mr-2 h-5 w-5" /> Remove Partner</button>
            </>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Budget Settings</h3>
          <button onClick={() => setIsUpdateBudgetOpen(!isUpdateBudgetOpen)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><Edit className="-ml-1 mr-2 h-5 w-5" /> Update Budget Structure</button>
          {isUpdateBudgetOpen && (
            <div className="mt-6 space-y-4 pt-6 border-t">
              <p className="text-sm text-gray-600">These actions will take you to the corresponding setup step to make changes. (Functionality coming soon).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UpdateBudgetCard icon={Wallet} title="Update Bank Accounts" onClick={() => alert('Functionality coming soon!')} />
                <UpdateBudgetCard icon={Banknote} title="Update Income" onClick={() => alert('Functionality coming soon!')} />
                <UpdateBudgetCard icon={Target} title="Update Savings Goals" onClick={() => alert('Functionality coming soon!')} />
                <UpdateBudgetCard icon={CreditCard} title="Update Debts" onClick={() => alert('Functionality coming soon!')} />
                <UpdateBudgetCard icon={ClipboardList} title="Update Categories" onClick={() => alert('Functionality coming soon!')} />
              </div>
              <div className="mt-6 pt-6 border-t border-dashed border-red-300">
                <h4 className="font-semibold text-red-700">Danger Zone</h4>
                <button onClick={() => setIsResetModalOpen(true)} className="mt-2 inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"><RefreshCw className="-ml-1 mr-2 h-5 w-5" /> Fully Reset Budget</button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Other Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setIsShareModalOpen(true)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><Share2 className="-ml-1 mr-2 h-5 w-5" /> Share Budget ID</button>
            <button onClick={() => setIsSignOutModalOpen(true)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-red-50 hover:text-red-700"><LogOut className="-ml-1 mr-2 h-5 w-5" /> Sign Out</button>
          </div>
        </div>
      </div>
    </>
  );
}