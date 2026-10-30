const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAllStudents,
  submitApplication,
  getStudentApplications,
  getAllApplications,
  updateApplicationStatus,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Admin / Management Login
router.post('/login', adminLogin);

// Get All Registered Students (Management Portal)
router.get('/students', getAllStudents);

// Submit Scholarship Application (Student Portal - protected)
router.post('/applications', protect, submitApplication);

// Get Applications for Logged In Student (Student Portal - protected)
router.get('/my-applications', protect, getStudentApplications);

// Get All Applications (Management Portal Dashboard)
router.get('/applications', getAllApplications);

// Update Application Status (Approve / Reject)
router.put('/applications/:id/status', updateApplicationStatus);

// Student Notifications Routes
router.get('/notifications', protect, getStudentNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

module.exports = router;
