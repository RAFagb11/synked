// src/pages/CompanyProjectManagement.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// =============================================================================
// SAFE DATA ACCESS HELPERS
// =============================================================================

const safeGet = (obj, path, defaultValue = null) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

const safeNumber = (value, defaultValue = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value) || defaultValue;
  return defaultValue;
};

const safeArray = (value, defaultValue = []) => {
  return Array.isArray(value) ? value : defaultValue;
};

const safeString = (value, defaultValue = '') => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

const CompanyProjectManagement = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [students, setStudents] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [newDeliverable, setNewDeliverable] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 10,
    status: 'pending'
  });
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  
  // =============================================================================
  // SAFE DATE FORMATTING
  // =============================================================================
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date set';
    
    try {
      // Handle Firestore timestamp
      if (dateStr && typeof dateStr === 'object' && dateStr.seconds) {
        return new Date(dateStr.seconds * 1000).toLocaleDateString();
      }
      // Handle regular date string
      if (typeof dateStr === 'string' || dateStr instanceof Date) {
        return new Date(dateStr).toLocaleDateString();
      }
      return 'Invalid date';
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  };
  
  // =============================================================================
  // FETCH PROJECT DATA
  // =============================================================================
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Get project data
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const rawProjectData = projectDoc.data();
        console.log('Raw project data:', rawProjectData);
        
        // SAFELY NORMALIZE PROJECT DATA
        const projectData = {
          id: projectDoc.id,
          // Handle both old flat structure and new nested structure
          title: safeGet(rawProjectData, 'basic.title', safeGet(rawProjectData, 'title', 'Untitled Project')),
          description: safeGet(rawProjectData, 'basic.description', safeGet(rawProjectData, 'description', '')),
          category: safeGet(rawProjectData, 'basic.category', safeGet(rawProjectData, 'category', 'Other')),
          status: safeGet(rawProjectData, 'status.current', safeGet(rawProjectData, 'status', 'open')),
          companyId: safeGet(rawProjectData, 'company.id', safeGet(rawProjectData, 'companyId', currentUser.uid)),
          duration: safeGet(rawProjectData, 'requirements.duration', safeGet(rawProjectData, 'duration', '')),
          compensation: safeGet(rawProjectData, 'compensation.amount', safeGet(rawProjectData, 'compensation', 0)),
          isExperienceOnly: safeGet(rawProjectData, 'compensation.type', '') === 'unpaid' || safeGet(rawProjectData, 'isExperienceOnly', false),
          
          // SAFE ARRAY ACCESS
          enrolledStudents: safeArray(
            safeGet(rawProjectData, 'status.selectedStudents', 
            safeGet(rawProjectData, 'enrolledStudents', []))
          ),
          
          // SAFE TIMESTAMP HANDLING
          createdAt: rawProjectData.createdAt || safeGet(rawProjectData, 'meta.createdAt', new Date()),
          
          // Keep all original data for compatibility
          ...rawProjectData
        };
        
        setProject(projectData);
        
        // SAFE STUDENT FETCHING
        const enrolledStudentsIds = safeArray(projectData.enrolledStudents);
        console.log('Enrolled student IDs:', enrolledStudentsIds);

        if (enrolledStudentsIds.length > 0) {
          const studentsData = [];
          
          for (const studentId of enrolledStudentsIds) {
            try {
              console.log("Fetching student with ID:", studentId);
              
              // Get student profile
              const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
              
              // Get user document for email
              let email = '';
              try {
                const userDoc = await getDoc(doc(db, 'users', studentId));
                if (userDoc.exists()) {
                  email = safeString(userDoc.data().email);
                }
              } catch (error) {
                console.error("Error fetching user email:", error);
              }
              
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                console.log("Student data found:", studentData);
                
                // SAFELY PROCESS STUDENT DATA
                studentsData.push({
                  id: studentId,
                  fullName: safeString(
                    safeGet(studentData, 'fullName', 
                    safeGet(studentData, 'personal.fullName', 'Student'))
                  ),
                  displayName: safeString(
                    safeGet(studentData, 'fullName', 
                    safeGet(studentData, 'personal.fullName', 'Student'))
                  ),
                  photoURL: safeString(
                    safeGet(studentData, 'photoURL', 
                    safeGet(studentData, 'personal.photoURL', ''))
                  ),
                  email: email,
                  major: safeString(
                    safeGet(studentData, 'major', 
                    safeGet(studentData, 'education.major', 'Not specified'))
                  ),
                  college: safeString(
                    safeGet(studentData, 'college', 
                    safeGet(studentData, 'education.college', ''))
                  ),
                  year: safeString(
                    safeGet(studentData, 'year', 
                    safeGet(studentData, 'education.year', 'Not specified'))
                  ),
                  bio: (() => {
                    const bio = safeString(safeGet(studentData, 'bio', ''));
                    return bio && bio !== '-' ? bio : 'No bio provided';
                  })(),
                  skills: safeArray(studentData.skills),
                  progress: 0, // Will calculate later
                  ...studentData
                });
              } else {
                console.log("No student profile found for ID:", studentId);
                // Add placeholder
                studentsData.push({
                  id: studentId,
                  fullName: 'Student',
                  displayName: 'Student',
                  photoURL: '',
                  email: email,
                  major: 'Not specified',
                  college: '',
                  bio: 'No bio provided',
                  skills: [],
                  progress: 0
                });
              }
            } catch (studentError) {
              console.error(`Error fetching student ${studentId}:`, studentError);
            }
          }
          
          console.log("Final processed students:", studentsData);
          setStudents(studentsData);
          
          if (studentsData.length > 0 && !activeStudent) {
            setActiveStudent(studentsData[0]);
          }
        }
        
        // Get deliverables
        try {
          const deliverablesQuery = query(
            collection(db, 'deliverables'),
            where('projectId', '==', projectId)
          );
          
          const deliverablesSnapshot = await getDocs(deliverablesQuery);
          const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort deliverables by due date
          deliverablesData.sort((a, b) => {
            try {
              if (a.dueDate && b.dueDate) {
                const aDate = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
                const bDate = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
                return aDate - bDate;
              }
              return 0;
            } catch (e) {
              return 0;
            }
          });
          
          setDeliverables(deliverablesData);
        } catch (error) {
          console.error('Error fetching deliverables:', error);
          setDeliverables([]);
        }
        
        // Get pending applications
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('projectId', '==', projectId),
            where('status', '==', 'pending')
          );
          
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Fetch student profiles for applications
          const applicationsWithProfiles = await Promise.all(
            applicationsData.map(async (app) => {
              try {
                const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
                if (studentDoc.exists()) {
                  return {
                    ...app,
                    studentProfile: { id: studentDoc.id, ...studentDoc.data() }
                  };
                }
                return app;
              } catch (error) {
                console.error('Error fetching student profile for application:', error);
                return app;
              }
            })
          );
          
          setPendingApplications(applicationsWithProfiles);
        } catch (error) {
          console.error('Error fetching applications:', error);
          setPendingApplications([]);
        }
        
        // Get messages for active student
        if (activeStudent) {
          await fetchMessages(activeStudent.id);
        }
        
        // Get submissions
        await fetchSubmissions();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(safeString(error.message, 'Unknown error occurred'));
        setLoading(false);
      }
    };
    
    if (projectId && currentUser) {
      fetchProjectData();
    }
  }, [projectId, currentUser]);
  
  // =============================================================================
  // FETCH MESSAGES
  // =============================================================================
  
  const fetchMessages = async (studentId) => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('projectId', '==', projectId),
        where('participants', 'array-contains', studentId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort messages by timestamp
      messagesData.sort((a, b) => {
        try {
          if (a.timestamp && b.timestamp) {
            const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return aTime - bTime;
          }
          return 0;
        } catch (e) {
          return 0;
        }
      });
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };
  
  // =============================================================================
  // FETCH SUBMISSIONS
  // =============================================================================
  
  const fetchSubmissions = async () => {
    try {
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('projectId', '==', projectId)
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    }
  };
  
  // =============================================================================
  // SAFE PROGRESS CALCULATION
  // =============================================================================
  
  const calculateStudentProgress = (studentId) => {
    const totalDeliverables = safeNumber(deliverables.length);
    if (totalDeliverables === 0) return 0;
    
    const studentSubmissions = submissions.filter(submission => submission.studentId === studentId);
    const completedCount = studentSubmissions.filter(submission => 
      submission.status === 'approved'
    ).length;
    
    return Math.round((safeNumber(completedCount) / totalDeliverables) * 100);
  };
  
  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================
  
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeStudent) return;
    
    try {
      const messageData = {
        projectId,
        senderId: currentUser.uid,
        senderType: 'company',
        recipientId: activeStudent.id,
        participants: [currentUser.uid, activeStudent.id],
        content: newMessage,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      await addDoc(collection(db, 'messages'), messageData);
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        activityType: 'message',
        content: `sent a message to ${safeString(activeStudent.fullName, 'Student')}`,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      await fetchMessages(activeStudent.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // =============================================================================
  // DELIVERABLE HANDLING
  // =============================================================================
  
  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    
    try {
      const deliverableData = {
        projectId,
        title: safeString(newDeliverable.title),
        description: safeString(newDeliverable.description),
        dueDate: newDeliverable.dueDate ? new Date(newDeliverable.dueDate) : null,
        points: safeNumber(newDeliverable.points, 10),
        status: 'pending',
        createdAt: serverTimestamp(),
        feedback: ''
      };
      
      await addDoc(collection(db, 'deliverables'), deliverableData);
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        activityType: 'deliverable',
        content: `added a new deliverable: ${safeString(newDeliverable.title)}`,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      setNewDeliverable({
        title: '',
        description: '',
        dueDate: '',
        points: 10,
        status: 'pending'
      });
      
      setIsAddingDeliverable(false);
      
      // Refresh deliverables
      const deliverablesQuery = query(
        collection(db, 'deliverables'),
        where('projectId', '==', projectId)
      );
      
      const deliverablesSnapshot = await getDocs(deliverablesQuery);
      const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort deliverables by due date
      deliverablesData.sort((a, b) => {
        try {
          if (a.dueDate && b.dueDate) {
            const aDate = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
            const bDate = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
            return aDate - bDate;
          }
          return 0;
        } catch (e) {
          return 0;
        }
      });
      
      setDeliverables(deliverablesData);
    } catch (error) {
      console.error('Error adding deliverable:', error);
    }
  };
  
  // =============================================================================
  // APPLICATION HANDLING
  // =============================================================================
  
  const handleAcceptApplication = async (application) => {
    try {
      // Update application status - ADD THE TWO KEY FIELDS HERE
      await updateDoc(doc(db, 'applications', application.id), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(), // ← ADD THIS - triggers modal
        modalShown: false,                    // ← ADD THIS - ensures modal shows
        updatedAt: serverTimestamp()
      });
      
      // Add student to project enrolled students
      await updateDoc(doc(db, 'projects', projectId), {
        enrolledStudents: arrayUnion(application.studentId)
      });
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        activityType: 'enrollment',
        content: `accepted ${safeString(safeGet(application, 'studentProfile.fullName', 'student'))}'s application`,
        timestamp: serverTimestamp()
      });
      
      // Refresh applications and enrolled students
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('projectId', '==', projectId),
        where('status', '==', 'pending')
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const applicationsWithProfiles = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
            if (studentDoc.exists()) {
              return {
                ...app,
                studentProfile: { id: studentDoc.id, ...studentDoc.data() }
              };
            }
            return app;
          } catch (error) {
            console.error('Error fetching student profile:', error);
            return app;
          }
        })
      );
      
      setPendingApplications(applicationsWithProfiles);
      
      // Refresh project data
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        const rawProjectData = projectDoc.data();
        const projectData = {
          id: projectDoc.id,
          title: safeGet(rawProjectData, 'basic.title', safeGet(rawProjectData, 'title', 'Untitled Project')),
          description: safeGet(rawProjectData, 'basic.description', safeGet(rawProjectData, 'description', '')),
          category: safeGet(rawProjectData, 'basic.category', safeGet(rawProjectData, 'category', 'Other')),
          status: safeGet(rawProjectData, 'status.current', safeGet(rawProjectData, 'status', 'open')),
          enrolledStudents: safeArray(
            safeGet(rawProjectData, 'status.selectedStudents', 
            safeGet(rawProjectData, 'enrolledStudents', []))
          ),
          ...rawProjectData
        };
        setProject(projectData);
      }
      
      // Optional: Show success message
      alert(`${safeString(safeGet(application, 'studentProfile.fullName', 'Student'))} has been accepted! They will see a congratulations modal when they visit their dashboard.`);
      
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Error accepting application. Please try again.');
    }
  };
  
  const handleRejectApplication = async (application) => {
    try {
      // Update application status
      await updateDoc(doc(db, 'applications', application.id), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      // Refresh applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('projectId', '==', projectId),
        where('status', '==', 'pending')
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const applicationsWithProfiles = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
            if (studentDoc.exists()) {
              return {
                ...app,
                studentProfile: { id: studentDoc.id, ...studentDoc.data() }
              };
            }
            return app;
          } catch (error) {
            console.error('Error fetching student profile:', error);
            return app;
          }
        })
      );
      
      setPendingApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };
  
  // =============================================================================
  // FEEDBACK HANDLING
  // =============================================================================
  
  const handleProvideFeedback = async (submission, feedback, status) => {
    try {
      // Update submission
      await updateDoc(doc(db, 'submissions', submission.id), {
        feedback,
        status,
        updatedAt: serverTimestamp()
      });
      
      // Update corresponding deliverable status
      const deliverableId = submission.deliverableId;
      await updateDoc(doc(db, 'deliverables', deliverableId), {
        status: status === 'approved' ? 'completed' : 'rejected',
        feedback,
        updatedAt: serverTimestamp()
      });
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        studentId: submission.studentId,
        activityType: 'feedback',
        content: `provided feedback on submission for ${safeString(
          deliverables.find(d => d.id === deliverableId)?.title, 'deliverable'
        )}`,
        timestamp: serverTimestamp()
      });
      
      // Refresh submissions
      await fetchSubmissions();
      
      // Refresh deliverables
      const deliverablesQuery = query(
        collection(db, 'deliverables'),
        where('projectId', '==', projectId)
      );
      
      const deliverablesSnapshot = await getDocs(deliverablesQuery);
      const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDeliverables(deliverablesData);
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  const getStudentSubmissions = (studentId) => {
    return submissions.filter(submission => submission.studentId === studentId);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'in-progress':
      case 'submitted':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return '';
    }
  };
  
  // =============================================================================
  // RENDER LOADING/ERROR STATES
  // =============================================================================
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div>Loading project management...</div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ color: 'var(--danger)' }}>{error}</div>
          <button 
            onClick={() => navigate('/company/dashboard')} 
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </>
    );
  }
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ marginBottom: '5px' }}>{safeString(project?.title, 'Project')}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="feature-badge">{safeString(project?.category, 'Category')}</span>
              <span>Project Management</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/company/dashboard')} 
            className="btn btn-outline"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '30px' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'overview' ? '600' : '400',
              color: activeTab === 'overview' ? 'var(--primary)' : 'inherit'
            }}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'students' ? '600' : '400',
              color: activeTab === 'students' ? 'var(--primary)' : 'inherit'
            }}
          >
            Students {students.length > 0 && `(${safeNumber(students.length)})`}
          </button>
          <button 
            onClick={() => setActiveTab('deliverables')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'deliverables' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'deliverables' ? '600' : '400',
              color: activeTab === 'deliverables' ? 'var(--primary)' : 'inherit'
            }}
          >
            Deliverables {deliverables.length > 0 && `(${safeNumber(deliverables.length)})`}
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'applications' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'applications' ? '600' : '400',
              color: activeTab === 'applications' ? 'var(--primary)' : 'inherit'
            }}
          >
            Applications {pendingApplications.length > 0 && `(${safeNumber(pendingApplications.length)})`}
          </button>
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Project Info</h3>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Status:</strong> {(() => {
                    const status = project?.status;
                    // Handle object status (nested structure)
                    if (status && typeof status === 'object') {
                      const currentStatus = status.current || status.status || 'Unknown';
                      return currentStatus === 'open' ? 'Active' : safeString(currentStatus);
                    }
                    // Handle string status (flat structure)
                    return status === 'open' ? 'Active' : safeString(status, 'Unknown');
                  })()}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Posted:</strong> {formatDate(project?.createdAt)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Duration:</strong> {safeString(project?.duration, 'Not specified')}
                </div>
                <div>
                  <strong>Compensation:</strong> {project?.isExperienceOnly ? 'Experience Only' : `${safeNumber(project?.compensation)}`}
                </div>
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Students</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
                  {safeNumber(students.length)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Active:</strong> {safeNumber(students.length)}
                </div>
                <button 
                  onClick={() => setActiveTab('students')}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Manage Students
                </button>
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Deliverables</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
                  {safeNumber(deliverables.length)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Completed:</strong> {safeNumber(deliverables.filter(d => d.status === 'completed').length)}
                </div>
                <button 
                  onClick={() => setActiveTab('deliverables')}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Manage Deliverables
                </button>
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Applications</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
                  {safeNumber(pendingApplications.length)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Pending Review:</strong> {safeNumber(pendingApplications.length)}
                </div>
                <button 
                  onClick={() => setActiveTab('applications')}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Review Applications
                </button>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '20px' }}>Project Description</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{safeString(project?.description, 'No description available')}</p>
              
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {safeArray(project?.skills).map(skill => (
                    <span key={skill} className="feature-badge">{safeString(skill)}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px' }}>Recent Submissions</h3>
              
              {submissions.length === 0 ? (
                <p>No submissions yet.</p>
              ) : (
                <div>
                  {submissions
                    .sort((a, b) => {
                      try {
                        if (a.submittedAt && b.submittedAt) {
                          const aTime = a.submittedAt.seconds ? a.submittedAt.seconds * 1000 : new Date(a.submittedAt).getTime();
                          const bTime = b.submittedAt.seconds ? b.submittedAt.seconds * 1000 : new Date(b.submittedAt).getTime();
                          return bTime - aTime; // Most recent first
                        }
                        return 0;
                      } catch (e) {
                        return 0;
                      }
                    })
                    .slice(0, 5)
                    .map(submission => {
                      const student = students.find(s => s.id === submission.studentId);
                      const deliverable = deliverables.find(d => d.id === submission.deliverableId);
                      
                      return (
                        <div 
                          key={submission.id} 
                          style={{ 
                            padding: '15px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                              {safeString(student?.fullName, 'Student')} - {safeString(deliverable?.title, 'Deliverable')}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              Submitted on {formatDate(submission.submittedAt)}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span className={`feature-badge ${getStatusClass(submission.status)}`}>
                              {safeString(submission.status, 'pending')}
                            </span>
                            <button 
                              onClick={() => {
                                setActiveTab('students');
                                setActiveStudent(student);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '8px 12px', fontSize: '14px' }}
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {/* Student List */}
            <div style={{ flex: '0 0 300px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '20px' }}>Enrolled Students</h3>
                
                {students.length === 0 ? (
                  <p>No students enrolled yet.</p>
                ) : (
                  <div>
                    {students.map(student => (
                      <div 
                        key={student.id} 
                        style={{ 
                          padding: '15px',
                          border: activeStudent?.id === student.id ? '2px solid var(--primary)' : '1px solid #f1f5f9',
                          borderRadius: '8px',
                          marginBottom: '15px',
                          cursor: 'pointer',
                          background: activeStudent?.id === student.id ? 'rgba(108, 99, 255, 0.05)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px'
                        }}
                        onClick={() => setActiveStudent(student)}
                      >
                        {safeString(student.photoURL) ? (
                          <img 
                            src={student.photoURL} 
                            alt={safeString(student.fullName, 'Student')} 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '500'
                          }}>
                            {safeString(student.fullName, 'S').charAt(0)}
                          </div>
                        )}
                        
                        <div style={{ flex: '1' }}>
                          <div style={{ fontWeight: '500' }}>
                            {safeString(student.fullName, 'Student')}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            Progress: {safeNumber(student.progress || calculateStudentProgress(student.id))}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Student Details */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {activeStudent ? (
                <>
                  <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                      {safeString(activeStudent.photoURL) ? (
                        <img 
                          src={activeStudent.photoURL} 
                          alt={safeString(activeStudent.fullName, 'Student')} 
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          fontWeight: '500'
                        }}>
                          {safeString(activeStudent.fullName, 'S').charAt(0)}
                        </div>
                      )}
                      
                      <div>
                        <h3 style={{ marginBottom: '5px' }}>{safeString(activeStudent.fullName, 'Student')}</h3>
                        <div>{safeString(activeStudent.college || activeStudent.university, 'University')}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Email:</strong> {safeString(activeStudent.email, 'Not provided')}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Major:</strong> {safeString(activeStudent.major, 'Not specified')}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Year:</strong> {safeString(activeStudent.year, 'Not specified')}
                      </div>
                      <div>
                        <strong>Skills:</strong> {safeArray(activeStudent.skills).length > 0 
                          ? safeArray(activeStudent.skills).join(', ') 
                          : 'None listed'}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Bio:</strong>
                      <p>{safeString(activeStudent.bio, 'No bio provided')}</p>
                    </div>
                  </div>
                  
                  <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Progress</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span>Overall Progress</span>
                        <span>{calculateStudentProgress(activeStudent.id)}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${calculateStudentProgress(activeStudent.id)}%`, 
                            background: 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <h4 style={{ marginBottom: '15px', marginTop: '20px' }}>Deliverables</h4>
                    
                    {deliverables.map(deliverable => {
                      const submission = submissions.find(s => 
                        s.deliverableId === deliverable.id && s.studentId === activeStudent.id
                      );
                      
                      return (
                        <div 
                          key={deliverable.id} 
                          style={{ 
                            padding: '15px',
                            border: '1px solid #f1f5f9',
                            borderRadius: '8px',
                            marginBottom: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>{safeString(deliverable.title)}</span>
                            <span className={`feature-badge ${getStatusClass(submission?.status || deliverable.status)}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                              {safeString(submission?.status || deliverable.status, 'pending')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                            <span>Due: {formatDate(deliverable.dueDate)}</span>
                            <span>{safeNumber(deliverable.points)} pts</span>
                          </div>
                          
                          {submission && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <strong>Submitted:</strong> {formatDate(submission.submittedAt)}
                              </div>
                              
                              {submission.content && (
                                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                  <strong>Notes:</strong> {safeString(submission.content)}
                                </div>
                              )}
                              
                              {submission.fileUrl && (
                                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                  <strong>File:</strong> <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">View Submission</a>
                                </div>
                              )}
                              
                              {submission.status === 'submitted' && (
                                <div style={{ marginTop: '10px' }}>
                                  <textarea 
                                    placeholder="Provide feedback..."
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' }}
                                    rows="3"
                                    id={`feedback-${submission.id}`}
                                  ></textarea>
                                  
                                  <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                      onClick={() => {
                                        const feedback = document.getElementById(`feedback-${submission.id}`).value;
                                        handleProvideFeedback(submission, feedback, 'approved');
                                      }}
                                      className="btn btn-primary"
                                      style={{ flex: '1', padding: '8px' }}
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const feedback = document.getElementById(`feedback-${submission.id}`).value;
                                        handleProvideFeedback(submission, feedback, 'rejected');
                                      }}
                                      className="btn btn-outline"
                                      style={{ flex: '1', padding: '8px' }}
                                    >
                                      Request Revisions
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {submission.feedback && (
                                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                                  <strong>Feedback:</strong> {safeString(submission.feedback)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>Messages</h3>
                    
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      marginBottom: '20px',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>No messages yet. Start a conversation with the student.</p>
                      ) : (
                        messages.map(message => (
                          <div 
                            key={message.id} 
                            style={{ 
                              marginBottom: '15px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: message.senderType === 'company' ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ 
                              background: message.senderType === 'company' ? 'var(--primary)' : '#f1f5f9',
                              color: message.senderType === 'company' ? 'white' : 'var(--dark)',
                              padding: '10px 15px',
                              borderRadius: '12px',
                              maxWidth: '80%'
                            }}>
                              {safeString(message.content)}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              marginTop: '4px'
                            }}>
                              {message.timestamp ? formatDate(message.timestamp) + ' ' + new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <form onSubmit={handleSubmitMessage}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message to the student..."
                          style={{ 
                            flex: '1',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}
                        />
                        <button 
                          type="submit"
                          className="btn btn-primary"
                          disabled={!newMessage.trim()}
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{ 
                  background: 'white', 
                  padding: '30px', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '24px',
                    color: '#94a3b8'
                  }}>
                    👤
                  </div>
                  <h3 style={{ marginBottom: '10px' }}>Select a Student</h3>
                  <p>Click on a student from the list to view their details and progress.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Deliverables Tab */}
        {activeTab === 'deliverables' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Project Deliverables</h3>
              <button 
                onClick={() => setIsAddingDeliverable(!isAddingDeliverable)}
                className="btn btn-primary"
              >
                {isAddingDeliverable ? 'Cancel' : 'Add Deliverable'}
              </button>
            </div>
            
            {isAddingDeliverable && (
              <div style={{ 
                background: 'white', 
                padding: '25px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                marginBottom: '30px'
              }}>
                <h3 style={{ marginBottom: '20px' }}>New Deliverable</h3>
                
                <form onSubmit={handleAddDeliverable}>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title</label>
                    <input 
                      type="text"
                      value={newDeliverable.title}
                      onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      placeholder="E.g. Project Wireframes"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                    <textarea 
                      value={newDeliverable.description}
                      onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                      placeholder="Describe what the student needs to do for this deliverable..."
                    ></textarea>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Due Date</label>
                      <input 
                        type="date"
                        value={newDeliverable.dueDate}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, dueDate: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Points</label>
                      <input 
                        type="number"
                        value={newDeliverable.points}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, points: e.target.value })}
                        required
                        min="1"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Add Deliverable
                  </button>
                </form>
              </div>
            )}
            
            {deliverables.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <p>No deliverables have been created yet.</p>
                <button 
                  onClick={() => setIsAddingDeliverable(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '15px' }}
                >
                  Create First Deliverable
                </button>
              </div>
            ) : (
              <div className="feature-grid">
                {deliverables.map(deliverable => (
                  <div 
                    key={deliverable.id} 
                    className="feature-card"
                    style={{ position: 'relative' }}
                  >
                    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                      <span className={`feature-badge ${getStatusClass(deliverable.status)}`}>
                        {safeString(deliverable.status, 'pending')}
                      </span>
                    </div>
                    
                    <h3>{safeString(deliverable.title)}</h3>
                    <p>{safeString(deliverable.description)}</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Due Date:</span>
                        <span>{formatDate(deliverable.dueDate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Points:</span>
                        <span>{safeNumber(deliverable.points)}</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Submitted:</span>
                        <span>
                          {safeNumber(submissions.filter(s => s.deliverableId === deliverable.id && s.status === 'approved').length)} / {safeNumber(students.length)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Pending Applications</h3>
            
            {pendingApplications.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <p>No pending applications to review.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                {pendingApplications.map(application => (
                  <div 
                    key={application.id} 
                    style={{ 
                      background: 'white', 
                      padding: '25px', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ 
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '500'
                      }}>
                        {safeString(safeGet(application, 'studentProfile.fullName', 'Student')).charAt(0)}
                      </div>
                      
                      <div>
                        <h4 style={{ marginBottom: '5px' }}>
                          {safeString(safeGet(application, 'studentProfile.fullName', 'Student'))}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {safeString(safeGet(application, 'studentProfile.university', safeGet(application, 'studentProfile.college', 'University')))} - {safeString(safeGet(application, 'studentProfile.major', 'Not specified'))}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Cover Letter</h4>
                      <p style={{ 
                        padding: '15px', 
                        background: '#f8fafc', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {safeString(application.coverLetter, 'No cover letter provided')}
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Availability:</strong> {safeString(application.availability, 'Not specified')}
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Applied:</strong> {formatDate(application.appliedAt)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button 
                        onClick={() => handleAcceptApplication(application)}
                        className="btn btn-primary"
                        style={{ flex: '1' }}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectApplication(application)}
                        className="btn btn-outline"
                        style={{ flex: '1' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyProjectManagement;