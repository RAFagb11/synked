// src/pages/AboutUs.js
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Our Story</div>
          <h2>About Synked</h2>
        </div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Synked was founded with a simple but powerful mission: to bridge the gap between talented students 
            seeking real-world experience and companies looking for fresh perspectives and innovative solutions.
          </p>
          
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Our Mission</h3>
          <p style={{ marginBottom: '30px' }}>
            We're dedicated to creating a seamless platform that connects talented students with companies 
            for impactful project experiences that benefit everyone. We believe that meaningful project work 
            during education creates better-prepared professionals and helps companies discover exceptional talent.
          </p>
          
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Our Vision</h3>
          <p style={{ marginBottom: '30px' }}>
            We envision a world where every student has access to valuable, real-world experience before graduation, 
            and where companies of all sizes can easily tap into the creativity and fresh perspectives that students offer. 
            By facilitating these connections, we're working to transform education-to-career pathways.
          </p>
          
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Our Values</h3>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                minWidth: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '24px',
                marginRight: '20px'
              }}>
                🔄
              </div>
              <div>
                <h4 style={{ marginBottom: '10px' }}>Mutual Benefit</h4>
                <p>We create opportunities that genuinely benefit both students and companies, ensuring value flows in both directions.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                minWidth: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '24px',
                marginRight: '20px'
              }}>
                🚀
              </div>
              <div>
                <h4 style={{ marginBottom: '10px' }}>Growth Mindset</h4>
                <p>We believe in continuous learning and improvement, for our users and ourselves.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                minWidth: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '24px',
                marginRight: '20px'
              }}>
                🤝
              </div>
              <div>
                <h4 style={{ marginBottom: '10px' }}>Inclusivity</h4>
                <p>We're committed to creating opportunities for students from all backgrounds and connecting them with diverse companies.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ 
                minWidth: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '24px',
                marginRight: '20px'
              }}>
                💡
              </div>
              <div>
                <h4 style={{ marginBottom: '10px' }}>Innovation</h4>
                <p>We encourage creative problem-solving and fresh perspectives in all the projects we facilitate.</p>
              </div>
            </div>
          </div>
          
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Our Team</h3>
          <p style={{ marginBottom: '20px' }}>
            We're a team of educators, industry professionals, and technologists who are passionate about creating 
            meaningful connections between education and industry. Our diverse backgrounds and experiences inform 
            our approach to building a platform that truly serves the needs of both students and companies.
          </p>
          
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h3 style={{ marginBottom: '20px' }}>Ready to get started?</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
              <Link to="/register" className="btn btn-primary">Sign Up Free</Link>
              <Link to="/projects" className="btn btn-outline">Browse Projects</Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutUs;