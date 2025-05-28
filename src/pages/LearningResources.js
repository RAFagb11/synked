// src/pages/LearningResources.js
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const LearningResources = () => {
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Learning Resources</div>
          <h2>Coming Soon</h2>
          <p>We're building a comprehensive learning platform to help you succeed.</p>
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Learning Resources Coming Soon!</h3>
          <p style={{ marginBottom: '30px' }}>
            We're developing a comprehensive set of learning resources to help you enhance your skills 
            and make the most of your project experiences. Our platform will include:
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
              Interactive tutorials and courses
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Project management best practices
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Industry-specific guides
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Professional development resources
            </li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LearningResources;