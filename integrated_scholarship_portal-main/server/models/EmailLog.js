const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    emailType: {
      type: String,
      default: 'SANCTION_APPROVED',
      index: true
    },
    eventKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    applicationNumber: {
      type: String,
      default: ''
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: {
      type: String,
      default: ''
    },
    sanctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sanction',
      required: true
    },
    sanctionNumber: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    attachmentName: {
      type: String,
      default: ''
    },
    attachmentPath: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      required: true,
      index: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    messageId: {
      type: String,
      default: ''
    },
    smtpResponse: {
      type: String,
      default: ''
    },
    errorMessage: {
      type: String,
      default: null
    },
    errorCode: {
      type: String,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
