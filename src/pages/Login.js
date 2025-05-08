// src/pages/Login.js - Update to properly handle Firebase authentication
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we were redirected from another page
  const from = location.state?.from || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      console.log("Attempting to log in with:", email);
      await login(email, password);
      console.log("Login successful, navigating to:", from);
      navigate(from);
    } catch (error) {
      console.error("Login error:", error);
      setError('Failed to log in: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ maxWidth: '500px', margin: '80px auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Log In to Your Account</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign Up</Link>
        </div>
      </div>
    </>
  );
};

export default Login;