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

function failIfFound(label, list, appNo) {
  const found = (list || []).find(a => a.applicationNumber === appNo);
  if (found) {
    console.error(`  ❌ FAIL: ${label} — Application INCORRECTLY visible (status: ${found.status})`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${label} — Application correctly NOT visible`);
}

function passIfFound(label, list, appNo) {
  const found = (list || []).find(a => a.applicationNumber === appNo);
  if (!found) {
    console.error(`  ❌ FAIL: ${label} — Application NOT visible (expected visible)`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${label} — Application FOUND (status: ${found.status})`);
}

async function runWorkflowTest() {
  console.log('========================================================================');
  console.log('🔬 5-STAGE STRICT WORKFLOW SEQUENCE TEST');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/national_scholarship_db');
  const Institution = mongoose.model('Institution', new mongoose.Schema({}, { strict: false }));
  const DBUser = mongoose.model('DBUser', new mongoose.Schema({}, { strict: false }), 'users');
  const nitInst = await Institution.findOne({ code: 'NITD-101' });

  const INST_EMAIL = 'institute@nsp.gov.in';
  const INST_PASS = 'institute123';
  const DEPT_PASS = 'department123';

  // ---- Register Brand New Student ----
  const ts = Date.now();
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: `Workflow Test Student ${ts}`,
      email: `workflow_${ts}@test.edu`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phone: '9876543210',
      institutionId: nitInst._id.toString(),
      course: 'B.Tech IT',
      dob: '2004-01-10',
      gender: 'Male',
      category: 'OBC',
      familyIncome: '200000',
      bankName: 'SBI',
      accountNumber: '12345678901',
      ifscCode: 'SBIN0001234'
    }
  });
  const studentToken = regRes.token;
  const studentInstitutionName = regRes.user.institutionName;
  console.log(`[SETUP] New student registered: ${regRes.user.name}`);
  console.log(`        Institution: ${studentInstitutionName}\n`);

  // Apply for scholarship — use CSSS (dept1/Ministry) to match the main demo officer
  const schemesRes = await request('/student/scholarships');
  // Pick the CSSS scholarship (Ministry of Higher Education dept) so we can use department@nsp.gov.in
  const scheme = schemesRes.scholarships.find(s => s.name.includes('CSSS') || s.name.includes('Central Sector')) || schemesRes.scholarships[0];
  console.log(`[SETUP] Applying for: ${scheme.name}`);
  console.log(`        Scholarship DeptId: ${scheme.departmentId}\n`);

  const applyRes = await request(`/student/apply/${scheme._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      submissionType: 'Fresh Application',
      personalDetails: { fullName: regRes.user.name, email: regRes.user.email, phone: '9876543210', dob: '2004-01-10', gender: 'Male', category: 'OBC', address: 'NIT Campus', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      academicDetails: { institutionName: studentInstitutionName, course: 'B.Tech IT', department: 'IT', year: '2nd Year', enrollmentNumber: `ENR-${ts}`, registerNumber: `REG-${ts}`, previousClassPercentage: 87, cgpa: 8.7, attendancePercentage: 90 },
      incomeDetails: { familyAnnualIncome: 200000, incomeCertificateNumber: `INC-${ts}`, issuingAuthority: 'Revenue Dept' },
      bankDetails: { bankName: 'SBI', accountNumber: '12345678901', ifscCode: 'SBIN0001234', branchName: 'Main Branch', accountHolderName: regRes.user.name },
      documents: { aadhaarCard: 'aadhaar.pdf', incomeCertificate: 'income.pdf' }
    }
  });
  const newApp = applyRes.application;
  console.log(`[SETUP] Application Created: ${newApp.applicationNumber}`);
  console.log(`        Initial Status: ${newApp.status}`);
  console.log(`        InstitutionId:  ${newApp.institutionId}`);
  console.log(`        DepartmentId:   ${newApp.departmentId} (${newApp.departmentName})`);

  if (newApp.status !== 'SUBMITTED') {
    console.error(`  ❌ FAIL: Expected initial status SUBMITTED, got: ${newApp.status}`);
    process.exit(1);
  }

  // ---- Login Institute token ----
  const instLoginRes = await request('/auth/login', { method: 'POST', body: { email: INST_EMAIL, password: INST_PASS, expectedRole: 'INSTITUTE_OFFICER' } });
  const instToken = instLoginRes.token;

  // ---- Dynamically find the correct dept officer for this app's departmentId ----
  const routedDeptId = newApp.departmentId;
  const correctDeptOfficer = await DBUser.findOne({ role: 'DEPARTMENT_OFFICER', departmentId: mongoose.Types.ObjectId.isValid(routedDeptId) ? new mongoose.Types.ObjectId(routedDeptId) : null });
  if (!correctDeptOfficer) {
    console.error(`  ❌ FAIL: No department officer found for departmentId ${routedDeptId}. Run the addMissingDeptOfficers script.`);
    process.exit(1);
  }
  console.log(`\n[SETUP] Dept officer resolved: ${correctDeptOfficer.email} (${correctDeptOfficer.departmentName})`);
  const deptLoginRes = await request('/auth/login', { method: 'POST', body: { email: correctDeptOfficer.email, password: DEPT_PASS, expectedRole: 'DEPARTMENT_OFFICER' } });
  const deptToken = deptLoginRes.token;

  // ══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 1: After Student Submission (Status: SUBMITTED)');
  console.log('══════════════════════════════════════════════════════');

  const instDash1 = await request('/institute/dashboard', { headers: { Authorization: `Bearer ${instToken}` } });
  const instApps1 = await request('/institute/applications', { headers: { Authorization: `Bearer ${instToken}` } });
  const deptDash1 = await request('/department/dashboard', { headers: { Authorization: `Bearer ${deptToken}` } });
  const deptApps1 = await request('/department/applications', { headers: { Authorization: `Bearer ${deptToken}` } });

  passIfFound('Institute Dashboard shows SUBMITTED application', instDash1.recentApplications, newApp.applicationNumber);
  passIfFound('Institute Applications list shows SUBMITTED application', instApps1.applications, newApp.applicationNumber);
  failIfFound('Department Dashboard does NOT show SUBMITTED application', deptDash1.recentApplications, newApp.applicationNumber);
  failIfFound('Department Applications list does NOT show SUBMITTED application', deptApps1.applications, newApp.applicationNumber);

  // Verify Department cannot directly access via URL (workflow gate)
  try {
    await request(`/department/applications/${newApp._id}`, { headers: { Authorization: `Bearer ${deptToken}` } });
    console.error('  ❌ FAIL: Department accessed SUBMITTED application by ID (should have been blocked)');
    process.exit(1);
  } catch (e) {
    if (e.status === 403) {
      console.log('  ✅ PASS: Department blocked from accessing SUBMITTED application by ID (403)');
    } else {
      console.error(`  ❌ FAIL: Unexpected error: ${e.status} ${e.message}`);
      process.exit(1);
    }
  }

  // ══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 2: Pre-Institute-Approval — Department MUST NOT see application');
  console.log('══════════════════════════════════════════════════════');
  const instApps2 = await request('/institute/applications?status=SUBMITTED', { headers: { Authorization: `Bearer ${instToken}` } });
  passIfFound('Institute sees application under SUBMITTED filter', instApps2.applications, newApp.applicationNumber);

  const deptApps2 = await request('/department/applications?status=ROUTED_TO_DEPARTMENT', { headers: { Authorization: `Bearer ${deptToken}` } });
  failIfFound('Department ROUTED_TO_DEPARTMENT filter: no pre-approval app visible', deptApps2.applications, newApp.applicationNumber);
  console.log('  ✅ Application correctly held at Institute stage — Department cannot see it.');

  // ══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 3: Institute Officer APPROVES — Routes to Department');
  console.log('══════════════════════════════════════════════════════');
  const verifyRes = await request(`/institute/applications/${newApp._id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instToken}` },
    body: {
      action: 'APPROVE',
      remarks: 'All enrollment & marksheets verified.',
      checklist: { enrollmentVerified: true, marksheetVerified: true, feeReceiptVerified: true, bonafideVerified: true }
    }
  });
  console.log(`  ✅ Institute Approved. New Status: ${verifyRes.application.status}`);
  if (verifyRes.application.status !== 'ROUTED_TO_DEPARTMENT') {
    console.error(`  ❌ FAIL: Expected ROUTED_TO_DEPARTMENT, got: ${verifyRes.application.status}`);
    process.exit(1);
  }

  // After approval: Department MUST now see it, Institute should see it as ROUTED (not SUBMITTED)
  const instDash3 = await request('/institute/dashboard', { headers: { Authorization: `Bearer ${instToken}` } });
  const deptDash3 = await request('/department/dashboard', { headers: { Authorization: `Bearer ${deptToken}` } });
  const deptApps3 = await request('/department/applications', { headers: { Authorization: `Bearer ${deptToken}` } });

  const instSubmittedAfterApproval = (instDash3.recentApplications || []).filter(a => a.status === 'SUBMITTED');
  failIfFound('Institute Dashboard: application no longer in SUBMITTED list', instSubmittedAfterApproval, newApp.applicationNumber);
  passIfFound('Department Dashboard NOW shows application (ROUTED_TO_DEPARTMENT)', deptDash3.recentApplications, newApp.applicationNumber);
  passIfFound('Department Applications list NOW shows application (ROUTED_TO_DEPARTMENT)', deptApps3.applications, newApp.applicationNumber);

  // Department can now access the application by ID
  const deptAppDetail = await request(`/department/applications/${newApp._id}`, { headers: { Authorization: `Bearer ${deptToken}` } });
  if (deptAppDetail.application?.status === 'ROUTED_TO_DEPARTMENT') {
    console.log('  ✅ PASS: Department can access application by ID after Institute approval');
  } else {
    console.error(`  ❌ FAIL: Department application detail unexpected status: ${deptAppDetail.application?.status}`);
    process.exit(1);
  }

  // ══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 4: Department Officer APPROVES application');
  console.log('══════════════════════════════════════════════════════');
  const deptVerifyRes = await request(`/department/applications/${newApp._id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: {
      action: 'APPROVE',
      approvedAmount: scheme.scholarshipAmount || 50000,
      remarks: 'Eligibility verified, quota available.',
      checklist: { eligibilityMet: true, budgetAvailable: true, quotaVerified: true, bankDetailsValid: true }
    }
  });
  console.log(`  ✅ Department Approved. New Status: ${deptVerifyRes.application.status}`);
  if (!['APPROVED', 'SANCTIONED'].includes(deptVerifyRes.application.status)) {
    console.error(`  ❌ FAIL: Expected APPROVED or SANCTIONED, got: ${deptVerifyRes.application.status}`);
    process.exit(1);
  }

  // ══════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 5: Generate Sanction → Process → Disburse');
  console.log('══════════════════════════════════════════════════════');
  const sanctionRes = await request('/department/sanctions/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: { applicationId: newApp._id, orderRemarks: 'Scholarship grant authorized.' }
  });
  console.log(`  ✅ Sanction Generated: ${sanctionRes.sanction?.sanctionNumber}`);
  if (!sanctionRes.sanction?.sanctionNumber) {
    console.error('  ❌ FAIL: No sanction number returned'); process.exit(1);
  }
  // Verify application is now SANCTIONED via dept detail endpoint
  const sanctionedApp = await request(`/department/applications/${newApp._id}`, { headers: { Authorization: `Bearer ${deptToken}` } });
  console.log(`     Application Status after sanction: ${sanctionedApp.application?.status}`);
  if (sanctionedApp.application?.status !== 'SANCTIONED') {
    console.error(`  ❌ FAIL: Expected SANCTIONED, got: ${sanctionedApp.application?.status}`); process.exit(1);
  }
  console.log('  ✅ PASS: Application correctly in SANCTIONED status');

  const paymentId = sanctionRes.payment?._id;
  if (!paymentId) { console.error('  ❌ FAIL: No payment created with sanction'); process.exit(1); }

  // Step 1: Process (send to banking gateway)
  const processRes = await request(`/department/disbursement/${paymentId}/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: { step: 'PROCESS' }
  });
  console.log(`  ✅ Payment sent to Banking Gateway: ${processRes.payment?.status}`);
  if (processRes.payment?.status !== 'PAYMENT_PROCESSING') {
    console.error(`  ❌ FAIL: Expected PAYMENT_PROCESSING, got: ${processRes.payment?.status}`); process.exit(1);
  }

  // Step 2: Complete Disbursement (DBT transfer)
  const disburseRes = await request(`/department/disbursement/${paymentId}/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: { step: 'COMPLETE' }
  });
  console.log(`  ✅ DISBURSED! Payment Status: ${disburseRes.payment?.status}`);
  console.log(`     UTR: ${disburseRes.payment?.utr} | Receipt: ${disburseRes.payment?.receiptNumber}`);
  if (disburseRes.payment?.status !== 'DISBURSED') {
    console.error(`  ❌ FAIL: Expected DISBURSED payment, got: ${disburseRes.payment?.status}`); process.exit(1);
  }

  // ---- Final Student view ----
  const studentAppRes = await request(`/student/applications/${newApp._id}`, { headers: { Authorization: `Bearer ${studentToken}` } });
  console.log(`\n[FINAL] Student sees status: ${studentAppRes.application?.status}`);
  console.log(`        Audit log entries: ${studentAppRes.auditLogs?.length || 0}`);
  if (studentAppRes.application?.status !== 'DISBURSED') {
    console.error(`  ❌ FAIL: Student should see DISBURSED, got: ${studentAppRes.application?.status}`);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL 5-STAGE TESTS PASSED — WORKFLOW IS STRICTLY CORRECT!');
  console.log('   SUBMITTED → [ROUTED_TO_DEPARTMENT] → [APPROVED] → [SANCTIONED] → [DISBURSED]');
  console.log('   ✓ Department blocked from SUBMITTED applications (list + direct URL)');
  console.log('   ✓ Department gains visibility only after Institute approval');
  console.log('   ✓ Full end-to-end disbursement flow completed');
  console.log('========================================================================\n');
  process.exit(0);
}

runWorkflowTest().catch(err => {
  console.error('\n❌ Workflow test failed:', err.data || err.message || err);
  process.exit(1);
});
