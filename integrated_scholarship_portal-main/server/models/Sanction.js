const mongoose = require('mongoose');

const sanctionSchema = new mongoose.Schema(
  {
    sanctionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    applicationNumber: {
      type: String,
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship',
      default: null
    },
    scholarshipName: {
      type: String,
      required: true
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
    institutionName: {
      type: String,
      default: ''
    },
    approvedAmount: {
      type: Number,
      required: true
    },
    approvalDate: {
      type: Date,
      default: Date.now
    },
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    officerName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SANCTIONED', 'DISBURSED', 'CANCELLED'],
      default: 'SANCTIONED'
    },
    sanctionOrderText: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Sanction', sanctionSchema);
