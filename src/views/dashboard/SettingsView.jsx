import React, { useState, useEffect } from 'react';
import { User, UserPlus, Users, Unlink, Edit, Share2, LogOut, RefreshCw, Wallet, Banknote, Target, CreditCard, ClipboardList } from 'lucide-react';
import { auth, db } from '../../config/firebase';
import { updateProfile, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UpdateProfileModal, ConfirmSignOutModal, ConfirmResetModal } from '../../components/modals/SettingsModals';
import { ShareBudgetModal, InviteModal } from '../../components/modals/SharingModals';
import { getDefaultBudgetData } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';

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
  setActiveTab,
  theme = 'light'
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
    // ... (Same logic as before, no changes needed here)
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
    <button onClick={onClick} className={`flex items-center p-4 rounded-xl border transition-colors w-full ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
        <div className={`p-3 rounded-full mr-4 ${theme === 'dark' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><Icon className="h-6 w-6" /></div>
        <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{title}</span>
    </button>
  );

  // Style Classes
  const cardClass = `p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-white/10 shadow-lg shadow-black/20' : 'bg-white/70 border-white/60 shadow-lg shadow-slate-200/50'}`;
  const textMain = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const textSub = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <>
      <UpdateProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} currentUser={currentUser} theme={theme} />
      <ShareBudgetModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} budgetId={budgetId} theme={theme} />
      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} budgetId={budgetId} userName={currentUser?.displayName || 'Your Partner'} theme={theme} />
      <ConfirmSignOutModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={onSignOut} theme={theme} />
      <ConfirmResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetBudget} theme={theme} />

      <div className="space-y-8">
        {sharingMessage.text && <div className={`rounded-md p-4 text-sm ${sharingMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{sharingMessage.text}</div>}

        <div className={cardClass}>
          <h3 className={`text-xl font-bold mb-4 ${textMain}`}>Personal Information</h3>
          {profileMessage.text && <div className={`rounded-md p-4 text-sm mb-4 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{profileMessage.text}</div>}
          <div className={`space-y-2 ${textSub}`}>
            <p><strong className={textMain}>Name:</strong> {currentUser?.displayName || 'Not set'}</p>
            <p><strong className={textMain}>Email:</strong> {currentUser?.email || 'Not set'}</p>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => { setProfileMessage({ type: '', text: '' }); setIsProfileModalOpen(true); }} icon={<User className="w-4 h-4" />}>Update Profile</Button>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className={`text-xl font-bold mb-4 ${textMain}`}>Budget Sharing</h3>
          {isSolo && (
            <>
              <p className={`text-sm mb-4 ${textSub}`}>Invite someone to share your budget or join an existing budget.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" onClick={() => setIsInviteModalOpen(true)} icon={<UserPlus className="w-4 h-4" />}>Invite Someone</Button>
                <Button variant="outline" onClick={onOpenJoinModal} icon={<Users className="w-4 h-4" />}>Join a Budget</Button>
              </div>
            </>
          )}
          {isLinked && (
            <>
              <p className={`text-sm mb-4 ${textSub}`}>You are currently a member of a shared budget.</p>
              <Button variant="outline" onClick={onOpenLeaveModal} icon={<Unlink className="w-4 h-4" />} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">Leave Budget</Button>
            </>
          )}
          {isOwner && (
            <>
              <p className={`text-sm mb-4 ${textSub}`}>You are sharing your budget with:</p>
              <div className={`text-sm space-y-2 p-4 border rounded-xl ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <p><strong>Name:</strong> {userDoc.sharedWith.name || 'N/A'}</p>
                <p><strong>Email:</strong> {userDoc.sharedWith.email || 'N/A'}</p>
                <p><strong>Permissions:</strong> {userDoc.sharedWith.permissions || 'N/A'}</p>
              </div>
              <div className="mt-4">
                 <Button variant="outline" onClick={onOpenRemoveModal} icon={<Unlink className="w-4 h-4" />} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">Remove Partner</Button>
              </div>
            </>
          )}
        </div>

        <div className={cardClass}>
          <h3 className={`text-xl font-bold mb-4 ${textMain}`}>Budget Settings</h3>
          <Button variant="outline" onClick={() => setIsUpdateBudgetOpen(!isUpdateBudgetOpen)} icon={<Edit className="w-4 h-4" />}>Update Budget Structure</Button>
          {isUpdateBudgetOpen && (
            <div className={`mt-6 space-y-4 pt-6 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <p className={`text-sm ${textSub}`}>These actions will take you to the corresponding setup step to make changes. (Functionality coming soon).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UpdateBudgetCard icon={Wallet} title="Update Bank Accounts" onClick={() => setActiveTab('accounts')} />
                <UpdateBudgetCard icon={Banknote} title="Update Income" onClick={() => setActiveTab('reports')} />
                <UpdateBudgetCard icon={Target} title="Update Savings Goals" onClick={() => setActiveTab('reports')} />
                <UpdateBudgetCard icon={CreditCard} title="Update Debts" onClick={() => setActiveTab('debts')} />
                <UpdateBudgetCard icon={ClipboardList} title="Update Categories" onClick={() => setActiveTab('budget')} />
              </div>
              <div className="mt-6 pt-6 border-t border-dashed border-red-300/50">
                <h4 className="font-bold text-red-500 mb-2">Danger Zone</h4>
                <Button variant="outline" onClick={() => setIsResetModalOpen(true)} icon={<RefreshCw className="w-4 h-4" />} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">Fully Reset Budget</Button>
              </div>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h3 className={`text-xl font-bold mb-4 ${textMain}`}>Other Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)} icon={<Share2 className="w-4 h-4" />}>Share Budget ID</Button>
            <Button variant="outline" onClick={() => setIsSignOutModalOpen(true)} icon={<LogOut className="w-4 h-4" />} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">Sign Out</Button>
          </div>
        </div>
      </div>
    </>
  );
}