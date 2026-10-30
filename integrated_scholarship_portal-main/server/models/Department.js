const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['GOVERNMENT', 'PRIVATE', 'CORPORATE', 'NGO'],
      default: 'GOVERNMENT'
    },
    provider: {
      type: String,
      required: true,
      default: 'Ministry of Education, Govt of India'
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedOfficerName: {
      type: String,
      default: ''
    },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    budget: {
      allocated: { type: Number, default: 5000000 },
      disbursed: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Department', departmentSchema);
