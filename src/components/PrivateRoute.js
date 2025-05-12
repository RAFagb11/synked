// src/components/PrivateRoute.js
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const PrivateRoute = ({ children, requireUserType }) => {
  const { currentUser, userType } = useContext(AuthContext);
  const location = useLocation();
  
  // In preview mode, allow access to protected routes
  if (process.env.REACT_APP_PREVIEW_MODE === "true") {
    return children;
  }
  
  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  
  // If a specific user type is required and doesn't match, redirect to login with message
  if (requireUserType && userType !== requireUserType) {
    return <Navigate to={`/login?message=${requireUserType}-only`} state={{ from: location }} />;
  }
  
  // User is logged in and meets requirements
  return children;
};

export default PrivateRoute;



// import React, { useContext } from "react";
// import { Navigate } from "react-router-dom";
// import { AuthContext } from "../contexts/AuthContext";

// // src/components/PrivateRoute.js
// const PrivateRoute = ({ children }) => {
//   const { currentUser } = useContext(AuthContext);
  
//   // In preview mode, allow access to protected routes
//   if (process.env.REACT_APP_PREVIEW_MODE === "true") {
//     return children;
//   }
  
//   return currentUser ? children : <Navigate to="/login" />;
// };

// export default PrivateRoute;
