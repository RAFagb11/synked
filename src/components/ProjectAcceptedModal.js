// src/components/ProjectAcceptedModal.js
import React from 'react';

const ProjectAcceptedModal = ({ project, onClose, onContinue }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
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
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button 
              onClick={onContinue} 
              className="btn btn-primary"
              style={{ padding: '15px 40px', fontSize: '16px' }}
            >
              Go to My Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAcceptedModal;