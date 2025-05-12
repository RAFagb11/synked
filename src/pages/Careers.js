// src/pages/Careers.js
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Careers = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    resume: null,
    coverLetter: '',
    position: 'general'
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        resume: null,
        coverLetter: '',
        position: 'general'
      });
      
      // Reset the file input
      const fileInput = document.getElementById('resume');
      if (fileInput) fileInput.value = '';
    }, 1500);
  };
  
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Join Our Team</div>
          <h2>Careers at Synked</h2>
          <p>Help us connect talented students with impactful project experiences</p>
        </div>
        
        <div style={{ maxWidth: '800px', margin: '50px auto 0' }}>
          <div style={{ 
            backgroundColor: '#f5f7ff',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '50px'
          }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>We're Growing!</h3>
            <p style={{ marginBottom: '20px' }}>
              At Synked, we're on a mission to transform how students gain real-world experience and how companies discover emerging talent. We're building a team of passionate individuals who believe in the power of meaningful project-based work.
            </p>
            <p>
              While we don't have any specific openings at this moment, we're always interested in connecting with talented people who share our vision. If you're passionate about education, technology, and creating opportunities, we'd love to hear from you!
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ marginBottom: '25px' }}>Submit Your Application</h3>
            
            {submitted ? (
              <div style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: 'var(--success)',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Application Received!</h4>
                <p>Thank you for your interest in joining Synked. We've received your application and will contact you if there's a potential fit.</p>
                <button 
                  className="btn btn-outline"
                  style={{ marginTop: '15px' }}
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="position">Area of Interest</label>
                  <select 
                    id="position" 
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  >
                    <option value="general">General Application</option>
                    <option value="engineering">Engineering</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="customer-success">Customer Success</option>
                    <option value="business-development">Business Development</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="resume">Resume/CV (PDF)</label>
                  <input 
                    type="file" 
                    id="resume" 
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    style={{ 
                      border: '1px dashed #ddd',
                      padding: '20px',
                      backgroundColor: '#f9f9f9'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="coverLetter">Cover Letter</label>
                  <textarea 
                    id="coverLetter" 
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Tell us why you're interested in joining Synked and what you would bring to the team."
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ marginTop: '10px', padding: '12px 25px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
          
          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px' }}>Why Work With Us?</h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginTop: '30px'
            }}>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚀</div>
                <h4 style={{ marginBottom: '10px' }}>Meaningful Impact</h4>
                <p>Help create opportunities that change students' careers and add value to companies.</p>
              </div>
              
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌱</div>
                <h4 style={{ marginBottom: '10px' }}>Growth & Learning</h4>
                <p>Join a team that values continuous improvement and personal development.</p>
              </div>
              
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💼</div>
                <h4 style={{ marginBottom: '10px' }}>Modern Workplace</h4>
                <p>Enjoy flexibility, competitive benefits, and a collaborative culture.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Careers;