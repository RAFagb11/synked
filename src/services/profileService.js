// src/services/profileService.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

/**
 * Create or update a student profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<boolean>} - Success status
 */
export const createStudentProfile = async (userId, profileData) => {
  try {
    // Create profile document
    await setDoc(doc(db, "studentProfiles", userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user document to mark profile as completed
    await updateDoc(doc(db, "users", userId), {
      profileCompleted: true,
    });

    return true;
  } catch (error) {
    throw new Error("Failed to create student profile: " + error.message);
  }
};

/**
 * Create or update a company profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<boolean>} - Success status
 */
export const createCompanyProfile = async (userId, profileData) => {
  try {
    // Create profile document
    await setDoc(doc(db, "companyProfiles", userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user document to mark profile as completed
    await updateDoc(doc(db, "users", userId), {
      profileCompleted: true,
    });

    return true;
  } catch (error) {
    throw new Error("Failed to create company profile: " + error.message);
  }
};

/**
 * Get a student profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Student profile data or null if not found
 */
export const getStudentProfile = async (userId) => {
  try {
    console.log('🔍 DEBUG getStudentProfile - Fetching for userId:', userId);
    const profileDoc = await getDoc(doc(db, "studentProfiles", userId));

    if (!profileDoc.exists()) {
      console.log(`Student profile not found for user: ${userId}`);
      return null; // Return null instead of throwing error
    }

    return profileDoc.data();
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null; // Return null on error instead of throwing
  }
};

/**
 * Get a company profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Company profile data or null if not found
 */
export const getCompanyProfile = async (userId) => {
  try {
    console.log('🔍 DEBUG getCompanyProfile - Fetching for userId:', userId);
    console.log('🔍 DEBUG getCompanyProfile - Collection: companyProfiles');
    
    const profileDoc = await getDoc(doc(db, "companyProfiles", userId));
    console.log('🔍 DEBUG getCompanyProfile - Document exists:', profileDoc.exists());

    if (!profileDoc.exists()) {
      console.log(`Company profile not found for user: ${userId}`);
      return null; // Return null instead of throwing error
    }

    const data = profileDoc.data();
    console.log('🔍 DEBUG getCompanyProfile - Data retrieved:', data);
    return data;
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null; // Return null on error instead of throwing
  }
};

/**
 * Upload profile image
 * @param {string} userId - User ID
 * @param {File} imageFile - Image file
 * @param {string} userType - 'student' or 'company'
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export const uploadProfileImage = async (userId, imageFile, userType) => {
  try {
    const storageRef = ref(storage, `profileImages/${userType}/${userId}`);
    await uploadBytes(storageRef, imageFile);

    const downloadURL = await getDownloadURL(storageRef);

    // Update profile with image URL
    const profileRef = doc(db, `${userType}Profiles`, userId);
    await updateDoc(profileRef, {
      profileImageUrl: downloadURL,
      updatedAt: serverTimestamp(),
    });

    return downloadURL;
  } catch (error) {
    throw new Error("Failed to upload profile image: " + error.message);
  }
};

/**
 * Update student profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<boolean>} - Success status
 */
export const updateStudentProfile = async (userId, updateData) => {
  try {
    const profileRef = doc(db, "studentProfiles", userId);

    await updateDoc(profileRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    throw new Error("Failed to update student profile: " + error.message);
  }
};

/**
 * Update company profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<boolean>} - Success status
 */
export const updateCompanyProfile = async (userId, updateData) => {
  try {
    const profileRef = doc(db, "companyProfiles", userId);

    await updateDoc(profileRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    throw new Error("Failed to update company profile: " + error.message);
  }
};