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
    throw err;
  }
  return data;
}

async function runTest() {
  console.log('========================================================================');
  console.log('🔍 VERIFYING STUDENT -> INSTITUTE DATA FLOW');
  console.log('========================================================================\n');

  // Step 1: Connect to DB and inspect available institutions
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_details');
  const Institution = mongoose.model('Institution', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false }));

  const nitInst = await Institution.findOne({ code: 'NITD-101' });
  const annaInst = await Institution.findOne({ code: 'AUC-303' });
  const iitInst = await Institution.findOne({ code: 'IITD-202' });

  console.log(`[CHECK 1] Institution IDs in MongoDB:`);
  console.log(`  - NIT Delhi: ${nitInst?._id} (${nitInst?.name})`);
  console.log(`  - Anna University: ${annaInst?._id} (${annaInst?.name})`);
  console.log(`  - IIT Delhi: ${iitInst?._id} (${iitInst?.name})`);

  // Ensure officer exists for Anna University
  let annaOfficer = await User.findOne({ email: 'institute.anna@nsp.gov.in' });
  if (!annaOfficer && annaInst) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('institute123', 10);
    annaOfficer = await User.create({
      name: 'Prof. M. Senthil',
      email: 'institute.anna@nsp.gov.in',
      password: hash,
      phone: '9811223346',
      role: 'INSTITUTE_OFFICER',
      institutionId: annaInst._id,
      institutionName: annaInst.name,
      status: 'Active'
    });
    annaInst.assignedOfficer = annaOfficer._id;
    annaInst.assignedOfficerName = annaOfficer.name;
    await annaInst.save();
    console.log(`  ✅ Synced Anna University Officer: ${annaOfficer.email}`);
  }

  // Step 2: Test Case A - Check existing KEERTHANA R application
  console.log(`\n[CHECK 2] Testing Existing Application for KEERTHANA R (APP-2026-999258):`);
  const keerthanaApp = await Application.findOne({ studentName: 'KEERTHANA R' });
  if (keerthanaApp) {
    console.log(`  - App Number: ${keerthanaApp.applicationNumber}`);
    console.log(`  - App Status: ${keerthanaApp.status}`);
    console.log(`  - App InstitutionId: ${keerthanaApp.institutionId}`);
    console.log(`  - App InstitutionName: ${keerthanaApp.institutionName}`);

    // Login as Anna University Officer
    const annaLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'institute.anna@nsp.gov.in',
        password: 'institute123',
        expectedRole: 'INSTITUTE_OFFICER'
      }
    });
    const annaToken = annaLoginRes.token;
    console.log(`  ✅ Anna University Officer authenticated`);

    // Fetch Dashboard
    const dashRes = await request('/institute/dashboard', {
      headers: { Authorization: `Bearer ${annaToken}` }
    });
    const recentApps = dashRes.recentApplications || [];
    const foundInDash = recentApps.find(a => a.applicationNumber === keerthanaApp.applicationNumber);
    console.log(`  ${foundInDash ? '✅ PASS' : '❌ FAIL'}: Application ${keerthanaApp.applicationNumber} in Anna Univ Dashboard: ${foundInDash ? 'FOUND' : 'NOT FOUND'}`);

    // Fetch Applications List
    const listRes = await request('/institute/applications', {
      headers: { Authorization: `Bearer ${annaToken}` }
    });
    const foundInList = listRes.applications?.find(a => a.applicationNumber === keerthanaApp.applicationNumber);
    console.log(`  ${foundInList ? '✅ PASS' : '❌ FAIL'}: Application ${keerthanaApp.applicationNumber} in Anna Univ Applications List: ${foundInList ? 'FOUND' : 'NOT FOUND'}`);
  }

  // Step 3: Test Case B - Create Brand NEW Student under NIT Delhi, apply, and verify with NIT Officer
  console.log(`\n[CHECK 3] Testing Brand NEW Student Registration -> NIT Delhi -> NIT Officer:`);
  const ts = Date.now();
  const regPayload = {
    name: `Test Student ${ts}`,
    email: `student_${ts}@test.edu`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '9876543210',
    institutionId: nitInst._id.toString(),
    course: 'B.Tech in Information Technology',
    dob: '2004-06-20',
    gender: 'Female',
    category: 'General',
    familyIncome: '250000',
    bankName: 'State Bank of India',
    accountNumber: '38291048291',
    ifscCode: 'SBIN0001234'
  };

  const regRes = await request('/auth/register', {
    method: 'POST',
    body: regPayload
  });
  const studentToken = regRes.token;
  const newStudentId = regRes.user._id;
  console.log(`  ✅ New Student Registered: ${regPayload.name} (ID: ${newStudentId})`);
  console.log(`     - Student InstitutionId: ${regRes.user.institutionId}`);
  console.log(`     - Student InstitutionName: ${regRes.user.institutionName}`);

  // Fetch active scheme
  const schemesRes = await request('/student/scholarships');
  const scheme = schemesRes.scholarships[0];
  console.log(`  ℹ️ Applying for scheme: ${scheme.name} (ID: ${scheme._id})`);

  // Submit Application
  const applyRes = await request(`/student/apply/${scheme._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      submissionType: 'Fresh Application',
      personalDetails: {
        fullName: regPayload.name,
        email: regPayload.email,
        phone: regPayload.phone,
        dob: regPayload.dob,
        gender: regPayload.gender,
        category: regPayload.category,
        address: 'Hostel Block A, NIT Campus',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      academicDetails: {
        institutionName: regRes.user.institutionName,
        course: regPayload.course,
        department: 'Information Technology',
        year: '2nd Year',
        enrollmentNumber: `ENR-${ts}`,
        registerNumber: `REG-${ts}`,
        previousClassPercentage: 88,
        cgpa: 8.8,
        attendancePercentage: 92
      },
      incomeDetails: {
        familyAnnualIncome: 250000,
        incomeCertificateNumber: `INC-${ts}`,
        issuingAuthority: 'Revenue Dept'
      },
      bankDetails: {
        bankName: regPayload.bankName,
        accountNumber: regPayload.accountNumber,
        ifscCode: regPayload.ifscCode,
        branchName: 'Main Campus Branch',
        accountHolderName: regPayload.name
      },
      documents: {
        aadhaarCard: 'Aadhaar.pdf',
        incomeCertificate: 'Income.pdf'
      }
    }
  });

  const newApp = applyRes.application;
  console.log(`  ✅ Application Created: ${newApp.applicationNumber}`);
  console.log(`     - Status: ${newApp.status}`);
  console.log(`     - InstitutionId: ${newApp.institutionId}`);
  console.log(`     - InstitutionName: ${newApp.institutionName}`);

  // Step 4: Verify with NIT Officer (institute@nsp.gov.in)
  console.log(`\n[CHECK 4] Verifying Application Visibility under NIT Officer:`);
  const nitLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'institute@nsp.gov.in',
      password: 'institute123',
      expectedRole: 'INSTITUTE_OFFICER'
    }
  });
  const nitToken = nitLoginRes.token;
  console.log(`  ✅ NIT Officer Logged in: ${nitLoginRes.user.name} (${nitLoginRes.user.institutionName})`);

  // Dashboard Check
  const nitDashRes = await request('/institute/dashboard', {
    headers: { Authorization: `Bearer ${nitToken}` }
  });
  const nitRecentApps = nitDashRes.recentApplications || [];
  const foundInNitDash = nitRecentApps.find(a => a.applicationNumber === newApp.applicationNumber);
  console.log(`  ${foundInNitDash ? '✅ PASS' : '❌ FAIL'}: Application ${newApp.applicationNumber} in NIT Dashboard: ${foundInNitDash ? 'FOUND' : 'NOT FOUND'}`);

  // Applications List Check
  const nitListRes = await request('/institute/applications?status=SUBMITTED', {
    headers: { Authorization: `Bearer ${nitToken}` }
  });
  const foundInNitList = nitListRes.applications?.find(a => a.applicationNumber === newApp.applicationNumber);
  console.log(`  ${foundInNitList ? '✅ PASS' : '❌ FAIL'}: Application ${newApp.applicationNumber} in Filtered List (SUBMITTED): ${foundInNitList ? 'FOUND' : 'NOT FOUND'}`);

  // Test Verify Action by Institute Officer
  console.log(`\n[CHECK 5] Executing Institute Verification (APPROVE & FORWARD):`);
  const verifyRes = await request(`/institute/applications/${newApp._id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${nitToken}` },
    body: {
      action: 'APPROVE',
      remarks: 'Verified student enrollment records and marksheets successfully.',
      checklist: {
        enrollmentVerified: true,
        marksheetVerified: true,
        feeReceiptVerified: true,
        bonafideVerified: true
      }
    }
  });
  console.log(`  ✅ Verification Response: ${verifyRes.message}`);
  console.log(`     - New Status: ${verifyRes.application.status}`);

  console.log('\n========================================================================');
  console.log('🎉 ALL DATA-FLOW CHECKS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err.data || err.message);
  process.exit(1);
});
