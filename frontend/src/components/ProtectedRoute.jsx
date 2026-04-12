  import React from "react";
  import { Navigate, Outlet } from "react-router-dom";

  const ProtectedRoute = ({ allowedRoles }) => {
    
    const token = sessionStorage.getItem("token");
    const userRole = sessionStorage.getItem("role");

    // 2. Check if user is logged in
    if (!token) {
      return <Navigate to="/login" replace />;
    }

    // 3. Check if  right role 
    if (allowedRoles && !allowedRoles.includes(userRole)) {
    
      return <Navigate to="/" replace />;
    }

    // 4. If all good, render the child routes
    return <Outlet />;
  };

  export default ProtectedRoute;
