// src/pages/ContactUs.js
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'student' // Default value
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
        subject: '',
        message: '',
        userType: 'student'
      });
    }, 1500);
  };
  
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Get In Touch</div>
          <h2>Contact Us</h2>
          <p>Have questions or feedback? We'd love to hear from you.</p>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          marginTop: '60px',
          maxWidth: '1200px',
          margin: '60px auto 0'
        }}>
          {/* Contact Info */}
          <div>
            <h3 style={{ marginBottom: '25px', color: 'var(--primary)' }}>Contact Information</h3>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ 
                  minWidth: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontSize: '20px',
                  marginRight: '15px'
                }}>
                  📞
                </div>
                <div>
                  <h4 style={{ marginBottom: '5px' }}>Phone</h4>
                  <p>(555) 123-4567</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ 
                  minWidth: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontSize: '20px',
                  marginRight: '15px'
                }}>
                  ✉️
                </div>
                <div>
                  <h4 style={{ marginBottom: '5px' }}>Email</h4>
                  <p>hello@synked.com</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ 
                  minWidth: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(108, 99, 255, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontSize: '20px',
                  marginRight: '15px'
                }}>
                  📍
                </div>
                <div>
                  <h4 style={{ marginBottom: '5px' }}>Address</h4>
                  <p>123 Innovation Way<br />Lewisville, TX 75057<br />United States</p>
                </div>
              </div>
            </div>
            
            <h3 style={{ marginBottom: '15px', marginTop: '40px', color: 'var(--primary)' }}>Business Hours</h3>
            <p style={{ marginBottom: '10px' }}>Monday - Friday: 9:00 AM - 6:00 PM CST</p>
            <p>Saturday & Sunday: Closed</p>
            
            <h3 style={{ marginBottom: '15px', marginTop: '40px', color: 'var(--primary)' }}>Connect With Us</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#" className="social-link">f</a>
              <a href="#" className="social-link">in</a>
              <a href="#" className="social-link">t</a>
              <a href="#" className="social-link">ig</a>
            </div>
          </div>
          
          {/* Contact Form */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ marginBottom: '25px' }}>Send Us a Message</h3>
            
            {submitted ? (
              <div style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: 'var(--success)',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Message Sent!</h4>
                <p>Thank you for contacting us. We've received your message and will get back to you as soon as possible.</p>
                <button 
                  className="btn btn-outline"
                  style={{ marginTop: '15px' }}
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
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
                  <label htmlFor="userType">I am a</label>
                  <select 
                    id="userType" 
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                  >
                    <option value="student">Student</option>
                    <option value="company">Company</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    required
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ marginTop: '10px', width: '100%', padding: '12px' }}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
        
        {/* FAQ Section */}
        <div style={{ marginTop: '80px', maxWidth: '800px', margin: '80px auto 0' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h3>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>How does Synked work?</h4>
            <p>Synked connects talented students with companies looking for project-based assistance. Companies post projects, students apply, and once matched, both parties collaborate through our platform to complete meaningful work.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Is Synked free to use?</h4>
            <p>Synked is free for students to create profiles and apply to projects. Companies can post their first project for free, with affordable subscription plans available for ongoing needs.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>How are students vetted?</h4>
            <p>Students create detailed profiles showcasing their skills, education, and previous work. They can also complete optional skill assessments to verify their abilities in specific areas.</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Can I use Synked for internships?</h4>
            <p>Synked is designed primarily for project-based work rather than traditional internships. However, many companies do convert successful project collaborations into internship or employment opportunities.</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContactUs;