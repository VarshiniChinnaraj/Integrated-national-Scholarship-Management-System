const express = require('express');
const router = express.Router();
const {
  getPublicSlpConfig,
  getApplicationSlpTracking,
  getAdminSlpOverview,
  triggerSlpCheck
} = require('../controllers/slpController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public SLP Configuration
router.get('/config', getPublicSlpConfig);

// Application SLP Tracking (Accessible by authenticated users or public for demo)
router.get('/tracking/:id', getApplicationSlpTracking);

// Admin SLP Overview (Accessible by Admin, Super Admin, and Officers)
router.get(
  '/admin/overview',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER', 'INSTITUTE_OFFICER'),
  getAdminSlpOverview
);

// Manual SLA Check trigger
router.post('/check', triggerSlpCheck);

module.exports = router;
