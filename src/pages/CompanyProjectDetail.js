// src/pages/CompanyProjectDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const CompanyProjectDetail = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [resources, setResources] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // For resource upload
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState('document');
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceLink, setResourceLink] = useState('');
  const [uploadingResource, setUploadingResource] = useState(false);
  
  // For messaging
  const [messageText, setMessageText] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [messageAll, setMessageAll] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Preview states
  const [previewResource, setPreviewResource] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Fetch project details
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
          
          // Extract applications from project
          const projectData = projectDoc.data();
          if (projectData.applicants) {
            setApplications(projectData.applicants);
          }
          
          // Fetch active students
          if (projectData.activeStudents) {
            const studentsData = [];
            for (const studentId of projectData.activeStudents) {
              const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
              if (studentDoc.exists()) {
                studentsData.push({ id: studentDoc.id, ...studentDoc.data() });
              }
            }
            setActiveStudents(studentsData);
          }
          
          // Fetch resources
          const resourcesQuery = query(
            collection(db, 'resources'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
          );
          const resourcesSnapshot = await getDocs(resourcesQuery);
          setResources(
            resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          
          // Fetch deliverables
          const deliverablesQuery = query(
            collection(db, 'deliverables'),
            where('projectId', '==', projectId),
            orderBy('dueDate', 'asc')
          );
          const deliverablesSnapshot = await getDocs(deliverablesQuery);
          setDeliverables(
            deliverablesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Error loading project data');
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
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
      
      if (resourceType === 'link') {
        resourceUrl = resourceLink;
      } else {
        // Upload file to storage
        const fileRef = ref(storage, `resources/${projectId}/${Date.now()}_${resourceFile.name}`);
        await uploadBytes(fileRef, resourceFile);
        resourceUrl = await getDownloadURL(fileRef);
      }
      
      // Create resource document
      const resourceData = {
        projectId,
        title: resourceTitle,
        description: resourceDescription,
        type: resourceType,
        url: resourceUrl,
        fileName: resourceType !== 'link' ? resourceFile.name : '',
        fileType: resourceType !== 'link' ? resourceFile.type : '',
        fileSize: resourceType !== 'link' ? resourceFile.size : 0,
        uploadedBy: currentUser.displayName || 'Company Admin',
        uploadedById: currentUser.uid,
        createdAt: serverTimestamp()
      };
      
      const resourceRef = await addDoc(collection(db, 'resources'), resourceData);
      
      // Add to local state
      setResources([
        { 
          id: resourceRef.id, 
          ...resourceData, 
          createdAt: { seconds: Math.floor(Date.now() / 1000) } 
        },
        ...resources
      ]);
      
      // Create activity record
      await addDoc(collection(db, 'activities'), {
        projectId,
        type: 'resource_added',
        description: `New resource added: ${resourceTitle}`,
        resourceId: resourceRef.id,
        userId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      setResourceTitle('');
      setResourceDescription('');
      setResourceType('document');
      setResourceFile(null);
      setResourceLink('');
      setUploadingResource(false);
      
      // Switch to resources tab
      setActiveTab('resources');
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource: ' + error.message);
      setUploadingResource(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      return;
    }
    
    try {
      setSendingMessage(true);
      
      const recipients = messageAll ? 
        activeStudents.map(student => student.id) : 
        selectedStudentIds;
      
      if (recipients.length === 0) {
        alert('Please select at least one student');
        setSendingMessage(false);
        return;
      }
      
      // Send message to each recipient
      for (const studentId of recipients) {
        await addDoc(collection(db, 'messages'), {
          projectId,
          text: messageText,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Company Admin',
          senderType: 'company',
          recipientId: studentId,
          recipientType: 'student',
          isGroupMessage: recipients.length > 1,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      
      // Create activity if it's a group message
      if (recipients.length > 1) {
        await addDoc(collection(db, 'activities'), {
          projectId,
          type: 'announcement',
          description: messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
          userId: currentUser.uid,
          timestamp: serverTimestamp()
        });
      }
      
      // Reset form
      setMessageText('');
      setSelectedStudentIds([]);
      setMessageAll(false);
      setSendingMessage(false);
      
      alert('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
      setSendingMessage(false);
    }
  };
  
  const handleStudentSelection = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };
  
  const handlePreviewResource = (resource) => {
    setPreviewResource(resource);
    setShowPreview(true);
  };
  
  const closePreview = () => {
    setShowPreview(false);
    setPreviewResource(null);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      // Firestore timestamp
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      // ISO string
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  // Function to render proper preview based on resource type
  const renderResourcePreview = () => {
    if (!previewResource) return null;
    
    const { type, url, title } = previewResource;
    
    switch (type) {
      case 'document':
        // Check if it's a PDF
        if (url.includes('.pdf') || previewResource.fileType === 'application/pdf') {
          return (
            <iframe 
              src={`${url}#toolbar=0`} 
              style={{ width: '100%', height: '500px', border: 'none' }}
              title={title}
            />
          );
        }
        // For other document types, show download link
        return (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p>Preview not available for this file type.</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Download File
            </a>
          </div>
        );
      
      case 'video':
        // Video preview
        return (
          <video 
            controls 
            style={{ width: '100%', maxHeight: '500px' }}
          >
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        );
      
      case 'link':
        // Embed link in iframe if possible
        return (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p>External link: <a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Open Link
            </a>
          </div>
        );
      
      default:
        return (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p>Preview not available</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Open Resource
            </a>
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="section-header">
            <h2>Loading project details...</h2>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="section-header">
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/company/dashboard')} 
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Back to Dashboard
            </button>
          </div>
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
            <h2>{project?.title}</h2>
            <p style={{ color: '#666' }}>
              {project?.category} • Posted on {formatDate(project?.createdAt)} • {project?.status}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/company/dashboard" className="btn btn-outline">
              Back to Dashboard
            </Link>
          </div>
        </div>
        
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
                onClick={() => setActiveTab('applications')} 
                style={{ 
                  flex: '1', 
                  padding: '15px', 
                  background: activeTab === 'applications' ? '#f5f7ff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'applications' ? '3px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'applications' ? '600' : '400',
                  color: activeTab === 'applications' ? 'var(--primary)' : 'inherit'
                }}
              >
                Applications
              </button>
              <button 
                onClick={() => setActiveTab('students')} 
                style={{ 
                  flex: '1', 
                  padding: '15px', 
                  background: activeTab === 'students' ? '#f5f7ff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'students' ? '600' : '400',
                  color: activeTab === 'students' ? 'var(--primary)' : 'inherit'
                }}
              >
                Active Students
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
                onClick={() => setActiveTab('deliverables')} 
                style={{ 
                  flex: '1', 
                  padding: '15px', 
                  background: activeTab === 'deliverables' ? '#f5f7ff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'deliverables' ? '3px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'deliverables' ? '600' : '400',
                  color: activeTab === 'deliverables' ? 'var(--primary)' : 'inherit'
                }}
              >
                Deliverables
              </button>
              <button 
                onClick={() => setActiveTab('messaging')} 
                style={{ 
                  flex: '1', 
                  padding: '15px', 
                  background: activeTab === 'messaging' ? '#f5f7ff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'messaging' ? '3px solid var(--primary)' : 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'messaging' ? '600' : '400',
                  color: activeTab === 'messaging' ? 'var(--primary)' : 'inherit'
                }}
              >
                Messaging
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: '30px' }}>
            {activeTab === 'overview' && (
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Project Description</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{project?.description}</p>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Skills Required</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {project?.skills?.map(skill => (
                      <span key={skill} className="feature-badge">{skill}</span>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Project Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Status</h4>
                      <p>
                        <span className="feature-badge" style={{ 
                          background: project?.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 
                                      project?.status === 'active' ? 'rgba(108, 99, 255, 0.1)' :
                                      'rgba(251, 191, 36, 0.1)',
                          color: project?.status === 'open' ? 'var(--success)' : 
                                 project?.status === 'active' ? 'var(--primary)' :
                                 'var(--warning)'
                        }}>
                          {project?.status === 'open' ? 'Open for Applications' : 
                           project?.status === 'active' ? 'In Progress' : 
                           'Completed'}
                        </span>
                      </p>
                    </div>
                    
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Duration</h4>
                      <p>{project?.duration}</p>
                    </div>
                    
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Compensation</h4>
                      <p>{project?.isExperienceOnly ? 'Experience Only' : `$${project?.compensation}`}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ marginBottom: '15px' }}>Project Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Applications</h4>
                      <p style={{ fontSize: '24px', fontWeight: '700' }}>{applications.length}</p>
                    </div>
                    
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Active Students</h4>
                      <p style={{ fontSize: '24px', fontWeight: '700' }}>{activeStudents.length}</p>
                    </div>
                    
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Resources</h4>
                      <p style={{ fontSize: '24px', fontWeight: '700' }}>{resources.length}</p>
                    </div>
                    
                    <div style={{ padding: '20px', background: '#f5f7ff', borderRadius: '8px', textAlign: 'center' }}>
                      <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Deliverables</h4>
                      <p style={{ fontSize: '24px', fontWeight: '700' }}>{deliverables.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'applications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Project Applications</h3>
                  <span style={{ color: '#666' }}>{applications.length} total</span>
                </div>
                
                {applications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>No applications received yet.</p>
                  </div>
                ) : (
                  <div>
                    {applications.map((application, index) => (
                      <div key={application.studentId} style={{ 
                        padding: '20px', 
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        marginBottom: '20px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ 
                              width: '60px', 
                              height: '60px', 
                              borderRadius: '50%', 
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {application.studentPhotoURL ? (
                                <img 
                                  src={application.studentPhotoURL} 
                                  alt={application.studentName || 'Student'} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  background: 'var(--primary)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '24px'
                                }}>
                                  {application.studentName ? application.studentName.charAt(0) : 'S'}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 style={{ marginBottom: '5px' }}>{application.studentName || `Student ${index + 1}`}</h4>
                              <p style={{ color: '#666', marginBottom: '10px' }}>
                                Applied: {formatDate(application.appliedAt)}
                              </p>
                              <p>Availability: {application.availability}</p>
                            </div>
                          </div>
                          <div>
                            <Link 
                              to={`/company/application/${projectId}/${application.studentId}`}
                              className="btn btn-primary"
                              style={{ marginLeft: '10px' }}
                            >
                              View Full Application
                            </Link>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f7ff', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px' }}>Cover Letter</h4>
                          <p>{application.coverLetter?.substring(0, 300)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Active Students</h3>
                  <span style={{ color: '#666' }}>{activeStudents.length} total</span>
                </div>
                
                {activeStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>No active students on this project yet.</p>
                    <p style={{ marginTop: '10px', color: '#666' }}>Accept applications to add students to the project.</p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                    gap: '20px' 
                  }}>
                    {activeStudents.map(student => (
                      <div key={student.id} style={{ 
                        padding: '20px', 
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                          <div style={{ 
                            width: '70px', 
                            height: '70px', 
                            borderRadius: '50%', 
                            overflow: 'hidden',
                            marginRight: '15px',
                            flexShrink: 0
                          }}>
                            {student.photoURL ? (
                              <img 
                                src={student.photoURL} 
                                alt={`${student.firstName} ${student.lastName}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}>
                                {student.firstName ? student.firstName.charAt(0) : 'S'}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 style={{ marginBottom: '5px' }}>{student.firstName} {student.lastName}</h4>
                            <p style={{ color: '#666' }}>{student.college}</p>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '15px', flex: 1 }}>
                          <p style={{ marginBottom: '10px' }}><strong>Major:</strong> {student.major}</p>
                          <p><strong>Skills:</strong></p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                            {student.skills?.slice(0, 4).map(skill => (
                              <span key={skill} className="feature-badge">{skill}</span>
                            ))}
                            {student.skills?.length > 4 && (
                              <span className="feature-badge">+{student.skills.length - 4} more</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                          <Link 
                            to={`/company/student/${student.id}`}
                            className="btn btn-outline"
                            style={{ flex: 1, textAlign: 'center' }}
                          >
                            View Profile
                          </Link>
                          <Link 
                            to={`/company/messages/${projectId}/${student.id}`}
                            className="btn btn-primary"
                            style={{ flex: 1, textAlign: 'center' }}
                          >
                            Message
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'resources' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Project Resources</h3>
                  <button
                    onClick={() => setActiveTab('add-resource')}
                    className="btn btn-primary"
                  >
                    Add New Resource
                  </button>
                </div>
                
                {resources.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>No resources added yet.</p>
                    <button
                      onClick={() => setActiveTab('add-resource')}
                      className="btn btn-outline"
                      style={{ marginTop: '15px' }}
                    >
                      Add Your First Resource
                    </button>
                  </div>
                ) : (
                  <div>
                    {resources.map((resource, index) => (
                      <div key={resource.id} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px', 
                        background: index % 2 === 0 ? '#f5f7ff' : 'white', 
                        borderRadius: '8px',
                        marginBottom: '15px',
                        border: '1px solid #eee'
                      }}>
                        <div style={{ marginRight: '20px', fontSize: '30px' }}>
                          {resource.type === 'document' ? '📄' : 
                           resource.type === 'video' ? '🎬' : 
                           resource.type === 'link' ? '🔗' : '📦'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ marginBottom: '5px' }}>{resource.title}</h4>
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ color: '#666', fontSize: '14px' }}>
                              Added: {formatDate(resource.createdAt)}
                            </span>
                            <span className="feature-badge">
                              {resource.type === 'document' ? 'Document' : 
                               resource.type === 'video' ? 'Video' : 
                               'External Link'}
                            </span>
                          </div>
                          {resource.description && (
                            <p>{resource.description}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => handlePreviewResource(resource)}
                            className="btn btn-outline"
                            style={{ padding: '8px 15px' }}
                          >
                            Preview
                          </button>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '8px 15px' }}
                          >
                            {resource.type === 'link' ? 'Visit Link' : 'Download'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'add-resource' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Add New Resource</h3>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className="btn btn-outline"
                  >
                    Back to Resources
                  </button>
                </div>
                
                <form onSubmit={handleUploadResource}>
                  <div className="form-group" style={{ marginBottom: '25px' }}>
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
                  
                  <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description (Optional)</label>
                    <textarea
                      value={resourceDescription}
                      onChange={(e) => setResourceDescription(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                      placeholder="Provide additional context about this resource"
                    ></textarea>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource Type</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="document"
                          checked={resourceType === 'document'}
                          onChange={() => setResourceType('document')}
                          style={{ marginRight: '8px' }}
                        />
                        Document
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          value="video"
                          checked={resourceType === 'video'}
                          onChange={() => setResourceType('video')}
                          style={{ marginRight: '8px' }}
                        />
                        Video
                      </label>
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
                    <div className="form-group" style={{ marginBottom: '25px' }}>
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
                    <div className="form-group" style={{ marginBottom: '25px' }}>
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
            
            {activeTab === 'deliverables' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Project Deliverables</h3>
                  <Link to={`/company/add-deliverable/${projectId}`} className="btn btn-primary">
                    Add New Deliverable
                  </Link>
                </div>
                
                {deliverables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>No deliverables have been added yet.</p>
                    <Link 
                      to={`/company/add-deliverable/${projectId}`}
                      className="btn btn-outline"
                      style={{ marginTop: '15px' }}
                    >
                      Add Your First Deliverable
                    </Link>
                  </div>
                ) : (
                  <div>
                    {deliverables.map((deliverable, index) => (
                      <div key={deliverable.id} style={{ 
                        padding: '20px', 
                        background: index % 2 === 0 ? '#f5f7ff' : 'white', 
                        borderRadius: '8px',
                        marginBottom: '15px',
                        border: '1px solid #eee'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ marginBottom: '10px' }}>{deliverable.title}</h4>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                                <span style={{ marginRight: '5px' }}>📅</span> Due: {formatDate(deliverable.dueDate)}
                              </span>
                              <span className="feature-badge" style={{ 
                                background: 
                                  deliverable.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 
                                  deliverable.status === 'in_progress' ? 'rgba(108, 99, 255, 0.1)' : 
                                  'rgba(251, 191, 36, 0.1)',
                                color:
                                  deliverable.status === 'completed' ? 'var(--success)' : 
                                  deliverable.status === 'in_progress' ? 'var(--primary)' : 
                                  'var(--warning)'
                              }}>
                                {deliverable.status === 'completed' ? 'Completed' : 
                                 deliverable.status === 'in_progress' ? 'In Progress' : 
                                 'Not Started'}
                              </span>
                            </div>
                            <p>{deliverable.description}</p>
                          </div>
                          <div>
                            <Link 
                              to={`/company/deliverable/${deliverable.id}`}
                              className="btn btn-outline"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                        
                        {deliverable.submissions && deliverable.submissions.length > 0 && (
                          <div style={{ 
                            marginTop: '20px',
                            padding: '15px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #eee'
                          }}>
                            <h5 style={{ marginBottom: '10px' }}>Submissions ({deliverable.submissions.length})</h5>
                            {deliverable.submissions.slice(0, 2).map(submission => (
                              <div key={submission.id} style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: '1px solid #eee'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: '500' }}>{submission.studentName}</p>
                                  <p style={{ fontSize: '14px', color: '#666' }}>
                                    Submitted: {formatDate(submission.submittedAt)}
                                  </p>
                                </div>
                                <div>
                                  <a 
                                    href={submission.submissionUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ padding: '8px 12px' }}
                                  >
                                    View Submission
                                  </a>
                                </div>
                              </div>
                            ))}
                            {deliverable.submissions.length > 2 && (
                              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                <Link to={`/company/deliverable/${deliverable.id}`}>
                                  View all {deliverable.submissions.length} submissions
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'messaging' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Send Message to Students</h3>
                
                {activeStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>No active students on this project yet.</p>
                    <p style={{ marginTop: '10px', color: '#666' }}>Accept applications to add students to the project.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage}>
                    <div className="form-group" style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Recipients</label>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={messageAll}
                            onChange={() => {
                              setMessageAll(!messageAll);
                              setSelectedStudentIds(messageAll ? [] : activeStudents.map(s => s.id));
                            }}
                            style={{ marginRight: '8px' }}
                          />
                          Message all students ({activeStudents.length})
                        </label>
                      </div>
                      
                      {!messageAll && (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                          gap: '15px' 
                        }}>
                          {activeStudents.map(student => (
                            <label 
                              key={student.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                padding: '10px',
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                background: selectedStudentIds.includes(student.id) ? '#f5f7ff' : 'white'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleStudentSelection(student.id)}
                                style={{ marginRight: '10px' }}
                              />
                              <div style={{ 
                                width: '30px', 
                                height: '30px', 
                                borderRadius: '50%', 
                                overflow: 'hidden',
                                marginRight: '10px'
                              }}>
                                {student.photoURL ? (
                                  <img 
                                    src={student.photoURL} 
                                    alt={`${student.firstName} ${student.lastName}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    background: 'var(--primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px'
                                  }}>
                                    {student.firstName ? student.firstName.charAt(0) : 'S'}
                                  </div>
                                )}
                              </div>
                              <span>{student.firstName} {student.lastName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '150px' }}
                        placeholder="Type your message here..."
                      ></textarea>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={sendingMessage || (selectedStudentIds.length === 0 && !messageAll)}
                      className="btn btn-primary"
                      style={{ minWidth: '150px' }}
                    >
                      {sendingMessage ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Resource Preview Modal */}
      {showPreview && (
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
              <h3>{previewResource?.title}</h3>
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
              {renderResourcePreview()}
            </div>
            <div style={{ 
              padding: '15px 20px', 
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <a 
                href={previewResource?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {previewResource?.type === 'link' ? 'Open Link' : 'Download'}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyProjectDetail;
