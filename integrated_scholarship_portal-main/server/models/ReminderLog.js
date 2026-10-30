const mongoose = require('mongoose');

/**
 * ReminderLog Model
 *
 * Tracks every scholarship deadline reminder attempt per student per scholarship.
 * The compound unique index on (studentId + scholarshipId + reminderType) provides
 * reliable duplicate prevention that survives server restarts.
 */
const reminderLogSchema = new mongoose.Schema(
  {
    // Student who was (or was attempted to be) reminded
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
      type: String,
      default: ''
    },

    // Scholarship this reminder relates to
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship',
      required: true,
      index: true
    },
    scholarshipName: {
      type: String,
      required: true
    },
    scholarshipDeadline: {
      type: Date,
      required: true
    },

    // Reminder type — e.g. REMINDER_48H, REMINDER_24H, REMINDER_MORNING, REMINDER_FINAL
    reminderType: {
      type: String,
      required: true,
      index: true
    },

    // Unique deduplication key: studentId:scholarshipId:reminderType
    deduplicationKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Email delivery status
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
      index: true
    },

    // When the scheduler decided to send this reminder
    scheduledAt: {
      type: Date,
      default: null
    },

    // When the email was actually dispatched
    sentAt: {
      type: Date,
      default: null
    },

    // SMTP message ID returned on success
    messageId: {
      type: String,
      default: ''
    },

    // SMTP server response string
    smtpResponse: {
      type: String,
      default: ''
    },

    // Error details if delivery failed
    errorMessage: {
      type: String,
      default: null
    },
    errorCode: {
      type: String,
      default: null
    },

    // Number of send attempts (initial + retries)
    retryCount: {
      type: Number,
      default: 0
    },

    // Reason if this reminder was intentionally skipped
    skipReason: {
      type: String,
      default: ''
    },

    // Which eligibility criteria caused this student to be included
    eligibilityNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for the most common query pattern
reminderLogSchema.index({ studentId: 1, scholarshipId: 1, reminderType: 1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
