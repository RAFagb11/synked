// src/App.js - WITH DEBUG COMPONENTS (Temporary)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateProfile from './pages/CreateProfile';
import NotFound from './pages/NotFound';
import ContactUs from './pages/ContactUs';

// Project Pages
import ProjectListings from './pages/ProjectListings';
import ProjectDetail from './pages/ProjectDetail';
import ProjectAccepted from './pages/ProjectAccepted';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentProjectPortal from './pages/StudentProjectPortal';

// Company Pages
import CompanyDashboard from './pages/CompanyDashboard';
import CompanyProfile from './pages/CompanyProfile';
import CompanyProjectManagement from './pages/CompanyProjectManagement';
import PostProject from './pages/PostProject';
import ProjectApplications from './pages/ProjectApplications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<ProjectListings />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/contact-us" element={<ContactUs />} />
            
            {/* Protected Routes - Student */}
            <Route 
              path="/student/dashboard" 
              element={
                <PrivateRoute requireUserType="student">
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <PrivateRoute requireUserType="student">
                  <StudentProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/project/:projectId" 
              element={
                <PrivateRoute requireUserType="student">
                  <StudentProjectPortal />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/projects/:id/accepted" 
              element={
                <PrivateRoute requireUserType="student">
                  <ProjectAccepted />
                </PrivateRoute>
              } 
            />
            
            {/* Protected Routes - Company */}
            <Route 
              path="/company/dashboard" 
              element={
                <PrivateRoute requireUserType="company">
                  <CompanyDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/company/profile" 
              element={
                <PrivateRoute requireUserType="company">
                  <CompanyProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/company/project/:projectId" 
              element={
                <PrivateRoute requireUserType="company">
                  <CompanyProjectManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/company/applications/:projectId" 
              element={
                <PrivateRoute requireUserType="company">
                  <ProjectApplications />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/post-project" 
              element={
                <PrivateRoute requireUserType="company">
                  <PostProject />
                </PrivateRoute>
              } 
            />
            
            {/* Both user types */}
            <Route 
              path="/create-profile" 
              element={
                <PrivateRoute>
                  <CreateProfile />
                </PrivateRoute>
              } 
            />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
    
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;