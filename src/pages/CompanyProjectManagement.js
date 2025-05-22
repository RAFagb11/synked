// src/pages/CompanyProjectManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  
  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Get project data
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        const enrolledStudentsIds = projectData.enrolledStudents || [];

        if (enrolledStudentsIds.length > 0) {
          const studentsData = [];
          
          for (const studentId of enrolledStudentsIds) {
            console.log("Fetching student with ID:", studentId);
            
            // Get student profile
            const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
            
            // Get user document for email
            let email = '';
            try {
              const userDoc = await getDoc(doc(db, 'users', studentId));
              if (userDoc.exists()) {
                email = userDoc.data().email || '';
              }
            } catch (error) {
              console.error("Error fetching user email:", error);
            }
            
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              console.log("Raw student data for", studentId, ":", studentData);
              
              // Also fetch active project data to get progress
              let progress = 0;
              try {
                const activeProjectsQuery = query(
                  collection(db, 'activeProjects'),
                  where('studentId', '==', studentId),
                  where('projectId', '==', projectId)
                );
                const activeProjectsSnapshot = await getDocs(activeProjectsQuery);
                
                if (!activeProjectsSnapshot.empty) {
                  const activeProjectData = activeProjectsSnapshot.docs[0].data();
                  progress = activeProjectData.progress || 0;
                }
              } catch (error) {
                console.error("Error fetching active project data:", error);
              }
              
              studentsData.push({
                id: studentId,
                fullName: studentData.fullName || 'Student',
                displayName: studentData.fullName || 'Student', // Add display name for components that might use it
                photoURL: studentData.photoURL || '',
                email: email,
                major: studentData.major || 'Not specified',
                college: studentData.college || '',
                year: studentData.year || 'Not specified',
                bio: studentData.bio && studentData.bio !== '-' ? studentData.bio : 'No bio provided',
                skills: studentData.skills || [],
                progress: progress,
                ...studentData  // Keep all original data
              });
            } else {
              console.log("No student profile found for ID:", studentId);
              // Add a placeholder record
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
          }
          
          console.log("Final processed student data:", studentsData);
          setStudents(studentsData);
          
          // Set first student as active if none is selected
          if (studentsData.length > 0 && !activeStudent) {
            setActiveStudent(studentsData[0]);
          }
        }
        
        // Get deliverables
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
          if (a.dueDate && b.dueDate) {
            const aDate = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
            const bDate = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
            return aDate - bDate;
          }
          return 0;
        });
        
        setDeliverables(deliverablesData);
        
        // Get pending applications
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
            const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
            if (studentDoc.exists()) {
              return {
                ...app,
                studentProfile: { id: studentDoc.id, ...studentDoc.data() }
              };
            }
            return app;
          })
        );
        
        setPendingApplications(applicationsWithProfiles);
        
        // Get messages for active student
        if (activeStudent) {
          await fetchMessages(activeStudent.id);
        }
        
        // Get submissions
        await fetchSubmissions();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    if (projectId && currentUser) {
      fetchProjectData();
    }
  }, [projectId, currentUser]);
  
  // Fetch messages for a specific student
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
        if (a.timestamp && b.timestamp) {
          const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
          const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
          return aTime - bTime;
        }
        return 0;
      });
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Fetch submissions for all deliverables
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
    }
  };
  
  // Submit a message to a student
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
        content: `sent a message to ${activeStudent.fullName || 'Student'}`,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      await fetchMessages(activeStudent.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Add a new deliverable
  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    
    try {
      const deliverableData = {
        projectId,
        title: newDeliverable.title,
        description: newDeliverable.description,
        dueDate: newDeliverable.dueDate ? new Date(newDeliverable.dueDate) : null,
        points: parseInt(newDeliverable.points) || 10,
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
        content: `added a new deliverable: ${newDeliverable.title}`,
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
        if (a.dueDate && b.dueDate) {
          const aDate = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
          const bDate = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
          return aDate - bDate;
        }
        return 0;
      });
      
      setDeliverables(deliverablesData);
    } catch (error) {
      console.error('Error adding deliverable:', error);
    }
  };
  
  // Accept student application
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
        content: `accepted ${application.studentProfile?.fullName || 'student'}'s application`,
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
          const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
          if (studentDoc.exists()) {
            return {
              ...app,
              studentProfile: { id: studentDoc.id, ...studentDoc.data() }
            };
          }
          return app;
        })
      );
      
      setPendingApplications(applicationsWithProfiles);
      
      // Refresh project data
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      const projectData = { id: projectDoc.id, ...projectDoc.data() };
      setProject(projectData);
      
      // Refresh enrolled students
      const enrolledStudentsIds = projectData.enrolledStudents || [];
      
      if (enrolledStudentsIds.length > 0) {
        const studentsData = [];
        
        for (const studentId of enrolledStudentsIds) {
          const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
          if (studentDoc.exists()) {
            studentsData.push({ id: studentDoc.id, ...studentDoc.data() });
          }
        }
        
        setStudents(studentsData);
      }

      // Optional: Show success message
      alert(`${application.studentProfile?.fullName || 'Student'} has been accepted! They will see a congratulations modal when they visit their dashboard.`);
      
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Error accepting application. Please try again.');
    }
  };
  
  // Reject student application
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
          const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
          if (studentDoc.exists()) {
            return {
              ...app,
              studentProfile: { id: studentDoc.id, ...studentDoc.data() }
            };
          }
          return app;
        })
      );
      
      setPendingApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };
  
  // Provide feedback on a submission
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
        content: `provided feedback on submission for ${deliverables.find(d => d.id === deliverableId)?.title || 'deliverable'}`,
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
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date set';
    
    try {
      if (dateStr.seconds) {
        // Firestore timestamp
        return new Date(dateStr.seconds * 1000).toLocaleDateString();
      }
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };
  
  // Get student submissions
  const getStudentSubmissions = (studentId) => {
    return submissions.filter(submission => submission.studentId === studentId);
  };
  
  // Calculate student progress
  const calculateStudentProgress = (studentId) => {
    if (!deliverables.length) return 0;
    
    const studentSubmissions = getStudentSubmissions(studentId);
    const completedCount = studentSubmissions.filter(submission => 
      submission.status === 'approved'
    ).length;
    
    return Math.round((completedCount / deliverables.length) * 100);
  };
  
  // Get status class for styling
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
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ marginBottom: '5px' }}>{project?.title}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="feature-badge">{project?.category}</span>
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
            Students {students.length > 0 && `(${students.length})`}
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
            Deliverables {deliverables.length > 0 && `(${deliverables.length})`}
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
            Applications {pendingApplications.length > 0 && `(${pendingApplications.length})`}
          </button>
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Project Info</h3>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Status:</strong> {project?.status === 'open' ? 'Active' : project?.status}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Posted:</strong> {formatDate(project?.createdAt)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Duration:</strong> {project?.duration}
                </div>
                <div>
                  <strong>Compensation:</strong> {project?.isExperienceOnly ? 'Experience Only' : `${project?.compensation}`}
                </div>
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '10px' }}>Students</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
                  {students.length}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Active:</strong> {students.length}
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
                  {deliverables.length}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Completed:</strong> {deliverables.filter(d => d.status === 'completed').length}
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
                  {pendingApplications.length}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Pending Review:</strong> {pendingApplications.length}
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
              <p style={{ whiteSpace: 'pre-wrap' }}>{project?.description}</p>
              
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project?.skills?.map(skill => (
                    <span key={skill} className="feature-badge">{skill}</span>
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
                      if (a.submittedAt && b.submittedAt) {
                        const aTime = a.submittedAt.seconds ? a.submittedAt.seconds * 1000 : new Date(a.submittedAt).getTime();
                        const bTime = b.submittedAt.seconds ? b.submittedAt.seconds * 1000 : new Date(b.submittedAt).getTime();
                        return bTime - aTime; // Most recent first
                      }
                      return 0;
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
                              {student ? (student.fullName || 'Student') : 'Student'} - {deliverable?.title || 'Deliverable'}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              Submitted on {formatDate(submission.submittedAt)}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span className={`feature-badge ${getStatusClass(submission.status)}`}>
                              {submission.status}
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
                        {student.photoURL ? (
                          <img 
                            src={student.photoURL} 
                            alt={student.fullName || 'Student'} 
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
                            {student.fullName ? student.fullName.charAt(0) : 'S'}
                          </div>
                        )}
                        
                        <div style={{ flex: '1' }}>
                          <div style={{ fontWeight: '500' }}>
                            {student.fullName || 'Student'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            Progress: {student.progress || calculateStudentProgress(student.id) || 0}%
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
                      {activeStudent.photoURL ? (
                        <img 
                          src={activeStudent.photoURL} 
                          alt={activeStudent.fullName || 'Student'} 
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
                          {activeStudent.fullName ? activeStudent.fullName.charAt(0) : 'S'}
                        </div>
                      )}
                      
                      <div>
                        <h3 style={{ marginBottom: '5px' }}>{activeStudent.fullName || 'Student'}</h3>
                        <div>{activeStudent.college || activeStudent.university || 'Student'}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Email:</strong> {activeStudent.email || 'Not provided'}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Major:</strong> {activeStudent.major || 'Not specified'}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Year:</strong> {activeStudent.year || 'Not specified'}
                      </div>
                      <div>
                        <strong>Skills:</strong> {Array.isArray(activeStudent.skills) && activeStudent.skills.length > 0 
                          ? activeStudent.skills.join(', ') 
                          : 'None listed'}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Bio:</strong>
                      <p>{activeStudent.bio || 'No bio provided'}</p>
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
                            <span style={{ fontWeight: '500' }}>{deliverable.title}</span>
                            <span className={`feature-badge ${getStatusClass(submission?.status || deliverable.status)}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                              {submission?.status || deliverable.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                            <span>Due: {formatDate(deliverable.dueDate)}</span>
                            <span>{deliverable.points} pts</span>
                          </div>
                          
                          {submission && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <strong>Submitted:</strong> {formatDate(submission.submittedAt)}
                              </div>
                              
                              {submission.content && (
                                <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                                  <strong>Notes:</strong> {submission.content}
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
                                  <strong>Feedback:</strong> {submission.feedback}
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
                              {message.content}
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
                        {deliverable.status}
                      </span>
                    </div>
                    
                    <h3>{deliverable.title}</h3>
                    <p>{deliverable.description}</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Due Date:</span>
                        <span>{formatDate(deliverable.dueDate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Points:</span>
                        <span>{deliverable.points}</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Submitted:</span>
                        <span>
                          {submissions.filter(s => s.deliverableId === deliverable.id).length} / {students.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Completed:</span>
                        <span>
                          {submissions.filter(s => s.deliverableId === deliverable.id && s.status === 'approved').length} / {students.length}
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
                        {application.studentProfile?.fullName ? application.studentProfile.fullName.charAt(0) : 'S'}
                      </div>
                      
                      <div>
                        <h4 style={{ marginBottom: '5px' }}>
                          {application.studentProfile?.fullName || 'Student'}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {application.studentProfile?.university || 'Student'} - {application.studentProfile?.major || 'Not specified'}
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
                        {application.coverLetter}
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Availability:</strong> {application.availability}
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