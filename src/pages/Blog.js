// src/pages/Blog.js
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Blog = () => {
  // Sample blog post data - in a real implementation, this would come from Firebase
  const blogPosts = [
    {
      id: 1,
      title: "How Students Can Make the Most of Project-Based Experience",
      excerpt: "Project-based experiences are invaluable for students looking to build their portfolios and gain real-world skills. Here are the top strategies to maximize your project work...",
      author: "Career Development Team",
      date: "May 1, 2025",
      category: "Student Tips",
      imageUrl: "https://via.placeholder.com/600x400"
    },
    {
      id: 2,
      title: "Why Companies Should Engage with Student Talent",
      excerpt: "In today's competitive market, companies need fresh perspectives and innovative thinking. Student projects offer a unique opportunity to access emerging talent and new ideas...",
      author: "Business Development Team",
      date: "April 22, 2025",
      category: "Business Insights",
      imageUrl: "https://via.placeholder.com/600x400"
    },
    {
      id: 3,
      title: "Success Story: How TeamSync Discovered Their Lead Developer Through a Student Project",
      excerpt: "TeamSync, a growing startup in the collaboration software space, needed fresh ideas for their UX design. They turned to Synked and found not just a great project outcome but their future lead developer...",
      author: "Success Stories Team",
      date: "April 15, 2025",
      category: "Success Stories",
      imageUrl: "https://via.placeholder.com/600x400"
    },
    {
      id: 4,
      title: "The Future of Education-Industry Partnerships",
      excerpt: "As the gap between education and industry needs continues to evolve, new models of collaboration are emerging. We explore the future of these partnerships and what they mean for students and companies...",
      author: "Research Team",
      date: "April 8, 2025",
      category: "Industry Trends",
      imageUrl: "https://via.placeholder.com/600x400"
    }
  ];

  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Knowledge Center</div>
          <h2>Synked Blog</h2>
          <p>Insights, success stories, and tips for students and companies</p>
        </div>
        
        <div style={{ marginTop: '50px' }}>
          {/* Categories filter */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '15px', 
            marginBottom: '40px',
            flexWrap: 'wrap'
          }}>
            <button className="feature-badge" style={{ cursor: 'pointer', padding: '8px 20px', fontWeight: 'bold' }}>
              All Posts
            </button>
            <button className="feature-badge" style={{ cursor: 'pointer', padding: '8px 20px', opacity: '0.7' }}>
              Student Tips
            </button>
            <button className="feature-badge" style={{ cursor: 'pointer', padding: '8px 20px', opacity: '0.7' }}>
              Business Insights
            </button>
            <button className="feature-badge" style={{ cursor: 'pointer', padding: '8px 20px', opacity: '0.7' }}>
              Success Stories
            </button>
            <button className="feature-badge" style={{ cursor: 'pointer', padding: '8px 20px', opacity: '0.7' }}>
              Industry Trends
            </button>
          </div>
          
          {/* Blog posts grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {blogPosts.map(post => (
              <div key={post.id} style={{ 
                border: '1px solid #eee',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              className="feature-card"
              >
                <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                
                <div style={{ padding: '25px' }}>
                  <div className="feature-badge">{post.category}</div>
                  <h3 style={{ marginTop: '15px', marginBottom: '10px' }}>{post.title}</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>{post.excerpt}</p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px',
                    marginTop: '15px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load more button */}
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button className="btn btn-outline">Load More Articles</button>
          </div>
        </div>
        
        {/* Subscribe section */}
        <div style={{ 
          marginTop: '80px',
          backgroundColor: '#f5f7ff',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Subscribe to Our Newsletter</h3>
          <p style={{ marginBottom: '25px', maxWidth: '600px', margin: '0 auto 25px' }}>
            Get the latest insights, tips, and success stories delivered directly to your inbox.
          </p>
          
          <div style={{ 
            display: 'flex', 
            maxWidth: '500px', 
            margin: '0 auto',
            gap: '10px'
          }}>
            <input 
              type="email" 
              placeholder="Your email address" 
              style={{ 
                flex: '1',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
            />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Blog;