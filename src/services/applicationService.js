// src/services/applicationService.js
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { arrayUnion } from 'firebase/firestore';

/**
 * Create a new application
 * @param {Object} applicationData - Application data
 * @returns {Promise<string>} - Application ID
 */
export const createApplication = async (applicationData) => {
  try {
    const applicationRef = await addDoc(collection(db, "applications"), {
      ...applicationData,
      status: "pending",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    return applicationRef.id;
  } catch (error) {
    throw new Error("Failed to create application: " + error.message);
  }
};

/**
 * Get applications for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} - Array of applications
 */
export const getStudentApplications = async (studentId) => {
  try {
    const applicationsQuery = query(
      collection(db, "applications"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error("Failed to fetch student applications: " + error.message);
  }
};

/**
 * Get applications for a company's project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of applications
 */
export const getProjectApplications = async (projectId) => {
  try {
    const applicationsQuery = query(
      collection(db, "applications"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error("Failed to fetch project applications: " + error.message);
  }
};

/**
 * Get all applications for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} - Array of applications
 */
export const getCompanyApplications = async (companyId) => {
  try {
    const applicationsQuery = query(
      collection(db, "applications"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error("Failed to fetch company applications: " + error.message);
  }
};

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status ('pending', 'accepted', 'rejected', 'withdrawn')
 * @param {string} feedback - Optional feedback message
 * @returns {Promise<boolean>} - Success status
 */
export const updateApplicationStatus = async (
  applicationId,
  status,
  feedback = ""
) => {
  try {
    const applicationRef = doc(db, "applications", applicationId);

    await updateDoc(applicationRef, {
      status,
      feedback,
      lastUpdated: serverTimestamp(),
    });

    return true;
  } catch (error) {
    throw new Error("Failed to update application status: " + error.message);
  }
};

/**
 * Get application by ID
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} - Application data
 */
export const getApplicationById = async (applicationId) => {
  try {
    const applicationDoc = await getDoc(doc(db, "applications", applicationId));

    if (!applicationDoc.exists()) {
      throw new Error("Application not found");
    }

    return { id: applicationDoc.id, ...applicationDoc.data() };
  } catch (error) {
    throw new Error("Failed to fetch application: " + error.message);
  }
};

/**
 * Delete an application
 * @param {string} applicationId - Application ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteApplication = async (applicationId) => {
  try {
    await deleteDoc(doc(db, "applications", applicationId));
    return true;
  } catch (error) {
    throw new Error("Failed to delete application: " + error.message);
  }
};

/**
 * Create application and update project applicants array
 * @param {Object} applicationData - Application data
 * @returns {Promise<string>} - Application ID
 */
export const createApplicationAndUpdateProject = async (applicationData) => {
  try {
    // Create application document
    const applicationRef = await addDoc(collection(db, 'applications'), {
      ...applicationData,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    
    // Update project's applicants array
    const projectRef = doc(db, 'projects', applicationData.projectId);
    await updateDoc(projectRef, {
      applicants: arrayUnion({
        ...applicationData,
        applicationId: applicationRef.id,
        appliedAt: new Date().toISOString()
      })
    });
    
    return applicationRef.id;
  } catch (error) {
    throw new Error('Failed to create application: ' + error.message);
  }
};