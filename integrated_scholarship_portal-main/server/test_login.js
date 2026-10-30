/**
 * Login verification test - tests the auth logic directly against the database
 * Run with: node test_login.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = 'national_scholarship_secret_key_2026_jwt';

async function testLogin(email, password, expectedRole) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return { success: false, message: 'User not found in DB' };
  }
  if (user.status !== 'Active') {
    return { success: false, message: 'Account not active' };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: 'Password mismatch' };
  }
  if (expectedRole) {
    const allowed = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
    const hasRole = allowed.includes(user.role) || (allowed.includes('ADMIN') && user.role === 'SUPER_ADMIN');
    if (!hasRole) {
      return { success: false, message: `Role mismatch: user is ${user.role}, expected ${expectedRole}` };
    }
  }
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return { success: true, role: user.role, name: user.name, tokenGenerated: !!token };
}

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  console.log('=== LOGIN API VERIFICATION TESTS ===\n');

  const tests = [
    { email: 'admin@nsp.gov.in',          password: 'admin123',       role: 'ADMIN',              label: 'Admin Login' },
    { email: 'institute@nsp.gov.in',      password: 'institute123',   role: 'INSTITUTE_OFFICER',  label: 'Institute NIT Login' },
    { email: 'institute.anna@nsp.gov.in', password: 'institute123',   role: 'INSTITUTE_OFFICER',  label: 'Institute Anna Login' },
    { email: 'institute.iitd@nsp.gov.in', password: 'institute123',   role: 'INSTITUTE_OFFICER',  label: 'Institute IIT Login' },
    { email: 'department@nsp.gov.in',     password: 'department123',  role: 'DEPARTMENT_OFFICER', label: 'Department Login' },
    // Negative tests
    { email: 'admin@nsp.gov.in',          password: 'wrongpassword',  role: 'ADMIN',              label: 'Admin Wrong Password (should FAIL)' },
    { email: 'notexist@nsp.gov.in',       password: 'admin123',       role: 'ADMIN',              label: 'Non-existent user (should FAIL)' },
    { email: 'institute@nsp.gov.in',      password: 'institute123',   role: 'ADMIN',              label: 'Institute trying admin role (should FAIL)' },
  ];

  for (const t of tests) {
    const result = await testLogin(t.email, t.password, t.role);
    const shouldFail = t.label.includes('should FAIL');
    const passed = shouldFail ? !result.success : result.success;
    const icon = passed ? '✓' : '✗';
    console.log(`[${icon}] ${t.label}`);
    if (!passed) {
      console.log(`    UNEXPECTED: ${JSON.stringify(result)}`);
    } else if (result.success) {
      console.log(`    Role: ${result.role}, Name: ${result.name}, Token: ${result.tokenGenerated}`);
    } else {
      console.log(`    Correctly rejected: ${result.message}`);
    }
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
