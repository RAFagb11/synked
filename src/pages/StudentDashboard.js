// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';
import ProjectAcceptedModal from '../components/ProjectAcceptedModal';

const StudentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get student profile
        const profileRef = doc(db, 'studentProfiles', currentUser.uid);
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          setStudentProfile(profileDoc.data());
        }
        
        // Get applications - SIMPLE QUERY
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid),
          orderBy('appliedAt', 'desc')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setApplications(applicationsData);
        
        // Check for newly accepted applications - SIMPLE ACCESS
        const recentlyAccepted = applicationsData.find(app => 
          app.status === 'accepted' && 
          !app.modalShown &&
          app.acceptedAt && 
          new Date() - new Date(app.acceptedAt) < 7 * 24 * 60 * 60 * 1000
        );
        
        if (recentlyAccepted) {
          // Get project details
          const projectRef = doc(db, 'projects', recentlyAccepted.projectId);
          const projectSnap = await getDoc(projectRef);
          
          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            setActiveProject({
              id: recentlyAccepted.projectId,
              ...projectData, // All flat now!
              applicationId: recentlyAccepted.id
            });
            
            setShowAcceptedModal(true);
            
            // Mark modal as shown
            const applicationRef = doc(db, 'applications', recentlyAccepted.id);
            await updateDoc(applicationRef, {
              modalShown: true
            });
          }
        }
        
        // Get active project from accepted applications
        const acceptedApplication = applicationsData.find(app => app.status === 'accepted');
        
        if (acceptedApplication) {
          const projectRef = doc(db, 'projects', acceptedApplication.projectId);
          const projectSnap = await getDoc(projectRef);
          
          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            setActiveProject({
              id: acceptedApplication.projectId,
              ...projectData,
              applicationId: acceptedApplication.id
            });
          }
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
      case 'withdrawn':
        return { 
          background: 'rgba(156, 163, 175, 0.1)', 
          color: '#6b7280' 
        };
      default:
        return {};
    }
  };

  const currentApplication = applications.length > 0 ? applications[0] : null;
  
  const handleModalContinue = () => {
    setShowAcceptedModal(false);
    // Navigate to the actual active project
    if (activeProject) {
      navigate(`/student/project/${activeProject.id}`);
    }
  };
  
  const handleWithdrawApplication = async (application) => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      try {
        await updateDoc(doc(db, 'applications', application.id), {
          status: 'withdrawn',
          withdrawnAt: new Date().toISOString()
        });
        
        // Refresh applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid),
          orderBy('appliedAt', 'desc')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setApplications(applicationsData);
        
        alert('Application withdrawn successfully.');
      } catch (error) {
        console.error('Error withdrawing application:', error);
        alert('Failed to withdraw application. Please try again.');
      }
    }
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
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2>Student Dashboard</h2>
            <p>Manage your project and application status</p>
          </div>
          
          <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Main Content */}
          <div>
            {/* Current Status Section */}
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Current Status</h3>
              
              {activeProject ? (
                // Student has an active project
                <div>
                  <div style={{ 
                    padding: '20px', 
                    borderRadius: '12px', 
                    background: 'rgba(34, 197, 94, 0.1)',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: 'var(--success)' 
                      }}></div>
                      <span style={{ color: 'var(--success)', fontWeight: '600' }}>Active Project</span>
                    </div>
                    <h4 style={{ marginBottom: '10px' }}>{activeProject.title}</h4>
                    <p style={{ color: '#666', marginBottom: '15px' }}>{activeProject.description?.slice(0, 150)}...</p>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontWeight: '500' }}>Company:</span>
                        <span style={{ marginLeft: '8px' }}>{activeProject.companyName || 'Company'}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '500' }}>Duration:</span>
                        <span style={{ marginLeft: '8px' }}>{activeProject.duration}</span>
                      </div>
                    </div>
                    
                    <Link 
                      to={`/student/project/${activeProject.id}`} 
                      className="btn btn-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      Go to Project Portal
                    </Link>
                  </div>
                </div>
              ) : currentApplication ? (
                // Student has a pending/rejected application
                <div>
                  <div style={{ 
                    padding: '20px', 
                    borderRadius: '12px', 
                    background: getStatusClass(currentApplication.status).background,
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: getStatusClass(currentApplication.status).color
                      }}></div>
                      <span style={{ 
                        color: getStatusClass(currentApplication.status).color, 
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        Application {currentApplication.status}
                      </span>
                    </div>
                    <h4 style={{ marginBottom: '10px' }}>{currentApplication.projectTitle}</h4>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontWeight: '500' }}>Applied:</span>
                        <span style={{ marginLeft: '8px' }}>{formatDate(currentApplication.appliedAt)}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '500' }}>Availability:</span>
                        <span style={{ marginLeft: '8px' }}>{currentApplication.availability}</span>
                      </div>
                    </div>
                    
                    {currentApplication.status === 'pending' && (
                      <>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                          Your application is being reviewed. You'll be notified once a decision is made.
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <Link 
                            to={`/projects/${currentApplication.projectId}`} 
                            className="btn btn-outline"
                            style={{ textDecoration: 'none' }}
                          >
                            View Project Details
                          </Link>
                          <button
                            onClick={() => handleWithdrawApplication(currentApplication)}
                            className="btn btn-outline"
                            style={{ 
                              color: 'var(--danger)', 
                              borderColor: 'var(--danger)' 
                            }}
                          >
                            Withdraw Application
                          </button>
                        </div>
                      </>
                    )}
                    
                    {currentApplication.status === 'rejected' && (
                      <>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                          Unfortunately, your application was not selected. You can apply to other projects.
                        </p>
                        <Link 
                          to={`/projects/${currentApplication.projectId}`} 
                          className="btn btn-outline"
                          style={{ textDecoration: 'none' }}
                        >
                          View Project Details
                        </Link>
                      </>
                    )}
                    
                    {currentApplication.status === 'withdrawn' && (
                      <>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                          You withdrew this application. You can apply to other projects.
                        </p>
                        <Link 
                          to="/projects" 
                          className="btn btn-primary"
                          style={{ textDecoration: 'none' }}
                        >
                          Browse Projects
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Student has no applications
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
                    📋
                  </div>
                  <h4 style={{ marginBottom: '10px' }}>No Active Applications</h4>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    You haven't applied to any projects yet. Start by browsing available projects.
                  </p>
                  <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
                </div>
              )}
            </div>
            
            {/* Application History */}
            {applications.length > 1 && (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ marginBottom: '20px' }}>Application History</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {applications.slice(1).map(application => (
                    <div 
                      key={application.id}
                      style={{ 
                        padding: '20px',
                        border: '1px solid #eee',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h5 style={{ marginBottom: '5px' }}>{application.projectTitle}</h5>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                          Applied on {formatDate(application.appliedAt)}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span 
                          style={{
                            ...getStatusClass(application.status),
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {application.status}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Link 
                            to={`/projects/${application.projectId}`}
                            style={{ 
                              color: 'var(--primary)', 
                              textDecoration: 'none',
                              fontSize: '14px'
                            }}
                          >
                            View Project
                          </Link>
                          
                          {application.status === 'pending' && (
                            <button
                              onClick={() => handleWithdrawApplication(application)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: 0
                              }}
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Profile Section */}
            <div style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '25px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                {studentProfile?.photoURL ? (
                  <img 
                    src={studentProfile.photoURL} 
                    alt="Profile"
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
                    backgroundColor: '#f47b7b',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '24px',
                    marginRight: '15px',
                    fontWeight: 'bold'
                  }}>
                    {studentProfile?.fullName ? studentProfile.fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                
                <div>
                  <h4 style={{ marginBottom: '5px' }}>
                    {studentProfile?.fullName || 'Complete Your Profile'}
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                    {studentProfile?.college || 'Add your university'}
                  </p>
                </div>
              </div>
              
              <Link 
                to="/student/profile" 
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
                  <span style={{ fontWeight: '500' }}>Applications Sent</span>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {applications.length}
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '500' }}>Active Projects</span>
                  <span style={{ 
                    background: activeProject ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    color: activeProject ? 'var(--success)' : '#6b7280',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {activeProject ? '1' : '0'}
                  </span>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500' }}>Profile Completeness</span>
                  <span style={{ 
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: 'var(--warning)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {studentProfile ? 
                      `${Math.round(((studentProfile.fullName ? 1 : 0) + 
                                   (studentProfile.college ? 1 : 0) + 
                                   (studentProfile.major ? 1 : 0) + 
                                   (studentProfile.bio ? 1 : 0) + 
                                   (studentProfile.skills?.length > 0 ? 1 : 0)) / 5 * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project Accepted Modal */}
        {showAcceptedModal && activeProject && (
          <ProjectAcceptedModal 
            project={activeProject}
            onClose={() => setShowAcceptedModal(false)}
            onContinue={handleModalContinue}
          />
        )}
      </div>
    </>
  );
};

export default StudentDashboard;