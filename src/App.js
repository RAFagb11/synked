// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Import CSS
import "./index.css";
import "./components/ProjectPreview.css";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import ProjectListings from "./pages/ProjectListings";
import ProjectDetail from "./pages/ProjectDetail";
import CreateProfile from "./pages/CreateProfile";
import PostProject from "./pages/PostProject";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/projects" element={<ProjectListings />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <PrivateRoute>
                <CompanyDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-profile"
            element={
              <PrivateRoute>
                <CreateProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/post-project"
            element={
              <PrivateRoute>
                <PostProject />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
