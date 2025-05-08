// src/services/projectService.js - Fix project service to correctly interact with Firestore
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

// Create a new project
export const createProject = async (projectData) => {
  console.log("Creating project:", projectData);
  try {
    const projectRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: serverTimestamp(),
      status: 'open',
      applicants: []
    });
    
    console.log("Project created with ID:", projectRef.id);
    return projectRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error('Failed to create project: ' + error.message);
  }
};

// Get project by ID
export const getProjectById = async (projectId) => {
  console.log("Getting project by ID:", projectId);
  try {
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

// Get all projects with optional filters
export const getProjects = async (filters = {}) => {
  console.log("Getting projects with filters:", filters);
  try {
    let projectsQuery = collection(db, 'projects');
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      projectsQuery = query(projectsQuery, where('category', '==', filters.category));
    }
    
    if (filters.companyId) {
      projectsQuery = query(projectsQuery, where('companyId', '==', filters.companyId));
    }
    
    if (filters.status) {
      projectsQuery = query(projectsQuery, where('status', '==', filters.status));
    }
    
    // Apply sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortDirection || 'desc';
    projectsQuery = query(projectsQuery, orderBy(sortField, sortDirection));
    
    console.log("Executing Firestore query");
    const querySnapshot = await getDocs(projectsQuery);
    const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Projects found:", projects.length);
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error('Failed to fetch projects: ' + error.message);
  }
};