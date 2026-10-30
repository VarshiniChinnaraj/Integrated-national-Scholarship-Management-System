const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'national_scholarship_secret_key_2026_jwt';

async function testEndpoints() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  const User = mongoose.connection.db.collection('users');
  const App = mongoose.connection.db.collection('applications');
  const Sanc = mongoose.connection.db.collection('sanctions');

  const deptOfficer = await User.findOne({ role: /DEPARTMENT/i });
  const student = await User.findOne({ role: 'STUDENT' });
  const admin = await User.findOne({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });

  const deptToken = jwt.sign({ id: deptOfficer._id, role: deptOfficer.role }, JWT_SECRET, { expiresIn: '1h' });
  const studentToken = jwt.sign({ id: student._id, role: student.role }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });

  const app = await App.findOne({ status: 'SANCTIONED' }) || await App.findOne();
  const sanction = await Sanc.findOne() || {};

  console.log('Testing against http://localhost:5000...');

  // 1. Health
  await check('/api/health');

  // 2. Department Applications
  await check('/api/department/applications', { Authorization: `Bearer ${deptToken}` });

  // 3. Department Sanctions
  await check('/api/department/sanctions', { Authorization: `Bearer ${deptToken}` });

  // 4. Department Disbursement
  await check('/api/department/disbursement', { Authorization: `Bearer ${deptToken}` });

  // 5. Admin Email Logs
  await check('/api/admin/email-logs', { Authorization: `Bearer ${adminToken}` });
  await check('/api/admin/email-logs?status=All', { Authorization: `Bearer ${adminToken}` });
  await check('/api/admin/email-logs?status=PENDING', { Authorization: `Bearer ${adminToken}` });
  await check('/api/admin/email-logs?status=SENT', { Authorization: `Bearer ${adminToken}` });

  // 6. Sanction PDF via sanctionNumber
  if (sanction.sanctionNumber) {
    await check(`/api/department/sanctions/${sanction.sanctionNumber}/pdf`, { Authorization: `Bearer ${deptToken}` });
  }

  // 7. Sanction PDF via Application ID (Student)
  if (app) {
    await check(`/api/student/applications/${app._id}/sanction-pdf?token=${studentToken}`);
    await check(`/api/student/applications/${app.applicationNumber}/sanction-pdf?token=${studentToken}`);
  }

  // 8. Department verification detail
  if (app) {
    await check(`/api/department/applications/${app._id}`, { Authorization: `Bearer ${deptToken}` });
  }

  await mongoose.disconnect();
}

async function check(path, headers = {}) {
  try {
    const res = await fetch(`http://localhost:5000${path}`, { headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.substring(0, 100); }
    console.log(`[${res.status}] ${path} ->`, typeof body === 'object' ? JSON.stringify(body).substring(0, 150) : body);
  } catch (err) {
    console.error(`[ERROR] ${path} ->`, err.message);
  }
}

testEndpoints();
