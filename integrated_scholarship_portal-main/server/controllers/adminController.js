const Student = require('../models/Student');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Management / Nodal Officer Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Default admin credentials check or role check
    if ((email.toLowerCase() === 'admin@nsp.gov.in' || email.toLowerCase() === 'management@nsp.gov.in') && password === 'admin123') {
      const adminPayload = {
        id: 'ADMIN-001',
        fullName: 'State Nodal Officer',
        email: email.toLowerCase(),
        role: 'Management Administrator',
        department: 'Ministry of Higher Education & Scholarships'
      };

      const token = jwt.sign(
        { id: adminPayload.id, role: 'admin' },
        process.env.JWT_SECRET || 'national_scholarship_secret_key_2026_jwt',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Management Portal Login Successful',
        token,
        admin: adminPayload
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid Management Credentials. Use admin@nsp.gov.in / admin123'
      });
    }
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during management login',
      error: error.message
    });
  }
};

// Get All Registered Students (for Management Portal Students Directory)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get All Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student directory',
      error: error.message
    });
  }
};

// Submit Scholarship Application (from Student Portal)
const submitApplication = async (req, res) => {
  try {
    const {
      refNo,
      schemeId,
      schemeCode,
      schemeTitle,
      amount,
      submissionType,
      bankDetails,
      annualIncome,
      statementOfPurpose,
      submittedDocuments,
      studentName,
      studentEmail,
      studentPhone,
      gender,
      category,
      collegeName,
      department,
      registerNumber,
      ugCgpa,
      hscPercentage
    } = req.body;

    const studentId = req.student ? req.student._id : null;
    const finalStudentName = req.student?.fullName || studentName || 'Student Applicant';
    const finalStudentEmail = req.student?.email || studentEmail || 'student@nsp.gov.in';
    const finalStudentPhone = req.student?.phone || studentPhone || '9876543210';
    const finalGender = req.student?.gender || gender || 'All';
    const finalCategory = req.student?.category || category || 'General';
    const finalCollegeName = req.student?.college?.collegeName || collegeName || 'National Engineering College';
    const finalDepartment = req.student?.college?.department || department || 'Computer Science & Engineering';
    const finalRegisterNumber = req.student?.college?.registerNumber || registerNumber || 'REG-2026-001';
    const finalUgCgpa = Number(req.student?.academic?.ug?.cgpa !== undefined ? req.student.academic.ug.cgpa : (ugCgpa || 8.0));
    const finalHscPercentage = Number(req.student?.academic?.hsc?.percentage !== undefined ? req.student.academic.hsc.percentage : (hscPercentage || 80));

    const finalBankDetails = bankDetails || {
      bankName: 'State Bank of India',
      accountNumber: '38492019482',
      ifscCode: 'SBIN0001234',
      branchName: 'Main Branch'
    };

    const finalSubmittedDocs = submittedDocuments || {
      aadhaar: 'Aadhaar_Card_Verified.pdf',
      incomeCert: 'Income_Certificate_Verified.pdf',
      communityCert: 'Community_Certificate.pdf',
      collegeId: 'College_Bonafide_ID.pdf',
      marksheet: 'Marksheet_Copy.pdf'
    };

    const newRefNo = refNo || `NSP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const application = await Application.create({
      refNo: newRefNo,
      studentId,
      studentName: finalStudentName,
      studentEmail: finalStudentEmail,
      studentPhone: finalStudentPhone,
      gender: finalGender,
      category: finalCategory,
      collegeName: finalCollegeName,
      department: finalDepartment,
      registerNumber: finalRegisterNumber,
      ugCgpa: finalUgCgpa,
      hscPercentage: finalHscPercentage,
      schemeId: schemeId || 'SCH-001',
      schemeCode: schemeCode || 'CSSS',
      schemeTitle: schemeTitle || 'Central Sector Scheme of Scholarships',
      amount: amount || '₹20,000 / Year',
      submissionType: submissionType || 'Fresh Application',
      bankDetails: finalBankDetails,
      annualIncome: String(annualIncome || '250000'),
      statementOfPurpose: statementOfPurpose || 'Required financial assistance to support higher education.',
      submittedDocuments: finalSubmittedDocs,
      status: 'Pending Verification'
    });

    // Create In-App Notification for Student
    try {
      await Notification.create({
        studentId,
        studentEmail: finalStudentEmail,
        title: 'Scholarship Application Submitted',
        message: `Your application for ${application.schemeTitle} (${application.submissionType}) has been submitted successfully (Ref: ${application.refNo}). It is currently queued for State Officer Verification.`,
        type: 'info',
        refNo: application.refNo,
        schemeId: application.schemeId,
        schemeTitle: application.schemeTitle
      });
    } catch (notifErr) {
      console.error('Notification creation error on submit:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Scholarship Application Submitted Successfully',
      application
    });
  } catch (error) {
    console.error('Submit Application Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit scholarship application',
      error: error.message
    });
  }
};

// Get Applications for Current Authenticated Student
const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.student ? req.student._id : null;
    const studentEmail = req.student ? req.student.email : null;

    let query = {};
    if (studentId) {
      query = { $or: [{ studentId }, { studentEmail }] };
    } else if (studentEmail) {
      query = { studentEmail };
    }

    const applications = await Application.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get Student Applications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your applications',
      error: error.message
    });
  }
};

// Get All Submitted Applications (for Management Portal Dashboard)
const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get All Applications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

// Update Application Status (Approve / Reject) by Management Officer
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Pending Verification'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status, remarks: remarks || '' },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found'
      });
    }

    // Trigger Notification to Student on Approval / Rejection
    try {
      if (status === 'Approved') {
        await Notification.create({
          studentId: application.studentId,
          studentEmail: application.studentEmail,
          title: 'Scholarship Application Approved! 🎉',
          message: `Congratulations! Your scholarship application for ${application.schemeTitle} (Ref: ${application.refNo}) has been Approved and Sanctioned for disbursement (${application.amount}).`,
          type: 'success',
          refNo: application.refNo,
          schemeId: application.schemeId,
          schemeTitle: application.schemeTitle,
          remarks: remarks || ''
        });
      } else if (status === 'Rejected') {
        await Notification.create({
          studentId: application.studentId,
          studentEmail: application.studentEmail,
          title: 'Application Rejected / Returned ⚠️',
          message: `Your scholarship application (Ref: ${application.refNo}) for ${application.schemeTitle} was returned. Reason: "${remarks || 'Document verification incomplete'}". You can review the reason and re-apply.`,
          type: 'danger',
          refNo: application.refNo,
          schemeId: application.schemeId,
          schemeTitle: application.schemeTitle,
          remarks: remarks || 'Document verification incomplete'
        });
      }
    } catch (notifErr) {
      console.error('Notification creation error on status update:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// Get Student Notifications
const getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.student ? req.student._id : null;
    const studentEmail = req.student ? req.student.email : null;

    let query = {};
    if (studentId) {
      query = { $or: [{ studentId }, { studentEmail }] };
    } else if (studentEmail) {
      query = { studentEmail };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30);
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
};

// Mark Single Notification as Read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Mark All Notifications as Read
const markAllNotificationsRead = async (req, res) => {
  try {
    const studentId = req.student ? req.student._id : null;
    const studentEmail = req.student ? req.student.email : null;

    let query = {};
    if (studentId) {
      query = { $or: [{ studentId }, { studentEmail }] };
    } else if (studentEmail) {
      query = { studentEmail };
    }

    await Notification.updateMany(query, { read: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications read',
      error: error.message
    });
  }
};

module.exports = {
  adminLogin,
  getAllStudents,
  submitApplication,
  getStudentApplications,
  getAllApplications,
  updateApplicationStatus,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
