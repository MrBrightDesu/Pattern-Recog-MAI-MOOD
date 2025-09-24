import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null; // Will be handled by App.js
  }

  // Just return children without header bar
  return <>{children}</>;
}

export default ProtectedRoute;
