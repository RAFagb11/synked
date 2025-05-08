import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

// src/components/PrivateRoute.js
const PrivateRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  
  // In preview mode, allow access to protected routes
  if (process.env.REACT_APP_PREVIEW_MODE === "true") {
    return children;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
