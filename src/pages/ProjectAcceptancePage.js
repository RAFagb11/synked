// src/pages/ProjectAcceptancePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';

const ProjectAcceptancePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setLoading(false);
      }
    };
    
    fetchProject();
    
    // Mark this page as seen in localStorage so it doesn't show again
    localStorage.setItem(`acceptance-seen-${projectId}`, 'true');
  }, [projectId]);
  
  const handleContinue = () => {
    navigate(`/student/project/${projectId}`);
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="section-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '80px 0', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--success)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px' 
            }}>
              <span style={{ fontSize: '40px', color: 'white' }}>✓</span>
            </div>
            <h2>Congratulations!</h2>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              You've been accepted to work on the project:
            </p>
            <h3 style={{ color: 'var(--primary)', marginBottom: '30px' }}>{project?.title}</h3>
            
            <div style={{ padding: '20px', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', marginBottom: '30px' }}>
              <p>This project will now appear on your dashboard, and you can access all project materials, submit deliverables, and communicate with the company directly through your project workspace.</p>
            </div>
            
            <p style={{ marginBottom: '30px' }}>Remember that you can only work on one project at a time. Completing this project successfully will build your portfolio and create valuable connections.</p>
            
            <button 
              onClick={handleContinue} 
              className="btn btn-primary"
              style={{ padding: '15px 40px', fontSize: '16px' }}
            >
              Go to My Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectAcceptancePage;