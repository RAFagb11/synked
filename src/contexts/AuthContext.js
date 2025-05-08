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
  };

  // Log in function
  const login = async (email, password) => {
    console.log("Logging in:", email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful", result.user.uid);
    return result;
  };

  // Log out function
  const logout = async () => {
    console.log("Logging out");
    return await signOut(auth);
  };

  // Reset password function
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Fetch user data from Firestore
  const fetchUserData = async (uid) => {
    console.log("Fetching user data for:", uid);
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
        }
      }
      
      return userData;
    } else {
      console.log("No user data found");
    }
    
    return null;
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid);
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user.uid);
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