import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Phone, User } from 'lucide-react';
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

// --- New UI Components ---
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

// --- Ambient Background Component ---
const AmbientBackground = ({ theme }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float ${theme === 'dark' ? 'bg-zillion-900/20' : 'bg-zillion-200'} transition-colors duration-1000`}></div>
    <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed ${theme === 'dark' ? 'bg-indigo-900/20' : 'bg-blue-200'} transition-colors duration-1000`}></div>
  </div>
);

export default function LoginScreen({ joinBudgetId }) {
  const [theme, setTheme] = useState('light');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Logic State
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Theme Effects ---
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- Logic Handlers (Preserved) ---
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

  // --- Google Icon SVG ---
  const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.577 12.254c0-.78-.068-1.522-.19-2.238H12.001v4.25h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.73 3.28-8.09z" fill="#4285F4" />
      <path d="M12.001 23c3.23 0 5.94-1.07 7.92-2.91l-3.57-2.77c-1.07.72-2.42 1.15-3.85 1.15-2.94 0-5.44-1.99-6.33-4.66H1.95v2.88C3.89 20.25 7.63 23 12.001 23z" fill="#34A853" />
      <path d="M5.67 13.79c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09V6.73H1.95c-.66 1.32-1.05 2.82-1.05 4.48s.39 3.16 1.05 4.48l3.72-2.88z" fill="#FBBC05" />
      <path d="M12.001 5.38c1.62 0 3.06.56 4.21 1.69l3.16-3.16C17.93 2.18 15.23 1 12.001 1 7.63 1 3.89 3.75 1.95 7.61l3.72 2.88c.89-2.67 3.39-4.66 6.33-4.66z" fill="#EA4335" />
    </svg>
  );

  // --- Render ---
  return (
    <div className={`
      min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-1000
      ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}
    `}>
      <AmbientBackground theme={theme} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

      <div className={`
        w-full max-w-md p-8 sm:p-10 rounded-3xl transition-all duration-500
        ${theme === 'dark'
          ? 'bg-slate-900/40 border border-white/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] backdrop-blur-xl'
          : 'bg-white/70 border border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-md'
        }
      `}>
        <div className="text-center mb-8">
          {isLoginMode ? (
            <>
              <h1 className="text-4xl font-bold tracking-tight mb-2 text-zillion-400">ZILLION</h1>
              <p className={`text-sm font-light ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Master your financial future.</p>
            </>
          ) : (
            <>
              <h2 className={`text-xl font-medium tracking-wide uppercase mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Sign Up For</h2>
              <h1 className="text-4xl font-bold tracking-tight text-zillion-400">ZILLION</h1>
            </>
          )}
        </div>

        {/* Messages */}
        {error && <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-500">{error}</div>}
        {info && <div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-3 text-center text-sm text-blue-500">{info}</div>}

        {/* Form */}
        <form onSubmit={isLoginMode ? handleLogin : handleSignUp} className="space-y-1">
          {!isLoginMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField name="firstName" label="First Name" placeholder="First" icon={<User className="w-4 h-4" />} value={firstName} onChange={e => setFirstName(e.target.value)} containerClassName="mb-1" />
              <InputField name="lastName" label="Last Name" placeholder="Last" icon={<User className="w-4 h-4" />} value={lastName} onChange={e => setLastName(e.target.value)} containerClassName="mb-5 md:mb-1" />
            </div>
          )}
          
          <InputField name="email" label="Email Address" placeholder="you@example.com" type="email" icon={<Mail className="w-4 h-4" />} value={email} onChange={e => setEmail(e.target.value)} containerClassName="mb-5" />
          
          {!isLoginMode && <InputField name="phone" label="Phone Number" placeholder="(123) 456-7890" type="tel" icon={<Phone className="w-4 h-4" />} value={phone} onChange={handlePhoneChange} containerClassName="mb-5" />}
          
          <div className="relative">
            <InputField name="password" label="Password" placeholder="••••••••" type="password" icon={<KeyRound className="w-4 h-4" />} value={password} onChange={e => setPassword(e.target.value)} containerClassName="mb-5" />
            {isLoginMode && (
              <button type="button" onClick={handleForgotPassword} className="absolute right-0 top-0 text-xs font-medium text-zillion-400 hover:text-zillion-500 transition-colors">
                Forgot Password?
              </button>
            )}
          </div>

          {!isLoginMode && <InputField name="confirmPassword" label="Confirm Password" placeholder="••••••••" type="password" icon={<KeyRound className="w-4 h-4" />} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} containerClassName="mb-5" />}
          
          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading} className="group">
              {isLoginMode ? 'SIGN IN' : 'SIGN UP'}
            </Button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="space-y-4 mt-6">
          <div className="relative flex items-center justify-center py-2">
             <div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div></div>
             <span className={`relative px-4 text-xs uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>OR</span>
          </div>

          <Button variant="outline" fullWidth onClick={handleGoogleSignIn} icon={<GoogleIcon />} className={`border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`}>
            {isLoginMode ? 'Sign In with Google' : 'Sign Up with Google'}
          </Button>

          {isLoginMode ? (
            <Button variant="ghost" fullWidth onClick={toggleMode}>
              <span className={`text-slate-500 ${theme === 'dark' ? 'text-slate-400' : ''}`}>New to Zillion? </span>
              <span className="font-semibold ml-1 text-zillion-400 hover:underline">Sign up</span>
            </Button>
          ) : (
            <Button variant="outline" fullWidth onClick={toggleMode} className={`border-zillion-400/60 text-zillion-500 hover:bg-zillion-50 dark:hover:bg-zillion-400/10 dark:text-zillion-400 uppercase tracking-wide text-xs font-semibold`}>
              Back to Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}