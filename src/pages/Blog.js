// src/pages/Blog.js
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Blog = () => {
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Blog</div>
          <h2>Coming Soon</h2>
          <p>We're working on creating valuable content for our community.</p>
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Our Blog is Coming Soon!</h3>
          <p style={{ marginBottom: '30px' }}>
            We're currently working on creating high-quality content that will help both students and companies 
            make the most of their Synked experience. Check back soon for:
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
              Success stories and case studies
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Tips for successful project collaboration
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Industry insights and trends
            </li>
            <li style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', color: 'var(--primary)' }}>✓</span>
              Career development resources
            </li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Blog;