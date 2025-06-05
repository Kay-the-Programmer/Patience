
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types'; // Import UserRole

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: UserRole[]; // Optional roles array
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them there after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the current user has one of those roles
  if (roles && roles.length > 0 && !roles.includes(currentUser.role)) {
    // User does not have the required role, redirect to a default page (e.g., dashboard)
    // Or show an access denied message. For simplicity, redirecting to dashboard.
    // You might want to create a specific "Access Denied" page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
