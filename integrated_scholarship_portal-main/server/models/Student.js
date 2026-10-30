const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  photo: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, 'Father Name is required'],
    trim: true
  },
  motherName: {
    type: String,
    required: [true, 'Mother Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone Number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required']
  },
  dob: {
    type: Date,
    required: [true, 'Date of Birth is required']
  },
  bloodGroup: {
    type: String,
    default: ''
  },
  nationality: {
    type: String,
    default: 'Indian'
  },
  religion: {
    type: String,
    default: ''
  },
  community: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },

  // Section 2 - College Details
  college: {
    collegeName: {
      type: String,
      required: [true, 'College Name is required']
    },
    department: {
      type: String,
      required: [true, 'Department is required']
    },
    degree: {
      type: String,
      required: [true, 'Degree is required']
    },
    university: {
      type: String,
      required: [true, 'University is required']
    },
    enrollmentNumber: {
      type: String,
      required: [true, 'Enrollment Number is required']
    },
    registerNumber: {
      type: String,
      required: [true, 'Register Number is required']
    },
    admissionYear: {
      type: Number,
      required: [true, 'Admission Year is required']
    },
    graduationYear: {
      type: Number,
      required: [true, 'Expected Graduation Year is required']
    },
    semester: {
      type: Number,
      required: [true, 'Current Semester is required']
    },
    currentYear: {
      type: Number,
      required: [true, 'Current Year is required']
    },
    studentType: {
      type: String,
      enum: ['Regular', 'Lateral Entry'],
      default: 'Regular'
    }
  },

  // Section 3 - Academic Details
  academic: {
    sslc: {
      schoolName: { type: String, required: true },
      board: { type: String, required: true },
      registerNumber: { type: String, required: true },
      yearOfPassing: { type: Number, required: true },
      percentage: { type: Number, required: true },
      medium: { type: String, required: true }
    },
    hsc: {
      schoolName: { type: String, required: true },
      board: { type: String, required: true },
      registerNumber: { type: String, required: true },
      yearOfPassing: { type: Number, required: true },
      percentage: { type: Number, required: true },
      group: { type: String, required: true },
      medium: { type: String, required: true }
    },
    ug: {
      cgpa: { type: Number, required: true },
      currentBacklogs: { type: Number, default: 0 },
      historyOfBacklogs: { type: Number, default: 0 }
    }
  },

  // Section 4 - Address
  address: {
    permanentAddress: { type: String, required: true },
    temporaryAddress: { type: String, default: '' },
    village: { type: String, default: '' },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pinCode: { type: String, required: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
