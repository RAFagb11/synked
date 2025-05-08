// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import ApplicationModal from '../components/ApplicationModal';

const CompanyDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const fetchData = async () => {
    if (currentUser) {
      try {
        console.log('Fetching data for company:', currentUser.uid);
        
        // Simplify the query for debugging - remove orderBy for now
        const projectsQ = query(
          collection(db, 'projects'),
          where('companyId', '==', currentUser.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQ);
        console.log('Found projects:', projectsSnapshot.docs.length);
        
        const projectsList = projectsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Project data:', { id: doc.id, ...data });
          return { id: doc.id, ...data };
        });
        
        // Sort in JavaScript instead
        projectsList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setProjects(projectsList);
        
        // Fetch applications
        const applicationsQ = query(
          collection(db, 'applications'),
          where('companyId', '==', currentUser.uid)
        );
        
        const applicationsSnapshot = await getDocs(applicationsQ);
        const applicationsList = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort applications
        applicationsList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setApplications(applicationsList);
        setLoading(false);
        
      } catch (error) {
        console.error('Detailed error:', error);
        setError('Failed to load dashboard data: ' + error.message);
        setLoading(false);
      }
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [currentUser]);
  
  const toggleProjectStatus = async (projectId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { status: newStatus });
      
      // Update local state
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus }
          : project
      ));
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

  const handleApplicationUpdate = () => {
    // Refresh applications data after update
    fetchData();
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div className="section-header">
          <h2>Company Dashboard</h2>
          <p>Manage your projects and applications</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '30px' }}>
          <h3>Your Projects</h3>
          <Link to="/post-project" className="btn btn-primary">Post New Project</Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>Loading dashboard...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <p>You haven't posted any projects yet.</p>
            <Link to="/post-project" className="btn btn-primary" style={{ marginTop: '20px' }}>Post Your First Project</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {projects.map(project => (
              <div key={project.id} className="feature-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h4 style={{ flex: '1', marginRight: '10px' }}>{project.title}</h4>
                  <button
                    onClick={() => toggleProjectStatus(project.id, project.status)}
                    className="btn"
                    style={{
                      padding: '5px 15px',
                      fontSize: '14px',
                      background: project.status === 'open' ? 'var(--warning)' : 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px'
                    }}
                  >
                    {project.status === 'open' ? 'Close Project' : 'Reopen Project'}
                  </button>
                </div>
                
                <div className="feature-badge" style={{ marginBottom: '10px' }}>{project.category}</div>
                <p style={{ marginBottom: '10px' }}>{project.description.slice(0, 100)}...</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span className="feature-badge" style={{
                    background: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    color: project.status === 'open' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {project.status === 'open' ? 'Active' : 'Closed'}
                  </span>
                  <span className="feature-badge">Applications: {project.applicants?.length || 0}</span>
                </div>
                
                <Link 
                  to={`/projects/${project.id}`} 
                  className="btn btn-outline"
                  style={{ marginTop: '15px', width: '100%', textAlign: 'center' }}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: '60px' }}>
          <h3>Recent Applications</h3>
          {applications.length === 0 ? (
            <p style={{ marginTop: '20px' }}>No applications yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              {applications.map(app => (
                <div key={app.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ marginBottom: '5px' }}>Project: {app.projectTitle}</h4>
                      <p style={{ color: '#666', fontSize: '14px' }}>Applied on: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className="feature-badge" style={{
                      background: app.status === 'pending' ? 'rgba(108, 99, 255, 0.1)' : 
                                 app.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 
                                 'rgba(239, 68, 68, 0.1)',
                      color: app.status === 'pending' ? 'var(--primary)' : 
                             app.status === 'accepted' ? 'var(--success)' : 
                             'var(--danger)'
                    }}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Applicant Availability:</strong> {app.availability}</p>
                    {app.applicationAnswer && <p><strong>Answer:</strong> {app.applicationAnswer.slice(0, 100)}...</p>}
                  </div>
                  
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleViewApplication(app)}
                      className="btn btn-outline"
                    >
                      View Application
                    </button>
                    {app.videoUrl && (
                      <button 
                        onClick={() => handleViewApplication(app)}
                        className="btn btn-outline"
                      >
                        View Video
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          isOpen={showModal}
          onClose={handleCloseModal}
          onUpdate={handleApplicationUpdate}
        />
      )}
    </>
  );
};

export default CompanyDashboard;