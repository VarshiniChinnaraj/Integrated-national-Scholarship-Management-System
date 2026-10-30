const express = require('express');
const router = express.Router();
const {
  login,
  registerStudent,
  getMe,
  updateProfile,
  getPublicInstitutions,
  getPublicDepartments
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Universal Login
router.post('/login', login);

// Student Registration
router.post('/register', registerStudent);

// Public Metadata Endpoints for Registration & Browsing
router.get('/institutions', getPublicInstitutions);
router.get('/departments', getPublicDepartments);

// Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
