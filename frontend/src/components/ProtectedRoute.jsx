import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-email', '/about'];

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const profileCompleted = localStorage.getItem('profile_completed') === 'true';

  // Pages publiques : toujours accessibles
  if (PUBLIC_PATHS.includes(location.pathname)) {
    return children;
  }

  // Page complete-profile : accessible si connecté (même si profil incomplet)
  if (location.pathname === '/complete-profile') {
    if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
  }

  //  Routes protégées : vérifier authentification
  if (!token || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //  Si le profil n'est pas complété, rediriger
  if (!profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
}
