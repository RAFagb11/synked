import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import ApplicationModal from '../components/ApplicationModal';
import { getProjectApplications } from '../services/applicationService';
import { getProjectById } from '../services/projectService';

const ProjectApplications = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !projectId) return;
      
      try {
        // Fetch project details
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Verify project belongs to current company
        if (projectData.companyId !== currentUser.uid) {
          setError("You don't have permission to view these applications");
          setLoading(false);
          return;
        }
        
        // Fetch applications for this project - SIMPLE QUERY
        const applications = await getProjectApplications(projectId);
        
        // Fetch student profiles for each application
        const applicationsWithProfiles = await Promise.all(
          applications.map(async (app) => {
            try {
              const studentDoc = await getDoc(doc(db, 'studentProfiles', app.studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                return {
                  ...app,
                  studentProfile: {
                    fullName: studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student',
                    photoURL: studentData.photoURL || '',
                    major: studentData.major || 'Not specified',
                    college: studentData.college || studentData.university || 'Not specified',
                    email: studentData.email || ''
                  }
                };
              }
              return app;
            } catch (error) {
              console.error('Error fetching student profile:', error);
              return app;
            }
          })
        );
        
        // Filter out withdrawn applications and sort by date (newest first)
        const filteredApplications = applicationsWithProfiles
          .filter(app => app.status !== 'withdrawn')
          .sort((a, b) => {
            const aTime = a.appliedAt?.seconds || a.appliedAt?.toDate?.() || 0;
            const bTime = b.appliedAt?.seconds || b.appliedAt?.toDate?.() || 0;
            return bTime - aTime;
          });
        
        setApplications(filteredApplications);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, projectId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    try {
      let date;
      if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return 'Recently';
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Recently';
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
    window.location.reload();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(251, 191, 36, 0.1)', color: 'var(--warning)' };
      case 'accepted':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280' };
    }
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <Link 
            to="/company/dashboard"
            className="btn btn-outline"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading applications...</div>
          </div>
        ) : error ? (
          <div style={{ 
            color: 'var(--danger)', 
            padding: '24px', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: '600' }}>
                {project?.title || 'Project'} Applications
              </h2>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>
                {applications.length} {applications.length === 1 ? 'candidate has' : 'candidates have'} applied
              </p>
            </div>
            
            {applications.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 40px', 
                background: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '32px'
                }}>
                  📋
                </div>
                <h3 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>No applications yet</h3>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  When students apply to this project, their applications will appear here.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px' 
              }}>
                {applications.map(app => {
                  const statusStyle = getStatusColor(app.status);
                  
                  return (
                    <div key={app.id} style={{ 
                      background: 'white', 
                      padding: '24px', 
                      borderRadius: '16px', 
                      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* All Info in One Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {/* Left Side - Profile and Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Profile Picture */}
                            <div style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              background: app.studentProfile?.photoURL ? 'none' : 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '22px',
                              fontWeight: '500',
                              color: app.studentProfile?.photoURL ? 'transparent' : 'white',
                              flexShrink: 0
                            }}>
                              {app.studentProfile?.photoURL ? (
                                <img 
                                  src={app.studentProfile.photoURL} 
                                  alt={app.studentProfile?.fullName || 'Student'} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                (app.studentProfile?.fullName || app.studentName || 'S').charAt(0).toUpperCase()
                              )}
                            </div>
                            
                            <div>
                              <h4 style={{ 
                                marginBottom: '4px', 
                                fontSize: '17px', 
                                fontWeight: '600',
                                color: '#111827'
                              }}>
                                {app.studentProfile?.fullName || app.studentName || 'Student'}
                              </h4>
                              <p style={{ 
                                color: '#6b7280', 
                                fontSize: '13px',
                                margin: 0,
                                lineHeight: '1.4'
                              }}>
                                {app.studentProfile?.college || 'University'}
                                <br />
                                {app.studentProfile?.major || 'Major'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Right Side - Status and Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ 
                                color: '#9ca3af', 
                                fontSize: '12px',
                                margin: '0 0 4px 0'
                              }}>
                                Applied {formatDate(app.appliedAt)}
                              </p>
                              <span style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'capitalize',
                                display: 'inline-block'
                              }}>
                                {app.status}
                              </span>
                            </div>
                            
                            {app.videoUrl && (
                              <button 
                                onClick={() => window.open(app.videoUrl, '_blank')}
                                className="btn btn-outline"
                                style={{
                                  padding: '6px',
                                  fontSize: '16px',
                                  borderRadius: '6px',
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Watch Video Introduction"
                              >
                                🎥
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button 
                          onClick={() => handleViewApplication(app)}
                          className="btn btn-primary"
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '8px',
                            width: '100%'
                          }}
                        >
                          View Application
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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

export default ProjectApplications;