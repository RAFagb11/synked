// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const StudentDashboard = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        // Get all applications instead of using a compound query
        const applicationsRef = collection(db, 'applications');
        const applicationsSnap = await getDocs(applicationsRef);
        
        // Filter in JavaScript instead of in the query
        const userApplications = [];
        applicationsSnap.forEach(doc => {
          const data = doc.data();
          if (data.studentId === currentUser.uid) {
            userApplications.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Sort in JavaScript
        userApplications.sort((a, b) => {
          // Sort by createdAt in descending order
          if (a.createdAt && b.createdAt) {
            if (a.createdAt.seconds && b.createdAt.seconds) {
              return b.createdAt.seconds - a.createdAt.seconds;
            } else if (a.createdAt > b.createdAt) {
              return -1;
            } else {
              return 1;
            }
          }
          return 0;
        });
        
        console.log('Applications found:', userApplications.length);
        setApplications(userApplications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to fetch student applications: ' + error.message);
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchApplications();
    }
  }, [currentUser]);
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      // Firestore timestamp
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      // ISO string
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  // Get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' };
      case 'pending':
      default:
        return { bg: 'rgba(251, 191, 36, 0.1)', color: 'var(--warning)' };
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2>Student Dashboard</h2>
          <p>Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}! Here are your applications.</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <Link to="/projects" className="btn btn-primary">
            Browse More Projects
          </Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>Loading your applications...</div>
        ) : error ? (
          <div style={{ color: 'var(--danger)', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <h3 style={{ marginBottom: '20px' }}>You haven't applied to any projects yet.</h3>
            <Link to="/projects" className="btn btn-primary">
              Browse Projects
            </Link>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Your Applications</h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {applications.map(application => (
                <div 
                  key={application.id} 
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    padding: '25px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h4>{application.projectTitle}</h4>
                    <span 
                      style={{ 
                        padding: '5px 12px', 
                        borderRadius: '50px', 
                        fontSize: '14px', 
                        backgroundColor: getStatusBadge(application.status).bg, 
                        color: getStatusBadge(application.status).color 
                      }}
                    >
                      {application.status === 'accepted' ? 'Accepted' : 
                       application.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ color: '#666' }}>
                      Applied on: {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ marginBottom: '10px' }}>Your Cover Letter:</h5>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{application.coverLetter}</p>
                  </div>
                  
                  <div>
                    <Link 
                      to={`/projects/${application.projectId}`} 
                      className="btn btn-outline"
                      style={{ fontSize: '14px', padding: '8px 15px' }}
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;