import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Student Auth Pages
import StudentLogin from './pages/auth/StudentLogin';
import Register from './pages/auth/Register';

// Student Portal Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentScholarships from './pages/student/Scholarships';
import StudentScholarshipDetails from './pages/student/ScholarshipDetails';
import StudentApplyScholarship from './pages/student/ApplyScholarship';
import StudentMyApplications from './pages/student/MyApplications';
import StudentApplicationTracking from './pages/student/ApplicationTracking';
import StudentPayments from './pages/student/Payments';
import StudentNotifications from './pages/student/Notifications';
import StudentFeedback from './pages/student/StudentFeedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Student Auth */}
          <Route path="/" element={<StudentLogin />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/register" element={<Register />} />

          {/* Student Portal Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/scholarships"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentScholarships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/scholarships/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentScholarshipDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/apply/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplyScholarship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentMyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentApplicationTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/payments"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/feedback"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentFeedback />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to student login */}
          <Route path="*" element={<Navigate to="/student/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
