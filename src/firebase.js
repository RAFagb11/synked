// src/firebase.js - Update this file with your actual Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// After initializing Firebase services

console.log("Firebase initialized with project:", firebaseConfig.projectId);
console.log("Auth instance:", auth);
console.log("Firestore instance:", db);

// Test Firestore connection immediately
const testConnection = async () => {
  try {
    const testCollection = collection(db, 'connection_test');
    const testDoc = await addDoc(testCollection, {
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log("Firebase connection verified. Test document written:", testDoc.id);
  } catch (error) {
    console.error("FIREBASE CONNECTION ERROR:", error);
    alert("Firebase connection error: " + error.message);
  }
};

testConnection();

export default app;
