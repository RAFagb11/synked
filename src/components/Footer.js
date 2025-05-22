// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo">Synked</div>
            <p>
              Connecting talented students with companies for impactful
              project experiences that benefit everyone.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                f
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                in
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                🐦
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                📷
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h3>For Companies</h3>
            <ul>
              <li>
                <Link to="/#how-it-works">How It Works</Link>
              </li>
              <li>
                <Link to="/pricing">Pricing Plans</Link>
              </li>
              <li>
                <Link to="/post-project">Post a Project</Link>
              </li>
              <li>
                <Link to="/#testimonials">Success Stories</Link>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>For Students</h3>
            <ul>
              <li>
                <Link to="/projects">Browse Projects</Link>
              </li>
              <li>
                <Link to="/create-profile">Create Profile</Link>
              </li>
              <li>
                <Link to="/skills-assessment">Skills Assessment</Link>
              </li>
              <li>
                <Link to="/learning-resources">Learning Resources</Link>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li>
                <Link to="/about-us">About Us</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/careers">Careers</Link>
              </li>
              <li>
                <Link to="/contact-us">Contact Us</Link>
              </li>
              <li>
                <Link to="/support">Support</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Synked. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;