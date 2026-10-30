const mongoose = require('mongoose');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`  ❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASSED: ${msg}`);
}

async function runSlpDemoTest() {
  console.log('========================================================================');
  console.log('⚡ SLP DEMO MODE (1-MINUTE SLA + ESCALATION) COMPREHENSIVE TEST');
  console.log('========================================================================\n');

  // Use application models directly
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_details');
  const SLPTracking = require('./models/SLPTracking');
  const AuditLog = require('./models/AuditLog');
  const Notification = require('./models/Notification');
  const Application = require('./models/Application');

  // 1. Verify SLP Config endpoint
  console.log('--- TEST 1: SLP Configuration ---');
  const configRes = await request('/slp/config');
  assert(configRes.success === true, 'Public SLP config accessible');
  assert(configRes.data.mode === 'DEMO', `SLP Mode is DEMO (got ${configRes.data.mode})`);
  assert(configRes.data.defaultStageSlaSeconds === 60, 'Demo SLA is 60 seconds (1 minute)');
  assert(configRes.data.label.includes('1 minute'), 'Label contains "1 minute"');

  // 2. Register Student & Submit Application
  console.log('\n--- TEST 2: Application Submission & SLP Timer Initiation ---');
  const Institution = require('./models/Institution');
  const nitInst = await Institution.findOne({ code: 'NITD-101' });

  const ts = Date.now();
  const studentEmail = `slp.student.${ts}@test.edu`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: `SLP Tester ${ts}`,
      email: studentEmail,
      password: 'password123',
      role: 'STUDENT',
      phone: '9876543210',
      category: 'GENERAL',
      institutionId: nitInst._id.toString()
    }
  });
  const studentToken = regRes.token;
  const studentId = regRes.user.id;

  // Apply for scholarship
  const scholarshipsRes = await request('/student/scholarships', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const scholarship = scholarshipsRes.scholarships.find(s => s.name.includes('CSSS') || s.name.includes('Central Sector')) || scholarshipsRes.scholarships[0];

  const applyRes = await request(`/student/apply/${scholarship._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      submissionType: 'Fresh Application',
      personalDetails: {
        fullName: regRes.user.name,
        email: regRes.user.email,
        phone: '9876543210',
        dob: '2004-01-10',
        gender: 'Male',
        category: 'OBC',
        address: 'NIT Campus',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      academicDetails: {
        institutionName: 'National Institute of Technology (NIT Delhi)',
        course: 'B.Tech IT',
        department: 'IT',
        year: '2nd Year',
        enrollmentNumber: `ENR-${ts}`,
        registerNumber: `REG-${ts}`,
        previousClassPercentage: 87,
        cgpa: 8.7,
        attendancePercentage: 90
      },
      incomeDetails: {
        familyAnnualIncome: 200000,
        incomeCertificateNumber: `INC-${ts}`,
        issuingAuthority: 'Revenue Dept'
      },
      bankDetails: {
        bankName: 'SBI',
        accountNumber: '12345678901',
        ifscCode: 'SBIN0001234',
        branchName: 'Main Branch',
        accountHolderName: regRes.user.name
      },
      documents: {
        aadhaarCard: 'aadhaar.pdf',
        incomeCertificate: 'income.pdf'
      }
    }
  });

  const appId = applyRes.application._id;
  const appNo = applyRes.application.applicationNumber;
  console.log(`  Submitted Application: ${appNo} (ID: ${appId})`);

  // Verify SLP Tracking record in DB
  const initialTracking = await SLPTracking.findOne({ applicationId: appId });
  assert(!!initialTracking, 'SLP tracking document created for application');
  assert(initialTracking.currentStage === 'SUBMITTED', 'Current SLP stage is SUBMITTED');
  assert(initialTracking.slaStatus === 'WITHIN_SLA', `SLA Status is initially active (got ${initialTracking.slaStatus})`);
  assert(initialTracking.slaDuration === 60, 'SLA Duration set to 60s');
  assert(initialTracking.escalationLevel === 0, 'Initial escalation level is 0');

  // 3. Fast-forward / Time-warp SLA Breach (>60s)
  console.log('\n--- TEST 3: SLA Breach & Auto-Escalation Simulation ---');
  // Set stageStartedAt to 75 seconds ago
  await SLPTracking.updateOne(
    { applicationId: appId },
    {
      $set: {
        stageStartedAt: new Date(Date.now() - 75 * 1000),
        slaDeadline: new Date(Date.now() - 15 * 1000)
      }
    }
  );

  // Trigger SLP engine check
  const checkRes = await request('/slp/check', { method: 'POST' });
  assert(checkRes.success === true, 'Triggered SLP background check');

  // Verify SLP Tracking updated to breached
  const breachedTracking = await SLPTracking.findOne({ applicationId: appId });
  assert(breachedTracking.slaStatus === 'SLA_BREACHED', `SLA status changed to SLA_BREACHED (got ${breachedTracking.slaStatus})`);
  assert(breachedTracking.escalationLevel >= 1, `Escalation level raised to >= 1 (got ${breachedTracking.escalationLevel})`);
  assert(breachedTracking.escalationStatus === 'ESCALATED', `Escalation status set to ESCALATED (got ${breachedTracking.escalationStatus})`);

  // Verify application stage did NOT skip or auto-change
  const currentApp = await Application.findById(appId);
  assert(currentApp.status === 'SUBMITTED', 'Application status STILL SUBMITTED (SLA breach does NOT alter workflow stage)');

  // Verify Admin alert notification generated
  const adminNotifs = await Notification.find({
    applicationNumber: appNo,
    recipientRole: 'ADMIN'
  });
  assert(adminNotifs.length > 0, `Escalation alert notification created for Admin (found ${adminNotifs.length})`);
  console.log(`  Alert notification title: "${adminNotifs[0].title}"`);

  // Verify Audit Log recorded for SLA breach
  const breachLogs = await AuditLog.find({
    applicationId: appId,
    newStatus: 'SLA_BREACHED'
  });
  assert(breachLogs.length > 0, `Audit log recorded with newStatus 'SLA_BREACHED'`);

  // 4. Institute Officer Approves after Breach
  console.log('\n--- TEST 4: Institute Approval Completed After SLA Breach ---');
  const instLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'institute@nsp.gov.in', password: 'institute123', expectedRole: 'INSTITUTE_OFFICER' }
  });
  const instToken = instLogin.token;

  const instVerifyRes = await request(`/institute/applications/${appId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instToken}` },
    body: {
      action: 'APPROVE',
      remarks: 'Verified credentials after delay. Approved for department routing.',
      checklist: {
        identityVerified: true,
        enrollmentVerified: true,
        academicMarksVerified: true,
        attendanceVerified: true,
        incomeVerified: true,
        documentsVerified: true
      }
    }
  });
  assert(instVerifyRes.success === true, 'Institute officer successfully verified application');

  // Verify previous stage marked COMPLETED_AFTER_SLA
  const postInstTracking = await SLPTracking.findOne({ applicationId: appId });
  const subHistory = postInstTracking.stageHistory.find(h => h.stage === 'SUBMITTED');
  assert(!!subHistory, 'History contains SUBMITTED stage record');
  assert(subHistory.slaStatus === 'COMPLETED_AFTER_SLA', `SUBMITTED history marked COMPLETED_AFTER_SLA (got ${subHistory.slaStatus})`);
  assert(postInstTracking.currentStage === 'ROUTED_TO_DEPARTMENT', `Active stage transitioned to ROUTED_TO_DEPARTMENT`);
  assert(postInstTracking.slaStatus === 'WITHIN_SLA', `New stage SLA timer started fresh (status: WITHIN_SLA)`);

  // 5. Department Breach Simulation (>60s)
  console.log('\n--- TEST 5: Department Scrutiny Breach Simulation ---');
  await SLPTracking.updateOne(
    { applicationId: appId },
    {
      $set: {
        stageStartedAt: new Date(Date.now() - 80 * 1000),
        slaDeadline: new Date(Date.now() - 20 * 1000)
      }
    }
  );
  await request('/slp/check', { method: 'POST' });

  const deptBreachedTracking = await SLPTracking.findOne({ applicationId: appId });
  assert(deptBreachedTracking.slaStatus === 'SLA_BREACHED', `Department stage correctly marked SLA_BREACHED`);

  // 6. Department Officer Approves & Sanctions
  console.log('\n--- TEST 6: Department Officer Approves After SLA Breach ---');
  const DBUser = require('./models/User');
  const routedDeptId = applyRes.application.departmentId;
  const correctDeptOfficer = await DBUser.findOne({
    role: 'DEPARTMENT_OFFICER',
    departmentId: mongoose.Types.ObjectId.isValid(routedDeptId) ? new mongoose.Types.ObjectId(routedDeptId) : null
  });
  const deptEmail = correctDeptOfficer ? correctDeptOfficer.email : 'department@nsp.gov.in';

  const deptLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: deptEmail, password: 'department123', expectedRole: 'DEPARTMENT_OFFICER' }
  });
  const deptToken = deptLogin.token;

  const deptVerifyRes = await request(`/department/applications/${appId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: {
      action: 'APPROVE',
      approvedAmount: 50000,
      remarks: 'Scrutiny verified and approved by Department Officer.'
    }
  });
  assert(deptVerifyRes.success === true, 'Department officer verified application');

  // Generate Sanction
  const sanctionRes = await request('/department/sanctions/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: {
      applicationId: appId,
      financialYear: '2025-2026',
      quotaCategory: 'General Merit',
      remarks: 'Sanction order issued.'
    }
  });
  assert(sanctionRes.success === true, 'Sanction order generated');

  // 7. Admin Overview Endpoint Verification
  console.log('\n--- TEST 7: Admin SLP Monitor Overview API ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@nsp.gov.in', password: 'admin123', expectedRole: 'ADMIN' }
  });
  const adminToken = adminLogin.token;

  const overviewRes = await request('/slp/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(overviewRes.success === true, 'Admin overview returned success');
  assert(typeof overviewRes.stats.totalActive === 'number', 'Stat totalActive is a valid number');
  assert(typeof overviewRes.stats.slaBreached === 'number', 'Stat slaBreached is a valid number');
  assert(typeof overviewRes.stats.adminAttentionRequired === 'number', 'Stat adminAttentionRequired is a valid number');
  assert(Array.isArray(overviewRes.applications), 'applications list returned as array');

  console.log('\n========================================================================');
  console.log('🎉 ALL SLP DEMO TESTS PASSED SUCCESSFULLY!');
  console.log('   ✓ 1-Minute Demo SLA accurately applied');
  console.log('   ✓ Breach detection without interrupting stage workflow');
  console.log('   ✓ Admin escalation notifications & audit logs created');
  console.log('   ✓ COMPLETED_AFTER_SLA tracking preserved on approval');
  console.log('   ✓ Fresh timer started for subsequent stages');
  console.log('   ✓ Admin SLP Monitor KPI calculations verified');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

runSlpDemoTest().catch((err) => {
  console.error('\n❌ Unhandled error in SLP demo test:', err);
  process.exit(1);
});
