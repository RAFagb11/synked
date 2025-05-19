// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getCompanyDashboardData } from '../services/dashboardService';
import { acceptApplication, rejectApplication } from '../services/applicationService';
import Navigation from '../components/Navigation';

const CompanyDashboard = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  
  const [projects, setProjects] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [pendingApplications, setPendingApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const [processingApplication, setProcessingApplication] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const dashboardData = await getCompanyDashboardData(currentUser.uid);
        
        // Sort projects by date
        const sortedProjects = dashboardData.projects.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            if (a.createdAt.seconds && b.createdAt.seconds) {
              return b.createdAt.seconds - a.createdAt.seconds;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return 0;
        });
        
        // Separate open and closed projects
        const openProjects = sortedProjects.filter(p => p.status === 'open');
        const activeProjects = sortedProjects.filter(p => p.status === 'in-progress');
        const closedProjects = sortedProjects.filter(p => p.status === 'closed');
        
        setProjects({
          open: openProjects,
          active: activeProjects,
          closed: closedProjects
        });
        
        setActiveStudents(dashboardData.activeStudents);
        setPendingApplications(dashboardData.pendingApplications);
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
  
  const handleAcceptApplication = async (applicationId) => {
    try {
      setProcessingApplication(applicationId);
      await acceptApplication(applicationId);
      
      // Reload dashboard data after accepting
      const dashboardData = await getCompanyDashboardData(currentUser.uid);
      
      const sortedProjects = dashboardData.projects.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          if (a.createdAt.seconds && b.createdAt.seconds) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
      
      // Separate open and closed projects
      const openProjects = sortedProjects.filter(p => p.status === 'open');
      const activeProjects = sortedProjects.filter(p => p.status === 'in-progress');
      const closedProjects = sortedProjects.filter(p => p.status === 'closed');
      
      setProjects({
        open: openProjects,
        active: activeProjects,
        closed: closedProjects
      });
      
      setActiveStudents(dashboardData.activeStudents);
      setPendingApplications(dashboardData.pendingApplications);
      setProcessingApplication(null);
    } catch (error) {
      console.error('Error accepting application:', error);
      setProcessingApplication(null);
    }
  };
  
  const handleRejectApplication = async (applicationId) => {
    try {
      setProcessingApplication(applicationId);
      await rejectApplication(applicationId);
      
      // Reload only pending applications after rejecting
      const dashboardData = await getCompanyDashboardData(currentUser.uid);
      setPendingApplications(dashboardData.pendingApplications);
      setProcessingApplication(null);
    } catch (error) {
      console.error('Error rejecting application:', error);
      setProcessingApplication(null);
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
          {/* Open Projects */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Open Projects ({projects.open.length})</h3>
            
            {projects.open.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <p style={{ marginBottom: '15px' }}>You don't have any open projects.</p>
                <Link to="/post-project" className="btn btn-primary">Post a New Project</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.open.map(project => (
                  <div key={project.id} className="feature-card">
                    <div className="feature-badge">{project.category}</div>
                    <h3>{project.title}</h3>
                    <p>{project.description.slice(0, 100)}...</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '500' }}>Posted:</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Applications:</span>
                        <span>{project.applicants?.length || 0}</span>
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
          
          {/* Active Projects */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Active Projects ({projects.active.length})</h3>
            
            {projects.active.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <p>You don't have any active projects yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.active.map(project => (
                  <div key={project.id} className="feature-card">
                    <div className="feature-badge">{project.category}</div>
                    <h3>{project.title}</h3>
                    <p>{project.description.slice(0, 100)}...</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '500' }}>Posted:</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Active Students:</span>
                        <span>{project.activeStudents?.length || 0}</span>
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
          
          {/* Closed Projects */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Closed Projects ({projects.closed.length})</h3>
            
            {projects.closed.length === 0 ? (
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <p>You don't have any closed projects.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.closed.map(project => (
                  <div key={project.id} className="feature-card">
                    <div className="feature-badge">{project.category}</div>
                    <h3>{project.title}</h3>
                    <p>{project.description.slice(0, 100)}...</p>
                    
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '500' }}>Posted:</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Status:</span>
                        <span style={{ color: 'var(--warning)' }}>Closed</span>
                      </div>
                    </div>
                    
                    <Link to={`/projects/${project.id}`} className="btn btn-outline" style={{ marginTop: '20px', display: 'block', textAlign: 'center' }}>
                      View Project
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else if (activeTab === 'students') {
      return (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Active Students ({activeStudents.length})</h3>
          
          {activeStudents.length === 0 ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p style={{ marginBottom: '15px' }}>You don't have any active students yet.</p>
              <p>Start accepting applications to see students here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {activeStudents.map(student => (
                <div key={student.id} className="feature-card">
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
                    marginBottom: '15px'
                  }}>
                    {student.firstName ? student.firstName.charAt(0) : 'S'}
                  </div>
                  <h3>{student.firstName} {student.lastName}</h3>
                  <div className="feature-badge" style={{ marginBottom: '10px' }}>
                    {student.university || 'Student'}
                  </div>
                  <p>{student.bio?.slice(0, 100) || 'No bio available'}...</p>
                  
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '500' }}>Project:</span>
                      <span>{student.projectTitle}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500' }}>Status:</span>
                      <span style={{ color: 'var(--success)' }}>Active</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <Link 
                      to={`/student-profile/${student.id}`} 
                      className="btn btn-outline" 
                      style={{ flex: '1', textAlign: 'center' }}
                    >
                      View Profile
                    </Link>
                    <Link 
                      to={`/projects/${student.projectId}`} 
                      className="btn btn-primary" 
                      style={{ flex: '1', textAlign: 'center' }}
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Pending Applications</h3>
          
          {Object.keys(pendingApplications).length === 0 ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p>You don't have any pending applications at the moment.</p>
            </div>
          ) : (
            <div>
              {Object.entries(pendingApplications).map(([projectId, apps]) => {
                // Find project title
                const project = [...projects.open, ...projects.active, ...projects.closed]
                  .find(p => p.id === projectId);
                
                return (
                  <div 
                    key={projectId} 
                    style={{ 
                      background: 'white', 
                      padding: '25px', 
                      borderRadius: '16px', 
                      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                      marginBottom: '30px'
                    }}
                  >
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ marginBottom: '10px' }}>{project?.title || 'Project'}</h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span className="feature-badge">{project?.category || 'Category'}</span>
                        <span className="feature-badge">{apps.length} Applications</span>
                      </div>
                    </div>
                    
                    <div>
                      {apps.map(app => (
                        <div 
                          key={app.id} 
                          style={{ 
                            padding: '20px', 
                            borderRadius: '8px', 
                            border: '1px solid #eee',
                            marginBottom: '15px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h4>{app.studentName}</h4>
                            <span className="feature-badge">
                              {formatDate(app.createdAt || app.appliedAt)}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
                            <h5 style={{ marginBottom: '10px' }}>Cover Letter</h5>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{app.coverLetter}</p>
                          </div>
                          
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ marginBottom: '10px' }}>Availability</h5>
                            <p>{app.availability}</p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => handleAcceptApplication(app.id)}
                              disabled={processingApplication === app.id}
                              className="btn btn-primary"
                              style={{ flex: '1' }}
                            >
                              {processingApplication === app.id ? 'Processing...' : 'Accept Application'}
                            </button>
                            <button 
                              onClick={() => handleRejectApplication(app.id)}
                              disabled={processingApplication === app.id}
                              className="btn btn-outline"
                              style={{ flex: '1' }}
                            >
                              {processingApplication === app.id ? 'Processing...' : 'Decline'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
            <h2>Company Dashboard</h2>
            <p>Manage your projects and student applications</p>
          </div>
          
          <Link to="/post-project" className="btn btn-primary">Post New Project</Link>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <button 
            className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects ({(projects.open?.length || 0) + (projects.active?.length || 0) + (projects.closed?.length || 0)})
          </button>
          <button 
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('students')}
          >
            Active Students ({activeStudents.length})
          </button>
          <button 
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('applications')}
          >
            Applications ({Object.values(pendingApplications).flat().length})
          </button>
        </div>
        
        {renderTabContent()}
      </div>
    </>
  );
};

export default CompanyDashboard;