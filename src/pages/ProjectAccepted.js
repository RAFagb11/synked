// src/pages/ProjectAccepted.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import confetti from 'canvas-confetti';

const ProjectAccepted = () => {
  const { projectId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Run confetti effect on load
  useEffect(() => {
    // Trigger confetti when component mounts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Trigger more confetti after a slight delay for a better effect
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 500);
  }, []);
  
  // Fetch project and company data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch project
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        setProject(projectData);
        
        // Fetch company
        const companyDoc = await getDoc(doc(db, 'companyProfiles', projectData.companyId));
        if (companyDoc.exists()) {
          setCompany({ id: companyDoc.id, ...companyDoc.data() });
        }
        
        // Update student's active projects count
        if (currentUser) {
          const studentProfileRef = doc(db, 'studentProfiles', currentUser.uid);
          const studentDoc = await getDoc(studentProfileRef);
          if (studentDoc.exists()) {
            await updateDoc(studentProfileRef, {
              activeProjects: (studentDoc.data().activeProjects || 0) + 1
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, currentUser]);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getTimeCommitment = (duration) => {
    switch(duration) {
      case '1-2 weeks':
        return 'Short-term (1-2 weeks)';
      case '2-4 weeks':
        return 'Medium-term (2-4 weeks)';
      case '1-2 months':
        return 'Longer-term (1-2 months)';
      case '3+ months':
        return 'Extended engagement (3+ months)';
      default:
        return duration;
    }
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
          <div>Loading project details...</div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '100px 0', textAlign: 'center', color: 'var(--danger)' }}>
          <div>Error: {error}</div>
          <Link to="/student/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Dashboard
          </Link>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--success)',
              color: 'white',
              fontSize: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              ✓
            </div>
            
            <h2 style={{ marginBottom: '10px' }}>Congratulations!</h2>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Your application for this project has been accepted. You're now part of the team!
            </p>
          </div>
          
          <div style={{ 
            padding: '30px', 
            border: '1px dashed var(--primary)', 
            borderRadius: '12px',
            backgroundColor: 'rgba(108, 99, 255, 0.05)',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {company && company.companyLogo ? (
                <img 
                  src={company.companyLogo} 
                  alt={company.companyName} 
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', marginRight: '15px' }}
                />
              ) : (
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '8px', 
                  background: 'var(--primary)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginRight: '15px'
                }}>
                  {company ? company.companyName.charAt(0) : 'C'}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{project.title}</h3>
                <div style={{ color: '#666' }}>
                  {company ? company.companyName : 'Company'} • {project.category}
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '20px',
              margin: '20px 0',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Start Date</div>
                <div>{formatDate(project.startDate || new Date())}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Time Commitment</div>
                <div>{getTimeCommitment(project.duration)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Compensation</div>
                <div>{project.isExperienceOnly ? 'Experience Only' : `$${project.compensation}`}</div>
              </div>
            </div>
            
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Required Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {project.skills?.map(skill => (
                  <span 
                    key={skill} 
                    style={{ 
                      backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                      color: 'var(--primary)',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '30px', maxWidth: '700px', margin: '0 auto' }}>
            <h3>Next Steps:</h3>
            <ol style={{ textAlign: 'left', lineHeight: 1.8 }}>
              <li>The company will reach out to schedule a kickoff meeting</li>
              <li>Add this project to your calendar</li>
              <li>Get to know your project dashboard to track deliverables and resources</li>
              <li>Keep all project-related communication within the platform</li>
            </ol>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <Link 
              to="/student/dashboard"
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Go to Dashboard
            </Link>
            <Link 
              to={`/projects/${projectId}/view`}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              View Project Details
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectAccepted;