// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';

const CompanyDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get company profile
        const profileRef = doc(db, 'companyProfiles', currentUser.uid);
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          setCompanyProfile(profileDoc.data());
        }
        
        // Get company's projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('companyId', '==', currentUser.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsData);
        
        // Get all applications for company's projects
        const projectIds = projectsData.map(project => project.id);
        if (projectIds.length > 0) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('projectId', 'in', projectIds.slice(0, 10)) // Firestore limit
          );
          
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setApplications(applicationsData);
        }
        
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
  
  const getRecentApplications = () => {
    return applications
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 5);
  };
  
  const getProjectStats = () => {
    const activeProjects = projects.filter(p => p.status === 'open').length;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    
    return { activeProjects, totalApplications, pendingApplications };
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          Loading your dashboard...
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--danger)' }}>
          {error}
        </div>
      </>
    );
  }
  
  const stats = getProjectStats();
  const recentApplications = getRecentApplications();
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2>Company Dashboard</h2>
            <p>Manage your projects and review applications</p>
          </div>
          
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Main Content */}
          <div>
            {/* Recent Projects */}
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Your Projects</h3>
                <Link 
                  to="/post-project" 
                  className="btn btn-outline"
                  style={{ textDecoration: 'none' }}
                >
                  + New Project
                </Link>
              </div>
              
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '32px'
                  }}>
                    📝
                  </div>
                  <h4 style={{ marginBottom: '10px' }}>No Projects Yet</h4>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Create your first project to start finding talented students.
                  </p>
                  <Link to="/post-project" className="btn btn-primary">Create Project</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {projects.slice(0, 5).map(project => {
                    const projectApplications = applications.filter(app => app.projectId === project.id);
                    const pendingCount = projectApplications.filter(app => app.status === 'pending').length;
                    
                    return (
                      <div 
                        key={project.id}
                        style={{ 
                          padding: '20px',
                          border: '1px solid #eee',
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: '1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h5 style={{ margin: 0 }}>{project.title}</h5>
                            <span style={{ 
                              background: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              color: project.status === 'open' ? 'var(--success)' : '#6b7280',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {project.status === 'open' ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>
                            {project.description?.slice(0, 100)}...
                          </p>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                            <span>Posted: {formatDate(project.createdAt)}</span>
                            <span>Applications: {projectApplications.length}</span>
                            {pendingCount > 0 && (
                              <span style={{ color: 'var(--warning)', fontWeight: '500' }}>
                                {pendingCount} pending
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Link 
                            to={`/company/project/${project.id}`}
                            className="btn btn-outline"
                            style={{ textDecoration: 'none', padding: '8px 16px' }}
                          >
                            Manage
                          </Link>
                          {projectApplications.length > 0 && (
                            <Link 
                              to={`/company/applications/${project.id}`}
                              className="btn btn-primary"
                              style={{ textDecoration: 'none', padding: '8px 16px' }}
                            >
                              View Applications
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {projects.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                      <Link 
                        to="/company/projects" 
                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                      >
                        View All Projects ({projects.length})
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Recent Applications */}
            {recentApplications.length > 0 && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Recent Applications</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentApplications.map(application => {
                    const project = projects.find(p => p.id === application.projectId);
                    return (
                      <div 
                        key={application.id}
                        style={{ 
                          padding: '15px',
                          border: '1px solid #eee',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h6 style={{ marginBottom: '5px' }}>
                            Application for: {project?.title || 'Unknown Project'}
                          </h6>
                          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Applied on {formatDate(application.appliedAt)}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ 
                            background: application.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : 
                                       application.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 
                                       'rgba(239, 68, 68, 0.1)',
                            color: application.status === 'pending' ? 'var(--warning)' : 
                                   application.status === 'accepted' ? 'var(--success)' : 
                                   'var(--danger)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            textTransform: 'capitalize'
                          }}>
                            {application.status}
                          </span>
                          
                          <Link 
                            to={`/company/applications/${application.projectId}`}
                            style={{ 
                              color: 'var(--primary)', 
                              textDecoration: 'none',
                              fontSize: '14px'
                            }}
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Company Profile Section */}
            <div style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '25px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                {companyProfile?.companyLogo ? (
                  <img 
                    src={companyProfile.companyLogo} 
                    alt="Company Logo"
                    style={{ 
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '15px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#627eea',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '24px',
                    marginRight: '15px',
                    fontWeight: 'bold'
                  }}>
                    {companyProfile?.companyName ? companyProfile.companyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                
                <div>
                  <h4 style={{ marginBottom: '5px' }}>
                    {companyProfile?.companyName || 'Complete Your Profile'}
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                    {companyProfile?.industry || 'Add your industry'}
                  </p>
                </div>
              </div>
              
              <Link 
                to="/company/profile" 
                className="btn btn-outline"
                style={{ 
                  width: '100%', 
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  padding: '12px'
                }}
              >
                View Profile
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ marginBottom: '20px' }}>Quick Stats</h4>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500' }}>Active Projects</span>
                  <span style={{ 
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {stats.activeProjects}
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500' }}>Total Applications</span>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {stats.totalApplications}
                  </span>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500' }}>Pending Reviews</span>
                  <span style={{ 
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: 'var(--warning)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {stats.pendingApplications}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyDashboard;