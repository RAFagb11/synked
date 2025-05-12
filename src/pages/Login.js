// src/pages/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get message from URL params for access denied messages
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [currentUser, navigate, location]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      
      // Navigate to the page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navigation />
      
      <div style={{ 
        backgroundColor: '#f5f7ff',
        minHeight: 'calc(100vh - 70px)', // Assuming header is 70px
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ 
            marginBottom: '30px',
            color: 'var(--primary)',
            textAlign: 'center'
          }}>
            Log in to Synked
          </h2>
          
          {error && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          {message === 'company-only' && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              color: 'var(--warning)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <strong>Access Denied:</strong> The page you tried to access is only available to company accounts. Please log in with a company account or register as a company.
            </div>
          )}
          
          {message === 'student-only' && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              color: 'var(--warning)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <strong>Access Denied:</strong> The page you tried to access is only available to student accounts. Please log in with a student account or register as a student.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px',
                marginTop: '20px'
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          
          <div style={{ 
            textAlign: 'center',
            marginTop: '30px',
            fontSize: '14px'
          }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)' }}>
              Forgot Password?
            </Link>
          </div>
          
          <div style={{ 
            textAlign: 'center',
            marginTop: '20px',
            borderTop: '1px solid #eee',
            paddingTop: '20px'
          }}>
            <p style={{ marginBottom: '15px' }}>
              Don't have an account yet?
            </p>
            <div style={{ 
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <Link to="/register?type=company" className="btn btn-outline" style={{ flex: '1' }}>
                Register as Company
              </Link>
              <Link to="/register?type=student" className="btn btn-outline" style={{ flex: '1' }}>
                Register as Student
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Login;


// // src/pages/Login.js - Update to properly handle Firebase authentication
// import React, { useState, useContext } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { AuthContext } from '../contexts/AuthContext';
// import Navigation from '../components/Navigation';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const { login } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   // Check if we were redirected from another page
//   const from = location.state?.from || '/';
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       setError('');
//       setLoading(true);
//       console.log("Attempting to log in with:", email);
//       await login(email, password);
//       console.log("Login successful, navigating to:", from);
//       navigate(from);
//     } catch (error) {
//       console.error("Login error:", error);
//       setError('Failed to log in: ' + error.message);
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Navigation />
//       <div className="container" style={{ maxWidth: '500px', margin: '80px auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
//         <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Log In to Your Account</h2>
        
//         {error && <div style={{ color: 'var(--danger)', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
//         <form onSubmit={handleSubmit}>
//           <div className="form-group" style={{ marginBottom: '20px' }}>
//             <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
//             />
//           </div>
          
//           <div className="form-group" style={{ marginBottom: '20px' }}>
//             <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
//             />
//           </div>
          
//           <button 
//             type="submit"
//             disabled={loading}
//             className="btn btn-primary"
//             style={{ width: '100%', marginTop: '10px' }}
//           >
//             {loading ? 'Logging In...' : 'Log In'}
//           </button>
//         </form>
        
//         <div style={{ textAlign: 'center', marginTop: '20px' }}>
//           Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign Up</Link>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;