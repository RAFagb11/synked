// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const StudentDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [activeProjects, setActiveProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recentDeliverables, setRecentDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Get user document to check profileCompleted flag
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        // Get student profile
        const profileDoc = await getDoc(doc(db, 'studentProfiles', currentUser.uid));
        if (profileDoc.exists()) {
          // Add the profileCompleted flag to the profile object
          setProfile({ 
            id: profileDoc.id, 
            ...profileDoc.data(),
            // Use the flag from userData if it exists, otherwise false
            profileCompleted: userData?.profileCompleted === true
          });
        }
        
        // Get active projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('enrolledStudents', 'array-contains', currentUser.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = [];
        
        for (const projectDoc of projectsSnapshot.docs) {
          const projectData = { id: projectDoc.id, ...projectDoc.data() };
          
          // Get company info
          const companyDoc = await getDoc(doc(db, 'companyProfiles', projectData.companyId));
          if (companyDoc.exists()) {
            projectData.company = { id: companyDoc.id, ...companyDoc.data() };
          }
          
          // Get project deliverables to calculate progress
          const deliverablesQuery = query(
            collection(db, 'deliverables'),
            where('projectId', '==', projectDoc.id)
          );
          
          const deliverablesSnapshot = await getDocs(deliverablesQuery);
          const deliverablesData = deliverablesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Get student submissions for this project
          const submissionsQuery = query(
            collection(db, 'submissions'),
            where('projectId', '==', projectDoc.id),
            where('studentId', '==', currentUser.uid)
          );
          
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const submissionsData = submissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Calculate progress
          const totalDeliverables = deliverablesData.length;
          const completedDeliverables = submissionsData.filter(s => s.status === 'approved').length;
          const progress = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;
          
          projectData.progress = progress;
          projectData.deliverables = deliverablesData;
          projectData.submissions = submissionsData;
          
          projectsList.push(projectData);
        }
        
        setActiveProjects(projectsList);
        
        // Get applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid),
          orderBy('appliedAt', 'desc')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsList = [];
        
        for (const appDoc of applicationsSnapshot.docs) {
          const appData = { id: appDoc.id, ...appDoc.data() };
          
          // Get project info
          if (appData.projectId) {
            const projectDoc = await getDoc(doc(db, 'projects', appData.projectId));
            if (projectDoc.exists()) {
              appData.project = { id: projectDoc.id, ...projectDoc.data() };
              
              // Get company info
              if (appData.project.companyId) {
                const companyDoc = await getDoc(doc(db, 'companyProfiles', appData.project.companyId));
                if (companyDoc.exists()) {
                  appData.company = { id: companyDoc.id, ...companyDoc.data() };
                }
              }
            }
          }
          
          applicationsList.push(appData);
        }
        
        setApplications(applicationsList);
        
        // Get recent deliverables from all projects
        const recentDeliverablesData = [];
        
        for (const project of projectsList) {
          // Get deliverables that are pending or in progress
          const activeDeliverables = project.deliverables.filter(d => 
            d.status === 'pending' || d.status === 'in-progress' || d.status === 'rejected'
          );
          
          for (const deliverable of activeDeliverables) {
            recentDeliverablesData.push({
              ...deliverable,
              project: {
                id: project.id,
                title: project.title,
                company: project.company
              }
            });
          }
        }
        
        // Sort by due date, closest first
        recentDeliverablesData.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            const aDate = a.dueDate.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
            const bDate = b.dueDate.seconds ? new Date(b.dueDate.seconds * 1000) : new Date(b.dueDate);
            return aDate - bDate;
          }
          return 0;
        });
        
        setRecentDeliverables(recentDeliverablesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchStudentData();
    }
  }, [currentUser]);
  
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
      case 'accepted':
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
  
  // Get application status label
  const getApplicationStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Not Selected';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div>Loading your dashboard...</div>
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
        </div>
      </>
    );
  }
  
  // Check if profile is complete
  const isProfileComplete = profile?.profileCompleted || 
  (profile && 
    profile.firstName && 
    profile.lastName && 
    profile.university && 
    profile.major);
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '40px 0' }}>
        {!isProfileComplete && (
          <div style={{ 
            background: 'rgba(251, 191, 36, 0.1)', 
            color: 'var(--warning)', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Complete your profile</strong> - Add your details to increase your chances of getting selected for projects
            </div>
            <Link to="/create-profile" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Complete Profile
            </Link>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2>Student Dashboard</h2>
          <Link to="/projects" className="btn btn-primary">
            Browse Projects
          </Link>
        </div>
        
        {/* Dashboard Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '10px' }}>Active Projects</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>
              {activeProjects.length}
            </div>
            <div>
              {activeProjects.length > 0 ? (
                <span>Projects in progress</span>
              ) : (
                <Link to="/projects" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  Browse open projects
                </Link>
              )}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '10px' }}>Pending Applications</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div>Applications awaiting review</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '10px' }}>Upcoming Deliverables</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>
              {recentDeliverables.length}
            </div>
            <div>Tasks to complete</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '10px' }}>Profile Completion</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>
              {isProfileComplete ? '100%' : '50%'}
            </div>
            <div>
              {isProfileComplete ? (
                <span>Your profile is complete</span>
              ) : (
                <Link to="/create-profile" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  Complete your profile
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '30px' }}>
          <button 
            onClick={() => setActiveTab('projects')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'projects' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'projects' ? '600' : '400',
              color: activeTab === 'projects' ? 'var(--primary)' : 'inherit'
            }}
          >
            My Projects
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'applications' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'applications' ? '600' : '400',
              color: activeTab === 'applications' ? 'var(--primary)' : 'inherit'
            }}
          >
            Applications
          </button>
          <button 
            onClick={() => setActiveTab('deliverables')}
            style={{ 
              padding: '12px 20px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              borderBottom: activeTab === 'deliverables' ? '3px solid var(--primary)' : 'none',
              fontWeight: activeTab === 'deliverables' ? '600' : '400',
              color: activeTab === 'deliverables' ? 'var(--primary)' : 'inherit'
            }}
          >
            Upcoming Deliverables
          </button>
        </div>
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Active Projects</h3>
            
            {activeProjects.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '20px' }}>You don't have any active projects yet.</p>
                <Link to="/projects" className="btn btn-primary">
                  Browse Available Projects
                </Link>
              </div>
            ) : (
              <div className="feature-grid">
                {activeProjects.map(project => (
                  <div 
                    key={project.id} 
                    className="feature-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/student/project/${project.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div className="feature-badge">{project.category}</div>
                      <div>
                        <strong>{project.progress}%</strong> Complete
                      </div>
                    </div>
                    
                    <h3>{project.title}</h3>
                    
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '15px 0' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${project.progress}%`, 
                          background: 'linear-gradient(to right, var(--gradient-start), var(--gradient-end))',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}
                      ></div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Company:</span>
                        <span>{project.company?.companyName || 'Company'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>Deliverables:</span>
                        <span>{project.deliverables.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Completed:</span>
                        <span>{project.submissions.filter(s => s.status === 'approved').length} / {project.deliverables.length}</span>
                      </div>
                    </div>
                    
                    <button className="btn btn-primary" style={{ width: '100%' }}>
                      Go to Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>My Applications</h3>
            
            {applications.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '20px' }}>You haven't applied to any projects yet.</p>
                <Link to="/projects" className="btn btn-primary">
                  Browse Available Projects
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {applications.map(app => (
                  <div 
                    key={app.id} 
                    style={{ 
                      background: 'white', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <h3 style={{ marginBottom: '10px' }}>{app.project?.title || app.projectTitle}</h3>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <div className="feature-badge">
                          {app.project?.category || 'Project'}
                        </div>
                        <div className={`feature-badge ${getStatusClass(app.status)}`}>
                          {getApplicationStatusLabel(app.status)}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <strong>Company:</strong> {app.company?.companyName || app.project?.company?.companyName || 'Company'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <strong>Applied:</strong> {formatDate(app.appliedAt)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {app.status === 'accepted' && (
                        <Link to={`/student/project/${app.projectId}`} className="btn btn-primary">
                          Go to Project
                        </Link>
                      )}
                      
                      {app.project?.id && app.status === 'pending' && (
                        <Link to={`/projects/${app.project.id}`} className="btn btn-outline">
                          View Listing
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Deliverables Tab */}
        {activeTab === 'deliverables' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Upcoming Deliverables</h3>
            
            {recentDeliverables.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '30px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center'
              }}>
                <p>You don't have any pending deliverables.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {recentDeliverables.map(deliverable => {
                  // Calculate days remaining
                  const dueDate = deliverable.dueDate?.seconds 
                    ? new Date(deliverable.dueDate.seconds * 1000) 
                    : new Date(deliverable.dueDate);
                  
                  const today = new Date();
                  const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={deliverable.id} 
                      style={{ 
                        background: 'white', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        borderLeft: daysRemaining <= 3 
                          ? '4px solid var(--danger)' 
                          : daysRemaining <= 7 
                          ? '4px solid var(--warning)' 
                          : '4px solid var(--primary)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ marginBottom: '5px' }}>{deliverable.title}</h3>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {deliverable.project.title} - {deliverable.project.company?.companyName || 'Company'}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div className={`feature-badge ${
                            daysRemaining <= 3 
                              ? 'danger' 
                              : daysRemaining <= 7 
                              ? 'warning' 
                              : 'primary'
                          }`}>
                            {daysRemaining <= 0 
                              ? 'Due Today' 
                              : daysRemaining === 1 
                              ? '1 Day Left' 
                              : `${daysRemaining} Days Left`}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                            Due: {formatDate(deliverable.dueDate)}
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ marginBottom: '20px' }}>{deliverable.description}</p>
                      
                      <Link to={`/student/project/${deliverable.project.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                        Go to Project
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;