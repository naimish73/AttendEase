import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'attendease-se76v',
  appId: '1:1073675639976:web:9bc1cc662720292431f69d',
  storageBucket: 'attendease-se76v.appspot.com',
  apiKey: 'AIzaSyAYX5cIh1CuNpgptj83ujMzs_t6t-UwSzk',
  authDomain: 'attendease-se76v.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '1073675639976',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
