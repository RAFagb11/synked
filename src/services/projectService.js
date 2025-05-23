// src/services/projectService.js - FIXED VERSION
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
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateDocumentId(type, name, length = 6) {
  const slug = name
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 10) || 'unknown';
  
  const randomId = Math.random().toString(36).substring(2, 2 + length);
  
  const prefixes = {
    company: 'comp',
    student: 'stu',
    project: 'proj'
  };
  
  return `${prefixes[type]}_${slug}_${randomId}`;
}

function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseSkills(skillsString) {
  if (Array.isArray(skillsString)) return skillsString;
  if (!skillsString) return [];
  return skillsString.split(',').map(s => s.trim()).filter(Boolean);
}

// =============================================================================
// PROJECT SERVICES
// =============================================================================

/**
 * Create a new project with structured ID
 */
export const createProject = async (companyId, projectData) => {
  try {
    console.log("Creating project:", projectData);
    
    const projectId = generateDocumentId('project', projectData.title);
    
    // Get company info for denormalization
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    let companyInfo = { name: "Company", email: "" };
    
    if (companyDoc.exists()) {
      const companyData = companyDoc.data();
      companyInfo = {
        name: companyData.basic?.name || "Company",
        email: companyData.contacts?.primary?.email || ""
      };
    }
    
    const project = {
      basic: {
        title: projectData.title?.trim() || "",
        slug: generateSlug(projectData.title),
        description: projectData.description?.trim() || "",
        category: projectData.category || "",
        tags: parseSkills(projectData.skills)
      },
      company: {
        id: companyId,
        name: companyInfo.name,
        contactEmail: companyInfo.email
      },
      requirements: {
        skills: parseSkills(projectData.skills),
        experience: "intermediate",
        hoursPerWeek: 15,
        duration: projectData.duration || "",
        startDate: null
      },
      compensation: {
        type: projectData.isExperienceOnly ? "unpaid" : "paid",
        amount: projectData.isExperienceOnly ? 0 : parseFloat(projectData.compensation) || 0,
        currency: "USD",
        schedule: "milestone"
      },
      application: {
        requiresCoverLetter: true,
        requiresPortfolio: false,
        requiresVideo: projectData.requireVideoIntro || false,
        customQuestions: projectData.applicationQuestion ? [projectData.applicationQuestion] : [],
        deadline: null
      },
      status: {
        current: "open",
        applicationsCount: 0,
        selectedStudents: [],
        startedAt: null,
        completedAt: null
      },
      meta: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        featured: false,
        priority: "normal",
        version: 1
      }
    };

    await setDoc(doc(db, 'projects', projectId), project);
    
    console.log("Project created with ID:", projectId);
    return projectId;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error('Failed to create project: ' + error.message);
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (projectId) => {
  try {
    console.log("Getting project by ID:", projectId);
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      console.log("Project not found");
      throw new Error('Project not found');
    }
    
    console.log("Project found:", projectDoc.data());
    return { id: projectDoc.id, ...projectDoc.data() };
  } catch (error) {
    console.error("Error fetching project:", error);
    throw new Error('Failed to fetch project: ' + error.message);
  }
};

/**
 * Get all projects with optional filters
 */
export const getProjects = async (filters = {}) => {
  try {
    console.log("Getting projects with filters:", filters);
    let projectsQuery = collection(db, 'projects');
    const constraints = [];
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      constraints.push(where('basic.category', '==', filters.category));
    }
    
    if (filters.companyId) {
      constraints.push(where('company.id', '==', filters.companyId));
    }
    
    if (filters.status) {
      constraints.push(where('status.current', '==', filters.status));
    }
    
    // Build query with constraints
    if (constraints.length > 0) {
      projectsQuery = query(projectsQuery, ...constraints);
    }
    
    // Add sorting
    const sortField = filters.sortBy || 'meta.createdAt';
    const sortDirection = filters.sortDirection || 'desc';
    projectsQuery = query(projectsQuery, orderBy(sortField, sortDirection));
    
    console.log("Executing Firestore query");
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    console.log("Projects found:", projects.length);
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error('Failed to fetch projects: ' + error.message);
  }
};

/**
 * Update project
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const updates = {};
    
    // Only update provided fields
    if (updateData.title) {
      updates['basic.title'] = updateData.title.trim();
      updates['basic.slug'] = generateSlug(updateData.title);
    }
    if (updateData.description) {
      updates['basic.description'] = updateData.description.trim();
    }
    if (updateData.category) {
      updates['basic.category'] = updateData.category;
    }
    if (updateData.skills) {
      updates['basic.tags'] = parseSkills(updateData.skills);
      updates['requirements.skills'] = parseSkills(updateData.skills);
    }
    if (updateData.duration) {
      updates['requirements.duration'] = updateData.duration;
    }
    if (updateData.compensation !== undefined) {
      updates['compensation.amount'] = parseFloat(updateData.compensation) || 0;
      updates['compensation.type'] = updateData.compensation > 0 ? "paid" : "unpaid";
    }
    
    // Always update timestamp
    updates['meta.updatedAt'] = serverTimestamp();
    
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
    console.log("Project deleted:", projectId);
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error('Failed to delete project: ' + error.message);
  }
};

/**
 * Add student to project (when application is accepted)
 */
export const addStudentToProject = async (projectId, studentId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    
    await updateDoc(projectRef, {
      'status.selectedStudents': arrayUnion(studentId),
      'status.current': 'in-progress',
      'meta.updatedAt': serverTimestamp()
    });
    
    return true;
  } catch (error) {
    throw new Error('Failed to add student to project: ' + error.message);
  }
};

/**
 * Get projects for a company
 */
export const getCompanyProjects = async (companyId) => {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('company.id', '==', companyId),
      orderBy('meta.createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(projectsQuery);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    throw new Error('Failed to fetch company projects: ' + error.message);
  }
};