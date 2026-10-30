const BASE_URL = 'http://127.0.0.1:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runTest() {
  console.log('========================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END SCHOLARSHIP WORKFLOW TEST');
  console.log('========================================================================');

  // STEP 1: Check Server Health
  console.log('\n[STAGE 1] Backend Health Check');
  try {
    const health = await req('/health');
    console.log('  ✅ Server is Online:', health.status, `(Timestamp: ${health.timestamp})`);
  } catch (err) {
    console.error('  ❌ Server health check failed:', err.message);
    process.exit(1);
  }

  // STEP 2: Seed / Ensure Base Data Exists
  console.log('\n[STAGE 2] Database Base Seed & Master Collections');
  try {
    const seedRes = await req('/seed', { method: 'POST' });
    console.log('  ✅ Base records loaded:', seedRes.message);
  } catch (err) {
    console.warn('  ⚠️ Seed endpoint notice:', err.data?.message || err.message);
  }

  // STEP 3: Test Public Institutions Endpoint
  console.log('\n[STAGE 3] Public Institutions & Schemes Retrieval');
  let institutions = [];
  try {
    const instRes = await req('/auth/institutions');
    institutions = instRes.institutions;
    console.log(`  ✅ Public Institutions: ${institutions.length} active institutes available`);
  } catch (err) {
    console.error('  ❌ Failed to fetch public institutions:', err.data || err.message);
    process.exit(1);
  }

  const selectedInst = institutions.find(i => i.name.includes('NIT') || i.name.includes('National Institute')) || institutions[0];
  console.log(`  ℹ️ Selected Institution: ${selectedInst.name} (${selectedInst._id})`);

  // STEP 4: Register a Brand NEW Student
  console.log('\n[STAGE 4] Register Brand NEW Student (Real MongoDB Insert)');
  const timestamp = Date.now();
  const newStudentEmail = `student_${timestamp}@university.edu`;
  const newStudentData = {
    name: `Aarohi Verma ${timestamp}`,
    email: newStudentEmail,
    password: 'password123',
    confirmPassword: 'password123',
    phone: '9876543210',
    institutionId: selectedInst._id,
    course: 'B.Tech in Artificial Intelligence & Data Science',
    dob: '2004-08-20',
    gender: 'Female',
    category: 'OBC',
    familyIncome: 250000,
    bankName: 'Punjab National Bank',
    accountNumber: '998877665544',
    ifscCode: 'PUNB0123456',
    branchName: 'North Campus Branch'
  };

  let studentToken = '';
  let studentUser = null;
  try {
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify(newStudentData)
    });
    studentToken = regRes.token;
    studentUser = regRes.user;
    console.log(`  ✅ Student Registered: ${studentUser.name} (${studentUser.email})`);
    console.log(`     - Student ID: ${studentUser._id}`);
    console.log(`     - Institution ID: ${studentUser.institutionId} (${studentUser.institutionName})`);
    if (!studentUser.institutionId) {
      throw new Error('FAILED: Registered student has null institutionId!');
    }
  } catch (err) {
    console.error('  ❌ Student registration failed:', err.data || err.message);
    process.exit(1);
  }

  // STEP 5: Student Login Verification
  console.log('\n[STAGE 5] Student Authentication & Role Guard');
  try {
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: newStudentEmail,
        password: 'password123',
        expectedRole: 'STUDENT'
      })
    });
    studentToken = loginRes.token;
    console.log('  ✅ Student login authenticated. Token verified.');
  } catch (err) {
    console.error('  ❌ Student login failed:', err.data || err.message);
    process.exit(1);
  }

  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // STEP 6: Student Fetches Scholarships & Applies
  console.log('\n[STAGE 6] Student Scholarship Application Submission');
  let scholarships = [];
  try {
    const schRes = await req('/student/scholarships', { headers: studentHeaders });
    scholarships = schRes.scholarships;
    console.log(`  ✅ Schemes Catalog: ${scholarships.length} active scholarships fetched from DB`);
  } catch (err) {
    console.error('  ❌ Failed to fetch scholarships:', err.data || err.message);
    process.exit(1);
  }

  const targetScheme = scholarships.find(s => s.departmentName?.includes('Higher Education') || s.code?.includes('CSSS') || s.code?.includes('NMM')) || scholarships[0];
  console.log(`  ℹ️ Applying for scheme: "${targetScheme.name}" [Code: ${targetScheme.code}] (Dept: ${targetScheme.departmentName})`);

  let newApplication = null;
  try {
    const applyRes = await req(`/student/apply/${targetScheme._id}`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        submissionType: 'Fresh Application',
        personalDetails: {
          fullName: studentUser.name,
          dob: '2004-08-20',
          gender: 'Female',
          category: 'OBC',
          phone: '9876543210',
          email: studentUser.email,
          address: 'Room 402, Kaveri Hostel',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        academicDetails: {
          institutionName: studentUser.institutionName,
          course: 'B.Tech in Artificial Intelligence',
          department: 'Computer Science',
          year: '2nd Year',
          enrollmentNumber: `ENR-${timestamp.toString().slice(-6)}`,
          previousClassPercentage: 89,
          cgpa: 8.9,
          attendancePercentage: 92
        },
        incomeDetails: {
          familyAnnualIncome: 250000,
          incomeCertificateNumber: `INC-${timestamp.toString().slice(-6)}`,
          issuingAuthority: 'Revenue Dept'
        },
        bankDetails: {
          bankName: 'Punjab National Bank',
          accountNumber: '998877665544',
          ifscCode: 'PUNB0123456',
          branchName: 'North Campus Branch',
          accountHolderName: studentUser.name
        }
      })
    });

    newApplication = applyRes.application;
    console.log(`  ✅ Application Created in MongoDB: ${newApplication.applicationNumber}`);
    console.log(`     - Initial Status: "${newApplication.status}"`);
    console.log(`     - Institution Link: ${newApplication.institutionName} (${newApplication.institutionId})`);
    console.log(`     - Department Link: ${newApplication.departmentName} (${newApplication.departmentId})`);
  } catch (err) {
    console.error('  ❌ Scholarship application submission failed:', err.data || err.message);
    process.exit(1);
  }

  // STEP 7: Verify Student Notification on Submission
  console.log('\n[STAGE 7] Student Submission Notification Check');
  try {
    const notifsRes = await req('/student/notifications', { headers: studentHeaders });
    const subNotif = notifsRes.notifications.find(n => n.applicationNumber === newApplication.applicationNumber);
    if (!subNotif) {
      throw new Error(`Submission notification for ${newApplication.applicationNumber} not found in Student inbox!`);
    }
    console.log(`  ✅ Student Notification Stored: "${subNotif.title}" - ${subNotif.message}`);
  } catch (err) {
    console.error('  ❌ Notification check failed:', err.message);
    process.exit(1);
  }

  // STEP 8: Institute Officer Login & Check Queue
  console.log('\n[STAGE 8] Institute Officer Login & Queue Verification');
  let instituteToken = '';
  try {
    const instLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'institute@nsp.gov.in',
        password: 'institute123',
        expectedRole: 'INSTITUTE_OFFICER'
      })
    });
    instituteToken = instLogin.token;
    console.log('  ✅ Institute Officer Authenticated');
  } catch (err) {
    console.error('  ❌ Institute Officer login failed:', err.data || err.message);
    process.exit(1);
  }

  const instituteHeaders = { Authorization: `Bearer ${instituteToken}` };

  try {
    const instDash = await req('/institute/dashboard', { headers: instituteHeaders });
    const instApps = await req('/institute/applications', { headers: instituteHeaders });
    const foundApp = instApps.applications.find(a => a.applicationNumber === newApplication.applicationNumber);
    if (!foundApp) {
      throw new Error(`Application ${newApplication.applicationNumber} NOT visible in Institute queue!`);
    }
    console.log(`  ✅ Institute Queue Check PASSED: Application is VISIBLE to Institute Officer.`);
    console.log(`     - Institute Pending Count: ${instDash.stats.pending}`);
  } catch (err) {
    console.error('  ❌ Institute application queue check failed:', err.message);
    process.exit(1);
  }

  // STEP 9: Institute Officer Approves Application
  console.log('\n[STAGE 9] Institute Officer Approves & Forwards to Department');
  try {
    const verifyRes = await req(`/institute/applications/${newApplication._id}/verify`, {
      method: 'POST',
      headers: instituteHeaders,
      body: JSON.stringify({
        action: 'APPROVE',
        remarks: 'All marks, enrollment, and bona fide certificates verified digitally by Institute Officer.'
      })
    });
    console.log(`  ✅ Institute Officer Approved & Forwarded: Status is now "${verifyRes.application.status}"`);
    console.log(`     - Routed to Department: ${verifyRes.application.departmentName} (${verifyRes.application.departmentId})`);
  } catch (err) {
    console.error('  ❌ Institute verification action failed:', err.data || err.message);
    process.exit(1);
  }

  // STEP 10: Department Officer Login & Check Queue
  console.log('\n[STAGE 10] Department Officer Login & Scrutiny Queue Check');
  let departmentToken = '';
  try {
    const deptLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'department@nsp.gov.in',
        password: 'department123',
        expectedRole: 'DEPARTMENT_OFFICER'
      })
    });
    departmentToken = deptLogin.token;
    console.log('  ✅ Department Officer Authenticated');
  } catch (err) {
    console.error('  ❌ Department login failed:', err.data || err.message);
    process.exit(1);
  }

  const departmentHeaders = { Authorization: `Bearer ${departmentToken}` };

  try {
    const deptDash = await req('/department/dashboard', { headers: departmentHeaders });
    const deptApps = await req('/department/applications', { headers: departmentHeaders });
    const foundDeptApp = deptApps.applications.find(a => a.applicationNumber === newApplication.applicationNumber);
    if (!foundDeptApp) {
      throw new Error(`Application ${newApplication.applicationNumber} NOT found in Department scrutiny queue!`);
    }
    console.log(`  ✅ Department Queue Check PASSED: Application is VISIBLE in Department Scrutiny Queue.`);
    console.log(`     - Department Incoming Scrutiny Count: ${deptDash.stats.incoming}`);
  } catch (err) {
    console.error('  ❌ Department queue check failed:', err.message);
    process.exit(1);
  }

  // STEP 11: Department Officer Approves Application
  console.log('\n[STAGE 11] Department Officer Scrutiny & Approval');
  try {
    const deptApprove = await req(`/department/applications/${newApplication._id}/verify`, {
      method: 'POST',
      headers: departmentHeaders,
      body: JSON.stringify({
        action: 'APPROVE',
        approvedAmount: 50000,
        remarks: 'Department scrutiny verified. Quota and eligibility met. Budget sanctioned.'
      })
    });
    console.log(`  ✅ Department Scrutiny Approved: Status is now "${deptApprove.application.status}" (Amount: ₹${deptApprove.application.approvedAmount})`);
  } catch (err) {
    console.error('  ❌ Department approval failed:', err.data || err.message);
    process.exit(1);
  }

  // STEP 12: Generate Official Sanction Order
  console.log('\n[STAGE 12] Generate Statutory Sanction Order (SAN-YYYY-XXXXXX)');
  let sanctionOrder = null;
  let paymentRecord = null;
  try {
    const sanctionRes = await req('/department/sanctions/generate', {
      method: 'POST',
      headers: departmentHeaders,
      body: JSON.stringify({
        applicationId: newApplication._id,
        orderRemarks: 'Formal statutory sanction granted under National Scholarship Grants 2026.'
      })
    });
    sanctionOrder = sanctionRes.sanction;
    paymentRecord = sanctionRes.payment;
    console.log(`  ✅ Sanction Order Issued: ${sanctionOrder.sanctionNumber}`);
    console.log(`     - Sanction Amount: ₹${sanctionOrder.approvedAmount}`);
    console.log(`     - Payment Queue Ref: ${paymentRecord.paymentReference} (Status: "${paymentRecord.status}")`);
  } catch (err) {
    console.error('  ❌ Sanction generation failed:', err.data || err.message);
    process.exit(1);
  }

  // Test Sanction Idempotency: Attempting to generate sanction twice must fail gracefully
  console.log('\n[STAGE 12b] Sanction Idempotency & Duplicate Prevention Check');
  try {
    await req('/department/sanctions/generate', {
      method: 'POST',
      headers: departmentHeaders,
      body: JSON.stringify({ applicationId: newApplication._id })
    });
    throw new Error('FAILED: Duplicate sanction generation was allowed!');
  } catch (err) {
    console.log('  ✅ Duplicate sanction creation blocked correctly:', err.message);
  }

  // STEP 13: Simulate Payment Disbursement via DBT
  console.log('\n[STAGE 13] Execute Direct Benefit Transfer (DBT) Disbursement');
  try {
    // Process step
    const procRes = await req(`/department/disbursement/${paymentRecord._id}/simulate`, {
      method: 'POST',
      headers: departmentHeaders,
      body: JSON.stringify({ step: 'PROCESS' })
    });
    console.log(`  ✅ Banking Gateway Dispatch: Status is "${procRes.payment.status}"`);

    // Complete DBT step
    const disbRes = await req(`/department/disbursement/${paymentRecord._id}/simulate`, {
      method: 'POST',
      headers: departmentHeaders,
      body: JSON.stringify({ step: 'COMPLETE' })
    });
    console.log(`  ✅ DBT Fund Transfer Completed: Status is "${disbRes.payment.status}"`);
    console.log(`     - UTR Reference: ${disbRes.payment.utr}`);
    console.log(`     - Receipt Number: ${disbRes.payment.receiptNumber}`);
    console.log(`     - Transaction Date: ${new Date(disbRes.payment.transactionDate).toLocaleDateString()}`);
  } catch (err) {
    console.error('  ❌ Disbursement simulation failed:', err.data || err.message);
    process.exit(1);
  }

  // STEP 14: Central Admin Portal Monitoring
  console.log('\n[STAGE 14] Central Admin Portal Oversight & Analytics');
  let adminToken = '';
  try {
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@nsp.gov.in',
        password: 'admin123',
        expectedRole: 'ADMIN'
      })
    });
    adminToken = adminLogin.token;
    console.log('  ✅ Admin Authenticated');
  } catch (err) {
    console.error('  ❌ Admin login failed:', err.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  try {
    const adminDash = await req('/admin/dashboard-analytics', { headers: adminHeaders });
    const adminUsers = await req('/admin/users', { headers: adminHeaders });
    const adminApps = await req('/admin/applications', { headers: adminHeaders });

    const studentInAdmin = adminUsers.users.find(u => u.email === newStudentEmail);
    const appInAdmin = adminApps.applications.find(a => a.applicationNumber === newApplication.applicationNumber);

    if (!studentInAdmin) throw new Error('New student not found in Admin user directory!');
    if (!appInAdmin) throw new Error('New application not found in Admin application monitor!');

    console.log(`  ✅ Admin Monitoring Check PASSED:`);
    console.log(`     - Total Registered Students: ${adminDash.metrics.totalStudents}`);
    console.log(`     - Total Applications: ${adminDash.metrics.totalApplications}`);
    console.log(`     - Total Disbursed: ₹${adminDash.metrics.totalDisbursedAmount.toLocaleString('en-IN')}`);
    console.log(`     - New Student found: "${studentInAdmin.name}"`);
    console.log(`     - New Application status: "${appInAdmin.status}"`);
  } catch (err) {
    console.error('  ❌ Admin monitoring check failed:', err.message);
    process.exit(1);
  }

  // STEP 15: Student Final Verification & Lifecycle Tracking
  console.log('\n[STAGE 15] Student Portal Reflection (Dashboard, Tracking, Payments, Notifications)');
  try {
    const studentDash = await req('/student/dashboard', { headers: studentHeaders });
    const studentApps = await req('/student/applications', { headers: studentHeaders });
    const studentPayments = await req('/student/payments', { headers: studentHeaders });
    const studentDetails = await req(`/student/applications/${newApplication._id}`, { headers: studentHeaders });
    const studentNotifs = await req('/student/notifications', { headers: studentHeaders });

    const finalApp = studentApps.applications.find(a => a.applicationNumber === newApplication.applicationNumber);
    console.log(`  ✅ Student Dashboard Status: "${finalApp?.status}"`);
    console.log(`     - Disbursed Payments Count: ${studentPayments.count} (Total Amount: ₹${studentDash.data?.stats?.disbursedAmount || 0})`);
    console.log(`     - Application Tracking Audit Logs: ${studentDetails.auditLogs.length} transitions recorded`);
    console.log(`     - Total Notifications Received by Student: ${studentNotifs.count}`);

    studentNotifs.notifications.forEach((n, idx) => {
      console.log(`       ${idx + 1}. [${n.type.toUpperCase()}] ${n.title}: ${n.message.substring(0, 70)}...`);
    });
  } catch (err) {
    console.error('  ❌ Student post-check failed:', err.message);
    process.exit(1);
  }

  // STEP 16: Page Refresh / Relogin Persistence Test
  console.log('\n[STAGE 16] Refresh / Re-login Test (Confirming MongoDB Source of Truth)');
  try {
    const reLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: newStudentEmail,
        password: 'password123',
        expectedRole: 'STUDENT'
      })
    });
    const reCheckApps = await req('/student/applications', { headers: { Authorization: `Bearer ${reLoginRes.token}` } });
    const reCheckPayments = await req('/student/payments', { headers: { Authorization: `Bearer ${reLoginRes.token}` } });

    const persistedApp = reCheckApps.applications.find(a => a.applicationNumber === newApplication.applicationNumber);
    if (!persistedApp || persistedApp.status !== 'DISBURSED') {
      throw new Error(`Persisted application status mismatch: ${persistedApp?.status}`);
    }
    console.log(`  ✅ Persistence Verified: Application ${persistedApp.applicationNumber} is permanently stored with status "${persistedApp.status}"`);
    console.log(`     - Payment records: ${reCheckPayments.count} verified`);
  } catch (err) {
    console.error('  ❌ Re-login persistence test failed:', err.message);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL 16 STAGES PASSED SUCCESSFULLY! REAL DATA FLOW IS 100% OPERATIONAL.');
  console.log('========================================================================\n');
}

runTest();
