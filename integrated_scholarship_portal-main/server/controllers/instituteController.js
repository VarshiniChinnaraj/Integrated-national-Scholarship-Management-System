const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Scholarship = require('../models/Scholarship');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { recordAuditLog, createNotification } = require('../utils/auditHelper');
const slpService = require('../services/slpService');
const SLPTracking = require('../models/SLPTracking');

// Helper to enforce institution isolation
const getOfficerInstitutionId = (req) => {
  return req.user.institutionId;
};

const buildInstituteFilter = (req) => {
  const institutionId = req.user.institutionId;
  const institutionName = req.user.institutionName;
  const orConditions = [];

  if (institutionId) {
    orConditions.push({ institutionId: institutionId });
    if (mongoose.Types.ObjectId.isValid(institutionId)) {
      orConditions.push({ institutionId: new mongoose.Types.ObjectId(institutionId) });
    }
  }

  if (institutionName && institutionName.trim()) {
    orConditions.push({ institutionName: institutionName.trim() });
    orConditions.push({ institutionName: { $regex: new RegExp(`^${institutionName.trim()}`, 'i') } });
  }

  if (orConditions.length > 0) {
    return { $or: orConditions };
  }
  return {};
};

// Master data can be reseeded while student applications are preserved.  Use
// the current scholarship mapping (or stable stored codes/names) rather than
// trusting a legacy ObjectId, and never route to an arbitrary department.
const resolveTargetDepartment = async (application) => {
  let scholarship = await Scholarship.findById(application.scholarshipId)
    .select('departmentId departmentName code name');

  if (!scholarship && application.scholarshipCode) {
    scholarship = await Scholarship.findOne({ code: application.scholarshipCode })
      .select('departmentId departmentName code name');
  }

  if (!scholarship && application.scholarshipName) {
    scholarship = await Scholarship.findOne({ name: application.scholarshipName })
      .select('departmentId departmentName code name');
  }

  for (const departmentId of [scholarship?.departmentId, application.departmentId].filter(Boolean)) {
    const department = await Department.findOne({ _id: departmentId, status: 'Active' });
    if (department) return department;
  }

  for (const name of [scholarship?.departmentName, application.departmentName].filter(Boolean)) {
    const department = await Department.findOne({ name, status: 'Active' });
    if (department) return department;
  }

  return null;
};

// @desc    Get Institute Officer Dashboard Metrics & Charts
// @route   GET /api/institute/dashboard
// @access  Private (Institute Officer)
const getInstituteDashboard = async (req, res) => {
  try {
    const institutionId = getOfficerInstitutionId(req);
    const baseFilter = buildInstituteFilter(req);

    const applications = await Application.find(baseFilter).sort({ createdAt: -1 });

    const pending = applications.filter((app) => ['SUBMITTED'].includes(app.status)).length;
    const verified = applications.filter((app) =>
      ['INSTITUTE_VERIFIED', 'ROUTED_TO_DEPARTMENT', 'DEPARTMENT_VERIFICATION', 'APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)
    ).length;
    const correction = applications.filter((app) => app.status === 'CORRECTION_REQUIRED').length;
    const rejected = applications.filter((app) => app.status === 'REJECTED').length;

    // Total students of this institution
    let studentFilter = { role: 'STUDENT' };
    if (institutionId && req.user.institutionName) {
      studentFilter.$or = [
        { institutionId: institutionId },
        { institutionName: req.user.institutionName }
      ];
    } else if (institutionId) {
      studentFilter.institutionId = institutionId;
    } else if (req.user.institutionName) {
      studentFilter.institutionName = req.user.institutionName;
    }
    const totalStudents = await User.countDocuments(studentFilter);

    // Monthly applications distribution
    const monthlyStats = [
      { month: 'Jan', count: 0 },
      { month: 'Feb', count: 0 },
      { month: 'Mar', count: 0 },
      { month: 'Apr', count: 0 },
      { month: 'May', count: 0 },
      { month: 'Jun', count: 0 },
      { month: 'Jul', count: 0 },
      { month: 'Aug', count: 0 }
    ];

    applications.forEach((app) => {
      const monthIdx = new Date(app.createdAt).getMonth();
      if (monthIdx >= 0 && monthIdx < 8) {
        monthlyStats[monthIdx].count += 1;
      }
    });

    // Institution info
    let instDetails = null;
    if (institutionId) {
      instDetails = await Institution.findById(institutionId);
    }
    if (!instDetails && req.user.institutionName) {
      instDetails = await Institution.findOne({ name: req.user.institutionName });
    }

    return res.status(200).json({
      success: true,
      institution: instDetails || { name: req.user.institutionName || 'Assigned Institution' },
      stats: {
        pending,
        verified,
        correction,
        rejected,
        totalStudents,
        totalApplications: applications.length
      },
      statusDistribution: [
        { name: 'Pending Verification', value: pending, color: '#f59e0b' },
        { name: 'Verified / Forwarded', value: verified, color: '#10b981' },
        { name: 'Correction Needed', value: correction, color: '#8b5cf6' },
        { name: 'Rejected', value: rejected, color: '#ef4444' }
      ],
      monthlyStats,
      recentApplications: (() => {
        const pendingApps = applications.filter((app) => ['SUBMITTED'].includes(app.status));
        const otherApps = applications.filter((app) => !['SUBMITTED'].includes(app.status));
        return [...pendingApps, ...otherApps].slice(0, 8);
      })()
    });
  } catch (error) {
    console.error('Institute Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load institute dashboard',
      error: error.message
    });
  }
};

// @desc    Get Filterable Applications List for Assigned Institution
// @route   GET /api/institute/applications
// @access  Private (Institute Officer)
const getInstituteApplications = async (req, res) => {
  try {
    const { status, scholarshipId, search, dateFrom, dateTo } = req.query;
    const baseFilter = buildInstituteFilter(req);
    const andConditions = [];

    if (baseFilter.$or) {
      andConditions.push({ $or: baseFilter.$or });
    } else if (Object.keys(baseFilter).length > 0) {
      andConditions.push(baseFilter);
    }

    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (scholarshipId && scholarshipId !== 'All') {
      andConditions.push({ scholarshipId });
    }
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      andConditions.push({
        $or: [
          { applicationNumber: searchRegex },
          { studentName: searchRegex },
          { studentEmail: searchRegex },
          { scholarshipName: searchRegex }
        ]
      });
    }
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      andConditions.push({ createdAt: dateFilter });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const applications = await Application.find(filter)
      .populate('scholarshipId', 'name code category scholarshipAmount')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    // Attach SLP tracking info to each application
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
    console.error('Get Institute Applications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// @desc    Get Single Application for Side-by-Side Verification
// @route   GET /api/institute/applications/:id
// @access  Private (Institute Officer)
const getInstituteApplicationById = async (req, res) => {
  try {
    const institutionId = getOfficerInstitutionId(req);
    const application = await Application.findById(req.params.id)
      .populate('scholarshipId')
      .populate('departmentId')
      .populate('studentId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Strict Isolation: check that application belongs to this institute
    const isOwner =
      !institutionId ||
      !application.institutionId ||
      application.institutionId.toString() === institutionId.toString() ||
      (req.user.institutionName && application.institutionName === req.user.institutionName);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access applications from your assigned institution.'
      });
    }

    // Fetch student's profile for institute side-by-side comparison
    const studentUser = await User.findById(application.studentId).select('-password');

    // Fetch SLP tracking info
    let slpTracking = await SLPTracking.findOne({
      $or: [{ applicationId: application._id }, { applicationNumber: application.applicationNumber }]
    });

    return res.status(200).json({
      success: true,
      application,
      studentUser,
      slpTracking
    });
  } catch (error) {
    console.error('Get Institute Application Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application details',
      error: error.message
    });
  }
};

// @desc    Verify Application (APPROVE -> Auto-Route to Department, CORRECTION, REJECT)
// @route   POST /api/institute/applications/:id/verify
// @access  Private (Institute Officer)
const verifyApplication = async (req, res) => {
  try {
    const institutionId = getOfficerInstitutionId(req);
    const { action, remarks, checklist } = req.body;
    // action: 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT'

    if (!['APPROVE', 'REQUEST_CORRECTION', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid verification action' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Strict Isolation check
    const isOwner =
      !institutionId ||
      !application.institutionId ||
      application.institutionId.toString() === institutionId.toString() ||
      (req.user.institutionName && application.institutionName === req.user.institutionName);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot verify applications from another institution.'
      });
    }

    const previousStatus = application.status;
    let newStatus = previousStatus;

    if (action === 'APPROVE') {
      const department = await resolveTargetDepartment(application);
      if (!department) {
        return res.status(409).json({
          success: false,
          message: 'Application cannot be routed because its scholarship department mapping is unavailable.'
        });
      }

      const departmentId = department._id;
      const departmentName = department.name;

      // Update the same record to the Department-visible status.
      application.departmentId = departmentId;
      application.departmentName = departmentName;
      newStatus = 'ROUTED_TO_DEPARTMENT';

      application.instituteVerification = {
        verifiedBy: req.user._id,
        officerName: req.user.name,
        verifiedAt: new Date(),
        remarks: remarks || 'Institute verification completed successfully. All academic credentials verified.',
        decision: 'APPROVED',
        checklist: checklist || {
          identityVerified: true,
          enrollmentVerified: true,
          academicMarksVerified: true,
          attendanceVerified: true,
          incomeVerified: true,
          documentsVerified: true
        }
      };

      // Create Department Notification
      if (departmentId) {
        await createNotification({
          recipientRole: 'DEPARTMENT_OFFICER',
          departmentId,
          title: 'New Application Routed for Department Scrutiny',
          message: `Application ${application.applicationNumber} (${application.studentName}) for "${application.scholarshipName}" has been verified by ${req.user.name} (${application.institutionName}) and routed to your department.`,
          type: 'info',
          applicationNumber: application.applicationNumber,
          link: `/department/applications/${application._id}`
        });
      }

      // Create Student Notification
      await createNotification({
        userId: application.studentId,
        recipientRole: 'STUDENT',
        title: 'Institute Verification Passed ✅',
        message: `Your application (${application.applicationNumber}) has been verified by your college officer and forwarded to the ${departmentName || 'Department'} for sanction and approval.`,
        type: 'success',
        applicationNumber: application.applicationNumber,
        link: `/student/applications/${application._id}`
      });
    } else if (action === 'REQUEST_CORRECTION') {
      newStatus = 'CORRECTION_REQUIRED';
      application.correctionRemarks = remarks || 'Please upload a clearer copy of marksheet and income certificate.';
      application.instituteVerification = {
        verifiedBy: req.user._id,
        officerName: req.user.name,
        verifiedAt: new Date(),
        remarks: remarks || 'Correction required by Institute Officer.',
        decision: 'CORRECTION',
        checklist: checklist || {}
      };

      // Notify Student
      await createNotification({
        userId: application.studentId,
        recipientRole: 'STUDENT',
        title: 'Action Required: Application Correction Requested ⚠️',
        message: `Your Institute Officer requested corrections for application ${application.applicationNumber}. Remarks: "${remarks || 'Update required documents'}"`,
        type: 'warning',
        applicationNumber: application.applicationNumber,
        link: `/student/applications/${application._id}`
      });
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      application.rejectionReason = remarks || 'Institute record mismatch or attendance below mandatory criteria.';
      application.instituteVerification = {
        verifiedBy: req.user._id,
        officerName: req.user.name,
        verifiedAt: new Date(),
        remarks: remarks || 'Application rejected by Institute Officer.',
        decision: 'REJECTED',
        checklist: checklist || {}
      };

      // Notify Student
      await createNotification({
        userId: application.studentId,
        recipientRole: 'STUDENT',
        title: 'Application Rejected by Institute ❌',
        message: `Your application ${application.applicationNumber} was rejected by your institute. Reason: "${remarks || 'Ineligible or record mismatch'}"`,
        type: 'danger',
        applicationNumber: application.applicationNumber,
        link: `/student/applications/${application._id}`
      });
    }

    application.status = newStatus;
    await application.save();

    // Record immutable audit log
    await recordAuditLog({
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      officerName: req.user.name,
      officerRole: 'INSTITUTE_OFFICER',
      remarks: remarks || `Institute Officer completed action: ${action}`
    });

    // Handle SLP Stage Completion & Next Stage Transition
    if (action === 'APPROVE') {
      await slpService.completeStage(application._id, 'SUBMITTED', {
        id: req.user._id,
        name: req.user.name,
        role: 'INSTITUTE_OFFICER',
        remarks: remarks || 'Institute verification completed successfully.'
      }, 'APPROVE');

      // Start next stage: ROUTED_TO_DEPARTMENT (Department Scrutiny)
      await slpService.startStage(application, 'ROUTED_TO_DEPARTMENT', {
        id: req.user._id,
        name: req.user.name,
        role: 'INSTITUTE_OFFICER'
      });
    } else {
      await slpService.completeStage(application._id, 'SUBMITTED', {
        id: req.user._id,
        name: req.user.name,
        role: 'INSTITUTE_OFFICER',
        remarks: remarks || `Institute action: ${action}`
      }, action);
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${newStatus}`,
      application
    });
  } catch (error) {
    console.error('Institute Verify Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify application',
      error: error.message
    });
  }
};

// @desc    Get List of Enrolled Students at this Institution
// @route   GET /api/institute/students
// @access  Private (Institute Officer)
const getInstituteStudents = async (req, res) => {
  try {
    const institutionId = getOfficerInstitutionId(req);
    let filter = { role: 'STUDENT' };

    if (institutionId && req.user.institutionName) {
      filter.$or = [
        { institutionId: institutionId },
        { institutionName: req.user.institutionName }
      ];
    } else if (institutionId) {
      filter.institutionId = institutionId;
    } else if (req.user.institutionName) {
      filter.institutionName = req.user.institutionName;
    }

    const students = await User.find(filter).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get Institute Students Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
};

// @desc    Get Notifications for Institute Officer
// @route   GET /api/institute/notifications
// @access  Private (Institute Officer)
const getInstituteNotifications = async (req, res) => {
  try {
    const institutionId = getOfficerInstitutionId(req);
    const notifications = await Notification.find({
      $or: [
        { recipientRole: 'INSTITUTE_OFFICER', institutionId },
        { recipientRole: 'INSTITUTE_OFFICER', institutionId: null },
        { userId: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

module.exports = {
  getInstituteDashboard,
  getInstituteApplications,
  getInstituteApplicationById,
  verifyApplication,
  getInstituteStudents,
  getInstituteNotifications
};
