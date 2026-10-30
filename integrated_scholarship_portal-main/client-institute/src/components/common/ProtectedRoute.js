import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted fw-semibold">Authenticating Institute Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/institute/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role);
    if (!hasRole) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
          <div className="custom-card p-5 text-center shadow-lg" style={{ maxWidth: '540px' }}>
            <div className="d-inline-flex p-3 rounded-circle bg-warning-subtle text-warning mb-4">
              <ShieldAlert size={48} />
            </div>
            <h3 className="fw-bold text-dark mb-2">403 - Access Forbidden</h3>
            <p className="text-muted mb-4">
              You do not have permission to access the Institute verification portal.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/institute/dashboard" className="btn btn-warning d-inline-flex align-items-center gap-2 text-dark">
                <ArrowLeft size={16} /> Return to Institute Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
