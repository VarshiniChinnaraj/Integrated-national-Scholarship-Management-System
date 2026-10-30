const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getMyFeedbacks,
  getAllFeedbacksAdmin,
  getFeedbackById,
  respondToFeedback,
  updateFeedbackStatus
} = require('../controllers/feedbackController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Submit Feedback (Authenticated user)
router.post('/', protect, submitFeedback);

// View current user's submitted feedbacks
router.get('/my', protect, getMyFeedbacks);

// Admin: View all feedbacks
router.get(
  '/admin/all',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  getAllFeedbacksAdmin
);

// Get feedback detail
router.get('/:id', protect, getFeedbackById);

// Admin: Reply to feedback
router.post(
  '/:id/reply',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  respondToFeedback
);

// Admin: Update feedback status
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  updateFeedbackStatus
);

module.exports = router;
