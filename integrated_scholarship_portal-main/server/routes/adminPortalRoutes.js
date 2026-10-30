const express = require('express');
const router = express.Router();
const {
  getAdminDashboardAnalytics,
  getAllScholarshipsAdmin,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  getAllInstitutions,
  createInstitution,
  updateInstitution,
  getAllUsers,
  createUserByAdmin,
  updateUserStatus,
  getAllStudentsAdmin,
  getAdminApplications,
  getAuditLogs,
  getAdminNotifications,
  sendBroadcastNotification
} = require('../controllers/adminPortalController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

// Analytics
router.get('/dashboard-analytics', getAdminDashboardAnalytics);

// Scholarships Management
router.get('/scholarships', getAllScholarshipsAdmin);
router.post('/scholarships', createScholarship);
router.put('/scholarships/:id', updateScholarship);
router.delete('/scholarships/:id', deleteScholarship);

// Departments Management
router.get('/departments', getAllDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);

// Institutions Management
router.get('/institutions', getAllInstitutions);
router.post('/institutions', createInstitution);
router.put('/institutions/:id', updateInstitution);

// User Management
router.get('/users', getAllUsers);
router.get('/students', getAllStudentsAdmin);
router.post('/users', createUserByAdmin);
router.put('/users/:id/status', updateUserStatus);

// Application Monitoring (System-Wide)
router.get('/applications', getAdminApplications);

// Audit Trail (Immutable)
router.get('/audit-logs', getAuditLogs);

// Notifications
router.get('/notifications', getAdminNotifications);
router.post('/notifications/broadcast', sendBroadcastNotification);

// Email Dispatch & Deadline Reminder Monitoring
const {
  getEmailLogs,
  retryEmailDispatch,
  getReminderLogs,
  triggerReminderRun,
  retryReminderLog
} = require('../controllers/emailController');
router.get('/email-logs', getEmailLogs);
router.post('/email-logs/:id/retry', retryEmailDispatch);

// Smart Scholarship Deadline Reminders (Admin control)
router.get('/reminders/logs', getReminderLogs);
router.post('/reminders/trigger', triggerReminderRun);
router.post('/reminders/logs/:id/retry', retryReminderLog);

module.exports = router;

