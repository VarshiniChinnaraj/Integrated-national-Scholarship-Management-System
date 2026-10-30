const express = require('express');
const router = express.Router();
const {
  getEmailLogs,
  retryEmailDispatch,
  downloadSanctionPdf,
  getReminderLogs,
  triggerReminderRun,
  retryReminderLog
} = require('../controllers/emailController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public or Student/Officer download PDF (authenticated)
router.get('/sanctions/:id/pdf', protect, downloadSanctionPdf);

// Admin-only monitoring and retry routes
router.get('/logs', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getEmailLogs);
router.post('/logs/:id/retry', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), retryEmailDispatch);

// Scholarship Deadline Reminder Monitoring & Trigger Routes (Admin)
router.get('/reminders/logs', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), getReminderLogs);
router.post('/reminders/trigger', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), triggerReminderRun);
router.post('/reminders/logs/:id/retry', protect, authorizeRoles('ADMIN', 'SUPER_ADMIN'), retryReminderLog);

module.exports = router;
