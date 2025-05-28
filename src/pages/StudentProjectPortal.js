// src/pages/StudentProjectPortal.js - Redesigned with Company Management Layout Pattern
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const StudentProjectPortal = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State management
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [activeDeliverable, setActiveDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [submission, setSubmission] = useState({ content: '', file: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewResource, setPreviewResource] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all project data
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
        
        // Get company data
        const companyDoc = await getDoc(doc(db, 'companyProfiles', projectData.companyId));
        if (companyDoc.exists()) {
          setCompany({ id: companyDoc.id, ...companyDoc.data() });
        }
        
        // Get deliverables and sort by due date
        const deliverablesQuery = query(
          collection(db, 'deliverables'),
          where('projectId', '==', projectId)
        );
        
        const deliverablesSnapshot = await getDocs(deliverablesQuery);
        const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by due date (earliest first)
        deliverablesData.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            const dateA = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
            const dateB = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
            return dateA - dateB;
          }
          return 0;
        });
        
        setDeliverables(deliverablesData);
        
        // Set active deliverable to the next pending/in-progress task
        const nextDeliverable = deliverablesData.find(d => 
          d.status === 'pending' || d.status === 'in-progress'
        ) || deliverablesData[0];
        
        setActiveDeliverable(nextDeliverable);
        
        // Get messages
        const messagesQuery = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        messagesData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return aTime - bTime;
          }
          return 0;
        });
        
        setMessages(messagesData);
        
        // Get resources
        const resourcesQuery = query(
          collection(db, 'projectResources'),
          where('projectId', '==', projectId)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setResources(resourcesData);
        
        // Get activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('projectId', '==', projectId)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        activitiesData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return bTime - aTime;
          }
          return 0;
        });
        
        setActivities(activitiesData);
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

  // Message handling
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const messageData = {
        projectId,
        senderId: currentUser.uid,
        senderType: 'student',
        content: newMessage,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      await addDoc(collection(db, 'messages'), messageData);
      
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'student',
        activityType: 'message',
        content: 'sent a message',
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      
      // Refresh messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('projectId', '==', projectId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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
      console.error('Error sending message:', error);
    }
  };

  // File handling
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSubmission({
        ...submission,
        file: e.target.files[0]
      });
    }
  };
  
  // Deliverable submission
  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    
    if (!activeDeliverable) return;
    
    try {
      setIsSubmitting(true);
      
      let fileUrl = '';
      
      if (submission.file) {
        const storageRef = ref(storage, `submissions/${projectId}/${activeDeliverable.id}/${currentUser.uid}_${Date.now()}_${submission.file.name}`);
        await uploadBytes(storageRef, submission.file);
        fileUrl = await getDownloadURL(storageRef);
      }
      
      const submissionData = {
        deliverableId: activeDeliverable.id,
        projectId,
        studentId: currentUser.uid,
        content: submission.content,
        fileUrl: fileUrl || '',
        submittedAt: serverTimestamp(),
        status: 'submitted',
        feedback: ''
      };
      
      await addDoc(collection(db, 'submissions'), submissionData);
      
      await updateDoc(doc(db, 'deliverables', activeDeliverable.id), {
        status: 'submitted',
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'student',
        activityType: 'submission',
        content: `submitted deliverable: ${activeDeliverable.title}`,
        timestamp: serverTimestamp()
      });
      
      setSubmission({ content: '', file: null });
      
      const updatedDeliverable = { ...activeDeliverable, status: 'submitted' };
      setActiveDeliverable(updatedDeliverable);
      
      const updatedDeliverables = deliverables.map(d => 
        d.id === activeDeliverable.id ? updatedDeliverable : d
      );
      
      setDeliverables(updatedDeliverables);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      setIsSubmitting(false);
    }
  };

  // Resource click handler with preview
  const handleResourceClick = (resource) => {
    setPreviewResource(resource);
    setShowPreview(true);
  };

  // Close preview
  const closePreview = () => {
    setShowPreview(false);
    setPreviewResource(null);
  };

  // Direct download
  const handleDirectDownload = (resource, e) => {
    e.stopPropagation();
    if (resource.resourceType === 'link' || resource.url) {
      window.open(resource.url || resource.fileUrl, '_blank');
    } else if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    }
  };

  // Render preview content
  const renderPreview = () => {
    if (!previewResource) return null;
    
    const { resourceType, fileUrl, fileType, title } = previewResource;
    
    if (resourceType === 'link') {
      return (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p>External link: <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a></p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Open Link
          </a>
        </div>
      );
    }
    
    if (!fileType) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <p>Preview not available for this file type.</p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Download File
          </a>
        </div>
      );
    }
    
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return (
        <iframe 
          src={`${fileUrl}#toolbar=0&navpanes=0`}
          title={title}
          width="100%"
          height="500px"
          style={{ border: 'none' }}
        />
      );
    }
    
    if (type.includes('image')) {
      return (
        <img 
          src={fileUrl} 
          alt={title} 
          style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
        />
      );
    }
    
    if (type.includes('video')) {
      return (
        <video 
          src={fileUrl} 
          controls 
          style={{ maxWidth: '100%', maxHeight: '500px' }}
        />
      );
    }
    
    if (type.includes('audio')) {
      return (
        <audio 
          src={fileUrl} 
          controls 
          style={{ width: '100%' }}
        />
      );
    }
    
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px' }}>
        <p>Preview not available for this file type.</p>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          style={{ marginTop: '20px' }}
        >
          Download File
        </a>
      </div>
    );
  };

  // Utility functions
  const calculateProgress = () => {
    if (!deliverables.length) return 0;
    
    const completedCount = deliverables.filter(d => 
      d.status === 'completed' || d.status === 'approved'
    ).length;
    
    return Math.round((completedCount / deliverables.length) * 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date set';
    
    try {
      if (dateStr.seconds) {
        return new Date(dateStr.seconds * 1000).toLocaleDateString();
      }
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const getResourceIcon = (resource) => {
    if (resource.resourceType === 'link') return '🔗';
    if (!resource.fileType) return '📄';
    
    const type = resource.fileType.toLowerCase();
    if (type.includes('pdf')) return '📕';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎬';
    if (type.includes('word') || type.includes('doc')) return '📘';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📄';
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

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (dueDate, status) => {
    if (status === 'completed' || status === 'approved') {
      return {
        text: 'Completed',
        style: { color: 'var(--success)' }
      };
    }

    const daysRemaining = getDaysUntilDue(dueDate);
    
    if (daysRemaining < 0) {
      return {
        text: 'Missing',
        style: { color: 'var(--danger)', fontWeight: '600' }
      };
    }
    
    if (daysRemaining === 0) {
      return {
        text: 'Due Today',
        style: { color: 'var(--warning)', fontWeight: '600' }
      };
    }
    
    if (daysRemaining <= 2) {
      return {
        text: `${daysRemaining} days remaining`,
        style: { color: 'var(--danger)' }
      };
    }
    
    if (daysRemaining <= 7) {
      return {
        text: `${daysRemaining} days remaining`,
        style: { color: 'var(--warning)' }
      };
    }
    
    return {
      text: `${daysRemaining} days remaining`,
      style: { color: '#666' }
    };
  };

  return (
    <div className="project-portal">
      <Navigation />
      <div className="portal-content">
        {loading ? (
          <div className="loading-state">Loading project details...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <>
            <div className="project-header">
              <div className="container">
                <h1>{project?.title}</h1>
                <div className="project-meta">
                  <span>{project?.category} • With {company?.companyName} • {project?.duration}</span>
                </div>
                <Link to="/student/dashboard" className="back-button">
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Main Tab Navigation */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '30px' }}>
              <div style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                <div style={{ display: 'flex' }}>
                  <button 
                    onClick={() => setActiveTab('overview')} 
                    style={{ 
                      flex: '1', 
                      padding: '15px', 
                      background: activeTab === 'overview' ? '#f5f7ff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : 'none',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'overview' ? '600' : '400',
                      color: activeTab === 'overview' ? 'var(--primary)' : 'inherit'
                    }}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('assignments')} 
                    style={{ 
                      flex: '1', 
                      padding: '15px', 
                      background: activeTab === 'assignments' ? '#f5f7ff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'assignments' ? '3px solid var(--primary)' : 'none',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'assignments' ? '600' : '400',
                      color: activeTab === 'assignments' ? 'var(--primary)' : 'inherit'
                    }}
                  >
                    Assignments
                  </button>
                  <button 
                    onClick={() => setActiveTab('resources')} 
                    style={{ 
                      flex: '1', 
                      padding: '15px', 
                      background: activeTab === 'resources' ? '#f5f7ff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'resources' ? '3px solid var(--primary)' : 'none',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'resources' ? '600' : '400',
                      color: activeTab === 'resources' ? 'var(--primary)' : 'inherit'
                    }}
                  >
                    Resources
                  </button>
                  <button 
                    onClick={() => setActiveTab('messages')} 
                    style={{ 
                      flex: '1', 
                      padding: '15px', 
                      background: activeTab === 'messages' ? '#f5f7ff' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'messages' ? '3px solid var(--primary)' : 'none',
                      cursor: 'pointer',
                      fontWeight: activeTab === 'messages' ? '600' : '400',
                      color: activeTab === 'messages' ? 'var(--primary)' : 'inherit'
                    }}
                  >
                    Messages
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '30px' }}>
                {/* Overview Tab - SIMPLIFIED */}
                {activeTab === 'overview' && (
                  <div>
                    {/* Progress Overview */}
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '15px' }}>Project Progress</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Overall Progress</h4>
                          <p style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>{calculateProgress()}%</p>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${calculateProgress()}%`, 
                                background: 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease'
                              }}
                            ></div>
                          </div>
                        </div>

                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Assignments</h4>
                          <p style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>{deliverables.length}</p>
                          <p style={{ color: '#666', fontSize: '14px' }}> In total </p>
                        </div>

                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Completed</h4>
                          <p style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>
                            {deliverables.filter(d => d.status === 'completed' || d.status === 'approved').length}
                          </p>
                          <p style={{ color: '#666', fontSize: '14px' }}>Assignments done</p>
                        </div>
                      </div>
                    </div>

                    {/* Project Description */}
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '15px' }}>Project Description</h3>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{project?.description}</p>
                      
                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Required Skills</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {project?.skills?.map(skill => (
                            <span key={skill} className="feature-badge">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div>
                      <h3 style={{ marginBottom: '15px' }}>Project Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Duration</h4>
                          <p>{project?.duration}</p>
                        </div>
                        
                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Compensation</h4>
                          <p>{project?.isExperienceOnly ? 'Experience Only' : `$${project?.compensation}`}</p>
                        </div>
                        
                        <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Company</h4>
                          <p>{company?.companyName || 'Company'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3>Project Assignments</h3>
                      <span style={{ color: '#666' }}>{deliverables.length} total</span>
                    </div>

                    {deliverables.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p>No assignments have been created yet.</p>
                      </div>
                    ) : (
                      <div>
                        {deliverables.map((deliverable, index) => (
                          <div key={deliverable.id} style={{ 
                            padding: '25px', 
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            marginBottom: '20px',
                            background: 'white'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                              <div>
                                <h4 style={{ marginBottom: '5px' }}>{deliverable.title}</h4>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                  Due: {formatDate(deliverable.dueDate)}
                                  {getDaysUntilDue(deliverable.dueDate) !== null && (
                                    <span style={getDeadlineStatus(deliverable.dueDate, deliverable.status).style}>
                                      {' '}({getDeadlineStatus(deliverable.dueDate, deliverable.status).text})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`feature-badge ${getStatusClass(deliverable.status)}`}>
                                {deliverable.status}
                              </span>
                            </div>
                            
                            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                              {deliverable.description}
                            </p>
                            
                            {deliverable === activeDeliverable && 
                             (deliverable.status === 'pending' || deliverable.status === 'in-progress' || deliverable.status === 'rejected') && (
                              <div style={{ 
                                marginTop: '20px',
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <h5 style={{ marginBottom: '15px' }}>Submit Assignment</h5>
                                
                                <form onSubmit={handleSubmitDeliverable}>
                                  <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                      Submission Notes
                                    </label>
                                    <textarea 
                                      value={submission.content}
                                      onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
                                      style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        borderRadius: '8px', 
                                        border: '1px solid #ddd', 
                                        minHeight: '100px'
                                      }}
                                      placeholder="Describe your submission and any challenges you faced..."
                                    />
                                  </div>
                                  
                                  <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                      Upload File (optional)
                                    </label>
                                    <input 
                                      type="file" 
                                      onChange={handleFileChange}
                                      style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '8px'
                                      }}
                                    />
                                    {submission.file && (
                                      <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--success)' }}>
                                        ✓ Selected: {submission.file.name}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                  >
                                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                  </button>
                                </form>
                              </div>
                            )}
                            
                            {deliverable.status === 'submitted' && (
                              <div style={{ 
                                marginTop: '15px',
                                padding: '15px',
                                background: 'rgba(108, 99, 255, 0.1)',
                                borderRadius: '8px',
                                color: 'var(--primary)'
                              }}>
                                <p style={{ fontWeight: '500', marginBottom: '5px' }}>Submitted for Review</p>
                                <p>Your assignment has been submitted and is being reviewed by your mentor.</p>
                              </div>
                            )}
                            
                            {(deliverable.status === 'completed' || deliverable.status === 'approved') && (
                              <div style={{ 
                                marginTop: '15px',
                                padding: '15px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                borderRadius: '8px',
                                color: 'var(--success)'
                              }}>
                                <p style={{ fontWeight: '500', marginBottom: '5px' }}>Assignment Approved!</p>
                                {deliverable.feedback && (
                                  <div>
                                    <p style={{ fontWeight: '500', marginTop: '10px' }}>Feedback:</p>
                                    <p>{deliverable.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {deliverable !== activeDeliverable && 
                             (deliverable.status === 'pending' || deliverable.status === 'in-progress') && (
                              <button 
                                onClick={() => setActiveDeliverable(deliverable)}
                                className="btn btn-outline"
                                style={{ marginTop: '15px' }}
                              >
                                Work on This Assignment
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resources Tab - SIMPLIFIED */}
                {activeTab === 'resources' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3>Project Resources</h3>
                      <span style={{ color: '#666' }}>{resources.length} available</span>
                    </div>

                    {resources.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                        <h4>No resources available yet</h4>
                        <p style={{ marginTop: '15px' }}>Your mentor will share project resources here when they become available.</p>
                      </div>
                    ) : (
                      <div>
                        {resources.map((resource, index) => (
                          <div key={resource.id} style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            padding: '25px', 
                            background: index % 2 === 0 ? '#f5f7ff' : 'white', 
                            borderRadius: '8px',
                            marginBottom: '15px',
                            border: '1px solid #eee',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          >
                            <div style={{ marginRight: '20px', fontSize: '32px' }}>
                              {getResourceIcon(resource)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ marginBottom: '5px' }}>{resource.title}</h4>
                              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ color: '#666', fontSize: '14px' }}>
                                  Added: {formatDate(resource.uploadedAt)}
                                </span>
                                <span className="feature-badge">
                                  {resource.resourceType === 'link' ? 'External Link' : 'Document'}
                                </span>
                              </div>
                              {resource.description && (
                                <p style={{ margin: '0', color: '#666' }}>
                                  {resource.description.length > 150 ? 
                                    `${resource.description.substring(0, 150)}...` : 
                                    resource.description
                                  }
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={() => handleResourceClick(resource)}
                                className="btn btn-outline"
                                style={{ padding: '8px 15px' }}
                              >
                                Preview
                              </button>
                              <button 
                                onClick={(e) => handleDirectDownload(resource, e)}
                                className="btn btn-primary"
                                style={{ padding: '8px 15px' }}
                              >
                                {resource.resourceType === 'link' ? 'Open Link' : 'Download'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <div>
                    <h3 style={{ marginBottom: '20px' }}>Messages with {company?.companyName || 'Mentor'}</h3>
                    
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
                        <h4>No messages yet</h4>
                        <p style={{ marginTop: '15px' }}>Start a conversation with your mentor using the message form below.</p>
                      </div>
                    ) : (
                      <div style={{ 
                        maxHeight: '400px',
                        overflowY: 'auto', 
                        marginBottom: '20px',
                        border: '1px solid #f1f5f9',
                        borderRadius: '8px',
                        padding: '20px',
                        background: '#f8fafc'
                      }}>
                        {messages.map(message => (
                          <div 
                            key={message.id} 
                            style={{ 
                              marginBottom: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: message.senderType === 'student' ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ 
                              background: message.senderType === 'student' ? 'var(--primary)' : 'white',
                              color: message.senderType === 'student' ? 'white' : 'var(--dark)',
                              padding: '12px 16px',
                              borderRadius: '16px',
                              maxWidth: '70%',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              border: message.senderType === 'student' ? 'none' : '1px solid #e2e8f0'
                            }}>
                              {message.content}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              marginTop: '6px',
                              padding: '0 8px'
                            }}>
                              {message.timestamp ? formatDate(message.timestamp) + ' ' + 
                                new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                'Just now'
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ 
                      background: 'white', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      boxShadow: '0 5px 15px rgba(0,0,0,0.05)' 
                    }}>
                      <h4 style={{ marginBottom: '15px' }}>Send Message</h4>
                      <form onSubmit={handleSubmitMessage}>
                        <div style={{ marginBottom: '15px' }}>
                          <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message to your mentor..."
                            style={{ 
                              width: '100%',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #ddd',
                              minHeight: '100px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="btn btn-primary"
                        >
                          Send Message
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Resource Preview Modal */}
            {showPreview && previewResource && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  width: '90%',
                  maxWidth: '900px',
                  maxHeight: '80vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3>{previewResource.title}</h3>
                    <button 
                      onClick={closePreview}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        fontSize: '24px',
                        cursor: 'pointer' 
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
                    {renderPreview()}
                  </div>
                  <div style={{ 
                    padding: '15px 20px', 
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                  }}>
                    <button 
                      onClick={closePreview}
                      className="btn btn-outline"
                    >
                      Close
                    </button>
                    <a 
                      href={previewResource.fileUrl || previewResource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      {previewResource.resourceType === 'link' ? 'Open Link' : 'Download'}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .project-portal {
          min-height: 100vh;
          background: var(--background);
        }

        .portal-content {
          padding-top: 84px; /* nav height (64px) + 20px padding */
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
          padding-bottom: 40px;
        }
      `}</style>
    </div>
  );
};

export default StudentProjectPortal;