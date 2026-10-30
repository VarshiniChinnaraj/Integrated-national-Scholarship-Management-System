const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
process.env.NODE_ENV = 'test';

const User = require('./models/User');
const Application = require('./models/Application');
const Sanction = require('./models/Sanction');
const Scholarship = require('./models/Scholarship');
const Department = require('./models/Department');
const EmailLog = require('./models/EmailLog');
const { generateSanctionOrderPdf } = require('./services/pdfService');
const { sendSanctionApprovedEmail, retrySanctionApprovedEmail } = require('./services/emailService');

const runTest = async () => {
  console.log('====================================================');
  console.log(' SANCTION ORDER EMAIL WORKFLOW VERIFICATION TEST');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/national_scholarship_db');
  console.log(' Connected to MongoDB database successfully.');

  let passedTests = 0;
  const totalTests = 11;

  try {
    // 1. Prepare Department Officer, Scheme & Test Applicant
    console.log('\n[TEST 1] Department Officer approval state preparation...');
    let deptOfficer = await User.findOne({ role: 'DEPARTMENT_OFFICER' });
    if (!deptOfficer) {
      throw new Error('No department officer found in database.');
    }

    let scholarship = await Scholarship.findOne();
    if (!scholarship) {
      throw new Error('No scholarship scheme found in database.');
    }

    const testAppNumber = `APP-EMAIL-TEST-${Date.now().toString().slice(-6)}`;
    const studentEmail = 'student.applicant.test@example.com';
    const studentName = 'Priya Sharma';

    // Create or find student
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        name: studentName,
        email: studentEmail,
        password: 'Password@123',
        role: 'STUDENT',
        phone: '9876543210'
      });
    }

    // Create test application in APPROVED state (ready for Sanction generation)
    const testApp = await Application.create({
      applicationNumber: testAppNumber,
      studentId: student._id,
      studentName,
      studentEmail,
      studentPhone: '9876543210',
      scholarshipId: scholarship._id,
      scholarshipName: scholarship.name,
      institutionName: 'National Institute of Technology (NIT Delhi)',
      requestedAmount: 50000,
      approvedAmount: 50000,
      status: 'APPROVED',
      departmentId: deptOfficer.departmentId,
      departmentName: deptOfficer.departmentName || 'Department of Higher Education',
      personalDetails: { fullName: studentName, email: studentEmail, phone: '9876543210', dob: '2004-05-15', gender: 'Female' },
      academicDetails: { institutionName: 'NIT Delhi', course: 'B.Tech CSE', department: 'CSE', year: '2nd Year', enrollmentNumber: 'NITD2024CS01', previousClassPercentage: 88 },
      incomeDetails: { familyAnnualIncome: 200000, incomeCertificateNumber: 'INC-2026-991' },
      bankDetails: { accountNumber: '998877665544', ifscCode: 'SBIN0001234', bankName: 'State Bank of India', branchName: 'Main Branch', accountHolderName: studentName }
    });
    console.log(`  ✅ Department Officer approved application: ${testApp.applicationNumber}`);
    passedTests++;

    // 2. Generate Unique Sanction Number
    console.log('\n[TEST 2] Sanction record & unique sanction number generation...');
    const currentYear = new Date().getFullYear();
    const sanctionNumber = `SAN-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

    const sanction = await Sanction.create({
      sanctionNumber,
      applicationId: testApp._id,
      applicationNumber: testApp.applicationNumber,
      studentId: testApp.studentId,
      studentName: testApp.studentName,
      scholarshipId: testApp.scholarshipId,
      scholarshipName: testApp.scholarshipName,
      departmentId: testApp.departmentId,
      departmentName: testApp.departmentName,
      institutionName: testApp.institutionName,
      approvedAmount: testApp.approvedAmount,
      approvalDate: new Date(),
      officerId: deptOfficer._id,
      officerName: deptOfficer.name,
      status: 'SANCTIONED',
      sanctionOrderText: 'Statutory financial sanction order issued for National Merit Scholarship Scheme AY 2025-2026.'
    });

    testApp.status = 'SANCTIONED';
    testApp.sanctionId = sanction._id;
    testApp.sanctionNumber = sanction.sanctionNumber;
    await testApp.save();

    console.log(`  ✅ Sanction created: ${sanction.sanctionNumber}`);
    passedTests++;

    // 3. Generate Sanction Order PDF
    console.log('\n[TEST 3] Sanction Order PDF generation via pdfService...');
    const pdfPath = await generateSanctionOrderPdf(sanction);
    console.log(`  ✅ Sanction Order PDF generated at: ${pdfPath}`);
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Sanction PDF does not exist at ${pdfPath}`);
    }
    const fileSize = fs.statSync(pdfPath).size;
    console.log(`     File size: ${fileSize} bytes`);
    if (fileSize < 500) {
      throw new Error('Generated PDF is unexpectedly too small');
    }
    passedTests++;

    // 4. Retrieve Student registered email
    console.log('\n[TEST 4] Student email retrieval and validation...');
    const recipientEmail = testApp.studentEmail;
    console.log(`  ✅ Student registered email retrieved: ${recipientEmail}`);
    if (!recipientEmail || !recipientEmail.includes('@')) {
      throw new Error('Invalid student recipient email');
    }
    passedTests++;

    // 5. Send automated email via Nodemailer
    console.log('\n[TEST 5] Send automated email with Nodemailer...');
    const emailResult = await sendSanctionApprovedEmail({
      studentName: testApp.studentName,
      studentEmail: recipientEmail,
      applicationNumber: testApp.applicationNumber,
      scholarshipName: testApp.scholarshipName,
      institutionName: testApp.institutionName,
      sanctionNumber: sanction.sanctionNumber,
      sanctionDate: sanction.approvalDate,
      sanctionedAmount: sanction.approvedAmount,
      sanctioningOfficer: sanction.officerName,
      pdfPath,
      applicationId: testApp._id,
      studentId: testApp.studentId,
      sanctionId: sanction._id
    });

    console.log(`  ✅ Email send outcome: success = ${emailResult.success}`);
    if (!emailResult.success) {
      throw new Error(`Email dispatch failed: ${emailResult.error}`);
    }
    passedTests++;

    // 6. Verify correct PDF attachment
    console.log('\n[TEST 6] Verify correct Sanction Order PDF attachment...');
    const expectedAttachmentName = `Sanction_Order_${sanction.sanctionNumber}.pdf`;
    console.log(`  ✅ Attachment name verified: ${emailResult.emailLog.attachmentName}`);
    if (emailResult.emailLog.attachmentName !== expectedAttachmentName) {
      throw new Error(`Expected attachment name ${expectedAttachmentName}, got ${emailResult.emailLog.attachmentName}`);
    }
    passedTests++;

    // 7. Verify correct recipient
    console.log('\n[TEST 7] Verify correct student received email...');
    console.log(`  ✅ Email recipient verified: ${emailResult.emailLog.recipient}`);
    if (emailResult.emailLog.recipient !== recipientEmail) {
      throw new Error(`Expected recipient ${recipientEmail}, got ${emailResult.emailLog.recipient}`);
    }
    passedTests++;

    // 8. Verify Email is logged as SENT
    console.log('\n[TEST 8] Verify EmailLog record status is SENT...');
    const foundLog = await EmailLog.findById(emailResult.emailLog._id);
    console.log(`  ✅ EmailLog status: ${foundLog.status}, EmailType: ${foundLog.emailType}`);
    if (foundLog.status !== 'SENT') {
      throw new Error(`Expected EmailLog status SENT, got ${foundLog.status}`);
    }
    passedTests++;

    // 9. Verify Duplicate sanction email is prevented
    console.log('\n[TEST 9] Duplicate email prevention check for same sanction...');
    const duplicateAttempt = await sendSanctionApprovedEmail({
      studentName: testApp.studentName,
      studentEmail: recipientEmail,
      applicationNumber: testApp.applicationNumber,
      scholarshipName: testApp.scholarshipName,
      institutionName: testApp.institutionName,
      sanctionNumber: sanction.sanctionNumber,
      sanctionDate: sanction.approvalDate,
      sanctionedAmount: sanction.approvedAmount,
      sanctioningOfficer: sanction.officerName,
      pdfPath,
      applicationId: testApp._id,
      studentId: testApp.studentId,
      sanctionId: sanction._id
    });

    console.log(`  ✅ Duplicate prevented: duplicatePrevented = ${duplicateAttempt.duplicatePrevented}`);
    if (!duplicateAttempt.duplicatePrevented) {
      throw new Error('Duplicate email was not prevented for the same sanction number!');
    }
    passedTests++;

    // 10. Email failure does NOT rollback sanction generation
    console.log('\n[TEST 10] Email failure safety check: ensure sanction is NOT rolled back...');
    const failSanctionNumber = `SAN-${currentYear}-FAIL${Math.floor(1000 + Math.random() * 9000)}`;
    const failSanction = await Sanction.create({
      sanctionNumber: failSanctionNumber,
      applicationId: testApp._id,
      applicationNumber: testApp.applicationNumber,
      studentId: testApp.studentId,
      studentName: testApp.studentName,
      scholarshipId: testApp.scholarshipId,
      scholarshipName: testApp.scholarshipName,
      departmentId: testApp.departmentId,
      departmentName: testApp.departmentName,
      institutionName: testApp.institutionName,
      approvedAmount: 40000,
      approvalDate: new Date(),
      officerId: deptOfficer._id,
      officerName: deptOfficer.name,
      status: 'SANCTIONED'
    });

    // Simulate sending with a non-existent PDF path to trigger graceful failure
    const badPdfResult = await sendSanctionApprovedEmail({
      studentName: testApp.studentName,
      studentEmail: recipientEmail,
      applicationNumber: testApp.applicationNumber,
      scholarshipName: testApp.scholarshipName,
      institutionName: testApp.institutionName,
      sanctionNumber: failSanctionNumber,
      sanctionDate: new Date(),
      sanctionedAmount: 40000,
      sanctioningOfficer: 'Officer',
      pdfPath: '/non/existent/path/bad.pdf', // Intentionally invalid
      applicationId: testApp._id,
      studentId: testApp.studentId,
      sanctionId: failSanction._id
    });

    console.log(`  ✅ Email failed gracefully: success = ${badPdfResult.success}, status = ${badPdfResult.emailLog?.status}`);
    // Verify sanction still exists and is untouched in database!
    const verifySanctionStillExists = await Sanction.findById(failSanction._id);
    if (!verifySanctionStillExists || verifySanctionStillExists.status !== 'SANCTIONED') {
      throw new Error('Sanction was rolled back or deleted on email failure!');
    }
    console.log(`  ✅ Confirmed: Sanction ${failSanction.sanctionNumber} remains SANCTIONED in DB despite email failure.`);
    passedTests++;

    // 11. Failed email can be retried
    console.log('\n[TEST 11] Retry functionality for failed email log...');
    // Now generate real PDF for this sanction and retry
    const recoveredPdf = await generateSanctionOrderPdf(failSanction);
    // Update path on the failed log so retry has the real file
    badPdfResult.emailLog.attachmentPath = recoveredPdf;
    await badPdfResult.emailLog.save();

    const retryOutcome = await retrySanctionApprovedEmail(badPdfResult.emailLog._id);
    console.log(`  ✅ Retry outcome: success = ${retryOutcome.success}, status = ${retryOutcome.emailLog?.status}`);
    if (!retryOutcome.success || retryOutcome.emailLog?.status !== 'SENT') {
      throw new Error('Retry did not successfully send email');
    }
    console.log(`     Retry count: ${retryOutcome.emailLog.retryCount}`);
    passedTests++;

    // Cleanup test records
    await Application.deleteOne({ _id: testApp._id });
    await Sanction.deleteMany({ applicationId: testApp._id });
    await EmailLog.deleteMany({ applicationId: testApp._id });
    await User.deleteOne({ _id: student._id });

    console.log('\n====================================================');
    console.log(` ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! ✅`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
};

runTest();
