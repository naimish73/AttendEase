import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'attendease-se76v',
  appId: '1:1073675639976:web:9bc1cc662720292431f69d',
  storageBucket: 'attendease-se76v.firebasestorage.app',
  apiKey: 'AIzaSyAYX5cIh1CuNpgptj83ujMzs_t6t-UwSzk',
  authDomain: 'attendease-se76v.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '1073675639976',
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export { firebaseApp, db };
