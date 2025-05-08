// src/pages/CreateProfile.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const CreateProfile = () => {
  const { currentUser, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Student fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const profileData = userType === 'student'
        ? {
            fullName,
            email: currentUser.email,
            bio,
            education,
            skills: skills.split(',').map(skill => skill.trim()),
            portfolioUrl,
            linkedinUrl,
            githubUrl,
            createdAt: new Date().toISOString()
          }
        : {
            companyName,
            contactName,
            email: currentUser.email,
            companyDescription,
            industry,
            location,
            companySize,
            companyWebsite,
            contactEmail,
            createdAt: new Date().toISOString()
          };
          
      // Save profile with correct collection name
      const collectionName = userType === 'student' ? 'studentProfiles' : 'companyProfiles';
      await setDoc(doc(db, collectionName, currentUser.uid), profileData);
      
      // Update user document to mark profile as completed
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { profileCompleted: true });
      
      // Navigate to appropriate dashboard
      navigate(userType === 'student' ? '/student/dashboard' : '/company/dashboard');
    } catch (error) {
      setError('Failed to create profile: ' + error.message);
      setLoading(false);
    }
  };
  
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'E-commerce',
    'Marketing',
    'Consulting',
    'Manufacturing',
    'Other'
  ];
  
  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501+ employees'
  ];
  
  if (!userType) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
          <p>Loading profile type...</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '800px', margin: '60px auto', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '40px' }}>
          <div className="feature-badge">
            {userType === 'student' ? 'Student Profile' : 'Company Profile'}
          </div>
          <h2>Complete Your Profile</h2>
          <p>
            {userType === 'student' 
              ? 'Tell companies about your skills and experience'
              : 'Share your company details with potential talent'
            }
          </p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {userType === 'student' ? (
            <>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px' }}
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Education</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="E.g. Computer Science, University Name"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="E.g. React, JavaScript, Python"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Portfolio URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your portfolio website"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your LinkedIn profile"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GitHub URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your GitHub profile"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your company name"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Contact Person Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your name"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Description</label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px' }}
                  placeholder="Tell us about your company..."
                ></textarea>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select size</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Website</label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="https://www.company.com"
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="contact@company.com"
                />
              </div>
            </>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '15px' }}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateProfile;