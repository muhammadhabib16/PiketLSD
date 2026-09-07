import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, userAccount } = useAttendance();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && userAccount?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
