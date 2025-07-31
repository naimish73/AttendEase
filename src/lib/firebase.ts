
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAYX5cIh1CuNpgptj83ujMzs_t6t-UwSzk",
  authDomain: "attendease-se76v.firebaseapp.com",
  projectId: "attendease-se76v",
  storageBucket: "attendease-se76v.appspot.com",
  messagingSenderId: "1073675639976",
  appId: "1:1073675639976:web:9bc1cc662720292431f69d"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();
const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;

// We are exporting the firebase namespace, but also the individual services
export { 
  db, 
  storage, 
  auth, 
  GoogleAuthProvider,
  firebase
};

// Types are still useful
export type User = firebase.User;
export type FirebaseApp = firebase.app.App;

// Functions for context can be simplified since they are on the auth object
export const signInWithPopup = (auth: firebase.auth.Auth, provider: firebase.auth.AuthProvider) => auth.signInWithPopup(provider);
export const onAuthStateChanged = (auth: firebase.auth.Auth, nextOrObserver: any) => auth.onAuthStateChanged(nextOrObserver);
export const signOut = (auth: firebase.auth.Auth) => auth.signOut();
