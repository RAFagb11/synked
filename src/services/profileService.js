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
 */
export const createStudentProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, "studentProfiles", userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

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
 */
export const createCompanyProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, "companyProfiles", userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

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
 */
export const getStudentProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "studentProfiles", userId));

    if (!profileDoc.exists()) {
      return null;
    }

    return profileDoc.data();
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
};

/**
 * Get a company profile
 */
export const getCompanyProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "companyProfiles", userId));

    if (!profileDoc.exists()) {
      return null;
    }

    return profileDoc.data();
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (userId, imageFile, userType) => {
  try {
    const storageRef = ref(storage, `profileImages/${userType}/${userId}`);
    await uploadBytes(storageRef, imageFile);

    const downloadURL = await getDownloadURL(storageRef);

    const profileRef = doc(db, `${userType}Profiles`, userId);
    await updateDoc(profileRef, {
      photoURL: downloadURL,
      updatedAt: serverTimestamp(),
    });

    return downloadURL;
  } catch (error) {
    throw new Error("Failed to upload profile image: " + error.message);
  }
};

/**
 * Update student profile
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