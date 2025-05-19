// src/pages/StudentProjectView.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';import { db, storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import MessageForm from '../components/MessageForm';
import ResourceCard from '../components/ResourceCard';
import DeliverableCard from '../components/DeliverableCard';

const StudentProjectView = () => {
  const { projectId } = useParams();
  const { currentUser, userProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([]);
  const [resources, setResources] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [currentDeliverables, setCurrentDeliverables] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Fetch all required data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch project
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        // Fetch company
        const companyDoc = await getDoc(doc(db, 'companyProfiles', projectData.companyId));
        if (companyDoc.exists()) {
          setCompany({ id: companyDoc.id, ...companyDoc.data() });
        }
        
        // Fetch messages
        const messagesQuery = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId),
          orderBy('timestamp', 'desc')
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesData = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesData);
        
        // Fetch resources
        const resourcesQuery = query(
          collection(db, 'resources'),
          where('projectId', '==', projectId),
          orderBy('uploadedAt', 'desc')
        );
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setResources(resourcesData);
        
        // Fetch deliverables
        const deliverablesQuery = query(
          collection(db, 'deliverables'),
          where('projectId', '==', projectId),
          orderBy('dueDate', 'asc')
        );
        const deliverablesSnapshot = await getDocs(deliverablesQuery);
        const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDeliverables(deliverablesData);
        
        // Filter current deliverables (not completed and due date hasn't passed)
        const now = new Date();
        const currentDeliverablesData = deliverablesData.filter(deliverable => {
          const dueDate = new Date(deliverable.dueDate.seconds * 1000);
          return !deliverable.completed && dueDate >= now;
        });
        setCurrentDeliverables(currentDeliverablesData);
        
        // Fetch recent activities (combine recent messages, resources, and deliverables)
        const recentActivitiesData = [
          ...messagesData.slice(0, 5).map(item => ({ ...item, type: 'message' })),
          ...resourcesData.slice(0, 5).map(item => ({ ...item, type: 'resource' })),
          ...deliverablesData
            .filter(item => item.status === 'added' || item.status === 'updated')
            .slice(0, 5)
            .map(item => ({ ...item, type: 'deliverable' }))
        ];
        
        // Sort by timestamp
        recentActivitiesData.sort((a, b) => {
          const timeA = a.timestamp || a.uploadedAt || a.createdAt;
          const timeB = b.timestamp || b.uploadedAt || b.createdAt;
          
          if (timeA.seconds && timeB.seconds) {
            return timeB.seconds - timeA.seconds;
          }
          
          return new Date(timeB) - new Date(timeA);
        });
        
        setRecentActivities(recentActivitiesData.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time ago for recent activities
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };
  
  // Handle sending a new message
  const handleSendMessage = async (messageText) => {
    try {
      const newMessage = {
        text: messageText,
        senderId: currentUser.uid,
        senderName: userProfile.fullName || 'Student',
        senderType: 'student',
        projectId,
        timestamp: new Date(),
        isPrivate: true, // Private message to company
        recipients: [project.companyId] // Send to company
      };
      
      // Add to messages collection
      const docRef = await addDoc(collection(db, 'messages'), newMessage);
      
      // Update state
      setMessages([{ id: docRef.id, ...newMessage }, ...messages]);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
          <div>Loading project details...</div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '100px 0', textAlign: 'center', color: 'var(--danger)' }}>
          <div>Error: {error}</div>
          <Link to="/student/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Dashboard
          </Link>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 0' }}>
        {/* Project Header */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '16px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          marginBottom: '30px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div className="feature-badge" style={{ marginBottom: '10px' }}>{project.category}</div>
            <h2 style={{ marginBottom: '5px' }}>{project.title}</h2>
            <div style={{ display: 'flex', gap: '20px', color: '#666' }}>
              <div>Start Date: {formatDate(project.startDate || project.createdAt)}</div>
              <div>End Date: {formatDate(project.endDate)}</div>
              <div style={{ 
                color: project.status === 'active' ? 'var(--success)' : 'var(--warning)'
              }}>
                Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </div>
            </div>
          </div>
          
          <div>
            {company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {company.companyLogo ? (
                    <img 
                      src={company.companyLogo} 
                      alt={company.companyName} 
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    company.companyName.charAt(0)
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{company.companyName}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{company.industry}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #eee', 
          marginBottom: '30px',
          overflowX: 'auto',
          padding: '0 10px'
        }}>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{ 
              padding: '15px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent', 
              color: activeTab === 'overview' ? 'var(--primary)' : '#666',
              fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('deliverables')}
            style={{ 
              padding: '15px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'deliverables' ? '3px solid var(--primary)' : '3px solid transparent', 
              color: activeTab === 'deliverables' ? 'var(--primary)' : '#666',
              fontWeight: activeTab === 'deliverables' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Deliverables
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            style={{ 
              padding: '15px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'resources' ? '3px solid var(--primary)' : '3px solid transparent', 
              color: activeTab === 'resources' ? 'var(--primary)' : '#666',
              fontWeight: activeTab === 'resources' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Resources
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            style={{ 
              padding: '15px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'messages' ? '3px solid var(--primary)' : '3px solid transparent', 
              color: activeTab === 'messages' ? 'var(--primary)' : '#666',
              fontWeight: activeTab === 'messages' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Messages
          </button>
        </div>
        
        {/* Content Sections */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* Left Column */}
            <div>
              {/* Project Description */}
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)', 
                marginBottom: '30px'
              }}>
                <h3 style={{ marginBottom: '15px' }}>Project Description</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
              </div>
              
              {/* Current Deliverables Section */}
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)', 
                marginBottom: '30px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Current Deliverables</h3>
                  <button 
                    onClick={() => setActiveTab('deliverables')}
                    className="btn btn-outline"
                    style={{ padding: '8px 15px', fontSize: '14px' }}
                  >
                    View All
                  </button>
                </div>
                
                {currentDeliverables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No current deliverables
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {currentDeliverables.map(deliverable => (
                      <DeliverableCard
                        key={deliverable.id}
                        deliverable={deliverable}
                        inOverview={true}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recent Resources */}
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Recent Resources</h3>
                  <button 
                    onClick={() => setActiveTab('resources')}
                    className="btn btn-outline"
                    style={{ padding: '8px 15px', fontSize: '14px' }}
                  >
                    View All
                  </button>
                </div>
                
                {resources.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No resources available
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {resources.slice(0, 3).map(resource => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              {/* Recent Activity */}
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)', 
                marginBottom: '30px'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Recent Activity</h3>
                
                {recentActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No recent activity
                  </div>
                ) : (
                  <div>
                    {recentActivities.map((activity, index) => (
                      <div 
                        key={activity.id || index} 
                        style={{ 
                          padding: '15px 0', 
                          borderBottom: index < recentActivities.length - 1 ? '1px solid #eee' : 'none'
                        }}
                      >
                        {activity.type === 'message' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {activity.senderName} 
                                <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
                                  posted a message
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                {timeAgo(activity.timestamp)}
                              </div>
                            </div>
                            <div style={{ marginTop: '5px', color: '#444' }}>
                              {activity.text.length > 100 
                                ? `${activity.text.substring(0, 100)}...` 
                                : activity.text
                              }
                            </div>
                          </div>
                        )}
                        
                        {activity.type === 'resource' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {activity.uploadedBy} 
                                <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
                                  added a resource
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                {timeAgo(activity.uploadedAt)}
                              </div>
                            </div>
                            <div style={{ marginTop: '5px', color: '#444' }}>
                              {activity.title}
                            </div>
                          </div>
                        )}
                        
                        {activity.type === 'deliverable' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                Deliverable 
                                <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
                                  {activity.status} 
                                </span>
                              </div>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                {timeAgo(activity.createdAt)}
                              </div>
                            </div>
                            <div style={{ marginTop: '5px', color: '#444' }}>
                              {activity.title}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick Message */}
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Quick Message</h3>
                <MessageForm onSendMessage={handleSendMessage} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'deliverables' && (
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>All Deliverables</h3>
            
            {deliverables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                No deliverables available
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {deliverables.map(deliverable => (
                  <DeliverableCard 
                    key={deliverable.id} 
                    deliverable={deliverable}
                    inOverview={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'resources' && (
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>All Resources</h3>
            
            {resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                No resources available
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                {resources.map(resource => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'messages' && (
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Messages</h3>
            
            <div style={{ marginBottom: '30px' }}>
              <MessageForm onSendMessage={handleSendMessage} />
            </div>
            
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No messages yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '12px', 
                      backgroundColor: message.senderId === currentUser.uid ? '#f0f4ff' : '#f9f9f9',
                      alignSelf: message.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {message.senderName}
                        {message.isPrivate && 
                          <span style={{ marginLeft: '5px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'normal' }}>
                            (Private)
                          </span>
                        }
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
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

export default StudentProjectView;