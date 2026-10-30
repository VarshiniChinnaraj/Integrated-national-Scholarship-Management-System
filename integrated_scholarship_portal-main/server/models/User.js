const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['STUDENT', 'INSTITUTE_OFFICER', 'DEPARTMENT_OFFICER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT'
    },
    // Association for Institute Officer
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null
    },
    institutionName: {
      type: String,
      default: ''
    },
    // Association for Department Officer
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    departmentName: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    },
    // Profile details (for Students or Officers)
    profile: {
      dob: { type: String, default: '' },
      gender: { type: String, default: '' },
      category: { type: String, default: 'General' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      collegeName: { type: String, default: '' },
      course: { type: String, default: '' },
      academicDepartment: { type: String, default: '' },
      year: { type: String, default: '' },
      enrollmentNo: { type: String, default: '' },
      marksPercentage: { type: Number, default: 0 },
      cgpa: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 85 },
      familyIncome: { type: Number, default: 0 },
      incomeCertNo: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      branchName: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
