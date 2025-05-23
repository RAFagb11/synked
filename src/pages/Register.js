// src/pages/Register.js - Fixed navigation logic
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import Navigation from '../components/Navigation';

const Register = () => {
  const navigate = useNavigate();
  
  // Get user type from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeFromUrl = urlParams.get('type');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType] = useState(userTypeFromUrl || 'student'); // Fixed userType, no setter
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [otherCollege, setOtherCollege] = useState('');
  const [otherMajor, setOtherMajor] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  // Lists of colleges and majors
  const colleges = [
    'Arizona State University',
    'Boston University',
    'Columbia University',
    'Cornell University',
    'Duke University',
    'Harvard University',
    'MIT',
    'New York University',
    'Northwestern University',
    'Princeton University',
    'Stanford University',
    'UC Berkeley',
    'UCLA',
    'University of Chicago',
    'University of Michigan',
    'University of Pennsylvania',
    'University of Texas',
    'Yale University',
    'Other'
  ];
  
  const majors = [
    'Accounting',
    'Biology',
    'Business Administration',
    'Chemistry',
    'Computer Science',
    'Economics',
    'Engineering',
    'English',
    'Finance',
    'History',
    'Marketing',
    'Mathematics',
    'Physics',
    'Political Science',
    'Psychology',
    'Sociology',
    'Statistics',
    'Other'
  ];
  
  const industries = [
    'Advertising',
    'Aerospace',
    'Agriculture',
    'Automotive',
    'Banking',
    'Biotechnology',
    'Construction',
    'Consulting',
    'Education',
    'Energy',
    'Entertainment',
    'Finance',
    'Food & Beverage',
    'Healthcare',
    'Hospitality',
    'Information Technology',
    'Insurance',
    'Manufacturing',
    'Media',
    'Nonprofit',
    'Pharmaceuticals',
    'Real Estate',
    'Retail',
    'Software',
    'Telecommunications',
    'Transportation',
    'Other'
  ];
  
  // Add validation for user type on component mount
  useEffect(() => {
    if (!userTypeFromUrl || (userTypeFromUrl !== 'student' && userTypeFromUrl !== 'company')) {
      // If no valid user type in URL, redirect to login or show error
      navigate('/login');
    }
  }, [userTypeFromUrl, navigate]);
  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Handle file selection for company logo
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Go to next step
  const handleNextStep = () => {
    // Validate first step
    if (step === 1) {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      
      if (!password.trim()) {
        setError('Password is required');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    // Validate second step
    if (step === 2) {
      if (userType === 'student') {
        if (!fullName.trim()) {
          setError('Full name is required');
          return;
        }
        
        if (college === 'Other' && !otherCollege.trim()) {
          setError('Please enter your college name');
          return;
        }
        
        if (major === 'Other' && !otherMajor.trim()) {
          setError('Please enter your major');
          return;
        }
        
        if (!college) {
          setError('Please select your college');
          return;
        }
        
        if (!major) {
          setError('Please select your major');
          return;
        }
        
        if (!profilePhoto) {
          setError('Profile photo is required');
          return;
        }
      } else {
        if (!companyName.trim()) {
          setError('Company name is required');
          return;
        }
        
        if (!industry) {
          setError('Please select your industry');
          return;
        }
        
        if (!companyLogo) {
          setError('Company logo is required');
          return;
        }
      }
    }
    
    setError('');
    setStep(step + 1);
  };
  
  // Go back to previous step
  const handlePreviousStep = () => {
    setStep(step - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Creating account with user type:', userType);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created successfully:', user.uid);
      
      let photoURL = null;
      let logoURL = null;
      
      // Upload profile photo for students
      if (userType === 'student' && profilePhoto) {
        console.log('Uploading profile photo...');
        const photoRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(photoRef, profilePhoto);
        photoURL = await getDownloadURL(photoRef);
        console.log('Profile photo uploaded successfully');
      }
      
      // Upload company logo for companies
      if (userType === 'company' && companyLogo) {
        console.log('Uploading company logo...');
        const logoRef = ref(storage, `companyLogos/${user.uid}`);
        await uploadBytes(logoRef, companyLogo);
        logoURL = await getDownloadURL(logoRef);
        console.log('Company logo uploaded successfully');
      }
      
      // Store user data in Firestore
      console.log('Creating user document with userType:', userType);
      await setDoc(doc(db, 'users', user.uid), {
        email,
        userType,
        createdAt: new Date(),
        profileCompleted: true
      });
      console.log('User document created successfully');
      
      // Store profile data based on user type
      if (userType === 'student') {
        const finalCollege = college === 'Other' ? otherCollege : college;
        const finalMajor = major === 'Other' ? otherMajor : major;
        
        console.log('Creating student profile...');
        await setDoc(doc(db, 'studentProfiles', user.uid), {
          fullName,
          college: finalCollege,
          major: finalMajor,
          photoURL,
          bio: '',
          skills: [],
          resume: null,
          portfolio: null,
          activeProjects: 0,
          completedProjects: 0
        });
        console.log('Student profile created successfully');
      } else {
        console.log('Creating company profile...');
        await setDoc(doc(db, 'companyProfiles', user.uid), {
          companyName,
          industry,
          companyLogo: logoURL,
          companyDescription: '',
          companyWebsite: '',
          location: '',
          companySize: ''
        });
        console.log('Company profile created successfully');
      }
      
      console.log('Navigating to dashboard for userType:', userType);
      
      // Use a timeout to ensure state updates complete before navigation
      setTimeout(() => {
        if (userType === 'student') {
          navigate('/student/dashboard', { replace: true });
        } else {
          navigate('/company/dashboard', { replace: true });
        }
      }, 1000); // 1 second delay to let Firebase state settle
      
    } catch (error) {
      console.error('Error creating account:', error);
      setError('Failed to create account: ' + error.message);
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Create Your Synked Account</h2>
          
          {/* Progress indicator */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                background: step >= 1 ? 'var(--primary)' : '#eee',
                color: step >= 1 ? 'white' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 2
              }}>
                1
              </div>
              <div style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                background: step >= 2 ? 'var(--primary)' : '#eee',
                color: step >= 2 ? 'white' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 2
              }}>
                2
              </div>
              <div style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                background: step >= 3 ? 'var(--primary)' : '#eee',
                color: step >= 3 ? 'white' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: 2
              }}>
                3
              </div>
              
              {/* Progress line */}
              <div style={{ 
                position: 'absolute', 
                top: '15px', 
                left: '30px', 
                right: '30px', 
                height: '2px', 
                background: '#eee',
                zIndex: 1
              }}>
                <div style={{ 
                  width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.3s'
                }}></div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ width: '60px', textAlign: 'center', fontSize: '14px' }}>Account</div>
              <div style={{ width: '60px', textAlign: 'center', fontSize: '14px' }}>Profile</div>
              <div style={{ width: '60px', textAlign: 'center', fontSize: '14px' }}>Finish</div>
            </div>
          </div>
          
          {error && (
            <div style={{ 
              color: 'var(--danger)', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Account Type</label>
                  <div style={{ 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '2px solid var(--primary)',
                    backgroundColor: 'rgba(108, 99, 255, 0.05)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary)' }}>
                      {userType === 'student' ? '🎓 Student Account' : '🏢 Company Account'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                    Creating a {userType} account
                  </p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '12px 15px', 
                      borderRadius: '8px', 
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '12px 15px', 
                      borderRadius: '8px', 
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    Password must be at least 6 characters
                  </p>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '12px 15px', 
                      borderRadius: '8px', 
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Continue
                </button>
              </div>
            )}
            
            {/* Step 2: Profile Information */}
            {step === 2 && (
              <div>
                {userType === 'student' ? (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>College/University</label>
                      <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '16px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select your college</option>
                        {colleges.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    
                    {college === 'Other' && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Other College/University</label>
                        <input
                          type="text"
                          value={otherCollege}
                          onChange={(e) => setOtherCollege(e.target.value)}
                          required
                          style={{ 
                            width: '100%', 
                            padding: '12px 15px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Major</label>
                      <select
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '16px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select your major</option>
                        {majors.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    
                    {major === 'Other' && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Other Major</label>
                        <input
                          type="text"
                          value={otherMajor}
                          onChange={(e) => setOtherMajor(e.target.value)}
                          required
                          style={{ 
                            width: '100%', 
                            padding: '12px 15px', 
                            borderRadius: '8px', 
                            border: '1px solid #ddd',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Profile Photo
                        <span style={{ color: 'var(--primary)', marginLeft: '5px' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '50%', 
                          background: '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1px solid #ddd'
                        }}>
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="Profile Preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ color: '#888', fontSize: '14px' }}>No Photo</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{ width: '100%' }}
                          />
                          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                            Upload a professional photo. Required for better identification.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Industry</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        required
                        style={{ 
                          width: '100%', 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '16px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select your industry</option>
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Company Logo
                        <span style={{ color: 'var(--primary)', marginLeft: '5px' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '12px', 
                          background: '#eee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1px solid #ddd'
                        }}>
                          {logoPreview ? (
                            <img 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span style={{ color: '#888', fontSize: '14px' }}>No Logo</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ width: '100%' }}
                          />
                          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                            Upload your company logo. Square images work best.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3: Review and Finish */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '600' }}>Review Your Information</h3>
                
                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Account Details</h4>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Account Type:</div>
                    <div style={{ width: '60%' }}>{userType === 'student' ? 'Student' : 'Company'}</div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '40%', fontWeight: '500' }}>Email:</div>
                    <div style={{ width: '60%' }}>{email}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Profile Details</h4>
                  
                  {userType === 'student' ? (
                    <>
                      <div style={{ display: 'flex', marginBottom: '10px' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Full Name:</div>
                        <div style={{ width: '60%' }}>{fullName}</div>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '10px' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>College:</div>
                        <div style={{ width: '60%' }}>{college === 'Other' ? otherCollege : college}</div>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '10px' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Major:</div>
                        <div style={{ width: '60%' }}>{major === 'Other' ? otherMajor : major}</div>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Profile Photo:</div>
                        <div style={{ width: '60%' }}>
                          {photoPreview && (
                            <img 
                              src={photoPreview} 
                              alt="Profile Preview" 
                              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', marginBottom: '10px' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Company Name:</div>
                        <div style={{ width: '60%' }}>{companyName}</div>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '10px' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Industry:</div>
                        <div style={{ width: '60%' }}>{industry}</div>
                      </div>
                      <div style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                        <div style={{ width: '40%', fontWeight: '500' }}>Company Logo:</div>
                        <div style={{ width: '60%' }}>
                          {logoPreview && (
                            <img 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain' }}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log In</Link>
            <div style={{ marginTop: '10px' }}>
              <Link 
                to={`/register?type=${userType === 'student' ? 'company' : 'student'}`} 
                style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px' }}
              >
                Want to register as a {userType === 'student' ? 'company' : 'student'} instead?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;