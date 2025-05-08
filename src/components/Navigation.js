// src/components/Navigation.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Navigation = () => {
  const { currentUser, logout, userType } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSectionLink = (sectionId, e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = () => {
    // Navigate to home page
    if (window.location.pathname !== '/') {
      navigate('/');
    } else {
      // Already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header>
      <div className="container">
        <nav>
        <div 
            className="logo"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            Synked
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/" onClick={(e) => handleSectionLink('features', e)}>
                Features
              </Link>
            </li>
            <li>
              <Link to="/" onClick={(e) => handleSectionLink('how-it-works', e)}>
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/" onClick={(e) => handleSectionLink('testimonials', e)}>
                Success Stories
              </Link>
            </li>
            
            {/* Only show Browse Projects for non-company users */}
            {userType !== 'company' && (
              <li><Link to="/projects">Browse Projects</Link></li>
            )}
            
            {currentUser ? (
              <>
                <li>
                  <Link 
                    to={userType === 'student' ? '/student/dashboard' : '/company/dashboard'} 
                    className="btn btn-outline"
                  >
                    Dashboard
                  </Link>
                </li>
                <li><button onClick={handleLogout} className="btn btn-primary">Log Out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="btn btn-outline">Log In</Link></li>
                <li><Link to="/register" className="btn btn-primary">Sign Up Free</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;