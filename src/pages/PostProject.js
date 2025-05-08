// src/pages/PostProject.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const PostProject = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [skills, setSkills] = useState('');
  const [duration, setDuration] = useState('1-2 weeks');
  const [compensation, setCompensation] = useState('');
  const [isExperienceOnly, setIsExperienceOnly] = useState(false);
  const [applicationQuestion, setApplicationQuestion] = useState('');
  const [requireVideoIntro, setRequireVideoIntro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const categories = [
    'Web Development', 
    'Mobile App', 
    'UI/UX Design', 
    'Marketing', 
    'Data Analysis', 
    'Content Creation',
    'Other'
  ];
  
  const durationOptions = [
    '1-2 weeks',
    '2-4 weeks',
    '1-2 months', 
    '3+ months'
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const skillsArray = skills.split(',').map(skill => skill.trim());
      
      const projectData = {
        title,
        description,
        category,
        skills: skillsArray,
        duration,
        compensation: isExperienceOnly ? null : parseFloat(compensation),
        isExperienceOnly,
        companyId: currentUser.uid,
        status: 'open',
        createdAt: serverTimestamp(),
        applicants: [],
        applicationRequirements: {
          question: applicationQuestion,
          requireVideoIntro: requireVideoIntro
        }
      };
      
      await addDoc(collection(db, 'projects'), projectData);
      
      navigate('/company/dashboard');
    } catch (error) {
      setError('Failed to post project: ' + error.message);
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '800px', margin: '60px auto', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '40px' }}>
          <div className="feature-badge">Create Project</div>
          <h2>Post a New Project</h2>
          <p>Share your project details and find the perfect student match</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              placeholder="E.g. E-commerce Website Development"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '150px' }}
              placeholder="Describe the project, goals, and deliverables in detail"
            ></textarea>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                {durationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Required Skills (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              placeholder="E.g. React, JavaScript, Firebase"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isExperienceOnly}
                onChange={(e) => setIsExperienceOnly(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              This is an experience-only project (no financial compensation)
            </label>
          </div>
          
          {!isExperienceOnly && (
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Compensation Amount ($)</label>
              <input
                type="number"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                required={!isExperienceOnly}
                min="0"
                step="0.01"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                placeholder="Enter amount in USD"
              />
            </div>
          )}
          
          {/* Application Requirements Section */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
            <h3 style={{ marginBottom: '20px' }}>Application Requirements</h3>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Application Question</label>
              <input
                type="text"
                value={applicationQuestion}
                onChange={(e) => setApplicationQuestion(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                placeholder="E.g. What experience do you have with React development?"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireVideoIntro}
                  onChange={(e) => setRequireVideoIntro(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                Require video introduction (2 minute max)
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '15px' }}
          >
            {loading ? 'Posting Project...' : 'Post Project'}
          </button>
        </form>
      </div>
    </>
  );
};

export default PostProject;