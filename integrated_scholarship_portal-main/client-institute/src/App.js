import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Institute Auth Page
import InstituteLogin from './pages/auth/InstituteLogin';

// Institute Officer Portal Pages
import InstituteDashboard from './pages/institute/InstituteDashboard';
import InstituteApplications from './pages/institute/InstituteApplications';
import InstituteVerification from './pages/institute/InstituteVerification';
import InstituteStudents from './pages/institute/InstituteStudents';
import InstituteNotifications from './pages/institute/InstituteNotifications';
import InstituteFeedback from './pages/institute/InstituteFeedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Institute Auth */}
          <Route path="/" element={<InstituteLogin />} />
          <Route path="/login" element={<InstituteLogin />} />
          <Route path="/institute/login" element={<InstituteLogin />} />
          <Route path="/login/institute" element={<InstituteLogin />} />

          {/* Institute Officer Portal Routes */}
          <Route
            path="/institute/dashboard"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institute/applications"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institute/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institute/students"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institute/notifications"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institute/feedback"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTE_OFFICER']}>
                <InstituteFeedback />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to institute login */}
          <Route path="*" element={<Navigate to="/institute/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
