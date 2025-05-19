// src/pages/CompanyProfileSetup.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const CompanyProfileSetup = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [location, setLocation] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Marketing',
    'Entertainment',
    'Non-profit',
    'Consulting',
    'Other'
  ];
  
  const companySizes = [
    'Solo/Freelancer',
    '2-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];
  
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      
      // Preview the logo
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      let logoURL = '';
      
      // Upload logo if provided
      if (logoFile) {
        const logoRef = ref(storage, `companyLogos/${currentUser.uid}`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
      }
      
      // Prepare profile data
      const profileData = {
        companyName,
        industry,
        companySize,
        location,
        companyWebsite,
        companyDescription,
        logoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create company profile
      await setDoc(doc(db, 'companyProfiles', currentUser.uid), profileData);
      
      // Update user record to mark profile as complete
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileCompleted: true,
        companyName,
        logoURL
      });
      
      navigate('/company/dashboard');
    } catch (error) {
      setError('Error creating profile: ' + error.message);
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '800px', margin: '60px auto', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '40px' }}>
          <div className="feature-badge">Company Profile</div>
          <h2>Complete Your Company Profile</h2>
          <p>Tell students about your company and the types of projects you offer</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
                />
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
                    <option value="">Select company size</option>
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
                    placeholder="City, State, Country"
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Website</label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Description</label>
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '150px' }}
              placeholder="Tell students about your company, mission, and the types of projects you're looking to complete"
            ></textarea>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '15px' }}
          >
            {loading ? 'Creating Profile...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </>
  );
};

export default CompanyProfileSetup;