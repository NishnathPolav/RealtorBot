import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard if role is not allowed
    if (user.role === 'seller') return <Navigate to="/seller-dashboard" replace />;
    if (user.role === 'buyer') return <Navigate to="/buyer-dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute; 