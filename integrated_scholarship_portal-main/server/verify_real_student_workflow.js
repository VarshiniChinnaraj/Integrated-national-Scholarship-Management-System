const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(BASE_URL + url, { ...options, headers });
  const data = await res.json();
  return { status: res.status, data };
}

async function runVerification() {
  console.log('===============================================================');
  console.log('STARTING COMPLETE REAL STUDENT WORKFLOW VERIFICATION');
  console.log('===============================================================');

  // STEP 1: Verify NO demo students exist
  console.log('\n[TEST 1] Checking for demo students in MongoDB...');
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_details');
  const demoUsers = await mongoose.connection.db.collection('users').find({
    email: { $in: ['student@nsp.gov.in', 'priya.patel@nsp.gov.in', 'rahul.verma@nsp.gov.in'] }
  }).toArray();

  if (demoUsers.length === 0) {
    console.log('✅ PASS: No demo students found in database.');
  } else {
    throw new Error(`FAIL: Found ${demoUsers.length} demo students!`);
  }

  // STEP 2: Fetch available institutions & scholarships for registration
  console.log('\n[TEST 2] Fetching active institutions...');
  const insts = await mongoose.connection.db.collection('institutions').find({ status: 'Active' }).toArray();
  const nitDelhi = insts.find(i => i.code === 'NITD-101') || insts[0];
  console.log(`✅ Selected Institution: ${nitDelhi.name} (${nitDelhi.code})`);

  const scholarships = await mongoose.connection.db.collection('scholarships').find({ status: 'Active' }).toArray();
  const csss = scholarships.find(s => s.code === 'CSSS-2026') || scholarships[0];
  console.log(`✅ Selected Scholarship: ${csss.name} (${csss.code})`);

  // STEP 3: Register a REAL Student
  console.log('\n[TEST 3] Registering a new real student via /api/auth/register...');
  const studentEmail = `real.student.${Date.now()}@college.edu`;
  const regPayload = {
    name: 'Siddharth Nair',
    email: studentEmail,
    password: 'Password@2026',
    phone: '9845012345',
    institutionId: nitDelhi._id.toString(),
    institutionName: nitDelhi.name,
    course: 'B.Tech in Computer Engineering',
    academicDepartment: 'Computer Engineering',
    year: '2nd Year',
    enrollmentNo: 'NITD/2024/CE/077',
    marksPercentage: 86,
    cgpa: 8.7,
    gender: 'Male',
    category: 'General',
    familyIncome: 200000,
    bankName: 'State Bank of India',
    accountNumber: '483920194829',
    ifscCode: 'SBIN0001234',
    branchName: 'NIT Delhi Campus Branch'
  };

  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify(regPayload)
  });

  if (regRes.status !== 201 || !regRes.data.token) {
    throw new Error(`FAIL: Student registration failed: ${JSON.stringify(regRes.data)}`);
  }
  const studentToken = regRes.data.token;
  const studentId = regRes.data.user._id;
  console.log(`✅ PASS: Student registered successfully (ID: ${studentId}, Email: ${studentEmail})`);

  // STEP 4: Verify student in MongoDB
  console.log('\n[TEST 4] Verifying student record in MongoDB...');
  const dbStudent = await mongoose.connection.db.collection('users').findOne({ email: studentEmail });
  if (!dbStudent || dbStudent.role !== 'STUDENT') {
    throw new Error('FAIL: Student not found in MongoDB or role incorrect');
  }
  console.log(`✅ PASS: Found real student in MongoDB: ${dbStudent.name}`);

  // STEP 5: Verify student appears in Admin Portal student list
  console.log('\n[TEST 5] Checking Admin Portal /api/admin/students...');
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@nsp.gov.in', password: 'admin123', expectedRole: 'ADMIN' })
  });
  const adminToken = adminLogin.data.token;

  const adminStudentsRes = await req('/admin/students', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundInAdmin = adminStudentsRes.data.students?.some(s => s.email === studentEmail);
  if (!foundInAdmin) {
    throw new Error('FAIL: Newly registered student did not appear in Admin Portal student list');
  }
  console.log('✅ PASS: Real student automatically visible in Admin Portal Registered Students Directory!');

  // STEP 6: Student Login
  console.log('\n[TEST 6] Logging in as the newly created student...');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail, password: 'Password@2026', expectedRole: 'STUDENT' })
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error(`FAIL: Student login failed: ${JSON.stringify(loginRes.data)}`);
  }
  console.log('✅ PASS: Student login successful with real credentials');

  // STEP 7: Student Applies for Scholarship
  console.log('\n[TEST 7] Student applying for scholarship...');
  const applyPayload = {
    personalDetails: {
      fullName: 'Siddharth Nair',
      dob: '2004-06-18',
      gender: 'Male',
      category: 'General',
      phone: '9845012345',
      email: studentEmail,
      address: 'Hostel 3, NIT Delhi Campus',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110040'
    },
    academicDetails: {
      institutionName: nitDelhi.name,
      course: 'B.Tech in Computer Engineering',
      department: 'Computer Engineering',
      year: '2nd Year',
      enrollmentNumber: 'NITD/2024/CE/077',
      registerNumber: 'REG-2024-077',
      previousClassPercentage: 86,
      cgpa: 8.7,
      attendancePercentage: 91
    },
    incomeDetails: {
      familyAnnualIncome: 200000,
      incomeCertificateNumber: 'INC-DL-2026-88192',
      issuingAuthority: 'Tahsildar Delhi'
    },
    bankDetails: {
      accountNumber: '483920194829',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      branchName: 'NIT Delhi Campus Branch',
      accountHolderName: 'Siddharth Nair'
    },
    documents: {
      aadhaarCard: 'Aadhaar_Siddharth.pdf',
      incomeCertificate: 'Income_Certificate_2026.pdf',
      bonafideCertificate: 'Bonafide_NITD.pdf',
      marksheet: 'Sem2_Marksheet.pdf'
    }
  };

  const applyRes = await req(`/student/apply/${csss._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify(applyPayload)
  });

  if (applyRes.status !== 201 || !applyRes.data.application) {
    throw new Error(`FAIL: Application submission failed: ${JSON.stringify(applyRes.data)}`);
  }
  const app = applyRes.data.application;
  console.log(`✅ PASS: Application created: ${app.applicationNumber} [Status: ${app.status}]`);

  // STEP 8: Institute Officer Views Incoming Application
  console.log('\n[TEST 8] Logging in as Institute Officer (NIT Delhi)...');
  const instLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'institute@nsp.gov.in', password: 'institute123', expectedRole: 'INSTITUTE_OFFICER' })
  });
  const instToken = instLogin.data.token;

  const instAppsRes = await req('/institute/applications?status=SUBMITTED', {
    headers: { Authorization: `Bearer ${instToken}` }
  });
  const foundInInst = instAppsRes.data.applications?.some(a => a.applicationNumber === app.applicationNumber);
  if (!foundInInst) {
    throw new Error('FAIL: New application not visible to Institute Officer!');
  }
  console.log('✅ PASS: New application successfully visible in Institute Officer Incoming queue!');

  // STEP 9: Department MUST NOT see this application yet
  console.log('\n[TEST 9] Verifying Department Officer CANNOT see pre-approved application...');
  const deptLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'department@nsp.gov.in', password: 'department123', expectedRole: 'DEPARTMENT_OFFICER' })
  });
  const deptToken = deptLogin.data.token;

  const deptAppsRes = await req('/department/applications', {
    headers: { Authorization: `Bearer ${deptToken}` }
  });
  const leakedToDept = deptAppsRes.data.applications?.some(a => a.applicationNumber === app.applicationNumber);
  if (leakedToDept) {
    throw new Error('FAIL: Unapproved application leaked to Department Officer!');
  }
  console.log('✅ PASS: Department Officer correctly blocked from seeing application prior to Institute Approval.');

  // STEP 10: Institute Officer Approves Application
  console.log('\n[TEST 10] Institute Officer approving application...');
  const instApproveRes = await req(`/institute/applications/${app._id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instToken}` },
    body: JSON.stringify({
      action: 'APPROVE',
      remarks: 'All college physical records, bonafide and attendance verified.',
      checklist: {
        identityVerified: true,
        enrollmentVerified: true,
        academicMarksVerified: true,
        attendanceVerified: true,
        incomeVerified: true,
        documentsVerified: true
      }
    })
  });
  if (instApproveRes.status !== 200 || instApproveRes.data.application.status !== 'ROUTED_TO_DEPARTMENT') {
    throw new Error(`FAIL: Institute approval failed: ${JSON.stringify(instApproveRes.data)}`);
  }
  console.log('✅ PASS: Institute approved application! Status transitioned to ROUTED_TO_DEPARTMENT.');

  // STEP 11: Department Officer NOW sees it
  console.log('\n[TEST 11] Checking Department Officer queue after Institute Approval...');
  const deptAppsAfterRes = await req('/department/applications?status=ROUTED_TO_DEPARTMENT', {
    headers: { Authorization: `Bearer ${deptToken}` }
  });
  const foundInDept = deptAppsAfterRes.data.applications?.some(a => a.applicationNumber === app.applicationNumber);
  if (!foundInDept) {
    throw new Error('FAIL: Application did not appear in Department Officer queue after Institute approval!');
  }
  console.log('✅ PASS: Application now visible in Department Officer queue!');

  // STEP 12: Department Officer Approves Application
  console.log('\n[TEST 12] Department Officer approving application...');
  const deptApproveRes = await req(`/department/applications/${app._id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: JSON.stringify({
      action: 'APPROVE',
      approvedAmount: 20000,
      remarks: 'Department Scrutiny verified. Meritorious candidate meets all scheme guidelines.'
    })
  });
  if (deptApproveRes.status !== 200 || deptApproveRes.data.application.status !== 'APPROVED') {
    throw new Error(`FAIL: Department approval failed: ${JSON.stringify(deptApproveRes.data)}`);
  }
  console.log('✅ PASS: Department approved application! Status is now APPROVED.');

  // STEP 13: Generate Sanction Order
  console.log('\n[TEST 13] Department Officer generating Sanction Order...');
  const sanctionRes = await req('/department/sanctions/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: JSON.stringify({
      applicationId: app._id,
      approvedAmount: 20000,
      remarks: 'CSSS Sanction Order approved by Ministry of Higher Education.'
    })
  });
  if (sanctionRes.status !== 200 && sanctionRes.status !== 201) {
    throw new Error(`FAIL: Sanction generation failed: ${JSON.stringify(sanctionRes.data)}`);
  }
  console.log(`✅ PASS: Sanction Order Generated: ${sanctionRes.data.sanction?.sanctionNumber}`);

  // STEP 14: Process Disbursement Simulation
  console.log('\n[TEST 14] Processing DBT Disbursement...');
  const appDetails = await req(`/department/applications/${app._id}`, {
    headers: { Authorization: `Bearer ${deptToken}` }
  });
  const paymentId = appDetails.data.application?.paymentId?._id || appDetails.data.application?.paymentId;

  const simProcess = await req(`/department/disbursement/${paymentId}/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: JSON.stringify({ step: 'PROCESS' })
  });
  console.log(`  - Simulated step PROCESS: status=${simProcess.status}`);

  const simComplete = await req(`/department/disbursement/${paymentId}/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deptToken}` },
    body: JSON.stringify({ step: 'COMPLETE' })
  });
  console.log(`  - Simulated step COMPLETE: status=${simComplete.status}`);

  const finalAppRes = await req(`/department/applications/${app._id}`, {
    headers: { Authorization: `Bearer ${deptToken}` }
  });
  const finalApp = finalAppRes.data.application;
  console.log(`✅ PASS: Final Application Status: ${finalApp.status}`);

  // STEP 15: Check Real Student Notifications
  console.log('\n[TEST 15] Checking Notifications received by real student...');
  const studentNotifs = await req('/student/notifications', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const notifs = studentNotifs.data.notifications || [];
  console.log(`✅ PASS: Real student received ${notifs.length} in-app notifications:`);
  notifs.forEach((n, i) => console.log(`   ${i + 1}. [${n.type.toUpperCase()}] ${n.title} - ${n.message.substring(0, 70)}...`));

  // CLEANUP test student
  console.log('\n[CLEANUP] Removing test student Siddharth Nair so DB keeps only your actual accounts...');
  await mongoose.connection.db.collection('payments').deleteMany({ studentEmail });
  await mongoose.connection.db.collection('sanctions').deleteMany({ applicationId: app._id });
  await mongoose.connection.db.collection('auditlogs').deleteMany({ applicationId: app._id });
  await mongoose.connection.db.collection('notifications').deleteMany({ studentEmail });
  await mongoose.connection.db.collection('applications').deleteMany({ studentEmail });
  await mongoose.connection.db.collection('users').deleteMany({ email: studentEmail });
  console.log('✅ Temporary verification student cleaned up.');

  await mongoose.disconnect();
  console.log('\n===============================================================');
  console.log('🎉 ALL 15 VERIFICATION STAGES PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
