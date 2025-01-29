import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBrrv65YY3GQMvSTOj82sDo4g1GuzVYnwk",
  authDomain: "codelog-api.firebaseapp.com",
  projectId: "codelog-api",
  storageBucket: "codelog-api.firebasestorage.app",
  messagingSenderId: "420580978368",
  appId: "1:420580978368:web:e6631df073cc320c0a4725"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);