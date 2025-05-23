// src/contexts/AuthContext.js - Fixed to prevent infinite loops
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  async function register(email, password, userType) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      userType: userType,
      createdAt: new Date(),
      profileCompleted: false
    });
    
    // Set userType immediately to prevent the need for refetch
    setUserType(userType);
    
    return userCredential;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserType(null);
    return signOut(auth);
  }

  // Function to fetch user type with retry logic
  const fetchUserType = async (user, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      console.log('Getting user type for UID:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document found:', userData);
        setUserType(userData.userType);
        return userData.userType;
      } else {
        console.log('No user document found for UID:', user.uid);
        
        // If document doesn't exist and we have retries left, wait and try again
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            fetchUserType(user, retryCount + 1);
          }, retryDelay);
          return;
        }
        
        // After all retries, set to null
        setUserType(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Retry on error if retries left
      if (retryCount < maxRetries) {
        console.log(`Retrying after error... (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchUserType(user, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      setUserType(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      
      if (user) {
        setCurrentUser(user);
        
        // Only fetch user type if we don't already have it
        if (!userType) {
          await fetchUserType(user);
        }
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
      
      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userType, initializing]); // Add userType to dependencies but only fetch if null

  const value = {
    currentUser,
    userType,
    register,
    login,
    logout,
    loading: loading || initializing
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && !initializing && children}
    </AuthContext.Provider>
  );
}

export { AuthContext };