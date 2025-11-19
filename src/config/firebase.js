import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCViRj7L4_FRIOuKqUNtChuJoPAbaxQpEQ',
  authDomain: 'zillion-budgeting.firebaseapp.com',
  projectId: 'zillion-budgeting',
  storageBucket: 'zillion-budgeting.firebasestorage.app',
  messagingSenderId: '190999011833',
  appId: '1:190999011833:web:91b96075ccc4845958dd28',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
setLogLevel('debug');