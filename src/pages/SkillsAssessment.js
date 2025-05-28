// src/pages/SkillsAssessment.js
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const SkillsAssessment = () => {
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Skills Assessment</div>
          <h2>Coming Soon</h2>
          <p>We're building a comprehensive skills assessment platform.</p>
        </div>
        
        <div style={{ 
          maxWidth: '600px', 
          margin: '50px auto',
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Skills Assessment Platform Coming Soon!</h3>
          <p style={{ marginBottom: '30px' }}>
            We're developing a comprehensive skills assessment platform to help you validate your abilities 
            and stand out to potential project partners. Our platform will include:
          </p>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            textAlign: 'left',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Technical skill assessments
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Project management evaluations
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Soft skills analysis
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Verified skills badges
            </li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SkillsAssessment;