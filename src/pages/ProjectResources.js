// src/pages/ProjectResources.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';

const ProjectResources = () => {
  const { projectId } = useParams();
  const { currentUser, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Document');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Categories for resources
  const categories = [
    'Document',
    'Starter Code',
    'Template',
    'Project Brief',
    'Reference',
    'Tutorial',
    'Other'
  ];
  
  useEffect(() => {
    const fetchResourcesData = async () => {
      try {
        setLoading(true);
        
        // Get project data
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        // Check if user has access to this project
        const isCompanyOwner = userType === 'company' && projectData.companyId === currentUser.uid;
        const isEnrolledStudent = userType === 'student' && projectData.enrolledStudents?.includes(currentUser.uid);
        
        if (!isCompanyOwner && !isEnrolledStudent) {
          throw new Error('You do not have access to this project');
        }
        
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
        
        // Sort resources by category then by uploadedAt
        resourcesData.sort((a, b) => {
          if (a.category === b.category) {
            return b.uploadedAt?.seconds - a.uploadedAt?.seconds;
          }
          return a.category.localeCompare(b.category);
        });
        
        setResources(resourcesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resources data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    if (projectId && currentUser) {
      fetchResourcesData();
    }
  }, [projectId, currentUser, userType]);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Generate preview for certain file types
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview({
          type: 'image',
          url: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFilePreview({
        type: 'pdf',
        name: file.name
      });
    } else {
      setFilePreview({
        type: 'other',
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      });
    }
  };
  
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) return;
    
    try {
      setUploadLoading(true);
      
      // Create storage reference
      const storageRef = ref(storage, `projects/${projectId}/resources/${Date.now()}_${selectedFile.name}`);
      
      // Upload file
      await uploadBytes(storageRef, selectedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add to Firestore
      const resourceData = {
        projectId,
        title,
        description,
        category,
        fileUrl: downloadURL,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadedBy: currentUser.uid,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'projectResources'), resourceData);
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType,
        activityType: 'resource',
        content: `uploaded a new resource: ${title}`,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Document');
      setSelectedFile(null);
      setFilePreview(null);
      setShowUploadForm(false);
      
      // Refresh resources
      const resourcesQuery = query(
        collection(db, 'projectResources'),
        where('projectId', '==', projectId)
      );
      
      const resourcesSnapshot = await getDocs(resourcesQuery);
      const resourcesData = resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort resources by category
      resourcesData.sort((a, b) => {
        if (a.category === b.category) {
          return b.uploadedAt?.seconds - a.uploadedAt?.seconds;
        }
        return a.category.localeCompare(b.category);
      });
      
      setResources(resourcesData);
      setUploadLoading(false);
    } catch (error) {
      console.error('Error uploading resource:', error);
      setError('Failed to upload resource: ' + error.message);
      setUploadLoading(false);
    }
  };
  
  const handleDeleteResource = async (resourceId, storageUrl) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'projectResources', resourceId));
      
      // Delete from Storage
      const fileRef = ref(storage, storageUrl);
      await deleteObject(fileRef);
      
      // Update state
      setResources(resources.filter(r => r.id !== resourceId));
      
      // Add activity
      await addDoc(collection(db, 'activities'), {
        projectId,
        userId: currentUser.uid,
        userType,
        activityType: 'resource',
        content: 'deleted a resource',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError('Failed to delete resource: ' + error.message);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.seconds) {
        // Firestore timestamp
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return timestamp;
    }
  };
  
  // Group resources by category
  const groupedResources = resources.reduce((groups, resource) => {
    const category = resource.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(resource);
    return groups;
  }, {});
  
  // Get icon for file type
  const getFileIcon = (fileType, fileName) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📝';
    if (fileType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return '📊';
    if (fileType.includes('presentation') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return '📊';
    if (fileType.includes('zip') || fileType.includes('compressed') || fileName.endsWith('.zip')) return '🗂️';
    if (fileType.includes('text/') || fileName.endsWith('.txt')) return '📝';
    if (fileName.endsWith('.js') || fileName.endsWith('.html') || fileName.endsWith('.css') || fileName.endsWith('.py')) return '💻';
    return '📁';
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div>Loading resources...</div>
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
            onClick={() => navigate(-1)} 
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Go Back
          </button>
        </div>
      </>
    );
  }
  
  const isCompany = userType === 'company';
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ marginBottom: '5px' }}>Project Resources</h2>
            <div>{project?.title}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => navigate(`/${userType}/project/${projectId}`)} 
              className="btn btn-outline"
            >
              Back to Project
            </button>
            
            {isCompany && (
              <button 
                onClick={() => setShowUploadForm(!showUploadForm)} 
                className="btn btn-primary"
              >
                {showUploadForm ? 'Cancel Upload' : 'Upload Resource'}
              </button>
            )}
          </div>
        </div>
        
        {/* Upload Form */}
        {showUploadForm && isCompany && (
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Upload Resource</h3>
            
            <form onSubmit={handleUpload}>
              <div style={{ display: 'grid', gridTemplateColumns: filePreview ? '1fr 300px' : '1fr', gap: '30px' }}>
                <div>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                      placeholder="Enter resource title"
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                      placeholder="Enter an optional description"
                    ></textarea>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>File *</label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      required={!selectedFile}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      Supported file types: PDF, Word, Excel, PowerPoint, images, ZIP, code files
                    </div>
                  </div>
                </div>
                
                {filePreview && (
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '20px', 
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '500' }}>Preview</div>
                    
                    {filePreview.type === 'image' ? (
                      <img 
                        src={filePreview.url} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                      />
                    ) : filePreview.type === 'pdf' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                        <div>{filePreview.name}</div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>PDF Document</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                        <div style={{ wordBreak: 'break-word' }}>{filePreview.name}</div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{filePreview.size}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={uploadLoading || !selectedFile || !title.trim()}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Resource'}
              </button>
            </form>
          </div>
        )}
        
        {/* Resources List */}
        {Object.keys(groupedResources).length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📁</div>
            <h3 style={{ marginBottom: '10px' }}>No Resources Available</h3>
            <p>
              {isCompany 
                ? 'Upload project resources to share with your students.' 
                : 'No resources have been uploaded for this project yet.'}
            </p>
            
            {isCompany && (
              <button 
                onClick={() => setShowUploadForm(true)} 
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                Upload First Resource
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedResources).map(([category, categoryResources]) => (
            <div 
              key={category} 
              style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                marginBottom: '30px'
              }}
            >
              <h3 style={{ 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span role="img" aria-label={category}>
                  {category === 'Starter Code' ? '💻' : 
                  category === 'Template' ? '📋' :
                  category === 'Project Brief' ? '📝' :
                  category === 'Reference' ? '📚' :
                  category === 'Tutorial' ? '🎓' : '📁'}
                </span>
                {category}
              </h3>
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                {categoryResources.map(resource => (
                  <div 
                    key={resource.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '15px',
                      borderBottom: '1px solid #f1f5f9',
                      gap: '15px'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>
                      <span role="img" aria-label="File">
                        {getFileIcon(resource.fileType, resource.fileName)}
                      </span>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '5px' }}>{resource.title}</div>
                      {resource.description && (
                        <div style={{ marginBottom: '5px', color: '#666' }}>{resource.description}</div>
                      )}
                      <div style={{ fontSize: '14px', color: '#666', display: 'flex', gap: '15px' }}>
                        <div>Uploaded: {formatDate(resource.uploadedAt)}</div>
                        <div>
                          {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a 
                        href={resource.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ padding: '8px 15px' }}
                      >
                        Download
                      </a>
                      
                      {isCompany && (
                        <button 
                          onClick={() => handleDeleteResource(resource.id, resource.fileUrl)} 
                          className="btn btn-outline"
                          style={{ padding: '8px 15px' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ProjectResources;