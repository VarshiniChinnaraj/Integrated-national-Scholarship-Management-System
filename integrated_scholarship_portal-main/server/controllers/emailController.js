const EmailLog = require('../models/EmailLog');
const { retrySanctionApprovedEmail } = require('../services/emailService');
const { getSanctionOrderPdfPath, generateSanctionOrderPdf } = require('../services/pdfService');
const Sanction = require('../models/Sanction');
const Application = require('../models/Application');
const mongoose = require('mongoose');
const fs = require('fs');

// @desc    Get All Email Dispatch Logs (Admin Monitoring)
// @route   GET /api/admin/email-logs
// @access  Private (Admin, Super Admin)
const getEmailLogs = async (req, res) => {
  try {
    const { status, emailType, search } = req.query;
    const filter = {};

    if (status && status !== 'All' && status.toLowerCase() !== 'all') {
      filter.status = status.toUpperCase();
    }

    if (emailType && emailType !== 'All' && emailType.toLowerCase() !== 'all') {
      filter.emailType = emailType.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { recipient: searchRegex },
        { sanctionNumber: searchRegex },
        { applicationNumber: searchRegex },
        { studentName: searchRegex }
      ];
    }

    const logs = await EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get Email Logs Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve email dispatch logs',
      error: error.message
    });
  }
};

// @desc    Retry a Failed Email Dispatch
// @route   POST /api/admin/email-logs/:id/retry
// @access  Private (Admin, Super Admin)
const retryEmailDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await retrySanctionApprovedEmail(id);

    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Email re-sent successfully' : 'Email retry failed',
      emailLog: result.emailLog,
      error: result.error
    });
  } catch (error) {
    console.error('Retry Email Dispatch Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retry email dispatch',
      error: error.message
    });
  }
};

// @desc    Download / View Generated Sanction Order PDF
// @route   GET /api/department/sanctions/:id/pdf
// @access  Private (Authenticated Users)
const downloadSanctionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    let sanction = null;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Identifier is required' });
    }

    const trimmedId = String(id).trim();

    // 1. Check if identifier is a Sanction Number (e.g., SAN-2026-XXXXXX)
    if (trimmedId.startsWith('SAN-')) {
      sanction = await Sanction.findOne({ sanctionNumber: trimmedId });
    }

    // 2. Check if identifier is an Application Number (e.g., APP-2026-XXXXXX or SCH-2026-XXXXXX)
    if (!sanction && (trimmedId.startsWith('APP-') || trimmedId.startsWith('SCH-'))) {
      sanction = await Sanction.findOne({ applicationNumber: trimmedId });
    }

    // 3. Check if identifier is a valid Mongo ObjectId
    if (!sanction && mongoose.Types.ObjectId.isValid(trimmedId)) {
      sanction = await Sanction.findById(trimmedId);
      if (!sanction) {
        sanction = await Sanction.findOne({ applicationId: trimmedId });
      }
    }

    // 4. Fallback search by sanctionNumber or applicationNumber
    if (!sanction) {
      sanction = await Sanction.findOne({
        $or: [
          { sanctionNumber: trimmedId },
          { applicationNumber: trimmedId }
        ]
      });
    }

    // 5. If still not found, check if it's an Application and look up its sanction
    if (!sanction) {
      let app = null;
      if (mongoose.Types.ObjectId.isValid(trimmedId)) {
        app = await Application.findById(trimmedId);
      }
      if (!app) {
        app = await Application.findOne({ applicationNumber: trimmedId });
      }

      if (app) {
        sanction = await Sanction.findOne({
          $or: [
            { applicationId: app._id },
            { applicationNumber: app.applicationNumber }
          ]
        });
      }
    }

    if (!sanction) {
      return res.status(404).json({ success: false, message: 'Sanction record not found for the requested application or sanction ID' });
    }

    let filePath = getSanctionOrderPdfPath(sanction.sanctionNumber);
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = await generateSanctionOrderPdf(sanction);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Sanction_Order_${sanction.sanctionNumber}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Download Sanction PDF Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate or retrieve Sanction Order PDF',
      error: error.message
    });
  }
};

// @desc    Get All Scholarship Deadline Reminder Logs (Admin Monitoring)
// @route   GET /api/emails/reminder-logs
// @access  Private (Admin, Super Admin)
const getReminderLogs = async (req, res) => {
  try {
    const ReminderLog = require('../models/ReminderLog');
    const { status, reminderType, search } = req.query;
    const filter = {};

    if (status && status !== 'All' && status.toLowerCase() !== 'all') {
      filter.status = status.toUpperCase();
    }

    if (reminderType && reminderType !== 'All' && reminderType.toLowerCase() !== 'all') {
      filter.reminderType = reminderType.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { studentEmail: searchRegex },
        { studentName: searchRegex },
        { scholarshipName: searchRegex }
      ];
    }

    const logs = await ReminderLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get Reminder Logs Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve deadline reminder logs',
      error: error.message
    });
  }
};

// @desc    Manually Trigger Reminder Run (Admin On-Demand)
// @route   POST /api/emails/reminders/trigger
// @access  Private (Admin, Super Admin)
const triggerReminderRun = async (req, res) => {
  try {
    const { processScheduledReminders } = require('../services/reminderService');
    const { scholarshipId, studentId, force } = req.body || {};
    const result = await processScheduledReminders({
      scholarshipId,
      studentId,
      force: Boolean(force)
    });

    return res.status(200).json({
      success: true,
      message: 'Scholarship deadline reminder check completed',
      result
    });
  } catch (error) {
    console.error('Trigger Reminder Run Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run deadline reminder scheduler',
      error: error.message
    });
  }
};

// @desc    Retry a Failed Deadline Reminder Email
// @route   POST /api/emails/reminder-logs/:id/retry
// @access  Private (Admin, Super Admin)
const retryReminderLog = async (req, res) => {
  try {
    const ReminderLog = require('../models/ReminderLog');
    const User = require('../models/User');
    const Scholarship = require('../models/Scholarship');
    const { sendReminder } = require('../services/reminderService');

    const { id } = req.params;
    const logDoc = await ReminderLog.findById(id);
    if (!logDoc) {
      return res.status(404).json({ success: false, message: 'Reminder log record not found' });
    }

    const student = await User.findById(logDoc.studentId);
    const scholarship = await Scholarship.findById(logDoc.scholarshipId);

    if (!student || !scholarship) {
      return res.status(400).json({
        success: false,
        message: 'Associated student or scholarship record no longer exists'
      });
    }

    const result = await sendReminder({
      student,
      scholarship,
      reminderType: logDoc.reminderType,
      reminderLabel: logDoc.reminderType,
      eligibilityNotes: logDoc.eligibilityNotes
    });

    const updatedLog = await ReminderLog.findById(id);
    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Reminder email re-sent successfully' : (result.error || 'Retry failed'),
      reminderLog: updatedLog
    });
  } catch (error) {
    console.error('Retry Reminder Log Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retry reminder dispatch',
      error: error.message
    });
  }
};

module.exports = {
  getEmailLogs,
  retryEmailDispatch,
  downloadSanctionPdf,
  getReminderLogs,
  triggerReminderRun,
  retryReminderLog
};
