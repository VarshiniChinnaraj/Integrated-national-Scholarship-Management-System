const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getScholarships,
  getScholarshipById,
  applyScholarship,
  getMyApplications,
  getApplicationDetails,
  resubmitCorrection,
  getMyPayments,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getEligibleScholarships
} = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public or student browsable scholarships
router.get('/scholarships', getScholarships);
router.get('/scholarships/:id', getScholarshipById);

// Student protected routes
router.get('/dashboard', protect, authorizeRoles('STUDENT'), getStudentDashboard);
router.get('/eligible-scholarships', protect, authorizeRoles('STUDENT'), getEligibleScholarships);
router.post('/apply/:id', protect, authorizeRoles('STUDENT'), applyScholarship);
router.get('/applications', protect, authorizeRoles('STUDENT'), getMyApplications);
router.get('/applications/:id', protect, getApplicationDetails);
const { downloadSanctionPdf } = require('../controllers/emailController');
router.get('/applications/:id/sanction-pdf', protect, downloadSanctionPdf);
router.put('/applications/:id/resubmit-correction', protect, authorizeRoles('STUDENT'), resubmitCorrection);
router.get('/payments', protect, authorizeRoles('STUDENT'), getMyPayments);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;

