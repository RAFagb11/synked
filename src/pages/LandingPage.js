// src/pages/LandingPage.js
import React from "react";
import { useContext } from 'react';
import { Link } from "react-router-dom";
import { AuthContext } from '../contexts/AuthContext';
import Navigation from "../components/Navigation";

const LandingPage = () => {
  const { currentUser, userType } = useContext(AuthContext);
  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <section className="hero">
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div className="hero-content">
            <div className="feature-badge">
              Student-Company Collaboration Platform
            </div>
            <h1>Where Talent Meets Opportunity</h1>
            <p>
              Connect ambitious students with companies for impactful projects.
              Build portfolios, gain experience, and create real business value.
            </p>
            <div className="hero-buttons">
              <Link to="/register?type=company" className="btn btn-primary">
                For Companies
              </Link>
              <Link to="/register?type=student" className="btn btn-outline">
                For Students
              </Link>
            </div>
          </div>
          <div className="hero-image">        {/* CHANGE IMAGE ON LANDING PAGE */} 
            <img
              src="https://d92mrp7hetgfk.cloudfront.net/images/sites/misc/su-home-hero-image-m/original.png"
              alt="Synked platform"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <div className="feature-badge">Benefits</div>
            <h2>Transforming Work Experience</h2>
            <p>
              Our platform bridges the gap between academic learning and
              professional experience.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>For Companies</h3>
              <p>
                Tap into a pool of motivated students with fresh perspectives.
                Complete projects affordably while discovering future talent for
                your organization.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>For Students</h3>
              <p>
                Build a standout portfolio with real-world projects. Gain
                valuable experience, develop professional skills, and make
                meaningful connections.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Smart Matching</h3>
              <p>
                Our intelligent matching system connects the right students with
                the right projects based on skills, interests, availability, and
                career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="feature-badge">Process</div>
            <h2>Simple and Effective</h2>
            <p>Four easy steps to connect talent with opportunity</p>
          </div>
          <div className="steps">
            <div className="step-line"></div>
            <div className="step">
              <div className="step-number">1</div>
              <h3>Post a Project</h3>
              <p>Companies describe their needs, timeline, and compensation</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Get Matched</h3>
              <p>Our system connects projects with qualified students</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Collaborate</h3>
              <p>Work together through our platform with integrated tools</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Complete & Review</h3>
              <p>
                Finish the project and provide feedback for future opportunities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="section-header">
            <div className="feature-badge">Testimonials</div>
            <h2>Success Stories</h2>
            <p>Real experiences from our community of companies and students</p>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "We needed help with our digital marketing strategy but couldn't
                afford an agency. The marketing students we connected with
                delivered incredible value and fresh ideas that transformed our
                approach."
              </p>
              <div className="testimonial-author">
                <div className="author-image">SJ</div>
                <div className="author-details">
                  <h4>Sarah Johnson</h4>
                  <p>Founder, EcoTech Solutions</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "The web development project I completed through Synked became
                the centerpiece of my portfolio. It directly led to my
                internship at a major tech company and gave me confidence in my
                abilities."
              </p>
              <div className="testimonial-author">
                <div className="author-image">JK</div>
                <div className="author-details">
                  <h4>Jason Kim</h4>
                  <p>Computer Science Student</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Our startup saved thousands in development costs while
                providing valuable experience to talented students. The quality
                of work exceeded our expectations, and we've even hired two
                students full-time!"
              </p>
              <div className="testimonial-author">
                <div className="author-image">MR</div>
                <div className="author-details">
                  <h4>Michael Rodriguez</h4>
                  <p>CTO, FinNext Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Bridge the Gap?</h2>
          <p>
            Join our community today and start connecting with opportunities
            that transform careers and businesses.
          </p>
          <div className="cta-buttons">
            <Link 
              to={
                !currentUser 
                  ? '/register?type=company' 
                  : userType === 'company' 
                    ? '/post-project' 
                    : '/register?type=company'  // Student trying to post project should register as company
              } 
              className="btn btn-white"
              onClick={() => setTimeout(() => window.scrollTo(0, 0), 100)}
            >
              Post a Project
            </Link>
            <Link 
              to={
                !currentUser 
                  ? '/register?type=student' 
                  : userType === 'student' 
                    ? '/student/dashboard' 
                    : '/register?type=student'  // Company trying to join as student should register as student
              } 
              className="btn btn-white-outline"
            >
              Join as a Student
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <a href="#" className="social-link">
                  f
                </a>
                <a href="#" className="social-link">
                  in
                </a>
                <a href="#" className="social-link">
                  🐦
                </a>
                <a href="#" className="social-link">
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
                  <Link to="/resources">Learning Resources</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Company</h3>
              <ul>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/careers">Careers</Link>
                </li>
                <li>
                  <Link to="/contact">Contact Us</Link>
                </li>
                <li>
                  <Link to="/support">Support</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Synked. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
