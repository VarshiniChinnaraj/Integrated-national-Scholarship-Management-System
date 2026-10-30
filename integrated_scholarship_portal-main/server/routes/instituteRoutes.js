const express = require('express');
const router = express.Router();
const {
  getInstituteDashboard,
  getInstituteApplications,
  getInstituteApplicationById,
  verifyApplication,
  getInstituteStudents,
  getInstituteNotifications
} = require('../controllers/instituteController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all institute routes
router.use(protect);
router.use(authorizeRoles('INSTITUTE_OFFICER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getInstituteDashboard);
router.get('/applications', getInstituteApplications);
router.get('/applications/:id', getInstituteApplicationById);
router.post('/applications/:id/verify', verifyApplication);
router.get('/students', getInstituteStudents);
router.get('/notifications', getInstituteNotifications);

module.exports = router;
