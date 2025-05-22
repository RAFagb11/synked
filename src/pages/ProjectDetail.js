// src/pages/ProjectDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProjectById } from '../services/projectService';
import { getCompanyProfile } from '../services/profileService';
import { createApplication } from '../services/applicationService';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import VideoRecorder from '../components/VideoRecorder';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

const ProjectDetail = () => {
  const { id } = useParams();
  const { currentUser, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [applicationAnswer, setApplicationAnswer] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Fetch project details
        const projectData = await getProjectById(id);
        setProject(projectData);
        
        // Fetch company details
        const companyData = await getCompanyProfile(projectData.companyId);
        setCompany(companyData);
        
        setLoading(false);
      } catch (error) {
        setError('Error fetching project: ' + error.message);
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);
  
  // Check for existing applications when component mounts
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (currentUser && userType === 'student') {
        try {
          const hasExisting = await checkExistingApplications(currentUser.uid);
          setHasExistingApplication(hasExisting);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    };
    
    checkApplicationStatus();
  }, [currentUser, userType]);
  
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (file && file.type.startsWith('video/')) {
      if (file.size > maxSize) {
        setVideoError('Video file must be less than 50MB');
        setVideoFile(null);
      } else {
        setVideoFile(file);
        setVideoError('');
      }
    } else {
      setVideoError('Please upload a valid video file');
      setVideoFile(null);
    }
  };

  const handleVideoReady = (url) => {
    setVideoUrl(url);
    setVideoFile(null);
    setVideoError('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/projects/${id}` } });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Check if student already has an application
      const hasExisting = await checkExistingApplications(currentUser.uid);
      
      if (hasExisting) {
        setError('You can only apply to one project at a time. Please withdraw your existing application first.');
        setSubmitting(false);
        return;
      }
      
      let finalVideoUrl = videoUrl;
      
      // Upload video file if one was selected (not recorded)
      if (videoFile) {
        setVideoUploading(true);
        const storageRef = ref(storage, `applications/${currentUser.uid}/${project.id}/video_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, videoFile);
        finalVideoUrl = await getDownloadURL(snapshot.ref);
        setVideoUploading(false);
      }
      
      // Prepare application data
      const applicationData = {
        projectId: id,
        projectTitle: project.title,
        studentId: currentUser.uid,
        coverLetter: coverLetter,
        availability: availability,
        companyId: project.companyId,
        appliedAt: new Date().toISOString(),
        applicationAnswer: applicationAnswer,
        videoUrl: finalVideoUrl,
        status: 'pending'
      };
      
      // Submit application
      await createApplication(applicationData);
      
      // Update project's applicants array
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        applicants: arrayUnion(currentUser.uid)
      });
      
      // Success state
      setApplicationSuccess(true);
      setShowApplicationForm(false);
      setSubmitting(false);
    } catch (error) {
      setError('Failed to submit application: ' + error.message);
      setSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp.seconds) {
      // Firestore timestamp
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      // ISO string
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  // Check if user already applied
  const checkIfAlreadyApplied = () => {
    if (!currentUser || !project) return false;
    return project.applicants?.includes(currentUser.uid);
  };

  // Function to check if student already has pending applications
  const checkExistingApplications = async (studentId) => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId),
        // Only consider pending or accepted applications as restrictions
        where('status', 'in', ['pending', 'accepted'])
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      return !applicationsSnapshot.empty; // Returns true if there are existing applications
    } catch (error) {
      console.error('Error checking existing applications:', error);
      throw error;
    }
  };
  
  // Check if this is the user's own project
  const isOwnProject = currentUser && project && userType === 'company' && project.companyId === currentUser.uid;
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '60px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>Loading project details...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--danger)' }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {/* Main Project Details */}
            <div style={{ flex: '1', minWidth: '60%' }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div className="feature-badge" style={{ marginBottom: '15px' }}>{project.category}</div>
                  <h2 style={{ marginBottom: '15px' }}>{project.title}</h2>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <span className="feature-badge">{project.duration}</span>
                    <span className="feature-badge" style={{ background: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: project.status === 'open' ? 'var(--success)' : 'var(--warning)' }}>
                      {project.status === 'open' ? 'Open for Applications' : 'Applications Closed'}
                    </span>
                    <span className="feature-badge">
                      {project.isExperienceOnly ? 'Experience Only' : `$${project.compensation}`}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Project Description</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Required Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {project.skills?.map(skill => (
                      <span key={skill} className="feature-badge">{skill}</span>
                    ))}
                  </div>
                </div>
                
                {!isOwnProject && userType === 'student' && (
                  <div style={{ marginTop: '30px' }}>
                    {applicationSuccess ? (
                      <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Application Submitted!</h4>
                        <p>Your application has been successfully submitted. The company will review it and respond soon.</p>
                      </div>
                    ) : checkIfAlreadyApplied() ? (
                      <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(108, 99, 255, 0.1)', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Already Applied</h4>
                        <p>You have already applied to this project. Check your dashboard for application status.</p>
                      </div>
                    ) : hasExistingApplication ? (
                      <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Application Limit Reached</h4>
                        <p>You can only apply to one project at a time. Please withdraw your existing application first.</p>
                      </div>
                    ) : project.status !== 'open' ? (
                      <div style={{ padding: '20px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Project Closed</h4>
                        <p>This project is no longer accepting applications.</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowApplicationForm(!showApplicationForm)} 
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '15px' }}
                      >
                        {showApplicationForm ? 'Cancel Application' : 'Apply for this Project'}
                      </button>
                    )}
                    
                    {showApplicationForm && !hasExistingApplication && (
                      <div style={{ marginTop: '30px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Submit Your Application</h3>
                        
                        <form onSubmit={handleApply}>
                          {project.applicationRequirements?.question && (
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Application Question
                              </label>
                              <p style={{ marginBottom: '8px', color: '#555' }}>{project.applicationRequirements.question}</p>
                              <textarea
                                value={applicationAnswer}
                                onChange={(e) => setApplicationAnswer(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '150px' }}
                                placeholder="Your answer..."
                              ></textarea>
                            </div>
                          )}
                          
                          <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Cover Letter</label>
                            <textarea
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              required
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '200px' }}
                              placeholder="Introduce yourself and explain why you're a good fit for this project..."
                            ></textarea>
                          </div>
                          
                          {project.applicationRequirements?.requireVideoIntro && (
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                              <VideoRecorder
                                userId={currentUser.uid}
                                projectId={id}
                                onVideoReady={handleVideoReady}
                              />
                              
                              <div style={{ marginTop: '15px' }}>
                                <p style={{ marginBottom: '8px', fontWeight: '500' }}>Or upload a video file:</p>
                                {videoError && <div style={{ color: 'var(--danger)', marginBottom: '8px' }}>{videoError}</div>}
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleVideoUpload}
                                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                                {videoFile && <div style={{ marginTop: '8px', color: 'var(--success)' }}>Video file selected: {videoFile.name}</div>}
                                {videoUrl && <div style={{ marginTop: '8px', color: 'var(--success)' }}>Video recorded successfully</div>}
                              </div>
                            </div>
                          )}
                          
                          <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Availability</label>
                            <input
                              type="text"
                              value={availability}
                              onChange={(e) => setAvailability(e.target.value)}
                              required
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                              placeholder="E.g. 15-20 hours per week, evenings and weekends"
                            />
                          </div>
                          
                          <button 
                            type="submit"
                            disabled={submitting || videoUploading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '15px' }}
                          >
                            {videoUploading ? 'Uploading Video...' : submitting ? 'Submitting Application...' : 'Submit Application'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
                
                {isOwnProject && (
                  <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                    <Link 
                      to={`/company/dashboard`} 
                      className="btn btn-outline"
                      style={{ flex: '1', padding: '15px', textAlign: 'center' }}
                    >
                      Back to Dashboard
                    </Link>
                    <button 
                      className="btn btn-primary"
                      style={{ flex: '1', padding: '15px' }}
                      onClick={() => navigate(`/company/project/${project.id}`)}
                    >
                      Manage Applications
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Company Info Sidebar */}
            <div style={{ flex: '0 0 300px' }}>
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>About the Company</h3>
                
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginRight: '15px'
                  }}>
                    {company?.companyName ? company.companyName.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h4>{company?.companyName || 'Company'}</h4>
                    <p style={{ fontSize: '14px', color: '#666' }}>{company?.industry || 'Industry'}</p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <p>{company?.companyDescription || 'No company description available.'}</p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500' }}>Location:</span>
                    <span>{company?.location || 'Not specified'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500' }}>Size:</span>
                    <span>{company?.companySize || 'Not specified'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>Website:</span>
                    <a href={company?.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      {company?.companyWebsite ? 'Visit Website' : 'Not available'}
                    </a>
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '15px' }}>Project Details</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500' }}>Posted On:</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500' }}>Duration:</span>
                    <span>{project.duration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500' }}>Compensation:</span>
                    <span>{project.isExperienceOnly ? 'Experience Only' : `$${project.compensation}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Status:</span>
                    <span style={{ color: project.status === 'open' ? 'var(--success)' : 'var(--warning)' }}>
                      {project.status === 'open' ? 'Open for Applications' : 'Applications Closed'}
                    </span>
                  </div>
                </div>
                
                {!currentUser && (
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                    Log In to Apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectDetail;