/**
 * End-to-end test for Department Portal:
 * dept approval --> sanction order generate ==> DBT disbursement queued for banking ==> Gateway Processing --> Disbursed (Completed)
 */
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Application = require('./models/Application');
const Sanction = require('./models/Sanction');
const Payment = require('./models/Payment');
const Scholarship = require('./models/Scholarship');
const Institution = require('./models/Institution');
const Department = require('./models/Department');

const JWT_SECRET = process.env.JWT_SECRET || 'national_scholarship_secret_key_2026_jwt';

async function runTest() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  console.log('=== VERIFYING DEPT APPROVAL -> SANCTION ORDER -> DBT DISBURSEMENT PIPELINE ===\n');

  // 1. Get Department Officer
  const deptOfficer = await User.findOne({ role: 'DEPARTMENT_OFFICER', email: 'department@nsp.gov.in' });
  if (!deptOfficer) {
    throw new Error('Department Officer not found');
  }
  const token = jwt.sign({ id: deptOfficer._id, role: deptOfficer.role }, JWT_SECRET, { expiresIn: '1d' });
  console.log('1. Department Officer authenticated:', deptOfficer.name, `(${deptOfficer.email})`);

  // 2. Find a student and scholarship to create a test application in ROUTED_TO_DEPARTMENT status
  const student = await User.findOne({ role: 'STUDENT' });
  const scholarship = await Scholarship.findOne();
  const institution = await Institution.findOne();
  const department = await Department.findOne();

  const randCode = Math.floor(100000 + Math.random() * 900000);
  const testAppNumber = `APP-TEST-${randCode}`;

  const testApp = await Application.create({
    applicationNumber: testAppNumber,
    studentId: student._id,
    studentName: student.name || 'Test Student',
    studentEmail: student.email || 'student@test.gov.in',
    studentPhone: '9876543210',
    institutionId: institution?._id || null,
    institutionName: institution?.name || 'National Test Institute',
    departmentId: department?._id || null,
    departmentName: department?.name || 'Department of Higher Education',
    scholarshipId: scholarship?._id || new mongoose.Types.ObjectId(),
    scholarshipName: scholarship?.name || 'National Merit Scheme',
    requestedAmount: 50000,
    approvedAmount: 0,
    status: 'ROUTED_TO_DEPARTMENT',
    personalDetails: {
      fullName: student.name || 'Test Student',
      dob: '2002-05-15',
      gender: 'Male',
      email: student.email || 'student@test.gov.in',
      phone: '9876543210',
      category: 'General',
      address: '123 Test St',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    academicDetails: {
      institutionName: institution?.name || 'National Test Institute',
      course: 'B.Tech Computer Science',
      department: 'Engineering',
      year: '3rd Year',
      enrollmentNumber: 'ENR-998877',
      previousClassPercentage: 88,
      cgpa: 8.8,
      attendancePercentage: 92
    },
    incomeDetails: {
      familyAnnualIncome: 200000,
      incomeCertificateNumber: 'INC-2026-9988'
    },
    bankDetails: {
      accountHolderName: student.name || 'Test Student',
      bankName: 'State Bank of India',
      accountNumber: '112233445566',
      ifscCode: 'SBIN0001234',
      branchName: 'Main Branch'
    }
  });

  console.log(`2. Created test application in ROUTED_TO_DEPARTMENT stage: ${testApp.applicationNumber}`);

  // 3. Simulate calling verifyDepartmentApplication (Department Officer Approves)
  const reqMock = {
    params: { id: testApp._id.toString() },
    body: {
      action: 'APPROVE',
      approvedAmount: 50000,
      remarks: 'Scrutinized and approved by State Welfare Officer. Quota & eligibility verified.',
      checklist: { eligibilityMet: true, budgetAvailable: true, quotaVerified: true, bankDetailsValid: true }
    },
    user: deptOfficer
  };

  let responseData = null;
  let statusCode = null;
  const resMock = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
          return data;
        }
      };
    }
  };

  const { verifyDepartmentApplication, simulateDisbursement, getDisbursements } = require('./controllers/departmentController');
  await verifyDepartmentApplication(reqMock, resMock);

  console.log(`3. Dept Officer executed APPROVE action. Response status: ${statusCode}`);
  if (statusCode !== 200 || !responseData.success) {
    throw new Error(`Approval failed: ${JSON.stringify(responseData)}`);
  }

  // Verify Sanction Order was created
  const sanction = await Sanction.findOne({ applicationId: testApp._id });
  if (!sanction) {
    throw new Error('FAILED: Sanction record was NOT created after Dept Approval!');
  }
  console.log(`   ✅ Sanction Order created: ${sanction.sanctionNumber} for ₹${sanction.approvedAmount}`);

  // Verify Payment record was created in PAYMENT_PENDING ("Queued for Banking")
  const payment = await Payment.findOne({ applicationId: testApp._id });
  if (!payment) {
    throw new Error('FAILED: Payment record was NOT created after Dept Approval!');
  }
  if (payment.status !== 'PAYMENT_PENDING') {
    throw new Error(`FAILED: Expected Payment status PAYMENT_PENDING, got ${payment.status}`);
  }
  console.log(`   ✅ DBT Banking record created: ${payment.paymentReference} (Status: ${payment.status})`);

  // Verify Application record updated
  const updatedApp = await Application.findById(testApp._id);
  if (updatedApp.status !== 'SANCTIONED') {
    throw new Error(`FAILED: Expected application status SANCTIONED, got ${updatedApp.status}`);
  }
  if (String(updatedApp.sanctionId) !== String(sanction._id)) {
    throw new Error('FAILED: Application sanctionId does not match sanction record');
  }
  if (String(updatedApp.paymentId) !== String(payment._id)) {
    throw new Error('FAILED: Application paymentId does not match payment record');
  }
  console.log(`   ✅ Application status transitioned to: ${updatedApp.status}`);

  // 4. Verify payment appears in DBT Disbursement Queue ("Queued for Banking")
  let listData = null;
  const resListMock = {
    status: (c) => ({
      json: (d) => { listData = d; return d; }
    })
  };
  await getDisbursements({ user: deptOfficer }, resListMock);
  const foundInQueue = listData.payments.find(p => String(p._id) === String(payment._id));
  if (!foundInQueue) {
    throw new Error('FAILED: Payment is not visible in DBT Disbursement list');
  }
  console.log(`4. DBT Disbursement Queue verified: Payment ${foundInQueue.paymentReference} is in stage: ${foundInQueue.status}`);

  // 5. Step: Dispatch to Gateway (Gateway Processing)
  const reqProcessMock = {
    params: { id: payment._id.toString() },
    body: { step: 'PROCESS' },
    user: deptOfficer
  };
  let processData = null;
  const resProcessMock = {
    status: (c) => ({
      json: (d) => { processData = d; return d; }
    })
  };
  await simulateDisbursement(reqProcessMock, resProcessMock);
  console.log(`5. Dispatched to Banking Gateway: Status -> ${processData.payment?.status}`);
  if (processData.payment?.status !== 'PAYMENT_PROCESSING') {
    throw new Error(`FAILED: Expected PAYMENT_PROCESSING, got ${processData.payment?.status}`);
  }

  // 6. Step: Execute DBT Credit (Disburse Completed)
  const reqCompleteMock = {
    params: { id: payment._id.toString() },
    body: { step: 'COMPLETE' },
    user: deptOfficer
  };
  let completeData = null;
  const resCompleteMock = {
    status: (c) => ({
      json: (d) => { completeData = d; return d; }
    })
  };
  await simulateDisbursement(reqCompleteMock, resCompleteMock);
  console.log(`6. Executed DBT Credit: Status -> ${completeData.payment?.status}, UTR -> ${completeData.payment?.utr}`);
  if (completeData.payment?.status !== 'DISBURSED') {
    throw new Error(`FAILED: Expected DISBURSED, got ${completeData.payment?.status}`);
  }

  // Final check on application
  const finalApp = await Application.findById(testApp._id);
  console.log(`7. Final Application Status: ${finalApp.status}`);
  if (finalApp.status !== 'DISBURSED') {
    throw new Error(`FAILED: Expected final application status DISBURSED, got ${finalApp.status}`);
  }

  // Cleanup test record
  await Application.deleteOne({ _id: testApp._id });
  await Sanction.deleteOne({ _id: sanction._id });
  await Payment.deleteOne({ _id: payment._id });
  console.log('8. Test records cleaned up.');

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED: COMPLETE PIPELINE IS WORKING 100%!');
  console.log('Dept Approval --> Sanction Order Generate ==> DBT Disbursement Queued ==> Gateway Processing --> Disbursed');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
