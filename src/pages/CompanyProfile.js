// src/pages/CompanyProfile.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';

const CompanyProfile = () => {
  const { currentUser } = useContext(AuthContext);
  
  const [profile, setProfile] = useState({
    companyName: '',
    email: currentUser ? currentUser.email : '',
    industry: '',
    companySize: '',
    location: '',
    companyDescription: '',
    companyWebsite: '',
    contactPerson: '',
    phone: '',
    linkedIn: '',
    companyLogo: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch company profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        console.log('Fetching company profile for user:', currentUser.uid);
        
        // Get company profile from the companyProfiles collection - this is the key change
        const companyRef = doc(db, 'companyProfiles', currentUser.uid);
        const companyDoc = await getDoc(companyRef);
        
        if (companyDoc.exists()) {
          console.log('Found company profile:', companyDoc.data());
          // Explicitly set all fields from the document to the state
          const data = companyDoc.data();
          setProfile({
            companyName: data.companyName || '',
            email: currentUser.email || '',
            industry: data.industry || '',
            companySize: data.companySize || '',
            location: data.location || '',
            companyDescription: data.companyDescription || '',
            companyWebsite: data.companyWebsite || '',
            contactPerson: data.contactPerson || '',
            phone: data.phone || '',
            linkedIn: data.linkedIn || '',
            companyLogo: data.companyLogo || ''
          });
        } else {
          console.log('No company profile found, creating with default values');
          
          // Create a default profile document
          try {
            const defaultProfile = {
              companyName: '',
              industry: '',
              companySize: '',
              location: '',
              companyDescription: '',
              companyWebsite: '',
              contactPerson: '',
              phone: '',
              linkedIn: '',
              email: currentUser.email || '',
              companyLogo: '',
              createdAt: new Date().toISOString()
            };
            
            await setDoc(companyRef, defaultProfile);
            // Set to state after creating
            setProfile({
              ...defaultProfile,
              email: currentUser.email || ''
            });
            console.log('Created default company profile document');
          } catch (err) {
            console.error('Error creating default company profile:', err);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching company profile:', error);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      console.log('Saving company profile:', profile);
      
      // Update profile - using the correct collection
      const companyRef = doc(db, 'companyProfiles', currentUser.uid);
      
      // Create a clean copy of the profile data for saving
      const profileData = {
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        location: profile.location || '',
        companyDescription: profile.companyDescription || '',
        companyWebsite: profile.companyWebsite || '',
        contactPerson: profile.contactPerson || '',
        phone: profile.phone || '',
        linkedIn: profile.linkedIn || '',
        lastUpdated: new Date().toISOString()
      };
      
      await updateDoc(companyRef, profileData);
      console.log('Company profile updated successfully');
      
      setSuccess('Company profile updated successfully!');
      setSaving(false);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating company profile:', error);
      setError('Failed to update profile. Please try again.');
      setSaving(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'May 21, 2025';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'May 21, 2025';
    }
  };
  
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          Loading your company profile...
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Company Profile</h2>
            <p>View and manage your company information</p>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="btn btn-primary"
            style={{ 
              padding: '10px 20px', 
              borderRadius: '30px', 
              fontWeight: '500',
              background: 'var(--primary)',
              border: 'none'
            }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            color: 'var(--success)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {success}
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Left Column - Company Info */}
          <div>
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                {profile.companyLogo ? (
                  <img 
                    src={profile.companyLogo} 
                    alt="Company Logo"
                    style={{ 
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '20px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#627eea', // Blue color for company
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '36px',
                    marginRight: '20px',
                    fontWeight: 'bold'
                  }}>
                    {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                
                <div>
                  <h3 style={{ marginBottom: '5px' }}>Company Profile</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Last updated: {formatDate(profile.lastUpdated || new Date().toISOString())}
                  </p>
                </div>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="companyName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={profile.companyName || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email || ''}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5'
                      }}
                      disabled
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="phone" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="contactPerson" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      id="contactPerson"
                      name="contactPerson"
                      value={profile.contactPerson || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="companyDescription" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Description
                    </label>
                    <textarea
                      id="companyDescription"
                      name="companyDescription"
                      value={profile.companyDescription || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        minHeight: '100px'
                      }}
                      placeholder="Describe your company and what makes it unique..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Company Name</div>
                    <div style={{ width: '60%' }}>{profile.companyName || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Email</div>
                    <div style={{ width: '60%' }}>{profile.email || ''}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Contact Phone</div>
                    <div style={{ width: '60%' }}>{profile.phone || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Contact Person</div>
                    <div style={{ width: '60%' }}>{profile.contactPerson || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Description</div>
                    <div style={{ width: '60%' }}>{profile.companyDescription || 'No description available'}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Company Details Section */}
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Company Details</h3>
              
              {isEditing ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="industry" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Industry
                    </label>
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      value={profile.industry || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="companySize" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Size
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={profile.companySize || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1001+">1001+ employees</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="location" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={profile.location || ''}
                      onChange={handleChange}
                      placeholder="e.g., New York, NY"
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Industry</div>
                    <div style={{ width: '60%' }}>{profile.industry || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Company Size</div>
                    <div style={{ width: '60%' }}>{profile.companySize || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Location</div>
                    <div style={{ width: '60%' }}>{profile.location || 'Not specified'}</div>
                  </div>
                </div>
              )}
              
              {isEditing && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    style={{ 
                      padding: '10px 20px', 
                      borderRadius: '30px', 
                      fontWeight: '500',
                      background: 'var(--primary)',
                      border: 'none'
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - External Links and Stats */}
          <div>
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginBottom: '20px' }}>External Links</h3>
              
              {isEditing ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="companyWebsite" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Website
                    </label>
                    <input
                      type="url"
                      id="companyWebsite"
                      name="companyWebsite"
                      value={profile.companyWebsite || ''}
                      onChange={handleChange}
                      placeholder="https://www.yourcompany.com"
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="linkedIn" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      LinkedIn Page
                    </label>
                    <input
                      type="url"
                      id="linkedIn"
                      name="linkedIn"
                      value={profile.linkedIn || ''}
                      onChange={handleChange}
                      placeholder="https://www.linkedin.com/company/yourcompany"
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Website</div>
                    <div style={{ width: '60%' }}>
                      {profile.companyWebsite ? (
                        <a href={profile.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                          {profile.companyWebsite.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>LinkedIn</div>
                    <div style={{ width: '60%' }}>
                      {profile.linkedIn ? (
                        <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                          {profile.linkedIn.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Account Activity</h3>
              
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <div style={{ width: '60%', fontWeight: '500' }}>Active Projects</div>
                <div style={{ width: '40%', textAlign: 'right' }}>
                  <span style={{ 
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    3 Open
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <div style={{ width: '60%', fontWeight: '500' }}>Applications Received</div>
                <div style={{ width: '40%', textAlign: 'right' }}>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    12 Pending
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '60%', fontWeight: '500' }}>Account Status</div>
                <div style={{ width: '40%', textAlign: 'right' }}>
                  <span style={{ 
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--success)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;