const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Sanction = require('../models/Sanction');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/auditHelper');

// @desc    Get Admin System-Wide Dashboard Analytics
// @route   GET /api/admin/dashboard-analytics
// @access  Private (Admin, Super Admin)
const getAdminDashboardAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstitutions,
      totalDepartments,
      totalScholarships,
      applications,
      payments
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      Institution.countDocuments(),
      Department.countDocuments(),
      Scholarship.countDocuments(),
      Application.find().sort({ createdAt: -1 }),
      Payment.find({ status: 'DISBURSED' })
    ]);

    const totalApplications = applications.length;
    const pendingApplications = applications.filter((a) =>
      ['SUBMITTED', 'INSTITUTE_VERIFIED', 'ROUTED_TO_DEPARTMENT', 'DEPARTMENT_VERIFICATION', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING'].includes(a.status)
    ).length;
    const approvedApplications = applications.filter((a) => ['APPROVED', 'SANCTIONED', 'DISBURSED'].includes(a.status)).length;
    const rejectedApplications = applications.filter((a) => a.status === 'REJECTED').length;
    const disbursedApplications = applications.filter((a) => a.status === 'DISBURSED').length;

    const totalDisbursedAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Status Pie Chart
    const statusPieChart = [
      { name: 'Pending Verification', value: pendingApplications, color: '#f59e0b' },
      { name: 'Approved / Sanctioned', value: approvedApplications - disbursedApplications, color: '#3b82f6' },
      { name: 'Disbursed', value: disbursedApplications, color: '#10b981' },
      { name: 'Rejected', value: rejectedApplications, color: '#ef4444' }
    ];

    // Monthly Bar Chart
    const monthlyBarChart = [
      { month: 'Jan', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Feb', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Mar', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Apr', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'May', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Jun', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Jul', applications: 0, approvals: 0, disbursements: 0 },
      { month: 'Aug', applications: 0, approvals: 0, disbursements: 0 }
    ];

    applications.forEach((app) => {
      const m = new Date(app.createdAt).getMonth();
      if (m >= 0 && m < 8) {
        monthlyBarChart[m].applications += 1;
        if (['APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)) {
          monthlyBarChart[m].approvals += 1;
        }
        if (app.status === 'DISBURSED') {
          monthlyBarChart[m].disbursements += 1;
        }
      }
    });

    // Govt vs Private Chart
    const scholarships = await Scholarship.find();
    let govtCount = 0;
    let privateCount = 0;
    let corporateCount = 0;
    let ngoCount = 0;
    scholarships.forEach((s) => {
      if (s.providerType === 'GOVERNMENT') govtCount++;
      else if (s.providerType === 'PRIVATE') privateCount++;
      else if (s.providerType === 'CORPORATE') corporateCount++;
      else ngoCount++;
    });

    const providerTypeChart = [
      { name: 'Government', value: govtCount, fill: '#2563eb' },
      { name: 'Private', value: privateCount, fill: '#7c3aed' },
      { name: 'Corporate', value: corporateCount, fill: '#059669' },
      { name: 'NGO / Trust', value: ngoCount, fill: '#d97706' }
    ];

    // Department-wise applications
    const deptMap = {};
    applications.forEach((app) => {
      const dName = app.departmentName || 'General';
      deptMap[dName] = (deptMap[dName] || 0) + 1;
    });

    const departmentChart = Object.keys(deptMap).map((key) => ({
      name: key.length > 20 ? key.substring(0, 18) + '...' : key,
      applications: deptMap[key]
    }));

    return res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        totalInstitutions,
        totalDepartments,
        totalScholarships,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        disbursedApplications,
        totalDisbursedAmount
      },
      charts: {
        statusPieChart,
        monthlyBarChart,
        providerTypeChart,
        departmentChart
      },
      recentApplications: applications.slice(0, 6)
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load system analytics',
      error: error.message
    });
  }
};

// ==========================================
// SCHOLARSHIP MANAGEMENT
// ==========================================
const getAllScholarshipsAdmin = async (req, res) => {
  try {
    const scholarships = await Scholarship.find()
      .populate('departmentId', 'name code type')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createScholarship = async (req, res) => {
  try {
    const {
      name,
      code,
      provider,
      providerType,
      departmentId,
      educationLevel,
      eligibleCourses,
      category,
      incomeLimit,
      minPercentage,
      minCgpa,
      scholarshipAmount,
      deadline,
      description,
      status
    } = req.body;

    if (!name || !code || !departmentId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Name, scheme code, department, and deadline are required'
      });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Invalid Department selected' });
    }

    const existing = await Scholarship.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Scholarship with this code already exists' });
    }

    const scholarship = await Scholarship.create({
      name,
      code: code.toUpperCase().trim(),
      provider: provider || 'Government of India',
      providerType: providerType || dept.type || 'GOVERNMENT',
      departmentId: dept._id,
      departmentName: dept.name,
      educationLevel: educationLevel || 'Undergraduate',
      eligibleCourses: eligibleCourses || ['Engineering', 'Medicine', 'Science', 'Arts'],
      category: category || 'All',
      incomeLimit: incomeLimit ? Number(incomeLimit) : 250000,
      minPercentage: minPercentage ? Number(minPercentage) : 60,
      minCgpa: minCgpa ? Number(minCgpa) : 6.5,
      scholarshipAmount: scholarshipAmount ? Number(scholarshipAmount) : 50000,
      amountDisplay: `₹${Number(scholarshipAmount || 50000).toLocaleString('en-IN')} / Year`,
      deadline: new Date(deadline),
      description: description || '',
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Scholarship scheme created successfully',
      scholarship
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.departmentId) {
      const dept = await Department.findById(updates.departmentId);
      if (dept) updates.departmentName = dept.name;
    }

    if (updates.scholarshipAmount) {
      updates.amountDisplay = `₹${Number(updates.scholarshipAmount).toLocaleString('en-IN')} / Year`;
    }

    const scholarship = await Scholarship.findByIdAndUpdate(id, updates, { new: true });
    if (!scholarship) {
      return res.status(404).json({ success: false, message: 'Scholarship not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Scholarship updated successfully',
      scholarship
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteScholarship = async (req, res) => {
  try {
    await Scholarship.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Scholarship deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DEPARTMENT MANAGEMENT
// ==========================================
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('assignedOfficer', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, type, provider, assignedOfficer, contact, budget, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }

    let assignedOfficerName = '';
    if (assignedOfficer) {
      const officer = await User.findById(assignedOfficer);
      if (officer) assignedOfficerName = officer.name;
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase().trim(),
      type: type || 'GOVERNMENT',
      provider: provider || 'Government of India',
      assignedOfficer: assignedOfficer || null,
      assignedOfficerName,
      contact: contact || {},
      budget: budget || { allocated: 5000000, disbursed: 0 },
      status: status || 'Active'
    });

    if (assignedOfficer) {
      await User.findByIdAndUpdate(assignedOfficer, {
        departmentId: department._id,
        departmentName: department.name,
        role: 'DEPARTMENT_OFFICER'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.assignedOfficer) {
      const officer = await User.findById(updates.assignedOfficer);
      if (officer) {
        updates.assignedOfficerName = officer.name;
        await User.findByIdAndUpdate(officer._id, {
          departmentId: id,
          departmentName: updates.name || officer.departmentName,
          role: 'DEPARTMENT_OFFICER'
        });
      }
    }

    const department = await Department.findByIdAndUpdate(id, updates, { new: true });
    return res.status(200).json({ success: true, message: 'Department updated', department });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// INSTITUTION MANAGEMENT
// ==========================================
const getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find()
      .populate('assignedOfficer', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: institutions.length,
      institutions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createInstitution = async (req, res) => {
  try {
    const { name, code, district, state, assignedOfficer, contactEmail, phone, status } = req.body;

    if (!name || !code || !district || !state) {
      return res.status(400).json({ success: false, message: 'Name, code, district, and state are required' });
    }

    let assignedOfficerName = '';
    if (assignedOfficer) {
      const officer = await User.findById(assignedOfficer);
      if (officer) assignedOfficerName = officer.name;
    }

    const institution = await Institution.create({
      name,
      code: code.toUpperCase().trim(),
      district,
      state,
      assignedOfficer: assignedOfficer || null,
      assignedOfficerName,
      contactEmail: contactEmail || '',
      phone: phone || '',
      status: status || 'Active'
    });

    if (assignedOfficer) {
      await User.findByIdAndUpdate(assignedOfficer, {
        institutionId: institution._id,
        institutionName: institution.name,
        role: 'INSTITUTE_OFFICER'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      institution
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.assignedOfficer) {
      const officer = await User.findById(updates.assignedOfficer);
      if (officer) {
        updates.assignedOfficerName = officer.name;
        await User.findByIdAndUpdate(officer._id, {
          institutionId: id,
          institutionName: updates.name || officer.institutionName,
          role: 'INSTITUTE_OFFICER'
        });
      }
    }

    const institution = await Institution.findByIdAndUpdate(id, updates, { new: true });
    return res.status(200).json({ success: true, message: 'Institution updated', institution });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// USER DIRECTORY & MANAGEMENT
// ==========================================
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let filter = {};

    if (role && role !== 'All') filter.role = role;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { institutionName: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('institutionId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, institutionId, departmentId, status } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let institutionName = '';
    if (institutionId) {
      const inst = await Institution.findById(institutionId);
      if (inst) institutionName = inst.name;
    }

    let departmentName = '';
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (dept) departmentName = dept.name;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      role,
      institutionId: institutionId || null,
      institutionName,
      departmentId: departmentId || null,
      departmentName,
      status: status || 'Active'
    });

    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      user: userData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    return res.status(200).json({ success: true, message: 'User updated', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// APPLICATION MONITORING (SYSTEM-WIDE)
// ==========================================
const getAdminApplications = async (req, res) => {
  try {
    const { institutionId, departmentId, scholarshipId, status, search, dateFrom, dateTo } = req.query;

    let filter = {};
    if (institutionId && institutionId !== 'All') filter.institutionId = institutionId;
    if (departmentId && departmentId !== 'All') filter.departmentId = departmentId;
    if (scholarshipId && scholarshipId !== 'All') filter.scholarshipId = scholarshipId;
    if (status && status !== 'All') filter.status = status;

    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { institutionName: { $regex: search, $options: 'i' } },
        { scholarshipName: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const applications = await Application.find(filter)
      .populate('scholarshipId', 'name code category scholarshipAmount')
      .populate('institutionId', 'name code district')
      .populate('departmentId', 'name code type')
      .populate('sanctionId')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    const SLPTracking = require('../models/SLPTracking');
    const appIds = applications.map((a) => a._id);
    const slpTrackings = await SLPTracking.find({ applicationId: { $in: appIds } });
    const slpMap = {};
    slpTrackings.forEach((t) => {
      slpMap[t.applicationId.toString()] = t;
    });

    const enrichedApplications = applications.map((app) => {
      const appObj = app.toObject();
      appObj.slpTracking = slpMap[app._id.toString()] || null;
      return appObj;
    });

    return res.status(200).json({
      success: true,
      count: enrichedApplications.length,
      applications: enrichedApplications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// IMMUTABLE AUDIT TRAIL LOGS
// ==========================================
const getAuditLogs = async (req, res) => {
  try {
    const { applicationId, search, role } = req.query;
    let filter = {};

    if (applicationId) filter.applicationId = applicationId;
    if (role && role !== 'All') filter.officerRole = role;
    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { officerName: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// NOTIFICATIONS MANAGEMENT
// ==========================================
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipientRole: 'ADMIN' }, { recipientRole: 'ALL' }, { userId: req.user._id }]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendBroadcastNotification = async (req, res) => {
  try {
    const { recipientRole, title, message, type } = req.body;

    const notif = await createNotification({
      recipientRole: recipientRole || 'ALL',
      title: title || 'System Announcement',
      message: message || 'Important system update from Administrator',
      type: type || 'info'
    });

    return res.status(201).json({
      success: true,
      message: 'Notification dispatched',
      notification: notif
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// REGISTERED STUDENTS DIRECTORY (ADMIN)
// ==========================================
const getAllStudentsAdmin = async (req, res) => {
  try {
    const users = await User.find({ role: 'STUDENT' })
      .select('-password')
      .populate('institutionId', 'name code district state')
      .sort({ createdAt: -1 });

    const students = users.map((u) => {
      const obj = u.toObject();
      return {
        ...obj,
        fullName: obj.name,
        category: obj.profile?.category || 'General',
        gender: obj.profile?.gender || 'N/A',
        college: {
          collegeName: obj.institutionName || obj.profile?.collegeName || 'N/A',
          department: obj.profile?.academicDepartment || 'N/A',
          degree: obj.profile?.course || 'Degree',
          registerNumber: obj.profile?.enrollmentNo || 'N/A'
        },
        academic: {
          ug: {
            cgpa: obj.profile?.cgpa || 'N/A',
            percentage: obj.profile?.marksPercentage || 'N/A'
          }
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminDashboardAnalytics,
  getAllScholarshipsAdmin,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  getAllInstitutions,
  createInstitution,
  updateInstitution,
  getAllUsers,
  createUserByAdmin,
  updateUserStatus,
  getAllStudentsAdmin,
  getAdminApplications,
  getAuditLogs,
  getAdminNotifications,
  sendBroadcastNotification
};

