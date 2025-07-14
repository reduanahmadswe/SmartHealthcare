import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    if (user?.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user?.role === "doctor") {
      return <Navigate to="/dashboard/doctor" replace />;
    } else {
      return <Navigate to="/dashboard/patient" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
