const mongoose = require('mongoose');
const User = require('../models/User');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const { recordAuditLog, createNotification } = require('../utils/auditHelper');
const slpService = require('../services/slpService');
const SLPTracking = require('../models/SLPTracking');

const getApplicationLookupQuery = (idOrNumber) => {
  if (!idOrNumber) return { _id: null };
  const str = String(idOrNumber).trim();
  if (mongoose.isValidObjectId(str)) {
    return {
      $or: [
        { _id: str },
        { applicationNumber: str }
      ]
    };
  }
  return { applicationNumber: str };
};

// @desc    Get Student Dashboard Overview
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const user = await User.findById(studentId);

    // Fetch applications
    const applications = await Application.find({ studentId }).sort({ createdAt: -1 });

    // Calculate metrics
    const totalApplications = applications.length;
    const pendingApplications = applications.filter((app) =>
      ['SUBMITTED', 'INSTITUTE_VERIFIED', 'ROUTED_TO_DEPARTMENT', 'DEPARTMENT_VERIFICATION', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING'].includes(app.status)
    ).length;
    const approvedApplications = applications.filter((app) =>
      ['APPROVED', 'DEPARTMENT_APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)
    ).length;
    const rejectedApplications = applications.filter((app) => app.status === 'REJECTED').length;

    // Disbursed payments
    const payments = await Payment.find({ studentId, status: 'DISBURSED' });
    const disbursedAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Profile completeness calculation
    let filledFields = 0;
    const totalFields = 12;
    const prof = user.profile || {};
    if (user.name) filledFields++;
    if (user.email) filledFields++;
    if (user.phone) filledFields++;
    if (prof.dob) filledFields++;
    if (prof.gender) filledFields++;
    if (prof.collegeName) filledFields++;
    if (prof.course) filledFields++;
    if (prof.enrollmentNo) filledFields++;
    if (prof.familyIncome) filledFields++;
    if (prof.bankName) filledFields++;
    if (prof.accountNumber) filledFields++;
    if (prof.ifscCode) filledFields++;
    const profileCompleteness = Math.min(100, Math.round((filledFields / totalFields) * 100));

    // Recommended scholarships (Active scholarships matching or general)
    const recommendedScholarships = await Scholarship.find({ status: 'Active' })
      .populate('departmentId', 'name type')
      .limit(4);

    // Recent notifications
    const notifications = await Notification.find({
      $or: [{ userId: studentId }, { recipientRole: 'STUDENT' }, { recipientRole: 'ALL' }]
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          institutionName: user.institutionName || prof.collegeName,
          profileCompleteness
        },
        stats: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          disbursedAmount
        },
        recentApplications: applications.slice(0, 4),
        recommendedScholarships,
        notifications
      }
    });
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load student dashboard',
      error: error.message
    });
  }
};

// @desc    Browse & Filter Scholarships
// @route   GET /api/student/scholarships
// @access  Public / Student
const getScholarships = async (req, res) => {
  try {
    const { providerType, educationLevel, category, minAmount, maxAmount, search } = req.query;

    let filter = { status: 'Active' };

    if (providerType && providerType !== 'All') {
      filter.providerType = providerType;
    }
    if (educationLevel && educationLevel !== 'All') {
      filter.educationLevel = { $in: [educationLevel, 'All'] };
    }
    if (category && category !== 'All') {
      filter.category = { $in: [category, 'All'] };
    }
    if (minAmount || maxAmount) {
      filter.scholarshipAmount = {};
      if (minAmount) filter.scholarshipAmount.$gte = Number(minAmount);
      if (maxAmount) filter.scholarshipAmount.$lte = Number(maxAmount);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const scholarships = await Scholarship.find(filter)
      .populate('departmentId', 'name code type')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: scholarships.length,
      scholarships
    });
  } catch (error) {
    console.error('Get Scholarships Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarships',
      error: error.message
    });
  }
};

// @desc    Get Scholarship Details by ID
// @route   GET /api/student/scholarships/:id
// @access  Public / Student
const getScholarshipById = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id).populate('departmentId', 'name code type provider');
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship scheme not found'
      });
    }

    return res.status(200).json({
      success: true,
      scholarship
    });
  } catch (error) {
    console.error('Get Scholarship By Id Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarship details',
      error: error.message
    });
  }
};

// @desc    Submit 7-Step Scholarship Application
// @route   POST /api/student/apply/:id
// @access  Private (Student)
const applyScholarship = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    // Check if already applied
    const existing = await Application.findOne({
      studentId: student._id,
      scholarshipId: scholarship._id,
      status: { $nin: ['REJECTED'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted an application (${existing.applicationNumber}) for this scholarship.`
      });
    }

    const {
      submissionType,
      personalDetails,
      academicDetails,
      incomeDetails,
      bankDetails,
      documents
    } = req.body;

    // Generate unique Application Number: APP-2026-XXXXXX
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const applicationNumber = `APP-2026-${randomCode}`;

    // Resolve Institution (Verify student's institutionId or look up by candidate name)
    let inst = null;
    if (student.institutionId) {
      inst = await Institution.findById(student.institutionId);
    }

    const candidateName = academicDetails?.institutionName || student.institutionName || student.profile?.collegeName;
    if (!inst && candidateName) {
      inst = await Institution.findOne({
        $or: [
          { name: candidateName.trim() },
          { name: { $regex: new RegExp(`^${candidateName.trim()}`, 'i') } }
        ]
      });
    }

    if (!inst) {
      inst = await Institution.findOne({ status: 'Active' }).sort({ name: 1 });
    }

    const institutionId = inst ? inst._id : null;
    const institutionName = inst ? inst.name : (candidateName || 'National Institute of Technology (NIT Delhi)');

    // Synchronize student's institution link if missing, stale, or updated
    if (institutionId && (!student.institutionId || String(student.institutionId) !== String(institutionId) || student.institutionName !== institutionName)) {
      student.institutionId = institutionId;
      student.institutionName = institutionName;
      await student.save();
    }

    let departmentId = scholarship.departmentId || null;
    let departmentName = scholarship.departmentName || '';

    if (departmentId && !departmentName) {
      const dept = await Department.findById(departmentId);
      if (dept) departmentName = dept.name;
    }

    if (!departmentId) {
      const defaultDept = await Department.findOne({ status: 'Active' });
      if (defaultDept) {
        departmentId = defaultDept._id;
        departmentName = defaultDept.name;
      }
    }

    const application = await Application.create({
      applicationNumber,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone || personalDetails?.phone || '9876543210',
      institutionId,
      institutionName,
      departmentId,
      departmentName: departmentName || 'Higher Education & Welfare Department',
      scholarshipId: scholarship._id,
      scholarshipCode: scholarship.code,
      scholarshipName: scholarship.name,
      requestedAmount: scholarship.scholarshipAmount || 50000,
      submissionType: submissionType || 'Fresh Application',
      status: 'SUBMITTED',

      personalDetails: personalDetails || {
        fullName: student.name,
        dob: student.profile?.dob || '2004-05-15',
        gender: student.profile?.gender || 'Male',
        category: student.profile?.category || 'General',
        phone: student.phone || '9876543210',
        email: student.email,
        address: student.profile?.address || 'Hostel Block B',
        city: student.profile?.city || 'New Delhi',
        state: student.profile?.state || 'Delhi',
        pincode: student.profile?.pincode || '110001'
      },

      academicDetails: academicDetails || {
        institutionName: student.institutionName || 'National Institute of Technology',
        course: student.profile?.course || 'B.Tech',
        department: student.profile?.academicDepartment || 'Computer Science & Engineering',
        year: student.profile?.year || '3rd Year',
        enrollmentNumber: student.profile?.enrollmentNo || 'ENR-839201',
        registerNumber: student.profile?.enrollmentNo || 'REG-2026-88',
        previousClassPercentage: student.profile?.marksPercentage || 85,
        cgpa: student.profile?.cgpa || 8.5,
        attendancePercentage: student.profile?.attendancePercentage || 88
      },

      incomeDetails: incomeDetails || {
        familyAnnualIncome: student.profile?.familyIncome || 180000,
        incomeCertificateNumber: student.profile?.incomeCertNo || 'INC-2026-9281',
        issuingAuthority: 'Tahsildar / Revenue Department'
      },

      bankDetails: {
        accountNumber: bankDetails?.accountNumber || student.profile?.accountNumber || '38947291048',
        ifscCode: bankDetails?.ifscCode || student.profile?.ifscCode || 'SBIN0001234',
        bankName: bankDetails?.bankName || student.profile?.bankName || 'State Bank of India',
        branchName: bankDetails?.branchName || student.profile?.branchName || 'Main Campus Branch',
        accountHolderName: bankDetails?.accountHolderName || student.name || 'Account Holder'
      },

      documents: documents || {
        aadhaarCard: 'Aadhaar_Card_Doc.pdf',
        incomeCertificate: 'Income_Certificate_2026.pdf',
        bonafideCertificate: 'College_Bonafide_Certificate.pdf',
        marksheet: 'Academic_Marksheet.pdf',
        communityCertificate: 'Community_Certificate.pdf',
        feeReceipt: 'College_Fee_Receipt.pdf'
      }
    });

    // Record immutable audit trail
    await recordAuditLog({
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      previousStatus: 'NEW',
      newStatus: 'SUBMITTED',
      changedBy: student._id,
      officerName: student.name,
      officerRole: 'STUDENT',
      remarks: 'Application submitted through 7-step wizard.'
    });

    // Create In-App Notification for Student
    await createNotification({
      userId: student._id,
      recipientRole: 'STUDENT',
      title: 'Application Submitted Successfully! 📄',
      message: `Your application (${application.applicationNumber}) for "${scholarship.name}" has been submitted and routed to your Institute Officer for verification.`,
      type: 'info',
      applicationNumber: application.applicationNumber,
      link: `/student/applications/${application._id}`
    });

    // Create Notification for Institute Officer
    if (student.institutionId) {
      await createNotification({
        recipientRole: 'INSTITUTE_OFFICER',
        institutionId: student.institutionId,
        title: 'New Student Application Submitted',
        message: `Student ${student.name} submitted application ${application.applicationNumber} for "${scholarship.name}". Pending your verification.`,
        type: 'info',
        applicationNumber: application.applicationNumber,
        link: `/institute/applications/${application._id}`
      });
    }

    // Start SLP SLA tracking timer for SUBMITTED stage
    await slpService.startStage(application, 'SUBMITTED', {
      id: student._id,
      name: student.name,
      role: 'STUDENT'
    });

    return res.status(201).json({
      success: true,
      message: 'Scholarship Application Submitted Successfully',
      application
    });
  } catch (error) {
    console.error('Apply Scholarship Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit scholarship application',
      error: error.message
    });
  }
};

// @desc    Get Logged-in Student Applications
// @route   GET /api/student/applications
// @access  Private (Student)
const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user._id;
    const applications = await Application.find({ studentId })
      .populate('scholarshipId', 'name code provider scholarshipAmount deadline')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    // Attach SLP tracking info for each application
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
    console.error('Get My Applications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

// @desc    Get Application Details & Tracking
// @route   GET /api/student/applications/:id
// @access  Private (Student / Officer / Admin)
const getApplicationDetails = async (req, res) => {
  try {
    const application = await Application.findOne(getApplicationLookupQuery(req.params.id))
      .populate('scholarshipId')
      .populate('institutionId', 'name code district state')
      .populate('departmentId', 'name code type provider')
      .populate('sanctionId')
      .populate('paymentId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Role check for Student: ensure can only access own application
    if (req.user.role === 'STUDENT' && application.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another student\'s application.'
      });
    }

    // Synchronize DBT Payment relationship if not populated or status out-of-sync
    let paymentDoc = application.paymentId;
    if (!paymentDoc || !paymentDoc.status) {
      paymentDoc = await Payment.findOne({
        $or: [
          { applicationId: application._id },
          { applicationNumber: application.applicationNumber }
        ]
      });
      if (paymentDoc) {
        application.paymentId = paymentDoc;
        if (!application.paymentReference) application.paymentReference = paymentDoc.paymentReference;
      }
    }

    if (paymentDoc && paymentDoc.status === 'DISBURSED' && !['DISBURSED', 'PAYMENT_DISBURSED'].includes(application.status)) {
      application.status = 'DISBURSED';
      await Application.updateOne(
        { _id: application._id },
        {
          $set: {
            status: 'DISBURSED',
            paymentId: paymentDoc._id,
            paymentReference: paymentDoc.paymentReference
          }
        }
      );
    }

    // Fetch Audit Logs for this application
    const AuditLog = require('../models/AuditLog');
    const auditLogs = await AuditLog.find({ applicationId: application._id }).sort({ timestamp: 1 });

    // Ensure disbursement audit log entry is present if payment is disbursed
    if (paymentDoc && paymentDoc.status === 'DISBURSED') {
      const hasDisbursedLog = auditLogs.some((l) => l.newStatus === 'DISBURSED' || l.action === 'DISBURSE');
      if (!hasDisbursedLog) {
        await recordAuditLog({
          applicationId: application._id,
          applicationNumber: application.applicationNumber,
          previousStatus: 'PAYMENT_PROCESSING',
          newStatus: 'DISBURSED',
          changedBy: paymentDoc.disbursedBy || null,
          officerName: paymentDoc.disbursedByName || 'DBT Payment Gateway (PFMS/NPCI)',
          officerRole: 'DEPARTMENT_OFFICER',
          remarks: `Payment disbursed via Direct Benefit Transfer (DBT). UTR: ${paymentDoc.utr || 'Confirmed'}`
        });
      }
    }

    // Re-fetch updated audit logs if added
    const updatedAuditLogs = await AuditLog.find({ applicationId: application._id }).sort({ timestamp: 1 });

    // Fetch or initialize SLP tracking record
    let slpTracking = await SLPTracking.findOne({
      $or: [{ applicationId: application._id }, { applicationNumber: application.applicationNumber }]
    });

    if (!slpTracking && !['DISBURSED', 'PAYMENT_DISBURSED', 'REJECTED'].includes(application.status)) {
      slpTracking = await slpService.startStage(application, application.status || 'SUBMITTED');
    }

    return res.status(200).json({
      success: true,
      application,
      auditLogs: updatedAuditLogs,
      slpTracking
    });
  } catch (error) {
    console.error('Get Application Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve application details',
      error: error.message
    });
  }
};

// @desc    Resubmit Application after Correction Request
// @route   PUT /api/student/applications/:id/resubmit-correction
// @access  Private (Student)
const resubmitCorrection = async (req, res) => {
  try {
    const studentId = req.user._id;
    const application = await Application.findOne(getApplicationLookupQuery(req.params.id));

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (application.status !== 'CORRECTION_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Application is not in CORRECTION_REQUIRED status.'
      });
    }

    const { personalDetails, academicDetails, incomeDetails, bankDetails, documents, notes } = req.body;

    if (personalDetails) application.personalDetails = { ...application.personalDetails, ...personalDetails };
    if (academicDetails) application.academicDetails = { ...application.academicDetails, ...academicDetails };
    if (incomeDetails) application.incomeDetails = { ...application.incomeDetails, ...incomeDetails };
    if (bankDetails) application.bankDetails = { ...application.bankDetails, ...bankDetails };
    if (documents) application.documents = { ...application.documents, ...documents };

    const previousStatus = application.status;
    application.status = 'SUBMITTED'; // Moves back to institute queue
    application.correctionRemarks = '';
    await application.save();

    // Record audit
    await recordAuditLog({
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      previousStatus,
      newStatus: 'SUBMITTED',
      changedBy: studentId,
      officerName: req.user.name,
      officerRole: 'STUDENT',
      remarks: notes || 'Student fixed required corrections and resubmitted application.'
    });

    // Notify Institute Officer
    if (application.institutionId) {
      await createNotification({
        recipientRole: 'INSTITUTE_OFFICER',
        institutionId: application.institutionId,
        title: 'Correction Resubmitted by Student',
        message: `Student ${req.user.name} has corrected and resubmitted application ${application.applicationNumber}.`,
        type: 'info',
        applicationNumber: application.applicationNumber,
        link: `/institute/applications/${application._id}`
      });
    }

    // Restart SLP timer for resubmitted application
    await slpService.startStage(application, 'SUBMITTED', {
      id: studentId,
      name: req.user.name,
      role: 'STUDENT',
      remarks: 'Corrections fixed by student and resubmitted'
    });

    return res.status(200).json({
      success: true,
      message: 'Application corrections submitted successfully',
      application
    });
  } catch (error) {
    console.error('Resubmit Correction Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resubmit corrections',
      error: error.message
    });
  }
};

// @desc    Get Student Payment & Disbursement History
// @route   GET /api/student/payments
// @access  Private (Student)
const getMyPayments = async (req, res) => {
  try {
    const studentId = req.user._id;
    const payments = await Payment.find({ studentId })
      .populate('scholarshipId', 'name code')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Get My Payments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
};

// @desc    Get Notifications for Student
// @route   GET /api/student/notifications
// @access  Private (Student)
const getNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;
    const notifications = await Notification.find({
      $or: [{ userId: studentId }, { recipientRole: 'STUDENT' }, { recipientRole: 'ALL' }]
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load notifications',
      error: error.message
    });
  }
};

// @desc    Mark Notification Read
// @route   PUT /api/student/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    return res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error marking read' });
  }
};

// @desc    Get Eligible Scholarships for Logged-In Student
// @route   GET /api/student/eligible-scholarships
// @access  Private (Student)
const getEligibleScholarships = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { getEligibleScholarshipsForStudent } = require('../services/reminderService');
    const eligibleList = await getEligibleScholarshipsForStudent(student);

    return res.status(200).json({
      success: true,
      count: eligibleList.length,
      eligibleScholarships: eligibleList
    });
  } catch (error) {
    console.error('Get Eligible Scholarships Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve eligible scholarships',
      error: error.message
    });
  }
};

// @desc    Mark All Notifications Read
// @route   PUT /api/student/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error marking all as read' });
  }
};

module.exports = {
  getStudentDashboard,
  getScholarships,
  getScholarshipById,
  applyScholarship,
  getMyApplications,
  getApplicationDetails,
  resubmitCorrection,
  getMyPayments,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getEligibleScholarships
};
