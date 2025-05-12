// src/pages/LearningResources.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const LearningResources = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const resourceCategories = [
    { id: 'all', name: 'All Resources' },
    { id: 'programming', name: 'Programming' },
    { id: 'design', name: 'Design' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'business', name: 'Business' },
    { id: 'productivity', name: 'Productivity' }
  ];
  
  const resources = [
    {
      id: 1,
      title: 'Complete JavaScript Course',
      description: 'Master JavaScript with this comprehensive course covering everything from basics to advanced concepts like async/await, ES6+ features, and more.',
      category: 'programming',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Beginner to Advanced',
      duration: '30 hours',
      creator: 'Web Dev Academy',
      link: '#'
    },
    {
      id: 2,
      title: 'Data Structures and Algorithms',
      description: 'Learn essential data structures and algorithms to ace technical interviews and become a better programmer. Includes practice problems and solutions.',
      category: 'programming',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Intermediate',
      duration: '25 hours',
      creator: 'Algorithm Masters',
      link: '#'
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the principles of effective UI/UX design and how to create user-friendly interfaces that engage and delight users.',
      category: 'design',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Beginner',
      duration: '15 hours',
      creator: 'Design School',
      link: '#'
    },
    {
      id: 4,
      title: 'Introduction to Python for Data Science',
      description: 'Get started with Python for data analysis, visualization, and machine learning. Learn libraries like NumPy, Pandas, and Matplotlib.',
      category: 'data-science',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Beginner',
      duration: '20 hours',
      creator: 'Data Science Hub',
      link: '#'
    },
    {
      id: 5,
      title: 'Business Strategy for Startups',
      description: 'Learn how to develop effective business strategies, identify market opportunities, and create sustainable competitive advantages.',
      category: 'business',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Intermediate',
      duration: '10 hours',
      creator: 'Startup Accelerator',
      link: '#'
    },
    {
      id: 6,
      title: 'React.js: From Zero to Hero',
      description: 'Build modern, reactive web applications with React.js. Learn hooks, context API, Redux, and best practices for component design.',
      category: 'programming',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Intermediate',
      duration: '22 hours',
      creator: 'React Experts',
      link: '#'
    },
    {
      id: 7,
      title: 'Time Management for Students',
      description: 'Learn effective time management techniques specifically designed for students balancing coursework, projects, and personal life.',
      category: 'productivity',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Beginner',
      duration: '5 hours',
      creator: 'Student Success Center',
      link: '#'
    },
    {
      id: 8,
      title: 'Machine Learning Fundamentals',
      description: 'Understand the core concepts of machine learning, including supervised and unsupervised learning, model evaluation, and practical implementations.',
      category: 'data-science',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Intermediate',
      duration: '28 hours',
      creator: 'AI Research Group',
      link: '#'
    },
    {
      id: 9,
      title: 'Digital Marketing Essentials',
      description: 'Learn the fundamentals of digital marketing, including SEO, social media marketing, content strategy, and analytics.',
      category: 'business',
      image: 'https://via.placeholder.com/300x200',
      difficulty: 'Beginner',
      duration: '12 hours',
      creator: 'Marketing Pros',
      link: '#'
    }
  ];
  
  // Filter resources based on active category and search query
  const filteredResources = resources.filter(resource => 
    (activeCategory === 'all' || resource.category === activeCategory) &&
    (resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     resource.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Knowledge Hub</div>
          <h2>Learning Resources</h2>
          <p>Expand your skills with these curated courses, tutorials, and guides</p>
        </div>
        
        {/* Search and Filter */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '1000px',
          margin: '0 auto 40px'
        }}>
          {/* Search Bar */}
          <div>
            <input 
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>
          
          {/* Category Filters */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {resourceCategories.map(category => (
              <button 
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={activeCategory === category.id ? "btn btn-primary" : "btn btn-outline"}
                style={{ 
                  padding: '8px 20px',
                  borderRadius: '50px'
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Resources Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '50px'
        }}>
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <div 
                key={resource.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                className="feature-card"
              >
                <img 
                  src={resource.image} 
                  alt={resource.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                
                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="feature-badge">{resource.category}</span>
                    <span style={{ 
                      backgroundColor: '#f5f7ff', 
                      color: 'var(--primary)',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {resource.difficulty}
                    </span>
                  </div>
                  
                  <h3 style={{ marginBottom: '10px' }}>{resource.title}</h3>
                  <p style={{ 
                    marginBottom: '20px', 
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {resource.description}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <span>Duration: {resource.duration}</span>
                    <span>By: {resource.creator}</span>
                  </div>
                  
                  <a 
                    href={resource.link} 
                    className="btn btn-primary" 
                    style={{ 
                      display: 'block',
                      textAlign: 'center'
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Access Resource
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f5f7ff',
              borderRadius: '16px'
            }}>
              <h3 style={{ marginBottom: '15px' }}>No resources found</h3>
              <p>
                Try adjusting your search terms or categories to find what you're looking for.
              </p>
              <button 
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Suggestion Section */}
        <div style={{ 
          backgroundColor: '#f5f7ff',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '900px',
          margin: '60px auto 0'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Can't find what you're looking for?</h3>
          <p style={{ marginBottom: '25px' }}>
            Suggest a learning resource or topic you'd like to see added to our collection.
          </p>
          
          <Link to="/contact-us" className="btn btn-primary">
            Submit a Suggestion
          </Link>
        </div>
        
        {/* Skills Assessment Call to Action */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '80px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Ready to test your skills?</h3>
          <p style={{ marginBottom: '20px', maxWidth: '600px' }}>
            Put your knowledge into practice by taking one of our coding challenges.
          </p>
          <Link to="/skills-assessment" className="btn btn-primary">
            Try Skills Assessment
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LearningResources;