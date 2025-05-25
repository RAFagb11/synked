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
        
        // Use the service instead of direct Firestore queries
        const projectsList = await getProjects({
          category: filter !== 'all' ? filter : undefined,
          sortBy: 'createdAt',
          sortDirection: 'desc'
        });
        
        // Filter by search term if provided
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
        setError('Failed to load projects');
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
    <>
      <Navigation />
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Explore Opportunities</div>
          <h2>Available Projects</h2>
          <p>Find the perfect project to enhance your skills and build your portfolio</p>
        </div>
        
        <div style={{ margin: '40px 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          
          <div>
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '12px 20px', borderRadius: '50px', border: '1px solid #ddd', width: '300px' }}
            />
          </div>
        </div>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            Error: {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            No projects found. Please try a different filter or search term.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 350px))', 
            gap: '30px'
          }}>
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectListings;