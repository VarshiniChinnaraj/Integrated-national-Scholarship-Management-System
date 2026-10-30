const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    stageName: { type: String, default: '' },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    slaDuration: { type: Number, required: true }, // in seconds
    slaDeadline: { type: Date, required: true },
    slaStatus: {
      type: String,
      enum: ['WITHIN_SLA', 'SLA_WARNING', 'SLA_BREACHED', 'COMPLETED_WITHIN_SLA', 'COMPLETED_AFTER_SLA'],
      default: 'COMPLETED_WITHIN_SLA'
    },
    elapsedSeconds: { type: Number, default: 0 },
    officerName: { type: String, default: '' },
    officerRole: { type: String, default: '' },
    action: { type: String, default: '' },
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const escalationHistorySchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, default: 1 },
    escalatedTo: { type: String, required: true, default: 'ADMIN' },
    escalatedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
    stage: { type: String, required: true },
    notifiedRoles: [{ type: String }]
  },
  { _id: false }
);

const slpTrackingSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true
    },
    applicationNumber: {
      type: String,
      required: true,
      index: true
    },
    currentStage: {
      type: String,
      enum: [
        'SUBMITTED',
        'INSTITUTE_VERIFIED',
        'ROUTED_TO_DEPARTMENT',
        'DEPARTMENT_VERIFICATION',
        'APPROVED',
        'SANCTIONED',
        'PAYMENT_PROCESSING',
        'DISBURSED',
        'CORRECTION_REQUIRED',
        'REJECTED'
      ],
      default: 'SUBMITTED',
      index: true
    },
    stageStartedAt: {
      type: Date,
      default: Date.now
    },
    stageCompletedAt: {
      type: Date,
      default: null
    },
    slaDuration: {
      type: Number,
      required: true,
      default: 60 // seconds
    },
    slaDeadline: {
      type: Date,
      required: true
    },
    slaStatus: {
      type: String,
      enum: ['WITHIN_SLA', 'SLA_WARNING', 'SLA_BREACHED', 'COMPLETED_WITHIN_SLA', 'COMPLETED_AFTER_SLA'],
      default: 'WITHIN_SLA',
      index: true
    },
    elapsedTime: {
      type: Number,
      default: 0
    },
    escalationLevel: {
      type: Number,
      default: 0,
      index: true
    },
    escalationStatus: {
      type: String,
      enum: ['NONE', 'WARNING_ISSUED', 'ESCALATED', 'RESOLVED'],
      default: 'NONE',
      index: true
    },
    assignedRole: {
      type: String,
      enum: ['STUDENT', 'INSTITUTE_OFFICER', 'DEPARTMENT_OFFICER', 'ADMIN', 'SYSTEM'],
      default: 'INSTITUTE_OFFICER'
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedOfficerName: {
      type: String,
      default: ''
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    studentName: {
      type: String,
      default: ''
    },
    institutionName: {
      type: String,
      default: ''
    },
    departmentName: {
      type: String,
      default: ''
    },
    scholarshipName: {
      type: String,
      default: ''
    },
    escalatedTo: {
      type: String,
      default: ''
    },
    escalatedAt: {
      type: Date,
      default: null
    },
    escalatedReason: {
      type: String,
      default: ''
    },
    breachedAt: {
      type: Date,
      default: null
    },
    timerState: {
      type: String,
      enum: ['RUNNING', 'STOPPED', 'COMPLETED'],
      default: 'RUNNING'
    },
    stageHistory: [stageHistorySchema],
    escalationHistory: [escalationHistorySchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SLPTracking', slpTrackingSchema);
