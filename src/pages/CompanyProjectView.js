// src/pages/CompanyProjectView.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const CompanyProjectView = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    compensation: '',
    isExperienceOnly: false,
    skills: [],
    status: 'open'
  });
  
  // Applications
  const [applications, setApplications] = useState([]);
  
  // Resources
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resourceType: 'file',
    url: '',
    file: null
  });
  const [uploadingResource, setUploadingResource] = useState(false);
  
  // Messages
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Check if user is authorized
        if (!currentUser) {
          navigate('/login');
          return;
        }
        
        // Fetch project
        const projectDoc = await getDoc(doc(db, 'projects', id));
        
        if (!projectDoc.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        
        // Check if this project belongs to the current user
        if (projectData.companyId !== currentUser.uid) {
          setError('You do not have permission to view this project');
          setLoading(false);
          return;
        }
        
        setProject(projectData);
        
        // Set form data for editing
        setFormData({
          title: projectData.title || '',
          description: projectData.description || '',
          category: projectData.category || '',
          duration: projectData.duration || '',
          compensation: projectData.isExperienceOnly ? '' : projectData.compensation || '',
          isExperienceOnly: projectData.isExperienceOnly || false,
          skills: projectData.skills || [],
          status: projectData.status || 'open'
        });
        
        // Fetch applications
        await fetchApplications(projectData.id);
        
        // Fetch resources
        await fetchResources(projectData.id);
        
        // Fetch messages
        await fetchMessages(projectData.id);
        
        // Fetch students (accepted applicants)
        await fetchStudents(projectData.id);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Error loading project: ' + error.message);
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id, currentUser, navigate]);
  
  const fetchApplications = async (projectId) => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('projectId', '==', projectId),
        orderBy('appliedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(applicationsQuery);
      const applicationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  
  const fetchResources = async (projectId) => {
    try {
      const resourcesQuery = query(
        collection(db, 'projectResources'),
        where('projectId', '==', projectId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(resourcesQuery);
      const resourcesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };
  
  const fetchMessages = async (projectId) => {
    try {
      const messagesQuery = query(
        collection(db, 'projectMessages'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const fetchStudents = async (projectId) => {
    try {
      // Find accepted applications
      const acceptedAppsQuery = query(
        collection(db, 'applications'),
        where('projectId', '==', projectId),
        where('status', '==', 'accepted')
      );
      
      const appsSnapshot = await getDocs(acceptedAppsQuery);
      const studentIds = appsSnapshot.docs.map(doc => doc.data().studentId);
      
      // Fetch student profiles for each accepted student
      const studentsData = [];
      for (const studentId of studentIds) {
        const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
        if (studentDoc.exists()) {
          studentsData.push({
            id: studentId,
            ...studentDoc.data()
          });
        }
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'skills') {
      // Handle skills as an array
      const skillsArray = value.split(',').map(skill => skill.trim());
      setFormData(prev => ({ ...prev, [name]: skillsArray }));
    } else {
      // Handle other inputs
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    try {
      const projectRef = doc(db, 'projects', id);
      
      await updateDoc(projectRef, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration,
        compensation: formData.isExperienceOnly ? null : parseFloat(formData.compensation),
        isExperienceOnly: formData.isExperienceOnly,
        skills: formData.skills,
        status: formData.status,
        updatedAt: serverTimestamp()
      });
      
      // Update local project state
      setProject(prev => ({
        ...prev,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration,
        compensation: formData.isExperienceOnly ? null : parseFloat(formData.compensation),
        isExperienceOnly: formData.isExperienceOnly,
        skills: formData.skills,
        status: formData.status
      }));
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project: ' + error.message);
    }
  };
  
  const handleDeleteProject = async () => {
    try {
      // Delete the project
      await deleteDoc(doc(db, 'projects', id));
      
      // Redirect to dashboard
      navigate('/company/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + error.message);
    }
  };
  
  // Resources handling
  const handleResourceTypeChange = (type) => {
    setNewResource(prev => ({
      ...prev,
      resourceType: type,
      // Reset the other field
      [type === 'file' ? 'url' : 'file']: null
    }));
  };
  
  const handleResourceChange = (e) => {
    const { name, value } = e.target;
    setNewResource(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewResource(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };
  
  const handleAddResource = async (e) => {
    e.preventDefault();
    
    try {
      setUploadingResource(true);
      
      let fileUrl = '';
      
      // If it's a file resource, upload the file
      if (newResource.resourceType === 'file' && newResource.file) {
        const storageRef = ref(storage, `project-resources/${id}/${Date.now()}_${newResource.file.name}`);
        await uploadBytes(storageRef, newResource.file);
        fileUrl = await getDownloadURL(storageRef);
      }
      
      // Create resource record
      const resourceData = {
        projectId: id,
        companyId: currentUser.uid,
        title: newResource.title,
        description: newResource.description,
        resourceType: newResource.resourceType,
        url: newResource.resourceType === 'link' ? newResource.url : '',
        fileUrl: newResource.resourceType === 'file' ? fileUrl : '',
        fileName: newResource.resourceType === 'file' ? newResource.file.name : '',
        uploadedAt: serverTimestamp()
      };
      
      const resourceRef = await addDoc(collection(db, 'projectResources'), resourceData);
      
      // Add to local state
      setResources(prev => [
        {
          id: resourceRef.id,
          ...resourceData,
          uploadedAt: new Date().toISOString() // For immediate display
        },
        ...prev
      ]);
      
      // Reset form
      setNewResource({
        title: '',
        description: '',
        resourceType: 'file',
        url: '',
        file: null
      });
      
      setUploadingResource(false);
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Error adding resource: ' + error.message);
      setUploadingResource(false);
    }
  };
  
  // Messages handling
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    try {
      setSendingMessage(true);
      
      // Determine recipients
      const recipients = sendToAll 
        ? students.map(student => student.id)
        : [selectedStudent];
      
      // Create message record
      const messageData = {
        projectId: id,
        senderId: currentUser.uid,
        senderName: project.companyName || 'Company',
        senderType: 'company',
        text: newMessage,
        recipients: recipients,
        isPrivate: !sendToAll && recipients.length > 0,
        timestamp: serverTimestamp()
      };
      
      const messageRef = await addDoc(collection(db, 'projectMessages'), messageData);
      
      // Add to local state
      setMessages(prev => [
        {
          id: messageRef.id,
          ...messageData,
          timestamp: new Date().toISOString() // For immediate display
        },
        ...prev
      ]);
      
      // Reset form
      setNewMessage('');
      setSendingMessage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
      setSendingMessage(false);
    }
  };
  
  // Format date
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
  
  return (
    <>
      <Navigation />
      
      <div className="container" style={{ padding: '60px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>Loading project...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--danger)' }}>{error}</div>
        ) : (
          <>
            {/* Project Header */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="feature-badge" style={{ marginBottom: '10px' }}>{project.category}</div>
                <h2 style={{ marginBottom: '15px' }}>{project.title}</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <span className="feature-badge">{project.duration}</span>
                  <span className="feature-badge" style={{ 
                    background: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)', 
                    color: project.status === 'open' ? 'var(--success)' : 'var(--warning)' 
                  }}>
                    {project.status === 'open' ? 'Open for Applications' : 'Applications Closed'}
                  </span>
                  <span className="feature-badge">
                    {project.isExperienceOnly ? 'Experience Only' : `$${project.compensation}`}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className={`btn ${editMode ? 'btn-outline' : 'btn-primary'}`}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Project'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Delete
                </button>
              </div>
            </div>
            
            {/* Tabs Navigation */}
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '30px' }}>
                <button 
                  onClick={() => setActiveTab('details')}
                  style={{ 
                    padding: '15px 5px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeTab === 'details' ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === 'details' ? 'var(--primary)' : 'inherit',
                    fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  Project Details
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  style={{ 
                    padding: '15px 5px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeTab === 'resources' ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === 'resources' ? 'var(--primary)' : 'inherit',
                    fontWeight: activeTab === 'resources' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  Resources
                </button>
                <button 
                  onClick={() => setActiveTab('messages')}
                  style={{ 
                    padding: '15px 5px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeTab === 'messages' ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === 'messages' ? 'var(--primary)' : 'inherit',
                    fontWeight: activeTab === 'messages' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  Messages
                </button>
                <button 
                  onClick={() => setActiveTab('applications')}
                  style={{ 
                    padding: '15px 5px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeTab === 'applications' ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === 'applications' ? 'var(--primary)' : 'inherit',
                    fontWeight: activeTab === 'applications' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  Applications
                  {applications.filter(app => app.status === 'pending').length > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '-10px', 
                      backgroundColor: 'var(--primary)', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: '20px', 
                      height: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '12px' 
                    }}>
                      {applications.filter(app => app.status === 'pending').length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                {editMode ? (
                  <form onSubmit={handleUpdateProject}>
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '200px' }}
                      ></textarea>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                          <option value="">Select a category</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Mobile App">Mobile App</option>
                          <option value="UI/UX Design">UI/UX Design</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Data Analysis">Data Analysis</option>
                          <option value="Content Creation">Content Creation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Duration</label>
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                          <option value="">Select duration</option>
                          <option value="1-2 weeks">1-2 weeks</option>
                          <option value="2-4 weeks">2-4 weeks</option>
                          <option value="1-2 months">1-2 months</option>
                          <option value="3+ months">3+ months</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Required Skills (comma separated)</label>
                      <input
                        type="text"
                        name="skills"
                        value={formData.skills.join(', ')}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        placeholder="E.g. React, JavaScript, Firebase"
                      />
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="isExperienceOnly"
                          checked={formData.isExperienceOnly}
                          onChange={handleInputChange}
                          style={{ marginRight: '10px' }}
                        />
                        This is an experience-only project (no financial compensation)
                      </label>
                    </div>
                    
                    {!formData.isExperienceOnly && (
                      <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Compensation Amount ($)</label>
                        <input
                          type="number"
                          name="compensation"
                          value={formData.compensation}
                          onChange={handleInputChange}
                          required={!formData.isExperienceOnly}
                          min="0"
                          step="0.01"
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      >
                        <option value="open">Open for Applications</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '15px' }}>Project Description</h3>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
                    </div>
                    
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ marginBottom: '15px' }}>Required Skills</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {project.skills?.map(skill => (
                          <span key={skill} className="feature-badge">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div style={{ 
                        padding: '20px', 
                        borderRadius: '16px', 
                        backgroundColor: '#f9f9f9', 
                        border: '1px solid #eee'
                      }}>
                        <h4 style={{ marginBottom: '15px' }}>Timeline</h4>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Created</div>
                          <div>{formatDate(project.createdAt)}</div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Duration</div>
                          <div>{project.duration}</div>
                        </div>
                        {project.updatedAt && (
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Last Updated</div>
                            <div>{formatDate(project.updatedAt)}</div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        padding: '20px', 
                        borderRadius: '16px', 
                        backgroundColor: '#f9f9f9', 
                        border: '1px solid #eee'
                      }}>
                        <h4 style={{ marginBottom: '15px' }}>Compensation</h4>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Type</div>
                          <div>{project.isExperienceOnly ? 'Experience Only' : 'Paid'}</div>
                        </div>
                        {!project.isExperienceOnly && (
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Amount</div>
                            <div>${project.compensation}</div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        padding: '20px', 
                        borderRadius: '16px', 
                        backgroundColor: '#f9f9f9', 
                        border: '1px solid #eee'
                      }}>
                        <h4 style={{ marginBottom: '15px' }}>Applications</h4>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total Received</div>
                          <div>{applications.length}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Status</div>
                          <div style={{
                            color: project.status === 'open' ? 'var(--success)' : 'var(--warning)'
                          }}>
                            {project.status === 'open' ? 'Open for Applications' : 'Applications Closed'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Link to="/company/dashboard" className="btn btn-outline">
                        Back to Dashboard
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Project Resources</h3>
                
                {/* Add Resource Form */}
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '8px', 
                  marginBottom: '30px' 
                }}>
                  <h4 style={{ marginBottom: '15px' }}>Add New Resource</h4>
                  
                  <form onSubmit={handleAddResource}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource Type</label>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          border: newResource.resourceType === 'file' ? '2px solid var(--primary)' : '2px solid #eee',
                          backgroundColor: newResource.resourceType === 'file' ? 'rgba(108, 99, 255, 0.05)' : 'transparent'
                        }}>
                          <input
                            type="radio"
                            checked={newResource.resourceType === 'file'}
                            onChange={() => handleResourceTypeChange('file')}
                            style={{ marginRight: '8px' }}
                          />
                          Upload File
                        </label>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          border: newResource.resourceType === 'link' ? '2px solid var(--primary)' : '2px solid #eee',
                          backgroundColor: newResource.resourceType === 'link' ? 'rgba(108, 99, 255, 0.05)' : 'transparent'
                        }}>
                          <input
                            type="radio"
                            checked={newResource.resourceType === 'link'}
                            onChange={() => handleResourceTypeChange('link')}
                            style={{ marginRight: '8px' }}
                          />
                          Add Link
                        </label>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource Title</label>
                      <input
                        type="text"
                        name="title"
                        value={newResource.title}
                        onChange={handleResourceChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd'
                        }}
                        placeholder="E.g. Project Requirements Document"
                      />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description (Optional)</label>
                      <textarea
                        name="description"
                        value={newResource.description}
                        onChange={handleResourceChange}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          minHeight: '80px'
                        }}
                        placeholder="Briefly describe this resource"
                      ></textarea>
                    </div>
                    
                    {newResource.resourceType === 'file' ? (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload File</label>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          required
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          Supported file types: PDF, Word, Excel, PowerPoint, images, videos, etc.
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Resource URL</label>
                        <input
                          type="url"
                          name="url"
                          value={newResource.url}
                          onChange={handleResourceChange}
                          required
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd'
                          }}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                    
                    <button 
                      type="submit"
                      disabled={uploadingResource}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {uploadingResource ? 'Uploading...' : 'Add Resource'}
                    </button>
                  </form>
                </div>
                
                {/* Resource List */}
                {resources.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No resources available. Add your first resource above.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {resources.map(resource => (
                      <div 
                        key={resource.id}
                        style={{ 
                          background: 'white', 
                          padding: '20px', 
                          borderRadius: '10px', 
                          boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                          border: '1px solid #eee',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '15px'
                        }}>
                          <div style={{ 
                            fontSize: '28px', 
                            marginRight: '15px',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--primary)10',
                            borderRadius: '8px'
                          }}>
                            {resource.resourceType === 'file' ? '📄' : '🔗'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', wordBreak: 'break-word' }}>{resource.title}</h4>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              {formatDate(resource.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        
                        {resource.description && (
                          <p style={{ 
                            margin: '0 0 15px 0', 
                            fontSize: '14px', 
                            color: '#555',
                            flex: 1
                          }}>
                            {resource.description}
                          </p>
                        )}
                        
                        <div style={{ marginTop: 'auto' }}>
                          <a 
                            href={resource.resourceType === 'file' ? resource.fileUrl : resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                          >
                            {resource.resourceType === 'file' ? 'View File' : 'Open Link'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Project Messages</h3>
                
                {/* Message Form */}
                <div id="message-form" style={{ 
                  padding: '20px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '8px', 
                  marginBottom: '30px' 
                }}>
                  <h4 style={{ marginBottom: '15px' }}>Send Message</h4>
                  
                  <form onSubmit={handleSubmitMessage}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Recipients</label>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          border: sendToAll ? '2px solid var(--primary)' : '2px solid #eee',
                          backgroundColor: sendToAll ? 'rgba(108, 99, 255, 0.05)' : 'transparent'
                        }}>
                          <input
                            type="radio"
                            checked={sendToAll}
                            onChange={() => setSendToAll(true)}
                            style={{ marginRight: '8px' }}
                          />
                          All Students
                        </label>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          border: !sendToAll ? '2px solid var(--primary)' : '2px solid #eee',
                          backgroundColor: !sendToAll ? 'rgba(108, 99, 255, 0.05)' : 'transparent'
                        }}>
                          <input
                            type="radio"
                            checked={!sendToAll}
                            onChange={() => setSendToAll(false)}
                            style={{ marginRight: '8px' }}
                          />
                          Individual Student
                        </label>
                      </div>
                    </div>
                    
                    {!sendToAll && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Student</label>
                        <select
                          value={selectedStudent || ''}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          required
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd'
                          }}
                        >
                          <option value="">Select a student</option>
                          {students.map(student => (
                            <option key={student.id} value={student.id}>
                              {student.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
                      <textarea
                        value={newMessage}
                        onChange={handleMessageChange}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          minHeight: '120px'
                        }}
                        placeholder="Type your message here..."
                      ></textarea>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={sendingMessage || (!sendToAll && !selectedStudent)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {sendingMessage ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
                
                {/* Message List */}
                <h4 style={{ marginBottom: '15px' }}>Message History</h4>
                
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No messages yet. Start the conversation above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        style={{ 
                          padding: '15px 20px', 
                          borderRadius: '8px', 
                          backgroundColor: message.senderType === 'company' ? '#f0f4ff' : '#f9f9f9',
                          border: '1px solid #eee'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontWeight: 'bold' }}>{message.senderName}</span>
                            {message.isPrivate && 
                              <span style={{ marginLeft: '5px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'normal' }}>
                                (Private to {message.recipients?.length === 1 ? '1 student' : `${message.recipients?.length} students`})
                              </span>
                            }
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {formatDate(message.timestamp)}
                          </div>
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Project Applications</h3>
                
                {applications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No applications received yet.
                  </div>
                ) : (
                  <div>
                    {/* Applications List */}
                    <div style={{ 
                      display: 'grid', 
                      gap: '15px',
                      marginBottom: '30px'
                    }}>
                      {applications.map(application => (
                        <div 
                          key={application.id}
                          style={{ 
                            padding: '20px', 
                            borderRadius: '8px', 
                            border: '1px solid #eee',
                            backgroundColor: application.status === 'accepted' ? 'rgba(34, 197, 94, 0.05)' : 
                                            application.status === 'rejected' ? 'rgba(239, 68, 68, 0.05)' : '#fff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                              <h4 style={{ margin: '0 0 5px 0' }}>{application.studentName || 'Applicant'}</h4>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                Applied: {formatDate(application.appliedAt)}
                              </div>
                            </div>
                            <div style={{ 
                              padding: '5px 10px', 
                              borderRadius: '20px', 
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor: application.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 
                                             application.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 
                                             'rgba(251, 191, 36, 0.1)',
                              color: application.status === 'accepted' ? 'var(--success)' : 
                                    application.status === 'rejected' ? 'var(--danger)' : 
                                    'var(--warning)'
                            }}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Availability</div>
                            <p style={{ margin: 0 }}>{application.availability}</p>
                          </div>
                          
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Cover Letter</div>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{application.coverLetter}</p>
                          </div>
                          
                          {application.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to accept this application?')) {
                                    try {
                                      // Update application status
                                      await updateDoc(doc(db, 'applications', application.id), {
                                        status: 'accepted'
                                      });
                                      
                                      // Refresh applications
                                      const updatedApplications = applications.map(app => 
                                        app.id === application.id ? { ...app, status: 'accepted' } : app
                                      );
                                      setApplications(updatedApplications);
                                      
                                      // Fetch student profile
                                      const studentDoc = await getDoc(doc(db, 'studentProfiles', application.studentId));
                                      if (studentDoc.exists()) {
                                        const studentData = { id: application.studentId, ...studentDoc.data() };
                                        setStudents([...students, studentData]);
                                      }
                                    } catch (error) {
                                      console.error('Error accepting application:', error);
                                      alert('Error accepting application: ' + error.message);
                                    }
                                  }
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                              >
                                Accept
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to reject this application?')) {
                                    try {
                                      // Update application status
                                      await updateDoc(doc(db, 'applications', application.id), {
                                        status: 'rejected'
                                      });
                                      
                                      // Refresh applications
                                      const updatedApplications = applications.map(app => 
                                        app.id === application.id ? { ...app, status: 'rejected' } : app
                                      );
                                      setApplications(updatedApplications);
                                    } catch (error) {
                                      console.error('Error rejecting application:', error);
                                      alert('Error rejecting application: ' + error.message);
                                    }
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          
                          {application.status !== 'pending' && (
                            <Link
                              to={`/students/${application.studentId}`}
                              className="btn btn-outline"
                              style={{ width: '100%' }}
                            >
                              View Student Profile
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Delete Project</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="btn btn-danger"
                style={{ 
                  flex: 1,
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  border: 'none'
                }}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyProjectView;