// src/pages/StudentProfile.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import Navigation from '../components/Navigation';

const StudentProfile = () => {
  const { currentUser } = useContext(AuthContext);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: currentUser ? currentUser.email : '',
    college: '',
    major: '',
    graduation: '',
    bio: '',
    skills: [],
    github: '',
    linkedin: '',
    portfolio: '',
    phone: '',
    photoURL: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        console.log('Fetching profile for user:', currentUser.uid);
        
        // Get student profile from the correct collection
        const studentRef = doc(db, 'studentProfiles', currentUser.uid);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          console.log('Found student profile:', studentDoc.data());
          const data = studentDoc.data();
          // Apply data directly to state rather than merging with previous state
          setProfile({
            fullName: data.fullName || '',
            email: currentUser.email || '',
            college: data.college || '',
            major: data.major || '',
            graduation: data.graduation || '',
            bio: data.bio || '',
            skills: data.skills || [],
            github: data.github || '',
            linkedin: data.linkedin || '',
            portfolio: data.portfolio || '',
            phone: data.phone || '',
            photoURL: data.photoURL || ''
          });
        } else {
          console.log('No profile found, creating with default values');
          
          // Create a default profile document
          try {
            const defaultProfile = {
              fullName: '',
              college: '',
              major: '',
              graduation: '',
              bio: '',
              skills: [],
              github: '',
              linkedin: '',
              portfolio: '',
              phone: '',
              email: currentUser.email || '',
              photoURL: '',
              createdAt: new Date().toISOString()
            };
            
            await setDoc(studentRef, defaultProfile);
            setProfile({
              ...defaultProfile,
              email: currentUser.email || ''
            });
            console.log('Created default profile document');
          } catch (err) {
            console.error('Error creating default profile:', err);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
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
  
  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile(prevProfile => ({
        ...prevProfile,
        skills: [...(prevProfile.skills || []), skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      skills: (prevProfile.skills || []).filter(skill => skill !== skillToRemove)
    }));
  };
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      console.log('Saving profile:', profile);
      
      // Update profile using the correct collection
      const studentRef = doc(db, 'studentProfiles', currentUser.uid);
      
      // Create a clean copy of the profile data for saving
      const profileData = {
        fullName: profile.fullName || '',
        college: profile.college || '',
        major: profile.major || '',
        graduation: profile.graduation || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        portfolio: profile.portfolio || '',
        phone: profile.phone || '',
        lastUpdated: new Date().toISOString()
      };
      
      await updateDoc(studentRef, profileData);
      console.log('Profile updated successfully');
      
      setSuccess('Profile updated successfully!');
      setSaving(false);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
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
          Loading your profile...
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
            <h2>Student Profile</h2>
            <p>View and manage your personal information</p>
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
          {/* Left Column - Profile Info */}
          <div>
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '30px',
                gap: '20px'
              }}>
                <div style={{ position: 'relative' }}>
                  {profile.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.fullName}
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '3px solid #f0f0f0'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '36px',
                      fontWeight: 'bold'
                    }}>
                      {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  
                  {isEditing && (
                    <label 
                      htmlFor="photo-upload"
                      style={{ 
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'var(--primary)',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '2px solid white',
                        fontSize: '16px'
                      }}
                    >
                      📷
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setUploadingPhoto(true);
                            try {
                              const photoRef = ref(storage, `profilePhotos/${currentUser.uid}`);
                              await uploadBytes(photoRef, file);
                              const photoURL = await getDownloadURL(photoRef);
                              
                              await updateDoc(doc(db, 'studentProfiles', currentUser.uid), {
                                photoURL
                              });
                              
                              setProfile(prev => ({ ...prev, photoURL }));
                              setSuccess('Profile photo updated successfully!');
                            } catch (error) {
                              setError('Failed to upload photo: ' + error.message);
                            } finally {
                              setUploadingPhoto(false);
                            }
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
                
                <div style={{ flex: '1' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{profile.fullName || 'Your Name'}</h4>
                  <p style={{ color: '#666', margin: 0 }}>{profile.email}</p>
                  {uploadingPhoto && (
                    <p style={{ color: 'var(--primary)', fontSize: '14px', marginTop: '10px' }}>
                      Uploading photo...
                    </p>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={profile.fullName || ''}
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
                      Phone Number
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
                    <label htmlFor="bio" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profile.bio || ''}
                      onChange={handleChange}
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        minHeight: '100px'
                      }}
                      placeholder="Tell companies a bit about yourself..."
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
                    <div style={{ width: '40%', fontWeight: '500' }}>Full Name</div>
                    <div style={{ width: '60%' }}>{profile.fullName || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Email</div>
                    <div style={{ width: '60%' }}>{profile.email || ''}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Phone</div>
                    <div style={{ width: '60%' }}>{profile.phone || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Bio</div>
                    <div style={{ width: '60%' }}>{profile.bio || 'No bio available'}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Skills Section */}
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Skills</h3>
              
              {isEditing ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add a skill (e.g., Python, Data Analysis)"
                      style={{ 
                        flex: '1',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="btn btn-outline"
                      style={{
                        padding: '0 15px',
                        border: '1px solid var(--primary)',
                        borderRadius: '8px',
                        color: 'var(--primary)',
                        background: 'white'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span 
                      key={index}
                      style={{ 
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '8px 15px',
                        borderRadius: '30px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px'
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p style={{ color: '#666' }}>No skills added yet</p>
                )}
              </div>
              
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
          
          {/* Right Column - Education and Links */}
          <div>
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '16px', 
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginBottom: '20px' }}>Education</h3>
              
              {isEditing ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="college" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      University
                    </label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={profile.college || ''}
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
                    <label htmlFor="major" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Major
                    </label>
                    <input
                      type="text"
                      id="major"
                      name="major"
                      value={profile.major || ''}
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
                    <label htmlFor="graduation" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Expected Graduation
                    </label>
                    <input
                      type="text"
                      id="graduation"
                      name="graduation"
                      value={profile.graduation || ''}
                      onChange={handleChange}
                      placeholder="e.g., Spring 2025"
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
                    <div style={{ width: '40%', fontWeight: '500' }}>University</div>
                    <div style={{ width: '60%' }}>{profile.college || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Major</div>
                    <div style={{ width: '60%' }}>{profile.major || 'Not specified'}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Expected Graduation</div>
                    <div style={{ width: '60%' }}>{profile.graduation || 'Not specified'}</div>
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
              <h3 style={{ marginBottom: '20px' }}>External Links</h3>
              
              {isEditing ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="github" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      id="github"
                      name="github"
                      value={profile.github || ''}
                      onChange={handleChange}
                      placeholder="https://github.com/yourusername"
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="linkedin" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      id="linkedin"
                      name="linkedin"
                      value={profile.linkedin || ''}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourusername"
                      style={{ 
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="portfolio" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Portfolio Website
                    </label>
                    <input
                      type="url"
                      id="portfolio"
                      name="portfolio"
                      value={profile.portfolio || ''}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
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
                    <div style={{ width: '40%', fontWeight: '500' }}>GitHub</div>
                    <div style={{ width: '60%' }}>
                      {profile.github ? (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                          {profile.github.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>LinkedIn</div>
                    <div style={{ width: '60%' }}>
                      {profile.linkedin ? (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                          {profile.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Portfolio</div>
                    <div style={{ width: '60%' }}>
                      {profile.portfolio ? (
                        <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                          {profile.portfolio.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;