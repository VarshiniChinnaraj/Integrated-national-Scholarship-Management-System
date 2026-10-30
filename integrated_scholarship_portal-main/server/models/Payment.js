const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    paymentId: {
      type: String,
      trim: true,
      default: function () {
        return this.paymentReference;
      }
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
    sanctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sanction',
      default: null
    },
    sanctionNumber: {
      type: String,
      default: ''
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    studentName: {
      type: String,
      default: 'Beneficiary Student'
    },
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship',
      default: null
    },
    scholarshipName: {
      type: String,
      default: 'National Scholarship Scheme'
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
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'DISBURSED', 'FAILED'],
      default: 'PAYMENT_PENDING'
    },
    utr: {
      type: String,
      default: ''
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' }
    },
    transactionDate: {
      type: Date,
      default: null
    },
    disbursedAt: {
      type: Date,
      default: null
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    disbursedByName: {
      type: String,
      default: ''
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
