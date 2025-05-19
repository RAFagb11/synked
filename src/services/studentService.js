// src/services/studentService.js
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  // Check if student already has an active project
  export const checkActiveProject = async (studentId) => {
    try {
      // Check if student is active on any project
      const projectsQuery = query(
        collection(db, 'projects'),
        where('activeStudents', 'array-contains', studentId),
        where('status', '==', 'active')
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      
      if (!projectsSnapshot.empty) {
        // Student already has an active project
        return {
          hasActiveProject: true,
          projectId: projectsSnapshot.docs[0].id,
          projectData: projectsSnapshot.docs[0].data()
        };
      }
      
      return { hasActiveProject: false };
    } catch (error) {
      throw new Error('Failed to check active projects: ' + error.message);
    }
  };
  
  // Accept a project (ensures student can only have one active project)
  export const acceptProject = async (projectId, studentId, applicationData) => {
    try {
      // First check if student already has an active project
      const activeProjectCheck = await checkActiveProject(studentId);
      
      if (activeProjectCheck.hasActiveProject) {
        throw new Error('You already have an active project. Please complete or leave your current project before accepting a new one.');
      }
      
      // Get the project
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      const projectData = projectDoc.data();
      
      // Update project status to active if not already
      if (projectData.status !== 'active') {
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'active',
          startDate: serverTimestamp()
        });
      }
      
      // Add student to active students if not already there
      if (!projectData.activeStudents || !projectData.activeStudents.includes(studentId)) {
        await updateDoc(doc(db, 'projects', projectId), {
          activeStudents: projectData.activeStudents ? 
            [...projectData.activeStudents, studentId] : 
            [studentId]
        });
      }
      
      // Update application status
      const updatedApplicants = projectData.applicants.map(app => {
        if (app.studentId === studentId) {
          return {
            ...app,
            status: 'accepted',
            acceptedAt: new Date().toISOString()
          };
        }
        return app;
      });
      
      await updateDoc(doc(db, 'projects', projectId), {
        applicants: updatedApplicants
      });
      
      // Create activity record
      await addDoc(collection(db, 'activities'), {
        projectId,
        type: 'student_joined',
        description: `${applicationData.studentName || 'Student'} has joined the project`,
        studentId,
        timestamp: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      throw new Error('Failed to accept project: ' + error.message);
    }
  };