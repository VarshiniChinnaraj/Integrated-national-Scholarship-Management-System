const Feedback = require('../models/Feedback');
const Application = require('../models/Application');
const { recordAuditLog, createNotification } = require('../utils/auditHelper');

/**
 * Submit Feedback (Student, Institute Officer, Department Officer)
 * POST /api/feedback
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { category, subject, message, priority, applicationNumber } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and message are required.'
      });
    }

    let applicationId = null;
    let appNumber = applicationNumber || '';
    let institutionId = req.user.institutionId || null;
    let institutionName = req.user.institutionName || '';
    let departmentId = req.user.departmentId || null;
    let departmentName = req.user.departmentName || '';

    // If application number is provided, try to find the matching application
    if (appNumber) {
      const app = await Application.findOne({ applicationNumber: appNumber.trim() });
      if (app) {
        applicationId = app._id;
        if (!institutionId && app.institutionId) {
          institutionId = app.institutionId;
          institutionName = app.institutionName;
        }
        if (!departmentId && app.departmentId) {
          departmentId = app.departmentId;
          departmentName = app.departmentName;
        }
      }
    } else if (req.user.role === 'STUDENT') {
      // Find latest application if user didn't specify one
      const studentApp = await Application.findOne({ studentId: req.user._id }).sort({ createdAt: -1 });
      if (studentApp) {
        applicationId = studentApp._id;
        appNumber = studentApp.applicationNumber;
        institutionId = studentApp.institutionId;
        institutionName = studentApp.institutionName;
        departmentId = studentApp.departmentId;
        departmentName = studentApp.departmentName;
      }
    }

    const feedback = await Feedback.create({
      senderId: req.user._id,
      senderRole: req.user.role,
      senderName: req.user.name,
      senderEmail: req.user.email,
      institutionId,
      institutionName,
      departmentId,
      departmentName,
      applicationId,
      applicationNumber: appNumber,
      category,
      subject,
      message,
      priority: priority || 'Normal',
      status: 'NEW'
    });

    // Notify Admins about the new feedback
    await createNotification({
      recipientRole: 'ADMIN',
      title: `New Feedback from ${req.user.name} (${req.user.role})`,
      message: `[${priority || 'Normal'}] ${category}: ${subject}`,
      type: priority === 'Urgent' ? 'warning' : 'info',
      applicationNumber: appNumber
    });

    // Write Audit Log
    await recordAuditLog({
      applicationId,
      applicationNumber: appNumber || 'N/A',
      previousStatus: 'NONE',
      newStatus: 'FEEDBACK_CREATED',
      changedBy: req.user._id,
      officerName: req.user.name,
      officerRole: req.user.role,
      remarks: `Submitted feedback: "${subject}" (${category}, ${priority || 'Normal'})`,
      metadata: { feedbackId: feedback._id, category, priority }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * Get current user's submitted feedbacks
 * GET /api/feedback/my
 */
exports.getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ senderId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Error getting my feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
};

/**
 * Get all feedbacks for Admin with optional filters
 * GET /api/feedback/admin/all
 */
exports.getAllFeedbacksAdmin = async (req, res) => {
  try {
    const { role, status, priority, category, search } = req.query;

    const filter = {};
    if (role && role !== 'ALL') filter.senderRole = role;
    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
        { senderEmail: { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } },
        { institutionName: { $regex: search, $options: 'i' } }
      ];
    }

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });

    // Calculate summary statistics
    const stats = {
      total: feedbacks.length,
      newCount: feedbacks.filter(f => f.status === 'NEW').length,
      inReviewCount: feedbacks.filter(f => f.status === 'IN_REVIEW').length,
      resolvedCount: feedbacks.filter(f => f.status === 'RESOLVED').length,
      closedCount: feedbacks.filter(f => f.status === 'CLOSED').length,
      urgentCount: feedbacks.filter(f => f.priority === 'Urgent').length
    };

    res.json({
      success: true,
      stats,
      feedbacks
    });
  } catch (error) {
    console.error('Error getting admin feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
      error: error.message
    });
  }
};

/**
 * Get feedback detail by ID
 * GET /api/feedback/:id
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Role check: non-admin can only view their own feedback
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin && feedback.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this feedback'
      });
    }

    // If Admin opens a NEW feedback, automatically move to IN_REVIEW
    if (isAdmin && feedback.status === 'NEW') {
      feedback.status = 'IN_REVIEW';
      await feedback.save();

      await recordAuditLog({
        applicationId: feedback.applicationId,
        applicationNumber: feedback.applicationNumber || 'N/A',
        previousStatus: 'NEW',
        newStatus: 'FEEDBACK_VIEWED',
        changedBy: req.user._id,
        officerName: req.user.name,
        officerRole: req.user.role,
        remarks: `Admin opened feedback "${feedback.subject}" for review`,
        metadata: { feedbackId: feedback._id }
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error getting feedback by id:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback details',
      error: error.message
    });
  }
};

/**
 * Respond to Feedback (Admin only)
 * POST /api/feedback/:id/reply
 */
exports.respondToFeedback = async (req, res) => {
  try {
    const { response, status } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response content is required'
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const previousStatus = feedback.status;
    const targetStatus = status || 'RESOLVED';

    feedback.adminResponse = response.trim();
    feedback.status = targetStatus;
    feedback.respondedBy = req.user._id;
    feedback.respondedByName = req.user.name;
    feedback.respondedAt = new Date();

    await feedback.save();

    // Notify Sender that Admin responded
    await createNotification({
      userId: feedback.senderId,
      recipientRole: feedback.senderRole,
      title: 'Feedback Response Received from Admin',
      message: `Admin responded to your feedback "${feedback.subject}": ${response.substring(0, 120)}${response.length > 120 ? '...' : ''}`,
      type: 'info',
      applicationNumber: feedback.applicationNumber
    });

    // Record Audit Log
    await recordAuditLog({
      applicationId: feedback.applicationId,
      applicationNumber: feedback.applicationNumber || 'N/A',
      previousStatus,
      newStatus: targetStatus === 'RESOLVED' ? 'FEEDBACK_RESOLVED' : 'FEEDBACK_RESPONSE_SENT',
      changedBy: req.user._id,
      officerName: req.user.name,
      officerRole: req.user.role,
      remarks: `Admin replied to feedback "${feedback.subject}" (Status: ${targetStatus})`,
      metadata: { feedbackId: feedback._id, responsePreview: response.substring(0, 80) }
    });

    res.json({
      success: true,
      message: 'Response sent successfully',
      feedback
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
};

/**
 * Update Feedback Status (Admin only)
 * PATCH /api/feedback/:id/status
 */
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['NEW', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const previousStatus = feedback.status;
    feedback.status = status;
    await feedback.save();

    await recordAuditLog({
      applicationId: feedback.applicationId,
      applicationNumber: feedback.applicationNumber || 'N/A',
      previousStatus,
      newStatus: status === 'RESOLVED' ? 'FEEDBACK_RESOLVED' : 'FEEDBACK_STATUS_CHANGED',
      changedBy: req.user._id,
      officerName: req.user.name,
      officerRole: req.user.role,
      remarks: `Admin changed feedback status from ${previousStatus} to ${status}`,
      metadata: { feedbackId: feedback._id, newStatus: status }
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message
    });
  }
};
