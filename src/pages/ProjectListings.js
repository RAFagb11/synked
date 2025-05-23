// src/pages/ProjectListings.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Navigation from '../components/Navigation';
import ProjectCard from '../components/ProjectCard';

const ProjectListings = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Simple query without complex filtering or ordering
        const projectsRef = collection(db, 'projects');
        console.log("Fetching projects from collection:", projectsRef.path);
        
        const querySnapshot = await getDocs(projectsRef);
        console.log("Projects collection exists:", !querySnapshot.empty);
        console.log("Number of documents found:", querySnapshot.size);
        
        // Get all projects
        let projectsList = querySnapshot.docs.map(doc => {
          console.log("Document ID:", doc.id, "Document data:", doc.data());
          return {
            id: doc.id,
            ...doc.data()
          };
        });
        
        console.log("Query returned:", projectsList.length, "documents");
        
        // Apply filters in memory
        if (filter !== 'all') {
          projectsList = projectsList.filter(project => project.category === filter);
        }
        
        // Sort by createdAt
        projectsList.sort((a, b) => {
          // Handle both Firestore timestamps and regular dates
          const timeA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
          const timeB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
          return timeB - timeA; // Descending order
        });
        
        // If there's a search term, filter projects by title or description
        const filteredProjects = searchTerm 
          ? projectsList.filter(project => 
              project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              project.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : projectsList;
          
        console.log("Final filtered projects:", filteredProjects.length);
        setProjects(filteredProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
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