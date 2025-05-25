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
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new application
 */
export const createApplication = async (applicationData) => {
  try {
    // Get denormalized data for UI performance
    const [projectDoc, studentDoc] = await Promise.all([
      getDoc(doc(db, 'projects', applicationData.projectId)),
      getDoc(doc(db, 'studentProfiles', applicationData.studentId))
    ]);
    
    const projectTitle = projectDoc.exists() ? projectDoc.data().title : 'Project';
    const studentName = studentDoc.exists() ? studentDoc.data().fullName : 'Student';
    const companyName = projectDoc.exists() ? projectDoc.data().companyName : 'Company';
    
    // FLAT APPLICATION STRUCTURE
    const application = {
      // IDs at top level for easy querying
      projectId: applicationData.projectId,
      studentId: applicationData.studentId,
      companyId: applicationData.companyId,
      
      // Denormalized data for UI performance
      projectTitle,
      studentName,
      companyName,
      
      // Application content - all flat
      coverLetter: applicationData.coverLetter || '',
      applicationAnswer: applicationData.applicationAnswer || '',
      videoUrl: applicationData.videoUrl || '',
      availability: applicationData.availability || '',
      
      // Status - simple string
      status: 'pending',
      acceptedAt: null,
      modalShown: false,
      feedback: '',
      
      // Timestamps
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'applications'), application);
    
    // Update project application count
    if (projectDoc.exists()) {
      await updateDoc(doc(db, 'projects', applicationData.projectId), {
        applicationsCount: (projectDoc.data().applicationsCount || 0) + 1
      });
    }
    
    return docRef.id;
    
  } catch (error) {
    throw new Error('Failed to create application: ' + error.message);
  }
};

/**
 * Get application by ID
 */
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

/**
 * Get applications for a student
 */
export const getStudentApplications = async (studentId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('studentId', '==', studentId),
      orderBy('appliedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch student applications: ' + error.message);
  }
};

/**
 * Get applications for a project
 */
export const getProjectApplications = async (projectId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId),
      orderBy('appliedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch project applications: ' + error.message);
  }
};

/**
 * Get applications for a company
 */
export const getCompanyApplications = async (companyId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('companyId', '==', companyId),
      orderBy('appliedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch company applications: ' + error.message);
  }
};

/**
 * Accept an application
 */
export const acceptApplication = async (applicationId, studentId, projectId) => {
  try {
    // Update application
    await updateDoc(doc(db, 'applications', applicationId), {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      modalShown: false, // Will trigger congratulations modal
      updatedAt: serverTimestamp()
    });
    
    // Update project
    await updateDoc(doc(db, 'projects', projectId), {
      enrolledStudents: arrayUnion(studentId),
      status: 'in-progress'
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to accept application: ' + error.message);
  }
};

/**
 * Reject an application
 */
export const rejectApplication = async (applicationId) => {
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw new Error('Failed to reject application: ' + error.message);
  }
};

/**
 * Withdraw an application (student action)
 */
export const withdrawApplication = async (applicationId) => {
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status: 'withdrawn',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw new Error('Failed to withdraw application: ' + error.message);
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (applicationId, status, feedback = "") => {
  try {
    const updates = {
      status: status,
      feedback: feedback,
      updatedAt: serverTimestamp()
    };
    
    // If accepting application
    if (status === 'accepted') {
      updates.acceptedAt = new Date().toISOString();
      updates.modalShown = false;
      
      // Get application data to update project
      const appDoc = await getDoc(doc(db, 'applications', applicationId));
      if (appDoc.exists()) {
        const appData = appDoc.data();
        
        // Add student to project's enrolled students
        await updateDoc(doc(db, 'projects', appData.projectId), {
          enrolledStudents: arrayUnion(appData.studentId),
          status: 'in-progress'
        });
      }
    }
    
    await updateDoc(doc(db, 'applications', applicationId), updates);
    return true;
  } catch (error) {
    throw new Error('Failed to update application status: ' + error.message);
  }
};

/**
 * Get pending applications for a project
 */
export const getPendingApplications = async (projectId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId),
      where('status', '==', 'pending'),
      orderBy('appliedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch pending applications: ' + error.message);
  }
};

/**
 * Check if student has already applied to project
 */
export const hasStudentApplied = async (projectId, studentId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId),
      where('studentId', '==', studentId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking if student applied:", error);
    return false;
  }
};

/**
 * Get application statistics for a project
 */
export const getProjectApplicationStats = async (projectId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(q);
    const applications = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      withdrawn: applications.filter(app => app.status === 'withdrawn').length
    };
    
    return stats;
  } catch (error) {
    throw new Error('Failed to get application statistics: ' + error.message);
  }
};

/**
 * Delete an application
 */
export const deleteApplication = async (applicationId) => {
  try {
    await deleteDoc(doc(db, 'applications', applicationId));
    return true;
  } catch (error) {
    throw new Error('Failed to delete application: ' + error.message);
  }
};
