// src/services/dashboardService.js
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where 
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  // Get data for student dashboard
  export const getStudentDashboardData = async (studentId) => {
    try {
      // Get applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get active projects from activeProjects collection
      const activeProjectsQuery = query(
        collection(db, 'activeProjects'),
        where('studentId', '==', studentId)
      );
      const activeProjectsSnapshot = await getDocs(activeProjectsQuery);
      
      // Get full project details for active projects
      const activeProjects = [];
      for (const activeDoc of activeProjectsSnapshot.docs) {
        const activeData = activeDoc.data();
        const projectDoc = await getDoc(doc(db, 'projects', activeData.projectId));
        
        if (projectDoc.exists()) {
          // Get company details
          const companyDoc = await getDoc(doc(db, 'companyProfiles', projectDoc.data().companyId));
          const companyName = companyDoc.exists() ? companyDoc.data().companyName : 'Unknown Company';
          
          activeProjects.push({
            id: projectDoc.id,
            ...projectDoc.data(),
            companyName,
            activeProjectId: activeDoc.id // Reference to activeProjects document
          });
        }
      }
      
      return {
        applications,
        activeProjects
      };
    } catch (error) {
      throw new Error('Failed to fetch dashboard data: ' + error.message);
    }
  };
  
  // Get data for company dashboard
  export const getCompanyDashboardData = async (companyId) => {
    try {
      // Get company projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('companyId', '==', companyId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get active students from activeProjects collection
      const activeProjectsQuery = query(
        collection(db, 'activeProjects'),
        where('companyId', '==', companyId)
      );
      const activeProjectsSnapshot = await getDocs(activeProjectsQuery);
      
      // Get full student details for active students
      const activeStudents = [];
      for (const activeDoc of activeProjectsSnapshot.docs) {
        const activeData = activeDoc.data();
        
        // Get student profile
        const studentDoc = await getDoc(doc(db, 'studentProfiles', activeData.studentId));
        
        if (studentDoc.exists()) {
          // Get project details
          const projectDoc = await getDoc(doc(db, 'projects', activeData.projectId));
          const projectTitle = projectDoc.exists() ? projectDoc.data().title : 'Unknown Project';
          
          // Get user document to get email and any additional info
          let email = '';
          try {
            const userDoc = await getDoc(doc(db, 'users', activeData.studentId));
            email = userDoc.exists() ? userDoc.data().email : '';
          } catch (error) {
            console.error("Error fetching user email:", error);
          }
          
          // Extract the student data
          const studentData = studentDoc.data();
          console.log("Student data from Firestore:", studentData);
          
          activeStudents.push({
            id: activeData.studentId,
            email: email,
            // Use the name as stored in the database
            fullName: studentData.fullName || 'Student',
            university: studentData.college || '',
            major: studentData.major || 'Not specified',
            bio: studentData.bio && studentData.bio !== '-' ? studentData.bio : 'No bio provided',
            skills: studentData.skills || [],
            photoURL: studentData.photoURL || '',
            ...studentData, // Keep all original data
            projectId: activeData.projectId,
            projectTitle,
            activeProjectId: activeDoc.id
          });
          
          console.log("Final processed student:", activeStudents[activeStudents.length-1]);
        }
      }
      
      // Get applications
      const pendingApplicationsQuery = query(
        collection(db, 'applications'),
        where('companyId', '==', companyId),
        where('status', '==', 'pending')
      );
      const pendingApplicationsSnapshot = await getDocs(pendingApplicationsQuery);
      const pendingApplications = pendingApplicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group applications by project
      const applicationsByProject = {};
      for (const app of pendingApplications) {
        if (!applicationsByProject[app.projectId]) {
          applicationsByProject[app.projectId] = [];
        }
        
        // Get student profile for each application
        const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
        const studentName = studentDoc.exists() 
          ? `${studentDoc.data().firstName} ${studentDoc.data().lastName}`
          : 'Unknown Student';
        
        applicationsByProject[app.projectId].push({
          ...app,
          studentName
        });
      }
      
      return {
        projects,
        activeStudents,
        pendingApplications: applicationsByProject
      };
    } catch (error) {
      throw new Error('Failed to fetch dashboard data: ' + error.message);
    }
  };