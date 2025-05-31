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
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '420px'
    }}>
      {/* Category Badge */}
      <div style={{ marginBottom: '16px' }}>
        <span className="feature-badge">{project.category}</span>
      </div>
      
      {/* Title - Fixed Height */}
      <h3 style={{ 
        marginBottom: '16px',
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        lineHeight: '1.4',
        minHeight: '56px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {project.title}
      </h3>
      
      {/* Description - Fixed Height */}
      <p style={{ 
        marginBottom: '20px',
        color: '#6b7280',
        fontSize: '15px',
        lineHeight: '1.6',
        minHeight: '72px',
        maxHeight: '72px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical'
      }}>
        {project.description}
      </p>
      
      {/* Company Information Section - Fixed Height */}
      <div style={{ marginBottom: '20px', minHeight: '70px' }}>
        {loading ? (
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            height: '70px'
          }}>
            Loading company...
          </div>
        ) : (
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '12px',
            height: '70px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: company?.companyLogo ? 'transparent' : 'var(--secondary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '500',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {company?.companyLogo ? (
                  <img 
                    src={company.companyLogo} 
                    alt={company.companyName || 'Company logo'} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.background = 'var(--secondary)';
                      e.target.parentNode.innerHTML = company?.companyName ? company.companyName.charAt(0) : 'C';
                    }}
                  />
                ) : (
                  (company?.companyName || project.companyName || 'Company').charAt(0)
                )}
              </div>
              <div>
                <div style={{ fontWeight: '500', fontSize: '15px', color: '#111827' }}>
                  {company?.companyName || project.companyName || 'Company'}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {company?.industry || 'Technology'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Spacer to push content to bottom */}
      <div style={{ flex: 1 }}></div>
      
      {/* Project Details */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <span className="feature-badge" style={{ 
          padding: '6px 12px',
          fontSize: '13px'
        }}>
          {project.duration}
        </span>
        <span className="feature-badge" style={{ 
          backgroundColor: project.status === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
          color: project.status === 'open' ? 'var(--success)' : '#6b7280',
          padding: '6px 12px',
          fontSize: '13px'
        }}>
          {project.status === 'open' ? 'Open' : 'Closed'}
        </span>
        <span className="feature-badge" style={{
          padding: '6px 12px',
          fontSize: '13px'
        }}>
          {project.isExperienceOnly ? 'Experience Only' : `$${project.compensation || 0}`}
        </span>
      </div>
      
      {/* View Details Button */}
      <Link 
        to={`/projects/${project.id}`} 
        className="btn btn-primary" 
        style={{ 
          width: '100%',
          padding: '12px 20px',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '500'
        }}
      >
        View Details
      </Link>
    </div>
  );
};

export default ProjectCard;