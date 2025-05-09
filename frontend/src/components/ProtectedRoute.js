import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPage }) => {
  const { user, permissions, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to all pages
  if (user.isAdmin) {
    return children;
  }

  // Check if the user has permission to view the required page
  const hasPermission = permissions[requiredPage]?.canView || false;

  if (!hasPermission) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
};
// /*test
export default ProtectedRoute;
