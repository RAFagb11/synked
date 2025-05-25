import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
        
        // Sort applications by date (newest first)
        applications.sort((a, b) => {
          const aTime = a.appliedAt?.seconds || 0;
          const bTime = b.appliedAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setApplications(applications);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, projectId]);

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
    const fetchApplications = async () => {
      try {
        const applicationsQ = query(
          collection(db, 'applications'),
          where('projectId', '==', projectId)
        );
        
        const applicationsSnapshot = await getDocs(applicationsQ);
        const applicationsList = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort applications by date (newest first)
        applicationsList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setApplications(applicationsList);
      } catch (err) {
        console.error('Error refreshing applications:', err);
      }
    };
    
    fetchApplications();
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ marginBottom: '30px' }}>
          <Link 
            to="/company/dashboard"
            className="btn btn-outline"
          >
            &larr; Dashboard
          </Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading applications...</div>
        ) : error ? (
          <div style={{ color: 'var(--danger)', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : (
          <>
            <div className="section-header" style={{ marginBottom: '30px' }}>
              <h2>Project Applications</h2>
              <p>{applications.length} application{applications.length !== 1 ? 's' : ''} received</p>
            </div>
            
            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                <h3>No applications yet</h3>
                <p style={{ marginTop: '15px' }}>When students apply to this project, their applications will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {applications.map(app => (
                  <div key={app.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ marginBottom: '5px' }}>Application from {app.studentName || 'Student'}</h4>
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
                      <p><strong>Availability:</strong> {app.availability}</p>
                      {app.applicationAnswer && <p><strong>Answer:</strong> {app.applicationAnswer.slice(0, 100)}...</p>}
                    </div>
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
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