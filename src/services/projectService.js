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
  arrayUnion, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new project
 */
export const createProject = async (companyId, projectData) => {
  try {
    // Get company info for denormalization
    const companyDoc = await getDoc(doc(db, 'companyProfiles', companyId));
    const companyName = companyDoc.exists() ? companyDoc.data().companyName : 'Company';
    
    // FLAT PROJECT STRUCTURE
    const project = {
      // Basic info
      title: projectData.title?.trim() || '',
      description: projectData.description?.trim() || '',
      category: projectData.category || '',
      
      // Company info
      companyId: companyId,
      companyName: companyName,
      
      // Requirements
      skills: Array.isArray(projectData.skills) ? projectData.skills : 
              projectData.skills?.split(',').map(s => s.trim()) || [],
      duration: projectData.duration || '',
      
      // Compensation
      compensation: projectData.isExperienceOnly ? 0 : parseFloat(projectData.compensation) || 0,
      isExperienceOnly: projectData.isExperienceOnly || false,
      
      // Status - all flat
      status: 'open',
      applicationsCount: 0,
      enrolledStudents: [],
      applicants: [], // For backward compatibility
      
      // Application requirements
      applicationQuestion: projectData.applicationQuestion || '',
      requireVideoIntro: projectData.requireVideoIntro || false,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'projects'), project);
    return docRef.id;
    
  } catch (error) {
    throw new Error('Failed to create project: ' + error.message);
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    return { id: projectDoc.id, ...projectDoc.data() };
  } catch (error) {
    throw new Error('Failed to fetch project: ' + error.message);
  }
};

/**
 * Get all projects with optional filters
 */
export const getProjects = async (filters = {}) => {
  try {
    let projectsQuery = collection(db, 'projects');
    const constraints = [];
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.companyId) {
      constraints.push(where('companyId', '==', filters.companyId));
    }
    
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Build query with constraints
    if (constraints.length > 0) {
      projectsQuery = query(projectsQuery, ...constraints);
    }
    
    // Add sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortDirection || 'desc';
    projectsQuery = query(projectsQuery, orderBy(sortField, sortDirection));
    
    const querySnapshot = await getDocs(projectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Failed to fetch projects: ' + error.message);
  }
};

/**
 * Update project
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const updates = { ...updateData };
    
    // Process skills if provided
    if (updateData.skills) {
      updates.skills = Array.isArray(updateData.skills) ? updateData.skills : 
                      updateData.skills.split(',').map(s => s.trim());
    }
    
    // Always update timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'projects', projectId), updates);
    return true;
  } catch (error) {
    throw new Error('Failed to update project: ' + error.message);
  }
};

/**
 * Delete project
 */
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    return true;
  } catch (error) {
    throw new Error('Failed to delete project: ' + error.message);
  }
};

/**
 * Add student to project (when application is accepted)
 */
export const addStudentToProject = async (projectId, studentId) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      enrolledStudents: arrayUnion(studentId),
      status: 'in-progress',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to add student to project: ' + error.message);
  }
};

/**
 * Remove student from project
 */
export const removeStudentFromProject = async (projectId, studentId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectDoc.data();
    const enrolledStudents = (projectData.enrolledStudents || []).filter(id => id !== studentId);
    
    await updateDoc(doc(db, 'projects', projectId), {
      enrolledStudents: enrolledStudents,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to remove student from project: ' + error.message);
  }
};

/**
 * Get projects for a company
 */
export const getCompanyProjects = async (companyId) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch company projects: ' + error.message);
  }
};

/**
 * Get open projects (available for applications)
 */
export const getOpenProjects = async () => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error('Failed to fetch open projects: ' + error.message);
  }
};

/**
 * Close project (stop accepting applications)
 */
export const closeProject = async (projectId) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'closed',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw new Error('Failed to close project: ' + error.message);
  }
};

/**
 * Complete project
 */
export const completeProject = async (projectId) => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    throw new Error('Failed to complete project: ' + error.message);
  }
};

/**
 * Get project statistics
 */
export const getProjectStats = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectDoc.data();
    
    // Get applications count
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('projectId', '==', projectId)
    );
    const applicationsSnapshot = await getDocs(applicationsQuery);
    
    const stats = {
      totalApplications: applicationsSnapshot.size,
      enrolledStudentsCount: (projectData.enrolledStudents || []).length,
      status: projectData.status,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt
    };
    
    return stats;
  } catch (error) {
    throw new Error('Failed to get project statistics: ' + error.message);
  }
};
