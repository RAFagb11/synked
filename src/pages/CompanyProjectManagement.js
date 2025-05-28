// src/pages/CompanyProjectManagement.js - COMPLETE WITH RESOURCES TAB
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import ResourceCard from '../components/ResourceCard';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { acceptApplication, getProjectApplications } from '../services/applicationService';
import { NotificationContext } from '../contexts/NotificationContext';
import { Timestamp } from 'firebase/firestore';

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
  const { createNotification } = useContext(NotificationContext);
  
  const [project, setProject] = useState(null);
  const [students, setStudents] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [resources, setResources] = useState([]);
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
  
  // Resource upload states
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState('document');
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceLink, setResourceLink] = useState('');
  const [uploadingResource, setUploadingResource] = useState(false);
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  // Format date
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
  
  // Get student submissions
  const getStudentSubmissions = (studentId) => {
    return submissions.filter(submission => submission.studentId === studentId);
  };
  
  // Calculate student progress
  const calculateStudentProgress = (studentId) => {
    const totalDeliverables = safeNumber(deliverables.length);
    if (totalDeliverables === 0) return 0;
    
    const studentSubmissions = submissions.filter(submission => submission.studentId === studentId);
    const completedCount = studentSubmissions.filter(submission => 
      submission.status === 'approved'
    ).length;
    
    return Math.round((safeNumber(completedCount) / totalDeliverables) * 100);
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
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        // Get enrolled students - COMPREHENSIVE FETCH INCLUDING PHOTOS
        const enrolledStudentIds = projectData.enrolledStudents || [];
        
        if (enrolledStudentIds.length > 0) {
          const studentsData = [];
          
          for (const studentId of enrolledStudentIds) {
            try {
              const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
              const userDoc = await getDoc(doc(db, 'users', studentId));
              
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                const email = userDoc.exists() ? userDoc.data().email : '';
                
                studentsData.push({
                  id: studentId,
                  // Name fields - check multiple possible formats
                  fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student',
                  firstName: studentData.firstName || studentData.fullName?.split(' ')[0] || 'Student',
                  lastName: studentData.lastName || studentData.fullName?.split(' ').slice(1).join(' ') || '',
                  
                  // Contact and academic info
                  email: email,
                  major: studentData.major || 'Not specified',
                  college: studentData.college || studentData.university || '',
                  year: studentData.year || studentData.graduation || 'Not specified',
                  
                  // Profile content
                  photoURL: studentData.photoURL || '',
                  bio: studentData.bio || 'No bio provided',
                  skills: studentData.skills || [],
                  
                  // Include all original data
                  ...studentData
                });
              }
            } catch (error) {
              console.error(`Error fetching student ${studentId}:`, error);
            }
          }
          
          setStudents(studentsData);
          if (studentsData.length > 0) {
            setActiveStudent(studentsData[0]);
          }
        }
        
        // Get pending applications with student profiles
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
                const studentData = studentDoc.data();
                return {
                  ...app,
                  studentProfile: { 
                    id: studentDoc.id, 
                    ...studentData,
                    fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student'
                  }
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
        
        // Get submissions
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
        
        // Get project resources
        const resourcesQuery = query(
          collection(db, 'projectResources'),
          where('projectId', '==', projectId)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort resources by uploadedAt (newest first)
        resourcesData.sort((a, b) => {
          if (a.uploadedAt && b.uploadedAt) {
            const aTime = a.uploadedAt.seconds ? a.uploadedAt.seconds * 1000 : new Date(a.uploadedAt).getTime();
            const bTime = b.uploadedAt.seconds ? b.uploadedAt.seconds * 1000 : new Date(b.uploadedAt).getTime();
            return bTime - aTime;
          }
          return 0;
        });
        
        setResources(resourcesData);
        
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
  
  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================
  
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
        content: `sent a message to ${safeString(activeStudent.fullName || activeStudent.firstName, 'Student')}`,
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
  
  // Add a new deliverable
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

      // Notify all students in the project
      for (const student of students) {
        await createNotification(
          student.id,
          'New Assignment',
          `A new assignment "${deliverableData.title}" has been added to your project.`,
          'assignment'
        );
      }

    } catch (error) {
      console.error('Error adding deliverable:', error);
    }
  };
  
  // =============================================================================
  // FEEDBACK HANDLING
  // =============================================================================
  
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
        content: `provided feedback on submission for ${safeString(
          deliverables.find(d => d.id === deliverableId)?.title, 'deliverable'
        )}`,
        timestamp: serverTimestamp()
      });
      
      // Refresh submissions
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
  // RESOURCE HANDLING
  // =============================================================================
  
  const handleResourceFileChange = (e) => {
    if (e.target.files[0]) {
      setResourceFile(e.target.files[0]);
    }
  };
  
  const handleUploadResource = async (e) => {
    e.preventDefault();
    
    if (resourceType !== 'link' && !resourceFile) {
      alert('Please select a file to upload');
      return;
    }
    
    if (resourceType === 'link' && !resourceLink) {
      alert('Please enter a valid URL');
      return;
    }
    
    try {
      setUploadingResource(true);
      
      let resourceUrl = '';
      let fileName = '';
      let fileType = '';
      let fileSize = 0;
      
      if (resourceType === 'link') {
        resourceUrl = resourceLink;
      } else {
        // Upload file to storage
        const fileRef = ref(storage, `projects/${projectId}/resources/${Date.now()}_${resourceFile.name}`);
        await uploadBytes(fileRef, resourceFile);
        resourceUrl = await getDownloadURL(fileRef);
        fileName = resourceFile.name;
        fileType = resourceFile.type;
        fileSize = resourceFile.size;
      }
      
      // Create resource document with format matching ResourceCard expectations
      const resourceData = {
        projectId,
        title: resourceTitle,
        description: resourceDescription,
        resourceType: resourceType,
        url: resourceUrl,
        fileUrl: resourceUrl, // For compatibility with ResourceCard
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        uploadedBy: currentUser.displayName || 'Company Admin',
        uploadedById: currentUser.uid,
        uploadedAt: serverTimestamp()
      };
      
      const resourceRef = await addDoc(collection(db, 'projectResources'), resourceData);
      
      // Add to local state immediately
      setResources([
        { 
          id: resourceRef.id, 
          ...resourceData, 
          uploadedAt: { seconds: Math.floor(Date.now() / 1000) } 
        },
        ...resources
      ]);
      
      // Create activity record
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        activityType: 'resource',
        content: `uploaded a new resource: ${resourceTitle}`,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      setResourceTitle('');
      setResourceDescription('');
      setResourceType('document');
      setResourceFile(null);
      setResourceLink('');
      setUploadingResource(false);
      setShowResourceForm(false);
      
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource: ' + error.message);
      setUploadingResource(false);
    }
  };
  
  const handleDeleteResource = async (resourceId, resourceUrl) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'projectResources', resourceId));
      
      // Delete from Storage if it's not a link
      if (resourceUrl && !resourceUrl.startsWith('http')) {
        try {
          const fileRef = ref(storage, resourceUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.log('Could not delete from storage:', storageError);
        }
      }
      
      // Update local state
      setResources(resources.filter(r => r.id !== resourceId));
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'company',
        activityType: 'resource',
        content: 'deleted a resource',
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource: ' + error.message);
    }
  };
  
  // =============================================================================
  // APPLICATION HANDLING
  // =============================================================================
  
  // Accept student application
  const handleAcceptApplication = async (application) => {
    try {
      // Update application status with modal trigger fields
      await updateDoc(doc(db, 'applications', application.id), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(), // ← Triggers modal
        modalShown: false,                    // ← Ensures modal shows
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
        content: `accepted ${safeString(
          application.studentProfile?.fullName || 
          application.studentName || 
          'student'
        )}'s application`,
        timestamp: serverTimestamp()
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
              const studentData = studentDoc.data();
              return {
                ...app,
                studentProfile: { 
                  id: studentDoc.id, 
                  ...studentData,
                  fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student'
                }
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
      
      // Refresh project data and enrolled students
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        // Refresh enrolled students list
        const enrolledStudentIds = projectData.enrolledStudents || [];
        
        if (enrolledStudentIds.length > 0) {
          const studentsData = [];
          
          for (const studentId of enrolledStudentIds) {
            try {
              const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
              const userDoc = await getDoc(doc(db, 'users', studentId));
              
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                const email = userDoc.exists() ? userDoc.data().email : '';
                
                studentsData.push({
                  id: studentId,
                  fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student',
                  firstName: studentData.firstName || studentData.fullName?.split(' ')[0] || 'Student',
                  lastName: studentData.lastName || studentData.fullName?.split(' ').slice(1).join(' ') || '',
                  email: email,
                  major: studentData.major || 'Not specified',
                  college: studentData.college || studentData.university || '',
                  year: studentData.year || studentData.graduation || 'Not specified',
                  photoURL: studentData.photoURL || '',
                  bio: studentData.bio || 'No bio provided',
                  skills: studentData.skills || [],
                  ...studentData
                });
              }
            } catch (error) {
              console.error(`Error fetching student ${studentId}:`, error);
            }
          }
          
          setStudents(studentsData);
        }
      }
      
      alert(`${safeString(
        application.studentProfile?.fullName || 
        application.studentName || 
        'Student'
      )} has been accepted! They will see a congratulations modal when they visit their dashboard.`);
      
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
          try {
            const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              return {
                ...app,
                studentProfile: { 
                  id: studentDoc.id, 
                  ...studentData,
                  fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student'
                }
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
  
  const handleSubmissionStatusUpdate = async (submissionId, newStatus, studentId) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Send notification to student
      const message = newStatus === 'approved' 
        ? 'Your assignment has been approved! Great work!' 
        : 'Your assignment needs some revisions. Please check the feedback.';

      await createNotification(
        studentId,
        'Assignment Update',
        message,
        'assignment'
      );

    } catch (error) {
      console.error('Error updating submission:', error);
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
            Students
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'resources' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'resources' ? '600' : '400',
              color: activeTab === 'resources' ? 'var(--primary)' : 'inherit'
            }}
          >
            Resources {resources.length > 0 && `(${safeNumber(resources.length)})`}
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
                  <strong>Compensation:</strong> {project?.isExperienceOnly ? 'Experience Only' : `$${safeNumber(project?.compensation)}`}
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
                <h3 style={{ marginBottom: '10px' }}>Resources</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
                  {safeNumber(resources.length)}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Total:</strong> {safeNumber(resources.length)}
                </div>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Manage Resources
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
          </div>
        )}
        
        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Project Resources</h3>
              <button 
                onClick={() => setShowResourceForm(!showResourceForm)}
                className="btn btn-primary"
              >
                {showResourceForm ? 'Cancel' : 'Add Resource'}
              </button>
            </div>
            
            {/* Resource Upload Form */}
            {showResourceForm && (
              <div style={{ 
                background: 'white', 
                padding: '25px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                marginBottom: '30px'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Add New Resource</h3>
                
                <form onSubmit={handleUploadResource}>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource Title</label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      placeholder="E.g. Project Brief, Tutorial Video, Reference Documentation"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description (Optional)</label>
                    <textarea
                      value={resourceDescription}
                      onChange={(e) => setResourceDescription(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                      placeholder="Provide additional context about this resource"
                    ></textarea>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource Type</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="link"
                          checked={resourceType === 'link'}
                          onChange={() => setResourceType('link')}
                          style={{ marginRight: '8px' }}
                        />
                        External Link
                      </label>
                    </div>
                  </div>
                  
                  {resourceType === 'link' ? (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>URL</label>
                      <input
                        type="url"
                        value={resourceLink}
                        onChange={(e) => setResourceLink(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        placeholder="https://example.com"
                      />
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        {resourceType === 'document' ? 'Upload Document' : 'Upload Video'}
                      </label>
                      <input
                        type="file"
                        onChange={handleResourceFileChange}
                        required
                        style={{ padding: '10px 0' }}
                        accept={resourceType === 'document' ? 
                          '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' : 
                          'video/*'}
                      />
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        {resourceType === 'document' ? 
                          'Accepted formats: PDF, Word, Excel, PowerPoint, Text' : 
                          'Accepted formats: MP4, MOV, AVI, etc.'}
                      </p>
                    </div>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={uploadingResource}
                    className="btn btn-primary"
                    style={{ minWidth: '150px' }}
                  >
                    {uploadingResource ? 'Uploading...' : 'Upload Resource'}
                  </button>
                </form>
              </div>
            )}
            
            {/* Resources List */}
            {resources.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📁</div>
                <h4 style={{ marginBottom: '10px' }}>No Resources Available</h4>
                <p>Upload project resources to share with your students.</p>
                <button 
                  onClick={() => setShowResourceForm(true)}
                  className="btn btn-outline"
                  style={{ marginTop: '15px' }}
                >
                  Add Your First Resource
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {resources.map(resource => (
                  <div key={resource.id} style={{ position: 'relative' }}>
                    <ResourceCard resource={resource} />
                    <button
                      onClick={() => handleDeleteResource(resource.id, resource.fileUrl)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(239, 68, 68, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        zIndex: 10
                      }}
                      title="Delete resource"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                        <div style={{ 
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: student.photoURL ? 'none' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '500',
                          color: student.photoURL ? 'transparent' : 'white'
                        }}>
                          {student.photoURL ? (
                            <img 
                              src={student.photoURL} 
                              alt={`${student.firstName} ${student.lastName}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <>
                              {student.firstName?.charAt(0) || 'S'}{student.lastName?.charAt(0) || ''}
                            </>
                          )}
                        </div>
                        <div style={{ flex: '1' }}>
                          <div style={{ fontWeight: '500' }}>
                            {student.firstName} {student.lastName}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            Progress: {calculateStudentProgress(student.id)}%
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
                    <div style={{ 
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: activeStudent.photoURL ? 'none' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: '500',
                      color: activeStudent.photoURL ? 'transparent' : 'white'
                    }}>
                      {activeStudent.photoURL ? (
                        <img 
                          src={activeStudent.photoURL} 
                          alt={`${activeStudent.firstName} ${activeStudent.lastName}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <>
                          {activeStudent.firstName?.charAt(0) || 'S'}{activeStudent.lastName?.charAt(0) || ''}
                        </>
                      )}
                    </div>
                      <div>
                        <h3 style={{ marginBottom: '5px' }}>{activeStudent.firstName} {activeStudent.lastName}</h3>
                        <div>{activeStudent.university || 'Student'}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Email:</strong> {activeStudent.email}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Major:</strong> {activeStudent.major || 'Not specified'}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Year:</strong> {activeStudent.year || 'Not specified'}
                      </div>
                      <div>
                        <strong>Skills:</strong> {activeStudent.skills?.join(', ') || 'None listed'}
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
        
        {/* Applications Tab - Keep existing implementation */}
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
                      overflow: 'hidden',
                      background: application.studentProfile?.photoURL ? 'none' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '500',
                      color: application.studentProfile?.photoURL ? 'transparent' : 'white'
                    }}>
                      {application.studentProfile?.photoURL ? (
                        <img 
                          src={application.studentProfile.photoURL} 
                          alt={safeString(application.studentProfile.fullName, 'Student')} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        safeString(application.studentProfile.fullName, 'Student').charAt(0)
                      )}
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

export default CompanyProjectManagement