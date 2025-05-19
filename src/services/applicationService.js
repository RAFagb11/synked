// src/services/applicationService.js
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp, 
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Create a new application
export const createApplication = async (applicationData) => {
  try {
    // Add to applications collection
    const applicationRef = await addDoc(collection(db, 'applications'), {
      ...applicationData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Add to project's applicants array
    const projectRef = doc(db, 'projects', applicationData.projectId);
    await updateDoc(projectRef, {
      applicants: arrayUnion({
        applicationId: applicationRef.id,
        studentId: applicationData.studentId,
        appliedAt: applicationData.appliedAt,
        status: 'pending'
      })
    });
    
    return applicationRef.id;
  } catch (error) {
    throw new Error('Failed to create application: ' + error.message);
  }
};

// Get application by ID
export const getApplicationById = async (applicationId) => {
  try {
    const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
    
    if (!applicationDoc.exists()) {
      throw new Error('Application not found');
    }
    
    return { id: applicationDoc.id, ...applicationDoc.data() };
  } catch (error) {
    throw new Error('Failed to fetch application: ' + error.message);
  }
};

// Get applications for a student
export const getStudentApplications = async (studentId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', studentId)
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch applications: ' + error.message);
  }
};

// Get applications for a project
export const getProjectApplications = async (projectId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId)
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch applications: ' + error.message);
  }
};

// Update application status
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const appRef = doc(db, 'applications', applicationId);
    
    // Update application status
    await updateDoc(appRef, { 
      status,
      updatedAt: serverTimestamp()
    });
    
    // If accepting, add to activeProjects and update relationships
    if (status === 'accepted') {
      // Get application data
      const appDoc = await getDoc(appRef);
      const appData = appDoc.data();
      
      // Create entries in activeProjects collection
      await setDoc(doc(db, 'activeProjects', applicationId), {
        projectId: appData.projectId,
        studentId: appData.studentId,
        companyId: appData.companyId,
        startDate: serverTimestamp(),
        status: 'active',
        applicationId: applicationId
      });
      
      // Update project document to show this student is active
      const projectRef = doc(db, 'projects', appData.projectId);
      await updateDoc(projectRef, {
        activeStudents: arrayUnion(appData.studentId),
        status: 'in-progress'
      });
      
      // Update user documents to reflect active status
      const studentRef = doc(db, 'users', appData.studentId);
      await updateDoc(studentRef, {
        activeProjects: arrayUnion(appData.projectId)
      });
      
      const companyRef = doc(db, 'users', appData.companyId);
      await updateDoc(companyRef, {
        activeStudents: arrayUnion(appData.studentId)
      });
      
      // Also update the application in the project's applicants array
      const projectDoc = await getDoc(projectRef);
      const projectData = projectDoc.data();
      const updatedApplicants = projectData.applicants.map(app => {
        if (app.applicationId === applicationId || 
            (app.studentId === appData.studentId && !app.applicationId)) {
          return { ...app, status: 'accepted' };
        }
        return app;
      });
      
      await updateDoc(projectRef, {
        applicants: updatedApplicants
      });
    }
    
    return true;
  } catch (error) {
    throw new Error('Failed to update application status: ' + error.message);
  }
};

// Accept an application
export const acceptApplication = async (applicationId) => {
  try {
    // Update application status
    await updateApplicationStatus(applicationId, 'accepted');
    
    // Get application data
    const appDoc = await getDoc(doc(db, 'applications', applicationId));
    const appData = appDoc.data();
    
    // Create notification for student
    await addDoc(collection(db, 'notifications'), {
      userId: appData.studentId,
      type: 'application_accepted',
      message: `Your application for "${appData.projectTitle}" has been accepted!`,
      projectId: appData.projectId,
      createdAt: serverTimestamp(),
      read: false
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to accept application: ' + error.message);
  }
};

// Reject an application
export const rejectApplication = async (applicationId) => {
  try {
    // Update application status
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, { 
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    
    // Get application data
    const appDoc = await getDoc(appRef);
    const appData = appDoc.data();
    
    // Update the application in the project's applicants array
    const projectRef = doc(db, 'projects', appData.projectId);
    const projectDoc = await getDoc(projectRef);
    const projectData = projectDoc.data();
    
    const updatedApplicants = projectData.applicants.map(app => {
      if (app.applicationId === applicationId || 
          (app.studentId === appData.studentId && !app.applicationId)) {
        return { ...app, status: 'rejected' };
      }
      return app;
    });
    
    await updateDoc(projectRef, {
      applicants: updatedApplicants
    });
    
    // Create notification for student
    await addDoc(collection(db, 'notifications'), {
      userId: appData.studentId,
      type: 'application_rejected',
      message: `Your application for "${appData.projectTitle}" has been declined.`,
      projectId: appData.projectId,
      createdAt: serverTimestamp(),
      read: false
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to reject application: ' + error.message);
  }
};