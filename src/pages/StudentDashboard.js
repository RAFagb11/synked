// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getStudentDashboardData } from '../services/dashboardService';
import Navigation from '../components/Navigation';

const StudentDashboard = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  
  const [applications, setApplications] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const dashboardData = await getStudentDashboardData(currentUser.uid);
        
        // Sort applications by date
        const sortedApplications = dashboardData.applications.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            if (a.createdAt.seconds && b.createdAt.seconds) {
              return b.createdAt.seconds - a.createdAt.seconds;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return 0;
        });
        
        setApplications(sortedApplications);
        setActiveProjects(dashboardData.activeProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'accepted':
        return { 
          background: 'rgba(34, 197, 94, 0.1)', 
          color: 'var(--success)' 
        };
      case 'pending':
        return { 
          background: 'rgba(251, 191, 36, 0.1)', 
          color: 'var(--warning)' 
        };
      case 'rejected':
        return { 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: 'var(--danger)' 
        };
      default:
        return {};
    }
  };
  
  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          Loading your dashboard...
        </div>
      );
    }
    
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--danger)' }}>
          {error}
        </div>
      );
    }
    
    if (activeTab === 'projects') {
      return (
        <div>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Active Projects ({activeProjects.length})</h3>
            
            {activeProjects.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <p style={{ marginBottom: '15px' }}>You don't have any active projects yet.</p>
                <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {activeProjects.map(project => (
                  <div key={project.id} className="feature-card">
                    <div className="feature-badge">{project.category}</div>
                    <h3>{project.title}</h3>
                    <p>{project.description.slice(0, 100)}...</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '500' }}>Company:</span>
                        <span>{project.companyName || 'Company'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Status:</span>
                        <span style={{ color: 'var(--success)' }}>Active</span>
                      </div>
                    </div>
                    
                    <Link to={`/projects/${project.id}`} className="btn btn-primary" style={{ marginTop: '20px', display: 'block', textAlign: 'center' }}>
                      View Project
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Your Applications ({applications.length})</h3>
          
          {applications.length === 0 ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p style={{ marginBottom: '15px' }}>You haven't applied to any projects yet.</p>
              <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
            </div>
          ) : (
            <div>
              {applications.map(application => (
                <div 
                  key={application.id} 
                  style={{ 
                    background: 'white', 
                    padding: '25px', 
                    borderRadius: '16px', 
                    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>{application.projectTitle}</h3>
                    <span 
                      className="feature-badge"
                      style={{
                        ...getStatusClass(application.status),
                        textTransform: 'capitalize'
                      }}
                    >
                      {application.status}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>Applied On:</span>
                      <span>{formatDate(application.createdAt || application.appliedAt)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500' }}>Your Availability:</span>
                      <span>{application.availability}</span>
                    </div>
                  </div>
                  
                  {application.status === 'accepted' && (
                    <div style={{ 
                      padding: '15px', 
                      borderRadius: '8px', 
                      background: 'rgba(34, 197, 94, 0.1)',
                      marginBottom: '20px'
                    }}>
                      <p style={{ color: 'var(--success)', fontWeight: '500', marginBottom: '5px' }}>
                        Your application has been accepted!
                      </p>
                      <p>This project is now active in your dashboard.</p>
                    </div>
                  )}
                  
                  <Link 
                    to={`/projects/${application.projectId}`} 
                    className="btn btn-outline"
                    style={{ display: 'block', textAlign: 'center' }}
                  >
                    Go to Project
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2>Student Dashboard</h2>
            <p>Manage your projects and applications</p>
          </div>
          
          <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <button 
            className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('projects')}
          >
            Active Projects ({activeProjects.length})
          </button>
          <button 
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('applications')}
          >
            Applications ({applications.length})
          </button>
        </div>
        
        {renderTabContent()}
      </div>
    </>
  );
};

export default StudentDashboard;