// src/services/applicationService.js - FIXED VERSION
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
  setDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateApplicationId(projectId, studentId) {
  const projectSlug = projectId.split('_')[1] || 'proj';
  const studentSlug = studentId.split('_')[1] || 'stu';
  const randomId = Math.random().toString(36).substring(2, 8);
  return `app_${projectSlug}_${studentSlug}_${randomId}`;
}

// =============================================================================
// APPLICATION SERVICES
// =============================================================================

/**
 * Create a new application with structured ID
 */
export const createApplication = async (applicationData) => {
  try {
    console.log("Creating application:", applicationData);
    
    // Generate structured application ID
    const applicationId = generateApplicationId(
      applicationData.projectId, 
      applicationData.studentId
    );
    
    // Get project and student info for denormalization
    const [projectDoc, studentDoc] = await Promise.all([
      getDoc(doc(db, 'projects', applicationData.projectId)),
      getDoc(doc(db, 'students', applicationData.studentId))
    ]);
    
    const projectTitle = projectDoc.exists() ? 
      projectDoc.data().basic?.title || 'Unknown Project' : 'Unknown Project';
    
    const studentName = studentDoc.exists() ? 
      studentDoc.data().personal?.fullName || 'Unknown Student' : 'Unknown Student';
    
    const companyName = projectDoc.exists() ? 
      projectDoc.data().company?.name || 'Unknown Company' : 'Unknown Company';
    
    const application = {
      refs: {
        projectId: applicationData.projectId,
        studentId: applicationData.studentId,
        companyId: applicationData.companyId
      },
      info: {
        projectTitle: projectTitle,
        studentName: studentName,
        companyName: companyName
      },
      content: {
        coverLetter: applicationData.coverLetter?.trim() || "",
        portfolioUrl: applicationData.portfolioUrl || "",
        videoUrl: applicationData.videoUrl || "",
        customAnswers: applicationData.customAnswers || [],
        applicationAnswer: applicationData.applicationAnswer || ""
      },
      availability: {
        startDate: applicationData.startDate || null,
        hoursPerWeek: applicationData.hoursPerWeek || 20,
        schedule: applicationData.availability || ""
      },
      status: {
        current: "pending",
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        responseAt: null,
        feedback: "",
        notes: ""
      },
      meta: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1
      }
    };

    // Save application
    await setDoc(doc(db, 'applications', applicationId), application);
    
    // Update project's application count
    if (projectDoc.exists()) {
      const currentCount = projectDoc.data().status?.applicationsCount || 0;
      await updateDoc(doc(db, 'projects', applicationData.projectId), {
        'status.applicationsCount': currentCount + 1,
        'meta.updatedAt': serverTimestamp()
      });
    }
    
    // Update student's application count
    if (studentDoc.exists()) {
      const currentCount = studentDoc.data().metrics?.totalApplications || 0;
      await updateDoc(doc(db, 'students', applicationData.studentId), {
        'metrics.totalApplications': currentCount + 1,
        'meta.updatedAt': serverTimestamp()
      });
    }
    
    console.log("Application created with ID:", applicationId);
    return applicationId;
  } catch (error) {
    console.error("Error creating application:", error);
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
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.studentId', '==', studentId),
      orderBy('meta.createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    throw new Error('Failed to fetch student applications: ' + error.message);
  }
};

/**
 * Get applications for a project
 */
export const getProjectApplications = async (projectId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.projectId', '==', projectId),
      orderBy('meta.createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    throw new Error('Failed to fetch project applications: ' + error.message);
  }
};

/**
 * Get applications for a company
 */
export const getCompanyApplications = async (companyId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.companyId', '==', companyId),
      orderBy('meta.createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    throw new Error('Failed to fetch company applications: ' + error.message);
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (applicationId, status, feedback = "") => {
  try {
    const updates = {
      'status.current': status,
      'status.responseAt': serverTimestamp(),
      'status.feedback': feedback,
      'meta.updatedAt': serverTimestamp()
    };
    
    // If accepting application
    if (status === 'accepted') {
      // Get application data
      const appDoc = await getDoc(doc(db, 'applications', applicationId));
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }
      
      const appData = appDoc.data();
      
      // Add student to project's selected students
      const projectRef = doc(db, 'projects', appData.refs.projectId);
      await updateDoc(projectRef, {
        'status.selectedStudents': arrayUnion(appData.refs.studentId),
        'status.current': 'in-progress',
        'meta.updatedAt': serverTimestamp()
      });
      
      // Update student's active projects count
      const studentRef = doc(db, 'students', appData.refs.studentId);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const currentActive = studentDoc.data().metrics?.activeProjects || 0;
        await updateDoc(studentRef, {
          'metrics.activeProjects': currentActive + 1,
          'platform.lastActiveAt': serverTimestamp(),
          'meta.updatedAt': serverTimestamp()
        });
      }
      
      // Update company's students hired count
      const companyRef = doc(db, 'companies', appData.refs.companyId);
      const companyDoc = await getDoc(companyRef);
      if (companyDoc.exists()) {
        const currentHired = companyDoc.data().metrics?.totalStudentsHired || 0;
        await updateDoc(companyRef, {
          'metrics.totalStudentsHired': currentHired + 1,
          'meta.updatedAt': serverTimestamp()
        });
      }
    }
    
    // Update the application
    await updateDoc(doc(db, 'applications', applicationId), updates);
    console.log("Application status updated:", applicationId, status);
    return true;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw new Error('Failed to update application status: ' + error.message);
  }
};

/**
 * Accept an application (wrapper for updateApplicationStatus)
 */
export const acceptApplication = async (applicationId, feedback = "") => {
  try {
    return await updateApplicationStatus(applicationId, 'accepted', feedback);
  } catch (error) {
    throw new Error('Failed to accept application: ' + error.message);
  }
};

/**
 * Reject an application (wrapper for updateApplicationStatus)
 */
export const rejectApplication = async (applicationId, feedback = "") => {
  try {
    return await updateApplicationStatus(applicationId, 'rejected', feedback);
  } catch (error) {
    throw new Error('Failed to reject application: ' + error.message);
  }
};

/**
 * Withdraw an application (student action)
 */
export const withdrawApplication = async (applicationId) => {
  try {
    const updates = {
      'status.current': 'withdrawn',
      'status.responseAt': serverTimestamp(),
      'meta.updatedAt': serverTimestamp()
    };
    
    await updateDoc(doc(db, 'applications', applicationId), updates);
    console.log("Application withdrawn:", applicationId);
    return true;
  } catch (error) {
    console.error("Error withdrawing application:", error);
    throw new Error('Failed to withdraw application: ' + error.message);
  }
};

/**
 * Get pending applications for a project
 */
export const getPendingApplications = async (projectId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.projectId', '==', projectId),
      where('status.current', '==', 'pending'),
      orderBy('meta.createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    throw new Error('Failed to fetch pending applications: ' + error.message);
  }
};

/**
 * Check if student has already applied to project
 */
export const hasStudentApplied = async (projectId, studentId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.projectId', '==', projectId),
      where('refs.studentId', '==', studentId)
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if student applied:", error);
    return false; // Default to false if error
  }
};

/**
 * Get application statistics for a project
 */
export const getProjectApplicationStats = async (projectId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.projectId', '==', projectId)
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    const applications = querySnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status.current === 'pending').length,
      accepted: applications.filter(app => app.status.current === 'accepted').length,
      rejected: applications.filter(app => app.status.current === 'rejected').length,
      withdrawn: applications.filter(app => app.status.current === 'withdrawn').length
    };
    
    return stats;
  } catch (error) {
    throw new Error('Failed to get application statistics: ' + error.message);
  }
};

/**
 * Get student's application for a specific project
 */
export const getStudentProjectApplication = async (projectId, studentId) => {
  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('refs.projectId', '==', projectId),
      where('refs.studentId', '==', studentId)
    );
    
    const querySnapshot = await getDocs(applicationsQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw new Error('Failed to fetch student application: ' + error.message);
  }
};