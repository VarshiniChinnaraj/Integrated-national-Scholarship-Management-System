const express = require('express');
const router = express.Router();
const {
  getDepartmentDashboard,
  getDepartmentApplications,
  getDepartmentApplicationById,
  verifyDepartmentApplication,
  generateSanctionOrder,
  getSanctions,
  getDisbursements,
  simulateDisbursement,
  getDepartmentReports,
  getDepartmentNotifications
} = require('../controllers/departmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all department routes
router.use(protect);
router.use(authorizeRoles('DEPARTMENT_OFFICER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDepartmentDashboard);
router.get('/applications', getDepartmentApplications);
router.get('/applications/:id', getDepartmentApplicationById);
router.post('/applications/:id/verify', verifyDepartmentApplication);
router.post('/sanctions/generate', generateSanctionOrder);
router.get('/sanctions', getSanctions);
const { downloadSanctionPdf } = require('../controllers/emailController');
router.get('/sanctions/:id/pdf', downloadSanctionPdf);
router.get('/disbursement', getDisbursements);
router.post('/disbursement/:id/simulate', simulateDisbursement);
router.get('/reports', getDepartmentReports);
router.get('/notifications', getDepartmentNotifications);

module.exports = router;
