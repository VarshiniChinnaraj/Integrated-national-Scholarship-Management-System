const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['STUDENT', 'INSTITUTE_OFFICER', 'DEPARTMENT_OFFICER', 'ADMIN'],
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String,
      default: ''
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null
    },
    institutionName: {
      type: String,
      default: ''
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    departmentName: {
      type: String,
      default: ''
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null
    },
    applicationNumber: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal'
    },
    status: {
      type: String,
      enum: ['NEW', 'IN_REVIEW', 'RESOLVED', 'CLOSED'],
      default: 'NEW'
    },
    adminResponse: {
      type: String,
      default: ''
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    respondedByName: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
