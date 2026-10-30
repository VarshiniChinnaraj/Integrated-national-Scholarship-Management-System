import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Department Auth Page
import DepartmentLogin from './pages/auth/DepartmentLogin';

// Department Officer Portal Pages
import DepartmentDashboard from './pages/department/DepartmentDashboard';
import DepartmentApplications from './pages/department/DepartmentApplications';
import DepartmentVerification from './pages/department/DepartmentVerification';
import DepartmentSanctions from './pages/department/DepartmentSanctions';
import DepartmentDisbursement from './pages/department/DepartmentDisbursement';
import DepartmentReports from './pages/department/DepartmentReports';
import DepartmentNotifications from './pages/department/DepartmentNotifications';
import DepartmentFeedback from './pages/department/DepartmentFeedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Department Auth */}
          <Route path="/" element={<DepartmentLogin />} />
          <Route path="/login" element={<DepartmentLogin />} />
          <Route path="/department/login" element={<DepartmentLogin />} />
          <Route path="/login/department" element={<DepartmentLogin />} />

          {/* Department Officer Portal Routes */}
          <Route
            path="/department/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/applications"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/sanctions"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentSanctions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/disbursement"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentDisbursement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/reports"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/notifications"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/feedback"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
                <DepartmentFeedback />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to department login */}
          <Route path="*" element={<Navigate to="/department/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
