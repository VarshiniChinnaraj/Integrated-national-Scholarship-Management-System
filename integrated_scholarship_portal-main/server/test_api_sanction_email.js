const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
process.env.NODE_ENV = 'test';

const app = require('./server');
const User = require('./models/User');
const Application = require('./models/Application');
const Scholarship = require('./models/Scholarship');
const Sanction = require('./models/Sanction');
const EmailLog = require('./models/EmailLog');

const TEST_PORT = 5005;

const req = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(url, `http://127.0.0.1:${TEST_PORT}`);
    const headers = options.headers || {};
    let postData = null;

    if (options.body) {
      postData = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const requestOptions = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: fullUrl.pathname + fullUrl.search,
      method: options.method || 'GET',
      headers
    };

    const clientReq = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    clientReq.on('error', reject);
    if (postData) clientReq.write(postData);
    clientReq.end();
  });
};

const runApiTest = async () => {
  console.log('--- STARTING HTTP API INTEGRATION TEST ---');
  
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(` Test server listening on port ${TEST_PORT}`);

  try {
    // 1. Login as Department Officer
    console.log('\n[API TEST 1] Login as Department Officer...');
    const loginRes = await req('/api/auth/login', {
      method: 'POST',
      body: { email: 'department@nsp.gov.in', password: 'department123' }
    });
    if (!loginRes.data.token) {
      throw new Error(`Failed to login: ${JSON.stringify(loginRes.data)}`);
    }
    const deptToken = loginRes.data.token;
    console.log('  ✅ Department Officer logged in successfully.');

    // 2. Login as Admin
    console.log('\n[API TEST 2] Login as Admin...');
    const adminLoginRes = await req('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@nsp.gov.in', password: 'admin123' }
    });
    const adminToken = adminLoginRes.data.token;
    console.log('  ✅ Admin logged in successfully.');

    // 3. Prepare test applicant & application in APPROVED status
    console.log('\n[API TEST 3] Prepare application in APPROVED status...');
    const scholarship = await Scholarship.findOne();
    const appNum = `APP-API-SANCTION-${Date.now().toString().slice(-5)}`;
    const studentUser = await User.findOne({ role: 'STUDENT' });

    const newApp = await Application.create({
      applicationNumber: appNum,
      studentId: studentUser._id,
      studentName: studentUser.name,
      studentEmail: 'api.applicant.test@example.com',
      studentPhone: '9876543210',
      scholarshipId: scholarship._id,
      scholarshipName: scholarship.name,
      institutionName: 'National Institute of Technology (NIT Delhi)',
      requestedAmount: 60000,
      approvedAmount: 60000,
      status: 'APPROVED',
      departmentName: 'Higher Education Department',
      personalDetails: { fullName: studentUser.name, email: 'api.applicant.test@example.com', phone: '9876543210', dob: '2004-01-01', gender: 'Male' },
      academicDetails: { institutionName: 'NIT Delhi', course: 'B.Tech', department: 'IT', year: '3rd Year', enrollmentNumber: 'NIT2024', previousClassPercentage: 85 },
      incomeDetails: { familyAnnualIncome: 180000, incomeCertificateNumber: 'INC-2026-902' },
      bankDetails: { accountNumber: '123456789012', ifscCode: 'SBIN0001234', bankName: 'SBI', branchName: 'Delhi', accountHolderName: studentUser.name }
    });
    console.log(`  ✅ Created APPROVED Application: ${newApp.applicationNumber}`);

    // 4. Trigger Sanction Generation via POST /api/department/sanctions/generate
    console.log('\n[API TEST 4] Call POST /api/department/sanctions/generate...');
    const genRes = await req('/api/department/sanctions/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${deptToken}` },
      body: {
        applicationId: newApp._id,
        orderRemarks: 'Formal sanction granted via API integration test.'
      }
    });

    console.log('  Response status:', genRes.status);
    console.log('  Sanction Number:', genRes.data.sanction?.sanctionNumber);
    console.log('  PDF Generated:', genRes.data.pdfGenerated);
    console.log('  Email Sent:', genRes.data.emailSent);

    if (genRes.status !== 201 || !genRes.data.sanction?.sanctionNumber) {
      throw new Error(`Failed to generate sanction: ${JSON.stringify(genRes.data)}`);
    }
    if (!genRes.data.pdfGenerated) {
      throw new Error('PDF was not generated');
    }
    if (!genRes.data.emailSent) {
      throw new Error('Email was not sent');
    }
    console.log('  ✅ PASS: Sanction Order, PDF, and Email all generated successfully via HTTP API!');

    // 5. Verify EmailLog in Admin Email Logs API
    console.log('\n[API TEST 5] Verify Admin GET /api/admin/email-logs...');
    const emailLogsRes = await req(`/api/admin/email-logs?search=${genRes.data.sanction.sanctionNumber}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('  Logs count found:', emailLogsRes.data.count);
    const matchingLog = emailLogsRes.data.logs?.find(l => l.sanctionNumber === genRes.data.sanction.sanctionNumber);
    if (!matchingLog || matchingLog.status !== 'SENT') {
      throw new Error('Email log not found in Admin API');
    }
    console.log(`  ✅ PASS: Found EmailLog with status ${matchingLog.status}, attachment: ${matchingLog.attachmentName}`);

    // 6. Verify PDF download endpoint: GET /api/department/sanctions/:id/pdf
    console.log('\n[API TEST 6] Test PDF download endpoint: GET /api/department/sanctions/:id/pdf...');
    const pdfRes = await req(`/api/department/sanctions/${genRes.data.sanction.sanctionNumber}/pdf`, {
      headers: { Authorization: `Bearer ${deptToken}` }
    });
    console.log('  PDF Download response status:', pdfRes.status);
    console.log('  Content-Type:', pdfRes.headers['content-type']);
    if (pdfRes.status !== 200 || !pdfRes.headers['content-type']?.includes('application/pdf')) {
      throw new Error(`PDF download failed with status ${pdfRes.status}`);
    }
    console.log('  ✅ PASS: PDF Download API returns valid application/pdf binary content.');

    // 7. Verify Idempotency & Duplicate prevention via API
    console.log('\n[API TEST 7] Test Sanction & Email Idempotency via API...');
    const dupRes = await req('/api/department/sanctions/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${deptToken}` },
      body: {
        applicationId: newApp._id
      }
    });
    console.log('  Duplicate generation response status:', dupRes.status);
    if (dupRes.status !== 400) {
      throw new Error('Duplicate sanction generation was not blocked');
    }
    console.log('  ✅ PASS: Duplicate sanction generation correctly rejected (400 Bad Request).');

    // Cleanup
    await Application.deleteOne({ _id: newApp._id });
    await Sanction.deleteMany({ applicationId: newApp._id });
    await EmailLog.deleteMany({ applicationId: newApp._id });

    console.log('\n====================================================');
    console.log(' ALL HTTP API WORKFLOW TESTS PASSED CLEANLY! ✅');
    console.log('====================================================');
    
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ API TEST FAILED:', err);
    server.close();
    process.exit(1);
  }
};

runApiTest();
