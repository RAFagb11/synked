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
 * @returns {Promise<Object>} - Student profile data
 */
export const getStudentProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "studentProfiles", userId));

    if (!profileDoc.exists()) {
      throw new Error("Student profile not found");
    }

    return profileDoc.data();
  } catch (error) {
    throw new Error("Failed to fetch student profile: " + error.message);
  }
};

/**
 * Get a company profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Company profile data
 */
export const getCompanyProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "companyProfiles", userId));

    if (!profileDoc.exists()) {
      throw new Error("Company profile not found");
    }

    return profileDoc.data();
  } catch (error) {
    throw new Error("Failed to fetch company profile: " + error.message);
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

