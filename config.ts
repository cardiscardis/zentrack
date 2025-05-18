// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9qEfBBc9zDGC2bO5t3cYb-Ytd3xrQJhM",
  authDomain: "chat-example-9ea60.firebaseapp.com",
  projectId: "chat-example-9ea60",
  storageBucket: "chat-example-9ea60.appspot.com",
  messagingSenderId: "485159630277",
  appId: "1:485159630277:web:8e8ebc6c8d39c7c57b47ac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

