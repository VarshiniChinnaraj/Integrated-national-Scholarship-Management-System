const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      institutionId: user.institutionId,
      departmentId: user.departmentId
    },
    process.env.JWT_SECRET || 'national_scholarship_secret_key_2026_jwt',
    { expiresIn: '7d' }
  );
};

// @desc    Universal Login for all roles (STUDENT, INSTITUTE_OFFICER, DEPARTMENT_OFFICER, ADMIN)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated or suspended. Please contact administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Role enforcement if expectedRole is passed
    if (expectedRole) {
      const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
      const hasPermission = allowedRoles.includes(user.role) || (allowedRoles.includes('ADMIN') && user.role === 'SUPER_ADMIN');
      if (!hasPermission) {
        const portalNames = {
          STUDENT: 'Student Portal',
          INSTITUTE_OFFICER: 'Institute Officer Portal',
          DEPARTMENT_OFFICER: 'Department Officer Portal',
          ADMIN: 'Admin Portal',
          SUPER_ADMIN: 'Admin Portal'
        };
        const expectedName = portalNames[allowedRoles[0]] || allowedRoles[0];
        const userRoleName = portalNames[user.role] || user.role;
        return res.status(403).json({
          success: false,
          message: `Access Denied: This account is registered as a ${userRoleName} user and cannot log in to the ${expectedName}.`
        });
      }
    }

    const token = generateToken(user);

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Register a new Student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      institutionId,
      institutionName: reqInstName,
      dob,
      gender,
      category,
      address,
      city,
      state,
      pincode,
      course,
      academicDepartment,
      year,
      enrollmentNo,
      marksPercentage,
      cgpa,
      familyIncome,
      bankName,
      accountNumber,
      ifscCode,
      branchName
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    let institutionName = '';
    let finalInstitutionId = null;

    const requestedInstName = reqInstName || req.body.collegeName;

    if (institutionId) {
      const inst = await Institution.findById(institutionId);
      if (inst) {
        institutionName = inst.name;
        finalInstitutionId = inst._id;
      }
    }

    if (!finalInstitutionId && requestedInstName) {
      const instByName = await Institution.findOne({
        $or: [
          { name: requestedInstName.trim() },
          { name: { $regex: new RegExp(`^${requestedInstName.trim()}`, 'i') } }
        ]
      });
      if (instByName) {
        finalInstitutionId = instByName._id;
        institutionName = instByName.name;
      }
    }

    if (!finalInstitutionId) {
      const defaultInst = await Institution.findOne({ status: 'Active' }).sort({ name: 1 });
      if (defaultInst) {
        finalInstitutionId = defaultInst._id;
        institutionName = defaultInst.name;
      } else {
        institutionName = 'National Institute of Technology (NIT Delhi)';
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '9876543210',
      role: 'STUDENT',
      institutionId: finalInstitutionId,
      institutionName: institutionName,
      status: 'Active',
      profile: {
        dob: dob || '2004-05-15',
        gender: gender || 'Male',
        category: category || 'General',
        address: address || 'Campus Hostel Block B',
        city: city || 'New Delhi',
        state: state || 'Delhi',
        pincode: pincode || '110001',
        collegeName: institutionName,
        course: course || 'B.Tech',
        academicDepartment: academicDepartment || 'Computer Science & Engineering',
        year: year || '3rd Year',
        enrollmentNo: enrollmentNo || `ENR-${Math.floor(100000 + Math.random() * 900000)}`,
        marksPercentage: marksPercentage ? Number(marksPercentage) : 85,
        cgpa: cgpa ? Number(cgpa) : 8.5,
        attendancePercentage: 88,
        familyIncome: familyIncome ? Number(familyIncome) : 180000,
        incomeCertNo: `INC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        bankName: bankName || 'State Bank of India',
        accountNumber: accountNumber || '38947291048',
        ifscCode: ifscCode || 'SBIN0001234',
        branchName: branchName || 'Main Campus Branch'
      }
    });

    const token = generateToken(user);
    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Get Public Institutions list
// @route   GET /api/auth/institutions
// @access  Public
const getPublicInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find({ status: 'Active' }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: institutions.length,
      institutions
    });
  } catch (error) {
    console.error('Get Public Institutions Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve institutions',
      error: error.message
    });
  }
};

// @desc    Get Public Departments list
// @route   GET /api/auth/departments
// @access  Public
const getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ status: 'Active' }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    console.error('Get Public Departments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};

// @desc    Update Student Profile (4 Tabs)
// @route   PUT /api/auth/profile
// @access  Private (Student)
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, institutionId, profile } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (institutionId) {
      user.institutionId = institutionId;
      const inst = await Institution.findById(institutionId);
      if (inst) user.institutionName = inst.name;
    }

    if (profile) {
      user.profile = {
        ...(user.profile?.toObject ? user.profile.toObject() : user.profile || {}),
        ...profile
      };
      if (user.institutionName) {
        user.profile.collegeName = user.institutionName;
      }
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

module.exports = {
  login,
  registerStudent,
  getPublicInstitutions,
  getPublicDepartments,
  getMe,
  updateProfile
};
