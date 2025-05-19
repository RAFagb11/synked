// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';


// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import ProjectListings from './pages/ProjectListings';
import ProjectDetail from './pages/ProjectDetail';
import CreateProfile from './pages/CreateProfile';
import PostProject from './pages/PostProject';
import StudentProjectPortal from './pages/StudentProjectPortal';
import CompanyProjectManagement from './pages/CompanyProjectManagement';
import NotFound from './pages/NotFound';
import CompanyProjectView from './pages/CompanyProjectView.js';
import ProjectAccepted from './pages/ProjectAccepted.js';
import StudentProjectView from './pages/StudentProjectView.js';



// New page imports
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import Careers from './pages/Careers';
import ContactUs from './pages/ContactUs';
import PricingPlans from './pages/PricingPlans';
import SkillsAssessment from './pages/SkillsAssessment';
import LearningResources from './pages/LearningResources';

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
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <PrivateRoute>
                <StudentDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/student/project/:projectId" 
            element={
              <PrivateRoute>
                <StudentProjectPortal />
              </PrivateRoute>
            } 
          />
          
          {/* Company Routes */}
          <Route 
            path="/company/dashboard" 
            element={
              <PrivateRoute>
                <CompanyDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/company/project/:projectId" 
            element={
              <PrivateRoute>
                <CompanyProjectManagement />
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
          
          {/* Company Only Routes */}
          <Route 
            path="/post-project" 
            element={
              <PrivateRoute requireUserType="company">
                <PostProject />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pricing" 
            element={
              <PrivateRoute requireUserType="company">
                <PricingPlans />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/projects/:id/accepted" 
            element={
              <PrivateRoute>
                <ProjectAccepted />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/company/projects/:id" 
            element={
              <PrivateRoute>
                <CompanyProjectView />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/student/projects/:id" 
            element={
              <PrivateRoute>
                <StudentProjectView />
              </PrivateRoute>
            } 
          />
          
          {/* New Public Routes */}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact-us" element={<ContactUs />} />
          
          {/* Student Resources */}
          <Route path="/skills-assessment" element={<SkillsAssessment />} />
          <Route path="/learning-resources" element={<LearningResources />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


// // src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import PrivateRoute from './components/PrivateRoute';

// // Pages
// import LandingPage from './pages/LandingPage';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import StudentDashboard from './pages/StudentDashboard';
// import CompanyDashboard from './pages/CompanyDashboard';
// import ProjectListings from './pages/ProjectListings';
// import ProjectDetail from './pages/ProjectDetail';
// import CreateProfile from './pages/CreateProfile';
// import PostProject from './pages/PostProject';
// import StudentProjectPortal from './pages/StudentProjectPortal';
// import CompanyProjectManagement from './pages/CompanyProjectManagement';
// import NotFound from './pages/NotFound';
// // New page imports
// import AboutUs from './pages/AboutUs';
// import Blog from './pages/Blog';
// import Careers from './pages/Careers';
// import ContactUs from './pages/ContactUs';
// import PricingPlans from './pages/PricingPlans';

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/projects" element={<ProjectListings />} />
//           <Route path="/projects/:id" element={<ProjectDetail />} />
          
//           {/* Student Routes */}
//           <Route 
//             path="/student/dashboard" 
//             element={
//               <PrivateRoute>
//                 <StudentDashboard />
//               </PrivateRoute>
//             } 
//           />
//           <Route 
//             path="/student/project/:projectId" 
//             element={
//               <PrivateRoute>
//                 <StudentProjectPortal />
//               </PrivateRoute>
//             } 
//           />
          
//           {/* Company Routes */}
//           <Route 
//             path="/company/dashboard" 
//             element={
//               <PrivateRoute>
//                 <CompanyDashboard />
//               </PrivateRoute>
//             } 
//           />
//           <Route 
//             path="/company/project/:projectId" 
//             element={
//               <PrivateRoute>
//                 <CompanyProjectManagement />
//               </PrivateRoute>
//             } 
//           />
//           <Route 
//             path="/create-profile" 
//             element={
//               <PrivateRoute>
//                 <CreateProfile />
//               </PrivateRoute>
//             } 
//           />
//           <Route 
//             path="/post-project" 
//             element={
//               <PrivateRoute>
//                 <PostProject />
//               </PrivateRoute>
//             } 
//           />
          
//           {/* New Routes */}
//           <Route path="/about-us" element={<AboutUs />} />
//           <Route path="/blog" element={<Blog />} />
//           <Route path="/careers" element={<Careers />} />
//           <Route path="/contact-us" element={<ContactUs />} />
//           <Route path="/pricing" element={<PricingPlans />} />
          
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

/*
<Route 
            path="/students/:id" 
            element={
              <PrivateRoute>
                <StudentProfile />
              </PrivateRoute>
            } 
          />

*/




