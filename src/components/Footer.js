// src/components/Footer.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Footer = () => {
  const { currentUser, userType } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Function to handle section links
  const handleSectionClick = (sectionId) => {
    // If we're already on the home page
    if (window.location.pathname === '/') {
      // Find the element and scroll to it
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're not on the home page, navigate to home with a hash
      window.location.href = `/#${sectionId}`;
    }
  };
  
  // Function to handle company-only links
  const handleCompanyOnlyLink = (e, path) => {
    e.preventDefault();
    
    if (!currentUser) {
      // Not logged in, redirect to login
      navigate('/login');
    } else if (userType === 'company') {
      // Logged in as company, proceed to destination
      navigate(path);
    } else {
      // Logged in as student, redirect to login with a message
      navigate('/login?message=company-only');
    }
  };

  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo">Synked</div>
            <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
              Connecting talented students with companies for impactful project experiences that benefit everyone.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">f</a>
              <a href="#" className="social-link">in</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">📷</a>
            </div>
          </div>
          
          <div className="footer-column">
            <h3>For Companies</h3>
            <ul>
              <li>
                <a 
                  href="#how-it-works" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSectionClick('how-it-works');
                  }}
                  style={{ color: '#cbd5e1', textDecoration: 'none' }}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => handleCompanyOnlyLink(e, '/pricing')}
                  style={{ color: '#cbd5e1', textDecoration: 'none' }}
                >
                  Pricing Plans
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => handleCompanyOnlyLink(e, '/post-project')}
                  style={{ color: '#cbd5e1', textDecoration: 'none' }}
                >
                  Post a Project
                </a>
              </li>
              <li>
                <a 
                  href="#success-stories" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSectionClick('success-stories');
                  }}
                  style={{ color: '#cbd5e1', textDecoration: 'none' }}
                >
                  Success Stories
                </a>
              </li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>For Students</h3>
            <ul>
              <li><Link to="/projects">Browse Projects</Link></li>
              <li><Link to="/create-profile">Create Profile</Link></li>
              <li><Link to="/skills-assessment">Skills Assessment</Link></li>
              <li><Link to="/learning-resources">Learning Resources</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 Synked. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



// // src/components/Footer.js
// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer = () => {
//   // Function to handle section links
//   const handleSectionClick = (sectionId) => {
//     // If we're already on the home page
//     if (window.location.pathname === '/') {
//       // Find the element and scroll to it
//       const section = document.getElementById(sectionId);
//       if (section) {
//         section.scrollIntoView({ behavior: 'smooth' });
//       }
//     } else {
//       // If we're not on the home page, navigate to home with a hash
//       window.location.href = `/#${sectionId}`;
//     }
//   };

//   return (
//     <footer>
//       <div className="container">
//         <div className="footer-content">
//           <div className="footer-column">
//             <div className="footer-logo">Synked</div>
//             <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
//               Connecting talented students with companies for impactful project experiences that benefit everyone.
//             </p>
//             <div className="social-links">
//               <a href="#" className="social-link">f</a>
//               <a href="#" className="social-link">in</a>
//               <a href="#" className="social-link">🐦</a>
//               <a href="#" className="social-link">📷</a>
//             </div>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Companies</h3>
//             <ul>
//               <li>
//                 <a 
//                   href="#how-it-works" 
//                   onClick={(e) => {
//                     e.preventDefault();
//                     handleSectionClick('how-it-works');
//                   }}
//                   style={{ color: '#cbd5e1', textDecoration: 'none' }}
//                 >
//                   How It Works
//                 </a>
//               </li>
//               <li><Link to="/pricing">Pricing Plans</Link></li>
//               <li><Link to="/post-project">Post a Project</Link></li>
//               <li>
//                 <a 
//                   href="#success-stories" 
//                   onClick={(e) => {
//                     e.preventDefault();
//                     handleSectionClick('success-stories');
//                   }}
//                   style={{ color: '#cbd5e1', textDecoration: 'none' }}
//                 >
//                   Success Stories
//                 </a>
//               </li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Students</h3>
//             <ul>
//               <li><Link to="/projects">Browse Projects</Link></li>
//               <li><Link to="/create-profile">Create Profile</Link></li>
//               <li><Link to="/login">Skills Assessment</Link></li>
//               <li><Link to="/login">Learning Resources</Link></li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>Company</h3>
//             <ul>
//               <li><Link to="/about-us">About Us</Link></li>
//               <li><Link to="/blog">Blog</Link></li>
//               <li><Link to="/careers">Careers</Link></li>
//               <li><Link to="/contact-us">Contact Us</Link></li>
//             </ul>
//           </div>
//         </div>
        
//         <div className="footer-bottom">
//           <p>© 2025 Synked. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;


// // src/components/Footer.js
// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer = () => {
//   return (
//     <footer>
//       <div className="container">
//         <div className="footer-content">
//           <div className="footer-column">
//             <div className="footer-logo">Synked</div>
//             <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
//               Connecting talented students with companies for impactful project experiences that benefit everyone.
//             </p>
//             <div className="social-links">
//               <a href="#" className="social-link">f</a>
//               <a href="#" className="social-link">in</a>
//               <a href="#" className="social-link">t</a>
//               <a href="#" className="social-link">ig</a>
//             </div>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Companies</h3>
//             <ul>
//               <li><Link to="/#how-it-works">How It Works</Link></li>
//               <li><Link to="/pricing">Pricing Plans</Link></li>
//               <li><Link to="/post-project">Post a Project</Link></li>
//               <li><Link to="/#success-stories">Success Stories</Link></li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Students</h3>
//             <ul>
//               <li><Link to="/projects">Browse Projects</Link></li>
//               <li><Link to="/create-profile">Create Profile</Link></li>
//               <li><Link to="/login">Skills Assessment</Link></li>
//               <li><Link to="/login">Learning Resources</Link></li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>Company</h3>
//             <ul>
//               <li><Link to="/about-us">About Us</Link></li>
//               <li><Link to="/blog">Blog</Link></li>
//               <li><Link to="/careers">Careers</Link></li>
//               <li><Link to="/contact-us">Contact Us</Link></li>
//             </ul>
//           </div>
//         </div>
        
//         <div className="footer-bottom">
//           <p>© 2025 Synked. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

// // src/components/Footer.js
// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer = () => {
//   return (
//     <footer>
//       <div className="container">
//         <div className="footer-content">
//           <div className="footer-column">
//             <div className="footer-logo">Synked</div>
//             <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
//               Connecting talented students with companies for impactful project experiences that benefit everyone.
//             </p>
//             <div className="social-links">
//               <a href="#" className="social-link">f</a>
//               <a href="#" className="social-link">in</a>
//               <a href="#" className="social-link">t</a>
//               <a href="#" className="social-link">ig</a>
//             </div>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Companies</h3>
//             <ul>
//               <li><Link to="/">How It Works</Link></li>
//               <li><Link to="/">Pricing Plans</Link></li>
//               <li><Link to="/post-project">Post a Project</Link></li>
//               <li><Link to="/">Success Stories</Link></li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>For Students</h3>
//             <ul>
//               <li><Link to="/projects">Browse Projects</Link></li>
//               <li><Link to="/create-profile">Create Profile</Link></li>
//               <li><Link to="/">Skills Assessment</Link></li>
//               <li><Link to="/">Learning Resources</Link></li>
//             </ul>
//           </div>
          
//           <div className="footer-column">
//             <h3>Company</h3>
//             <ul>
//               <li><Link to="/about-us">About Us</Link></li>
//               <li><Link to="/blog">Blog</Link></li>
//               <li><Link to="/careers">Careers</Link></li>
//               <li><Link to="/contact-us">Contact Us</Link></li>
//             </ul>
//           </div>
//         </div>
        
//         <div className="footer-bottom">
//           <p>© 2025 Synked. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;