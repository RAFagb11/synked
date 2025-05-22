// src/pages/CreateProfile.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const CreateProfile = () => {
  const { currentUser, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Student fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Predefined options
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
  
  // Handle photo/logo file selection
  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (userType === 'student') {
        // Student profile creation
        let photoURL = null;
        
        // Upload profile photo if provided
        if (profilePhoto) {
          const photoRef = ref(storage, `profilePhotos/${currentUser.uid}`);
          await uploadBytes(photoRef, profilePhoto);
          photoURL = await getDownloadURL(photoRef);
        }
        
        // Prepare and save student profile
        const profileData = {
          fullName,
          email: currentUser.email,
          bio,
          education,
          skills: skills.split(',').map(skill => skill.trim()),
          portfolioUrl,
          linkedinUrl,
          githubUrl,
          photoURL,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'studentProfiles', currentUser.uid), profileData);
        
      } else if (userType === 'company') {
        // Company profile creation
        let logoURL = null;
        
        // Upload company logo if provided
        if (companyLogo) {
          const logoRef = ref(storage, `companyLogos/${currentUser.uid}`);
          await uploadBytes(logoRef, companyLogo);
          logoURL = await getDownloadURL(logoRef);
        }
        
        // Prepare and save company profile
        const profileData = {
          companyName,
          contactName,
          email: currentUser.email,
          companyDescription,
          industry,
          location,
          companySize,
          companyWebsite,
          contactEmail,
          logoURL,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'companyProfiles', currentUser.uid), profileData);
      }
      
      // Update user document to mark profile as completed
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileCompleted: true
      });
      
      // Navigate to appropriate dashboard
      navigate(userType === 'student' ? '/student/dashboard' : '/company/dashboard');
      
    } catch (error) {
      setError('Failed to create profile: ' + error.message);
      setLoading(false);
    }
  };
  
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
              {/* Student Profile Fields */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 200px' }}>
                  <div style={{ 
                    width: '200px', 
                    height: '200px', 
                    borderRadius: '50%', 
                    background: '#f1f1f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #ddd',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '15px'
                  }}>
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ color: '#999', fontSize: '18px' }}>Upload Photo</span>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-block' }}>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      Choose Photo
                    </label>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                      Upload a professional photo
                    </p>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
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
                </div>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Portfolio URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  placeholder="Your portfolio website"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    placeholder="Your LinkedIn profile"
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GitHub URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    placeholder="Your GitHub profile"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Company Profile Fields */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 200px' }}>
                  <div style={{ 
                    width: '200px', 
                    height: '200px', 
                    borderRadius: '10px', 
                    background: '#f1f1f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #ddd',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '15px'
                  }}>
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }}
                      />
                    ) : (
                      <span style={{ color: '#999', fontSize: '18px' }}>Upload Logo</span>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-block' }}>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                      Choose Logo
                    </label>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                      Upload your company logo
                    </p>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
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
                </div>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
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
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Website</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    placeholder="https://www.company.com"
                  />
                </div>
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