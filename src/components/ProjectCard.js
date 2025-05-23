// src/components/ProjectCard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanyProfile } from '../services/profileService';

const ProjectCard = ({ project }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (project.companyId) {
          console.log('🔍 DEBUG - Fetching company for project:', project.id, 'companyId:', project.companyId);
          const companyData = await getCompanyProfile(project.companyId);
          console.log('🔍 DEBUG - Company data received:', companyData);
          setCompany(companyData);
        } else {
          console.log('❌ DEBUG - No companyId found for project:', project.id);
          setCompany(null);
        }
      } catch (error) {
        console.error('❌ DEBUG - Error fetching company for project', project.id, ':', error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (project.companyId) {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [project.companyId, project.id]);

  return (
    <div className="feature-card">
      <div className="feature-badge">{project.category}</div>
      <h3>{project.title}</h3>
      <p>{project.description.slice(0, 150)}...</p>
      
      {/* Company Information Section */}
      {loading ? (
        <div style={{ margin: '15px 0', color: '#666' }}>Loading company info...</div>
      ) : company ? (
        <div style={{ margin: '15px 0', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: company.companyLogo ? 'transparent' : 'var(--secondary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              overflow: 'hidden'
            }}>
              {company.companyLogo ? (
                <img 
                  src={company.companyLogo} 
                  alt={company.companyName || 'Company logo'} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                  onError={(e) => {
                    // Fallback to letter if image fails to load
                    e.target.style.display = 'none';
                    e.target.parentNode.style.background = 'var(--secondary)';
                    e.target.parentNode.innerHTML = company.companyName ? company.companyName.charAt(0) : 'C';
                  }}
                />
              ) : (
                company.companyName ? company.companyName.charAt(0) : 'C'
              )}
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{company.companyName || 'Company'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{company.industry || 'Industry'}</div>
            </div>
          </div>
        </div>
      ) : (
        // Fallback when company profile is missing
        <div style={{ margin: '15px 0', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--secondary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              C
            </div>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>Company</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Industry</div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '15px' }}>
        <span className="feature-badge" style={{ marginRight: '10px' }}>
          {project.duration}
        </span>
        <span className="feature-badge" style={{ 
          backgroundColor: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
          color: project.status === 'open' ? 'var(--success)' : 'var(--warning)'
        }}>
          {project.status === 'open' ? 'Active' : 'Closed'}
        </span>
        <span className="feature-badge">
          {project.compensation ? `$${project.compensation}` : 'Experience Only'}
        </span>
      </div>
      <Link to={`/projects/${project.id}`} className="btn btn-outline" style={{ marginTop: '20px' }}>
        View Details
      </Link>
    </div>
  );
};

export default ProjectCard;