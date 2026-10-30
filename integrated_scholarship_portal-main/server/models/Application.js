const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
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
    studentEmail: {
      type: String,
      required: true
    },
    studentPhone: {
      type: String,
      required: true
    },
    // Institutional routing association
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null
    },
    institutionName: {
      type: String,
      required: true
    },
    // Department routing association (Bound automatically on approval)
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    departmentName: {
      type: String,
      default: ''
    },
    // Scholarship details
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship',
      required: true
    },
    scholarshipCode: {
      type: String,
      default: ''
    },
    scholarshipName: {
      type: String,
      required: true
    },
    requestedAmount: {
      type: Number,
      required: true,
      default: 50000
    },
    approvedAmount: {
      type: Number,
      default: 0
    },
    submissionType: {
      type: String,
      enum: ['Fresh Application', 'Renewal Application'],
      default: 'Fresh Application'
    },
    // Application Lifecycle Status
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'INSTITUTE_VERIFIED',
        'ROUTED_TO_DEPARTMENT',
        'DEPARTMENT_VERIFICATION',
        'APPROVED',
        'DEPARTMENT_APPROVED',
        'SANCTIONED',
        'PAYMENT_PENDING',
        'PAYMENT_PROCESSING',
        'DISBURSED',
        'PAYMENT_DISBURSED',
        'CORRECTION_REQUIRED',
        'REJECTED'
      ],
      default: 'SUBMITTED'
    },

    // Step 1: Personal Details
    personalDetails: {
      fullName: { type: String, required: true },
      dob: { type: String, required: true },
      gender: { type: String, required: true },
      fatherName: { type: String, default: '' },
      motherName: { type: String, default: '' },
      category: { type: String, default: 'General' },
      religion: { type: String, default: '' },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' }
    },

    // Step 2: Academic Details
    academicDetails: {
      institutionName: { type: String, required: true },
      course: { type: String, required: true },
      department: { type: String, required: true },
      year: { type: String, required: true },
      enrollmentNumber: { type: String, required: true },
      registerNumber: { type: String, default: '' },
      previousClassPercentage: { type: Number, required: true },
      cgpa: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 85 }
    },

    // Step 3: Income Details
    incomeDetails: {
      familyAnnualIncome: { type: Number, required: true },
      incomeCertificateNumber: { type: String, required: true },
      issuingAuthority: { type: String, default: 'Tahsildar / Revenue Department' },
      fatherOccupation: { type: String, default: 'Self Employed' },
      motherOccupation: { type: String, default: 'Homemaker' }
    },

    // Step 4: Bank Details
    bankDetails: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      branchName: { type: String, required: true },
      accountHolderName: { type: String, required: true }
    },

    // Step 5: Documents (Simulated/Uploaded files)
    documents: {
      aadhaarCard: { type: String, default: 'Aadhaar_Card_Doc.pdf' },
      incomeCertificate: { type: String, default: 'Income_Certificate_2026.pdf' },
      bonafideCertificate: { type: String, default: 'College_Bonafide_Certificate.pdf' },
      marksheet: { type: String, default: 'Academic_Marksheet.pdf' },
      communityCertificate: { type: String, default: 'Community_Certificate.pdf' },
      feeReceipt: { type: String, default: 'College_Fee_Receipt.pdf' }
    },

    // Institute Verification Record
    instituteVerification: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      officerName: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
      remarks: { type: String, default: '' },
      decision: { type: String, enum: ['PENDING', 'APPROVED', 'CORRECTION', 'REJECTED'], default: 'PENDING' },
      checklist: {
        identityVerified: { type: Boolean, default: false },
        enrollmentVerified: { type: Boolean, default: false },
        academicMarksVerified: { type: Boolean, default: false },
        attendanceVerified: { type: Boolean, default: false },
        incomeVerified: { type: Boolean, default: false },
        documentsVerified: { type: Boolean, default: false }
      }
    },

    // Department Verification Record
    departmentVerification: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      officerName: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
      remarks: { type: String, default: '' },
      decision: { type: String, enum: ['PENDING', 'APPROVED', 'CORRECTION', 'REJECTED'], default: 'PENDING' },
      checklist: {
        eligibilityMet: { type: Boolean, default: false },
        budgetAvailable: { type: Boolean, default: false },
        quotaVerified: { type: Boolean, default: false },
        bankDetailsValid: { type: Boolean, default: false }
      }
    },

    // Sanction Association
    sanctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sanction',
      default: null
    },
    sanctionNumber: {
      type: String,
      default: ''
    },

    // Payment Association
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    paymentReference: {
      type: String,
      default: ''
    },

    correctionRemarks: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Application', applicationSchema);
