import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const Navigation = () => {
  const { currentUser, logout, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSectionLink = (sectionId, e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#' + sectionId);
    }
  };

  const handleLogoClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="nav-header">
        <nav className="nav-container">
          <div className="nav-left">
            <button 
              className="menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            
            <div className="nav-logo" onClick={handleLogoClick}>
              Synked
            </div>

            <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
              <Link to="/" onClick={(e) => handleSectionLink('features', e)}>Features</Link>
              <Link to="/" onClick={(e) => handleSectionLink('how-it-works', e)}>How It Works</Link>
              <Link to="/" onClick={(e) => handleSectionLink('testimonials', e)}>Success Stories</Link>
              {userType !== 'company' && (
                <Link to="/projects">Browse Projects</Link>
              )}
            </div>
          </div>

          <div className="nav-right">
            {currentUser ? (
              <>
                <NotificationBell />
                <Link
                  to={userType === 'student' ? '/student/dashboard' : '/company/dashboard'}
                  className="nav-dashboard-link"
                >
                  Dashboard
                </Link>
                <div className="nav-profile">
                  <button onClick={handleLogout} className="nav-logout-button">
                    Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="nav-login">Log In</Link>
                <Link to="/register" className="nav-signup">Sign Up Free</Link>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="nav-spacer"></div>

      <style jsx>{`
        .nav-header {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 64px;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: var(--text-primary);
        }

        .nav-logo {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          cursor: pointer;
          padding: 8px 0;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-links a {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 0;
          position: relative;
        }

        .nav-links a:hover::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-dashboard-link {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .nav-dashboard-link:hover {
          background: var(--background-hover);
        }

        .nav-auth {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-login {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .nav-login:hover {
          background: var(--background-hover);
        }

        .nav-signup {
          background: var(--primary);
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .nav-signup:hover {
          background: var(--primary-dark);
        }

        .nav-logout-button {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-logout-button:hover {
          background: var(--background-hover);
          border-color: var(--border-hover);
        }

        @media (max-width: 768px) {
          .menu-button {
            display: block;
          }

          .nav-links {
            display: none;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .nav-links.active {
            display: flex;
          }

          .nav-right {
            gap: 8px;
          }

          .nav-login, .nav-signup {
            padding: 6px 12px;
          }
        }

        .nav-spacer {
          height: 84px; /* 64px nav height + 20px extra padding */
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default Navigation;