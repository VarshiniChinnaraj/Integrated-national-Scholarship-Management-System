const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scholarship name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Scholarship scheme code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      default: 'Government of India'
    },
    providerType: {
      type: String,
      enum: ['GOVERNMENT', 'PRIVATE', 'CORPORATE', 'NGO'],
      default: 'GOVERNMENT'
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required for automatic application routing']
    },
    departmentName: {
      type: String,
      default: ''
    },
    educationLevel: {
      type: String,
      enum: ['All', 'Class 11-12', 'Undergraduate', 'Postgraduate', 'Doctorate / Ph.D', 'Diploma / Polytechnic'],
      default: 'Undergraduate'
    },
    eligibleCourses: [
      {
        type: String
      }
    ],
    category: {
      type: String,
      enum: ['All', 'General', 'OBC', 'SC', 'ST', 'EWS', 'Minority', 'PwD'],
      default: 'All'
    },
    incomeLimit: {
      type: Number,
      default: 250000 // In INR per annum
    },
    minPercentage: {
      type: Number,
      default: 60
    },
    minCgpa: {
      type: Number,
      default: 6.5
    },
    scholarshipAmount: {
      type: Number,
      required: true,
      default: 50000 // In INR per year
    },
    amountDisplay: {
      type: String,
      default: '₹50,000 / Year'
    },
    deadline: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    eligibilityCriteria: {
      type: String,
      default: ''
    },
    applicationInstructions: {
      type: String,
      default: '1. Fill in accurate academic details\n2. Attach bonafide certificate\n3. Attach valid income certificate\n4. Bank account must be seeded with Aadhaar.'
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Closed', 'Deactivated'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
