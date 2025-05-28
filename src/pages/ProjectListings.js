// src/pages/ProjectListings.js
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import ProjectCard from '../components/ProjectCard';
import { getProjects } from '../services/projectService';

const ProjectListings = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError('');
        
        const projectsList = await getProjects({
          category: filter !== 'all' ? filter : undefined,
          sortBy: 'createdAt',
          sortDirection: 'desc'
        });
        
        const filteredProjects = searchTerm 
          ? projectsList.filter(project => 
              project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              project.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : projectsList;
            
        setProjects(filteredProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [filter, searchTerm]);
  
  const categories = [
    'all', 
    'Web Development', 
    'Mobile App', 
    'UI/UX Design', 
    'Marketing', 
    'Data Analysis', 
    'Content Creation'
  ];
  
  return (
    <div className="project-listings">
      <Navigation />
      <div className="listings-content">
        <div className="section-header">
          <div className="feature-badge">Explore Opportunities</div>
          <h2>Available Projects</h2>
          <p>Find the perfect project to enhance your skills and build your portfolio</p>
        </div>
        
        <div className="filters-section">
          <div className="categories">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setFilter(category)}
                className={`btn ${filter === category ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="search">
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading-state">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            No projects found. Please try a different filter or search term.
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .project-listings {
          min-height: 100vh;
          background: var(--background);
        }

        .listings-content {
          padding-top: 84px; /* nav height (64px) + 20px padding */
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
          padding-bottom: 40px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header h2 {
          margin: 16px 0 8px;
          font-size: 32px;
        }

        .section-header p {
          color: var(--text-secondary);
        }

        .filters-section {
          margin: 40px 0;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .categories {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-input {
          padding: 12px 20px;
          border-radius: 50px;
          border: 1px solid var(--border);
          width: 300px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-light);
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 50px 0;
          color: var(--text-secondary);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }

        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
            gap: 16px;
          }

          .search-input {
            width: 100%;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectListings;