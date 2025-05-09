// src/pages/StudentProjectPortal.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const StudentProjectPortal = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
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

    // Fetch project, company, and deliverables data
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
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          return 0;
        });
        
        setDeliverables(deliverablesData);
        
        // Set active deliverable (first incomplete or in-progress deliverable)
        const currentDeliverable = deliverablesData.find(d => 
          d.status === 'pending' || d.status === 'in-progress'
        ) || deliverablesData[0];
        
        setActiveDeliverable(currentDeliverable);
        
        // Get messages - directly inline
        const messagesQuery = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId)
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
        
        // Get activities - directly inline
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('projectId', '==', projectId)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort activities by timestamp (newest first)
        activitiesData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return bTime - aTime;
          }
          return 0;
        });
        
        setActivities(activitiesData);
        
        // Set loading to false after all async operations complete
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

 // Submit a message
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
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'student',
        activityType: 'message',
        content: 'sent a message',
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      
      // Instead of calling fetchMessages and fetchActivities, fetch the data directly:
      
      // Fetch messages inline
      const messagesQuery = query(
        collection(db, 'messages'),
        where('projectId', '==', projectId)
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
      
      // Fetch activities inline
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('projectId', '==', projectId)
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort activities by timestamp (newest first)
      activitiesData.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
          const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
          return bTime - aTime;
        }
        return 0;
      });
      
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSubmission({
        ...submission,
        file: e.target.files[0]
      });
    }
  };
  
  // Submit deliverable
  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    
    if (!activeDeliverable) return;
    
    try {
      setIsSubmitting(true);
      
      let fileUrl = '';
      
      // Upload file if selected
      if (submission.file) {
        const storageRef = ref(storage, `submissions/${projectId}/${activeDeliverable.id}/${currentUser.uid}_${Date.now()}_${submission.file.name}`);
        await uploadBytes(storageRef, submission.file);
        fileUrl = await getDownloadURL(storageRef);
      }
      
      // Create submission
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
      
      // Update deliverable status
      await updateDoc(doc(db, 'deliverables', activeDeliverable.id), {
        status: 'submitted',
        updatedAt: serverTimestamp()
      });
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType: 'student',
        activityType: 'submission',
        content: `submitted deliverable: ${activeDeliverable.title}`,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      setSubmission({ content: '', file: null });
      
      // Refresh data
      const updatedDeliverable = { ...activeDeliverable, status: 'submitted' };
      setActiveDeliverable(updatedDeliverable);
      
      const updatedDeliverables = deliverables.map(d => 
        d.id === activeDeliverable.id ? updatedDeliverable : d
      );
      
      setDeliverables(updatedDeliverables);
      // Fetch activities inline
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('projectId', '==', projectId)
        );
        
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort activities by timestamp (newest first)
        activitiesData.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
            const aTime = a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return bTime - aTime;
            }
            return 0;
        });
        
        setActivities(activitiesData);
      
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      setIsSubmitting(false);
    }
  };
  
  // Calculate project progress
  const calculateProgress = () => {
    if (!deliverables.length) return 0;
    
    const completedCount = deliverables.filter(d => 
      d.status === 'completed' || d.status === 'approved'
    ).length;
    
    return Math.round((completedCount / deliverables.length) * 100);
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
          <div>Loading project portal...</div>
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
            onClick={() => navigate('/student/dashboard')} 
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
              <span>With {company?.companyName || 'Company'}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="btn btn-outline"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Progress Bar */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Project Progress</h3>
            <span>{calculateProgress()}% Complete</span>
          </div>
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
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
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ 
              flex: '1', 
              minWidth: '120px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: 'var(--success)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {deliverables.filter(d => d.status === 'completed' || d.status === 'approved').length}
              </div>
              <div>Completed</div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '120px', 
              background: 'rgba(108, 99, 255, 0.1)', 
              color: 'var(--primary)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {deliverables.filter(d => d.status === 'in-progress' || d.status === 'submitted').length}
              </div>
              <div>In Progress</div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '120px', 
              background: '#f1f5f9', 
              color: 'var(--dark)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {deliverables.filter(d => d.status === 'pending').length}
              </div>
              <div>Not Started</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          {/* Left Column - Deliverables */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            {/* Current Deliverable */}
            {activeDeliverable && (
              <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Current Deliverable</h3>
                <div className="feature-badge" style={{ marginBottom: '10px' }}>
                  {activeDeliverable.status === 'pending' ? 'Not Started' : 
                   activeDeliverable.status === 'in-progress' ? 'In Progress' :
                   activeDeliverable.status === 'submitted' ? 'Submitted' :
                   activeDeliverable.status === 'completed' ? 'Completed' : 
                   activeDeliverable.status === 'approved' ? 'Approved' : 
                   activeDeliverable.status === 'rejected' ? 'Needs Revision' : 
                   activeDeliverable.status}
                </div>
                <h4 style={{ marginBottom: '10px' }}>{activeDeliverable.title}</h4>
                <p style={{ marginBottom: '15px' }}>{activeDeliverable.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>Due Date:</span> {formatDate(activeDeliverable.dueDate)}
                  </div>
                  <div className={`feature-badge ${getStatusClass(activeDeliverable.status)}`}>
                    {activeDeliverable.status}
                  </div>
                </div>
                
                {(activeDeliverable.status === 'pending' || activeDeliverable.status === 'in-progress' || activeDeliverable.status === 'rejected') && (
                  <form onSubmit={handleSubmitDeliverable}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Submission Notes</label>
                      <textarea 
                        value={submission.content}
                        onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                        placeholder="Describe your submission or add any notes for your mentor..."
                      ></textarea>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload File (optional)</label>
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {isSubmitting ? 'Submitting...' : (
                        activeDeliverable.status === 'rejected' ? 'Resubmit Deliverable' : 
                        activeDeliverable.status === 'in-progress' ? 'Submit Deliverable' : 
                        'Start & Submit Deliverable'
                      )}
                    </button>
                  </form>
                )}
                
                {(activeDeliverable.status === 'submitted') && (
                  <div style={{ padding: '15px', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px' }}>
                    <p>Your submission is under review. Check back later for feedback.</p>
                  </div>
                )}
                
                {(activeDeliverable.status === 'completed' || activeDeliverable.status === 'approved') && (
                  <div style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '500', marginBottom: '5px' }}>Feedback:</p>
                    <p>{activeDeliverable.feedback || 'No feedback provided yet.'}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* All Deliverables */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px' }}>All Deliverables</h3>
              
              {deliverables.length === 0 ? (
                <p>No deliverables have been assigned yet.</p>
              ) : (
                <div>
                  {deliverables.map((deliverable, index) => (
                    <div 
                      key={deliverable.id} 
                      style={{ 
                        padding: '15px',
                        border: activeDeliverable?.id === deliverable.id ? '2px solid var(--primary)' : '1px solid #f1f5f9',
                        borderRadius: '8px',
                        marginBottom: index < deliverables.length - 1 ? '15px' : '0',
                        cursor: 'pointer',
                        background: activeDeliverable?.id === deliverable.id ? 'rgba(108, 99, 255, 0.05)' : 'white'
                      }}
                      onClick={() => setActiveDeliverable(deliverable)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>{deliverable.title}</span>
                        <span className={`feature-badge ${getStatusClass(deliverable.status)}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                          {deliverable.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                        <span>Due: {formatDate(deliverable.dueDate)}</span>
                        <span>{deliverable.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Activities and Messages */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            {/* Messages */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
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
                  <p style={{ textAlign: 'center', color: '#666' }}>No messages yet. Start a conversation with your mentor.</p>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id} 
                      style={{ 
                        marginBottom: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.senderType === 'student' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ 
                        background: message.senderType === 'student' ? 'var(--primary)' : '#f1f5f9',
                        color: message.senderType === 'student' ? 'white' : 'var(--dark)',
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
                    placeholder="Type a message to your mentor..."
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
            
            {/* Recent Activity */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '20px' }}>Recent Activity</h3>
              
              {activities.length === 0 ? (
                <p>No recent activity.</p>
              ) : (
                <div>
                  {activities.slice(0, 5).map(activity => (
                    <div 
                      key={activity.id} 
                      style={{ 
                        padding: '12px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ 
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        background: 
                          activity.activityType === 'submission' ? 'rgba(34, 197, 94, 0.1)' :
                          activity.activityType === 'feedback' ? 'rgba(251, 191, 36, 0.1)' :
                          activity.activityType === 'message' ? 'rgba(108, 99, 255, 0.1)' :
                          '#f1f5f9',
                        color:
                          activity.activityType === 'submission' ? 'var(--success)' :
                          activity.activityType === 'feedback' ? 'var(--warning)' :
                          activity.activityType === 'message' ? 'var(--primary)' :
                          'var(--dark)'
                      }}>
                        {activity.activityType === 'submission' ? '📄' :
                         activity.activityType === 'feedback' ? '✓' :
                         activity.activityType === 'message' ? '💬' : '📌'}
                      </div>
                      
                      <div style={{ flex: '1' }}>
                        <div style={{ fontSize: '14px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {activity.userType === 'student' ? 'You' : company?.companyName || 'Mentor'}
                          </span>{' '}
                          {activity.content}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {activity.timestamp ? formatDate(activity.timestamp) + ' ' + new Date(activity.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProjectPortal;