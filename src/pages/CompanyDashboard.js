// src/pages/CompanyDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';

const CompanyDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [activeStudents, setActiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProjectOptions, setShowProjectOptions] = useState({}); // For dropdown menus
  const [editingProject, setEditingProject] = useState(null); // For edit modal
  const [editFormData, setEditFormData] = useState({});
  
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
        
        // Get company's projects - SIMPLE QUERY
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
        
        // Get all applications for company's projects - SIMPLE QUERY
        if (projectsData.length > 0) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('companyId', '==', currentUser.uid)
          );
          
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).filter(app => app.status !== 'withdrawn'); // Filter out withdrawn applications
          
          setApplications(applicationsData);
        }
        
        // Get enrolled students from projects - SIMPLE ACCESS
        const allStudentIds = new Set();
        projectsData.forEach(project => {
          (project.enrolledStudents || []).forEach(id => allStudentIds.add(id));
        });
        
        // Fetch student profiles
        const studentsData = [];
        for (const studentId of allStudentIds) {
          try {
            const studentDoc = await getDoc(doc(db, 'studentProfiles', studentId));
            if (studentDoc.exists()) {
              studentsData.push({
                id: studentId,
                ...studentDoc.data()
              });
            }
          } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
          }
        }
        
        setActiveStudents(studentsData);
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
  
  const handleEditProject = (project) => {
    setEditingProject(project);
    setEditFormData({
      title: project.title,
      description: project.description,
      compensation: project.compensation,
      isExperienceOnly: project.isExperienceOnly
    });
    setShowProjectOptions({});
  };
  
  const handleSaveEdit = async () => {
    if (editingProject.hasBeenEdited) {
      alert('This project has already been edited once and cannot be edited again.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'projects', editingProject.id), {
        ...editFormData,
        hasBeenEdited: true,
        lastEditedAt: new Date().toISOString()
      });
      
      // Refresh projects
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
      
      setEditingProject(null);
      setEditFormData({});
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };
  
  const handleToggleProjectStatus = async (project) => {
    const newStatus = project.status === 'open' ? 'closed' : 'open';
    const confirmMessage = project.status === 'open' 
      ? 'Are you sure you want to close this project? Students will no longer be able to apply.'
      : 'Are you sure you want to reopen this project?';
      
    if (window.confirm(confirmMessage)) {
      try {
        await updateDoc(doc(db, 'projects', project.id), {
          status: newStatus,
          lastStatusChangeAt: new Date().toISOString()
        });
        
        // Refresh projects
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
        
        alert(`Project ${newStatus === 'open' ? 'opened' : 'closed'} successfully!`);
      } catch (error) {
        console.error('Error updating project status:', error);
        alert('Failed to update project status. Please try again.');
      }
    }
    setShowProjectOptions({});
  };
  
  const handleDeleteProject = async (project) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'projects', project.id));
        
        // Refresh projects
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
        
        alert('Project deleted successfully!');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
    setShowProjectOptions({});
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
              padding: '40px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>Your Projects</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>Manage your active projects and review applications</p>
                </div>
                <Link 
                  to="/post-project" 
                  className="btn btn-outline"
                  style={{ 
                    textDecoration: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {projects.slice(0, 5).map(project => {
                    const projectApplications = applications.filter(app => app.projectId === project.id);
                    const pendingCount = projectApplications.filter(app => app.status === 'pending').length;
                    
                    return (
                      <div 
                        key={project.id}
                        style={{ 
                          padding: '28px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '16px',
                          background: 'white',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          ':hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            borderColor: '#d1d5db'
                          }
                        }}
                      >
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h5 style={{ 
                              margin: 0, 
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#111827',
                              lineHeight: '1.4'
                            }}>
                              {project.title}
                            </h5>
                            <span style={{ 
                              background: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              color: project.status === 'open' ? 'var(--success)' : '#6b7280',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}>
                              {project.status === 'open' ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: '14px', 
                            margin: '0 0 16px 0',
                            lineHeight: '1.5'
                          }}>
                            {project.description?.slice(0, 120)}...
                          </p>
                          
                          <div style={{ 
                            display: 'flex', 
                            gap: '24px', 
                            fontSize: '13px', 
                            color: '#9ca3af',
                            marginBottom: '20px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '16px' }}>📅</span>
                              <span>Posted {formatDate(project.createdAt)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '16px' }}>📋</span>
                              <span>{projectApplications.length} applications</span>
                            </div>
                            {pendingCount > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ 
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: 'var(--warning)',
                                  display: 'inline-block'
                                }}></span>
                                <span style={{ color: 'var(--warning)', fontWeight: '500' }}>
                                  {pendingCount} pending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '12px',
                          paddingTop: '20px',
                          borderTop: '1px solid #f3f4f6'
                        }}>
                          <Link 
                            to={`/company/project/${project.id}`}
                            className="btn btn-outline"
                            style={{ 
                              textDecoration: 'none', 
                              padding: '10px 20px',
                              fontSize: '14px',
                              borderColor: '#e5e7eb',
                              color: '#374151'
                            }}
                          >
                            Manage Project
                          </Link>
                          {projectApplications.length > 0 && (
                            <Link 
                              to={`/company/applications/${project.id}`}
                              className="btn btn-primary"
                              style={{ 
                                textDecoration: 'none', 
                                padding: '10px 20px',
                                fontSize: '14px'
                              }}
                            >
                              Review Applications ({projectApplications.length})
                            </Link>
                          )}
                          
                          {/* Project Options Menu */}
                          <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowProjectOptions(prev => ({
                                  ...prev,
                                  [project.id]: !prev[project.id]
                                }))
                              }}
                              style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f9fafb';
                                e.currentTarget.style.borderColor = '#d1d5db';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                            >
                              ⋮
                            </button>
                            
                            {showProjectOptions[project.id] && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '5px',
                                background: 'white',
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                minWidth: '150px',
                                zIndex: 10
                              }}>
                                <button
                                  onClick={() => handleEditProject(project)}
                                  style={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  Edit
                                </button>
                                
                                <button
                                  onClick={() => handleToggleProjectStatus(project)}
                                  style={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  {project.status === 'open' ? 'Close' : 'Open'} Project
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteProject(project)}
                                  style={{
                                    width: '100%',
                                    padding: '10px 15px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'var(--danger)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {projects.length > 5 && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <Link 
                        to="/company/projects" 
                        style={{ 
                          color: 'var(--primary)', 
                          textDecoration: 'none',
                          fontSize: '15px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        View All Projects ({projects.length})
                        <span style={{ fontSize: '18px' }}>→</span>
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
      
      {/* Edit Project Modal */}
      {editingProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Edit Project</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Project Title
                </label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '120px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Compensation
                </label>
                <input
                  type="number"
                  value={editFormData.compensation || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, compensation: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  disabled={editFormData.isExperienceOnly}
                />
                <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={editFormData.isExperienceOnly || false}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      isExperienceOnly: e.target.checked,
                      compensation: e.target.checked ? 0 : prev.compensation
                    }))}
                    style={{ marginRight: '8px' }}
                  />
                  Experience Only (No compensation)
                </label>
              </div>
              
              <div style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
                Note: You can edit a project only once. Make sure all details are correct.
              </div>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setEditFormData({});
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editingProject.hasBeenEdited}
                >
                  {editingProject.hasBeenEdited ? 'Already Edited' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyDashboard;