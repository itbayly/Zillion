import React, { useState } from 'react';
import { Loader2, Mail, KeyRound, Phone, User } from 'lucide-react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail, 
  getAdditionalUserInfo 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../config/firebase';
import { getDefaultBudgetData } from '../../utils/helpers';

export default function LoginScreen({ joinBudgetId }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const numbers = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (numbers.length > 0) formatted = `(${numbers.slice(0, 3)}`;
    if (numbers.length >= 4) formatted = `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}`;
    if (numbers.length >= 7) formatted = `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    setPhone(formatted);
  };

  const handleAuth = async (authPromise) => {
    setIsLoading(true); setError(null); setInfo(null);
    try { await authPromise; } 
    catch (err) {
      if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/email-already-in-use') { setError('That email is already in use. Please sign in.'); setIsLoginMode(true); }
      else if (err.code === 'auth/weak-password') setError('Password is too weak. Must be at least 6 characters.');
      else setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (firstName.trim() === '' || lastName.trim() === '') { setError('Please enter your first and last name.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;
    if (!passwordRegex.test(password)) { setError('Password must be over 6 characters and include an uppercase, lowercase, number, and special character (@$!%*?&).'); return; }

    const displayName = (firstName.trim() + ' ' + lastName.trim()).trim();
    const phoneNumber = phone.replace(/\D/g, '');

    setIsLoading(true); setError(null); setInfo(null);

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, { displayName: displayName }).then(() => user);
      })
      .then((user) => {
        const docPath = `/artifacts/zillion-budget-app/users/${user.uid}/budget/main`;
        const newBudgetDoc = getDefaultBudgetData();
        newBudgetDoc.userName = displayName;
        newBudgetDoc.phone = phoneNumber;
        return setDoc(doc(db, docPath), newBudgetDoc);
      })
      .catch((err) => {
        if (err.code === 'auth/email-already-in-use') { setError('That email is already in use. Please sign in.'); setIsLoginMode(true); }
        else if (err.code === 'auth/weak-password') setError('Password is too weak.');
        else setError(err.message);
        setIsLoading(false);
      });
  };

  const handleLogin = (e) => { e.preventDefault(); handleAuth(signInWithEmailAndPassword(auth, email, password)); };

  const handleForgotPassword = () => {
    if (email.trim() === '') { setError('Please enter your email address first.'); return; }
    setIsLoading(true); setError(null);
    sendPasswordResetEmail(auth, email)
      .then(() => { setInfo('Password reset email sent! Check your inbox.'); setIsLoading(false); })
      .catch((err) => { setError(err.code === 'auth/user-not-found' ? 'No account found with that email.' : err.message); setIsLoading(false); });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true); setError(null); setInfo(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(userCredential);
      if (additionalInfo?.isNewUser) {
        const user = userCredential.user;
        const docPath = `/artifacts/zillion-budget-app/users/${user.uid}/budget/main`;
        const newBudgetDoc = getDefaultBudgetData();
        newBudgetDoc.userName = user.displayName || 'Google User';
        if (user.phoneNumber) newBudgetDoc.phone = user.phoneNumber;
        await setDoc(doc(db, docPath), newBudgetDoc);
      }
    } catch (err) { setError(err.message); setIsLoading(false); }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode); setError(null); setInfo(null);
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setPassword(''); setConfirmPassword('');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-normal text-gray-900">
          {isLoginMode ? <span className="text-6xl font-bold text-[#3DDC97]">ZILLION</span> : <>SIGN UP FOR<br /><span className="text-5xl font-bold text-[#3DDC97]">ZILLION</span></>}
        </h1>
        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
        {info && <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-center text-sm text-blue-700">{info}</div>}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12"><Loader2 className="h-12 w-12 animate-spin text-[#3DDC97]" /><span className="mt-4 text-gray-700">Loading...</span></div>
        ) : isLoginMode ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="you@example.com" /></div>
              </div>
              <div>
                <div className="flex justify-between"><label className="block text-sm font-medium text-gray-700">Password</label><button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-[#3DDC97] hover:text-emerald-500">Forgot?</button></div>
                <div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><KeyRound className="h-5 w-5 text-gray-400" /></div><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="••••••••" /></div>
              </div>
              <div><button type="submit" className="mt-4 w-full justify-center rounded-md border border-transparent bg-[#3DDC97] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">SIGN IN</button></div>
            </form>
            <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="mx-4 flex-shrink text-sm text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
            <div className="space-y-3">
              <button type="button" onClick={handleGoogleSignIn} className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.577 12.254c0-.78-.068-1.522-.19-2.238H12.001v4.25h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.73 3.28-8.09z" fill="#4285F4" /><path d="M12.001 23c3.23 0 5.94-1.07 7.92-2.91l-3.57-2.77c-1.07.72-2.42 1.15-3.85 1.15-2.94 0-5.44-1.99-6.33-4.66H1.95v2.88C3.89 20.25 7.63 23 12.001 23z" fill="#34A853" /><path d="M5.67 13.79c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09V6.73H1.95c-.66 1.32-1.05 2.82-1.05 4.48s.39 3.16 1.05 4.48l3.72-2.88z" fill="#FBBC05" /><path d="M12.001 5.38c1.62 0 3.06.56 4.21 1.69l3.16-3.16C17.93 2.18 15.23 1 12.001 1 7.63 1 3.89 3.75 1.95 7.61l3.72 2.88c.89-2.67 3.39-4.66 6.33-4.66z" fill="#EA4335" /></svg> SIGN IN WITH GOOGLE
              </button>
              <button type="button" onClick={toggleMode} className="w-full justify-center rounded-md border border-[#3DDC97] bg-white px-4 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50">SIGN UP</button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">First Name</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><User className="h-5 w-5 text-gray-400" /></div><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="First" /></div></div>
                <div><label className="block text-sm font-medium text-gray-700">Last Name</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><User className="h-5 w-5 text-gray-400" /></div><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="Last" /></div></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Email Address</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="you@example.com" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700">Phone Number</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Phone className="h-5 w-5 text-gray-400" /></div><input type="tel" value={phone} onChange={handlePhoneChange} maxLength="14" className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="(123) 456-7890" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700">Password</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><KeyRound className="h-5 w-5 text-gray-400" /></div><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="••••••••" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700">Confirm Password</label><div className="relative mt-1"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><KeyRound className="h-5 w-5 text-gray-400" /></div><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" placeholder="••••••••" /></div></div>
              <div><button type="submit" className="mt-4 w-full justify-center rounded-md border border-transparent bg-[#3DDC97] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">SIGN UP</button></div>
            </form>
            <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="mx-4 flex-shrink text-sm text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
            <div className="space-y-3">
              <button type="button" onClick={handleGoogleSignIn} className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.577 12.254c0-.78-.068-1.522-.19-2.238H12.001v4.25h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.73 3.28-8.09z" fill="#4285F4" /><path d="M12.001 23c3.23 0 5.94-1.07 7.92-2.91l-3.57-2.77c-1.07.72-2.42 1.15-3.85 1.15-2.94 0-5.44-1.99-6.33-4.66H1.95v2.88C3.89 20.25 7.63 23 12.001 23z" fill="#34A853" /><path d="M5.67 13.79c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09V6.73H1.95c-.66 1.32-1.05 2.82-1.05 4.48s.39 3.16 1.05 4.48l3.72-2.88z" fill="#FBBC05" /><path d="M12.001 5.38c1.62 0 3.06.56 4.21 1.69l3.16-3.16C17.93 2.18 15.23 1 12.001 1 7.63 1 3.89 3.75 1.95 7.61l3.72 2.88c.89-2.67 3.39-4.66 6.33-4.66z" fill="#EA4335" /></svg> SIGN UP WITH GOOGLE</button>
              <button type="button" onClick={toggleMode} className="w-full justify-center rounded-md border border-[#3DDC97] bg-white px-4 py-2 text-sm font-bold text-[#3DDC97] shadow-sm hover:bg-emerald-50">SIGN IN</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}