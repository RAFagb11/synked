// src/contexts/AuthContext.js
import React, { useEffect, useState, createContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, type) => {
    console.log("Signing up:", email, type);
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("User created:", user.uid);
      
      // Store user type in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        userType: type,
        createdAt: new Date().toISOString(),
        profileCompleted: false
      });
      
      setUserType(type);
      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Log in function
  const login = async (email, password) => {
    console.log("Logging in:", email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful", result.user.uid);
      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Log out function
  const logout = async () => {
    console.log("Logging out");
    try {
      const result = await signOut(auth);
      // Clear user state
      setCurrentUser(null);
      setUserType(null);
      setUserProfile(null);
      return result;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (uid) => {
    console.log("Fetching user data for:", uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data found:", userData);
        setUserType(userData.userType);
        
        // Fetch profile data if profile is completed
        if (userData.profileCompleted) {
          const profileRef = doc(db, `${userData.userType}Profiles`, uid);
          const profileDoc = await getDoc(profileRef);
          
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
            console.log("User profile loaded:", profileDoc.data());
          } else {
            console.log("Profile document exists but no data found");
          }
        } else {
          console.log("Profile not completed yet");
        }
        
        return userData;
      } else {
        console.log("No user data found");
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid);
      setCurrentUser(user);
      
      if (user) {
        try {
          await fetchUserData(user.uid);
        } catch (error) {
          console.error("Error in fetchUserData during auth state change:", error);
        }
      } else {
        setUserType(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userType,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;