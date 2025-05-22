// src/services/firebaseService.js
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
  import { db, storage } from '../firebase';
  
  /**
   * Project Service Functions
   */
  
  // Get a project by ID
  export const getProjectById = async (projectId) => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      return { id: projectDoc.id, ...projectDoc.data() };
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  };
  
  // Create a new project
  export const createProject = async (projectData, userId) => {
    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        companyId: userId,
        createdAt: serverTimestamp(),
        status: 'open',
        applicants: [],
        enrolledStudents: []
      });
      return projectRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };
  
  // Update a project
  export const updateProject = async (projectId, projectData) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...projectData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };
  
  // Delete a project
  export const deleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };
  
  // Get projects with filters
  export const getProjects = async (filters = {}) => {
    try {
      let projectQuery = collection(db, 'projects');
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        const constraints = [];
        
        if (filters.companyId) {
          constraints.push(where('companyId', '==', filters.companyId));
        }
        
        if (filters.status) {
          constraints.push(where('status', '==', filters.status));
        }
        
        if (filters.category) {
          constraints.push(where('category', '==', filters.category));
        }
        
        projectQuery = query(projectQuery, ...constraints);
      }
      
      // Add sorting if provided
      if (filters.orderBy) {
        projectQuery = query(projectQuery, orderBy(filters.orderBy, filters.orderDir || 'desc'));
      } else {
        projectQuery = query(projectQuery, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(projectQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  };
  
  /**
   * Application Service Functions
   */
  
  // Create a new application
  export const createApplication = async (applicationData) => {
    try {
      const applicationRef = await addDoc(collection(db, 'applications'), {
        ...applicationData,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      // Update project to add the application
      const projectRef = doc(db, 'projects', applicationData.projectId);
      await updateDoc(projectRef, {
        applicants: applicationData.studentId
      });
      
      return applicationRef.id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  };
  
  // Accept an application
  export const acceptApplication = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }
      
      const applicationData = applicationDoc.data();
      
      // Update application status
      await updateDoc(applicationRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      // Update project to add student to enrolled students
      const projectRef = doc(db, 'projects', applicationData.projectId);
      await updateDoc(projectRef, {
        enrolledStudents: [applicationData.studentId],
        status: 'in-progress'
      });
      
      return true;
    } catch (error) {
      console.error('Error accepting application:', error);
      throw error;
    }
  };
  
  // Reject an application
  export const rejectApplication = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  };
  
  // Get applications for a project
  export const getApplicationsForProject = async (projectId) => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(applicationsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  };
  
  /**
   * Profile Service Functions
   */
  
  // Get student profile
  export const getStudentProfile = async (studentId) => {
    try {
      const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student profile not found');
      }
      return { id: studentDoc.id, ...studentDoc.data() };
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  };
  
  // Get company profile
  export const getCompanyProfile = async (companyId) => {
    try {
      const companyDoc = await getDoc(doc(db, 'companyProfiles', companyId));
      if (!companyDoc.exists()) {
        throw new Error('Company profile not found');
      }
      return { id: companyDoc.id, ...companyDoc.data() };
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  };
  
  /**
   * Dashboard Service Functions
   */
  
  // Get student dashboard data
  export const getStudentDashboardData = async (studentId) => {
    try {
      // Get applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get active projects (from accepted applications)
      const activeProjects = [];
      const acceptedApplications = applications.filter(app => app.status === 'accepted');
      
      for (const app of acceptedApplications) {
        const projectDoc = await getDoc(doc(db, 'projects', app.projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          
          // Get company info for the project
          let companyName = 'Company';
          const companyDoc = await getDoc(doc(db, 'companyProfiles', projectData.companyId));
          if (companyDoc.exists()) {
            companyName = companyDoc.data().companyName;
          }
          
          activeProjects.push({
            id: projectDoc.id,
            ...projectData,
            companyName
          });
        }
      }
      
      return {
        applications,
        activeProjects
      };
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
      throw error;
    }
  };
  
  // Get company dashboard data
  export const getCompanyDashboardData = async (companyId) => {
    try {
      // Get all projects for this company
      const projectsQuery = query(
        collection(db, 'projects'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get all active students from projects
      const activeStudents = [];
      const pendingApplications = {};
      
      for (const project of projects) {
        // Handle enrolled students
        if (project.enrolledStudents && project.enrolledStudents.length > 0) {
          for (const studentId of project.enrolledStudents) {
            const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
            if (studentDoc.exists()) {
              activeStudents.push({
                id: studentId,
                ...studentDoc.data(),
                projectId: project.id,
                projectTitle: project.title
              });
            }
          }
        }
        
        // Handle pending applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('projectId', '==', project.id),
          where('status', '==', 'pending')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const pendingApps = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (pendingApps.length > 0) {
          pendingApplications[project.id] = pendingApps;
        }
      }
      
      return {
        projects,
        activeStudents,
        pendingApplications
      };
    } catch (error) {
      console.error('Error fetching company dashboard data:', error);
      throw error;
    }
  };
  
  /**
   * Resource Service Functions
   */
  
  // Upload a resource
  export const uploadResource = async (projectId, userId, resourceData, file = null) => {
    try {
      let fileUrl = '';
      
      // Upload file if provided
      if (file) {
        const storageRef = ref(storage, `resources/${projectId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }
      
      // Create resource document
      const resource = {
        ...resourceData,
        projectId,
        uploadedById: userId,
        fileUrl: fileUrl || resourceData.url || '',
        uploadedAt: serverTimestamp()
      };
      
      const resourceRef = await addDoc(collection(db, 'resources'), resource);
      
      // Create activity record
      await addDoc(collection(db, 'activities'), {
        projectId,
        type: 'resource_added',
        description: `New resource added: ${resourceData.title}`,
        resourceId: resourceRef.id,
        userId,
        timestamp: serverTimestamp()
      });
      
      return resourceRef.id;
    } catch (error) {
      console.error('Error uploading resource:', error);
      throw error;
    }
  };
  
  // Get resources for a project
  export const getResourcesForProject = async (projectId) => {
    try {
      const resourcesQuery = query(
        collection(db, 'resources'),
        where('projectId', '==', projectId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(resourcesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  };
  
  /**
   * Message Service Functions
   */
  
  // Send a message
  export const sendMessage = async (messageData) => {
    try {
      const messageRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      // Create activity
      await addDoc(collection(db, 'activities'), {
        projectId: messageData.projectId,
        type: 'message',
        description: 'New message sent',
        userId: messageData.senderId,
        timestamp: serverTimestamp()
      });
      
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Get messages for a project/user
  export const getMessagesForProject = async (projectId, userId = null) => {
    try {
      let messagesQuery;
      
      if (userId) {
        // Get messages specific to a user
        messagesQuery = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId),
          where('participants', 'array-contains', userId),
          orderBy('timestamp', 'desc')
        );
      } else {
        // Get all messages for the project
        messagesQuery = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId),
          orderBy('timestamp', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(messagesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  };
  
  /**
   * File Upload Helper
   */
  
  // Upload a file and get URL
  export const uploadFile = async (file, path) => {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };
  
  export default {
    // Project services
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjects,
    
    // Application services
    createApplication,
    acceptApplication,
    rejectApplication,
    getApplicationsForProject,
    
    // Profile services
    getStudentProfile,
    getCompanyProfile,
    
    // Dashboard services
    getStudentDashboardData,
    getCompanyDashboardData,
    
    // Resource services
    uploadResource,
    getResourcesForProject,
    
    // Message services
    sendMessage,
    getMessagesForProject,
    
    // File upload helper
    uploadFile
  };