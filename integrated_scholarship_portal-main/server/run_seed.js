/**
 * Direct seed script - run with: node run_seed.js
 * Seeds admin, institute officers, and department officers with bcrypt-hashed passwords.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Institution = require('./models/Institution');
const Department = require('./models/Department');
const Scholarship = require('./models/Scholarship');

async function runSeed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  console.log('Connected to MongoDB');

  // Generate password hashes
  const adminHash = await bcrypt.hash('admin123', 10);
  const instHash = await bcrypt.hash('institute123', 10);
  const deptHash = await bcrypt.hash('department123', 10);
  console.log('Password hashes generated');

  // Remove old officers/admins
  await User.deleteMany({
    role: { $in: ['ADMIN', 'SUPER_ADMIN', 'INSTITUTE_OFFICER', 'DEPARTMENT_OFFICER'] }
  });
  console.log('Old officer accounts removed');

  // Remove old institutions and departments
  await Institution.deleteMany({});
  await Department.deleteMany({});
  await Scholarship.deleteMany({});
  console.log('Old institutions, departments, scholarships removed');

  // Create institutions
  const inst1 = await Institution.create({
    name: 'National Institute of Technology (NIT Delhi)',
    code: 'NITD-101',
    district: 'North Delhi',
    state: 'Delhi',
    contactEmail: 'nodal@nitdelhi.ac.in',
    phone: '011-27787500',
    status: 'Active'
  });
  const inst2 = await Institution.create({
    name: 'Indian Institute of Technology (IIT Delhi)',
    code: 'IITD-202',
    district: 'South Delhi',
    state: 'Delhi',
    contactEmail: 'scholarships@iitd.ac.in',
    phone: '011-26591000',
    status: 'Active'
  });
  const inst3 = await Institution.create({
    name: 'Anna University Chennai',
    code: 'AUC-303',
    district: 'Chennai',
    state: 'Tamil Nadu',
    contactEmail: 'welfare@annauniv.edu',
    phone: '044-22357004',
    status: 'Active'
  });
  console.log('Institutions created: NIT Delhi, IIT Delhi, Anna University Chennai');

  // Create departments
  const dept1 = await Department.create({
    name: 'Ministry of Higher Education & Welfare',
    code: 'MOHE-GOV',
    type: 'GOVERNMENT',
    provider: 'Department of Higher Education, Govt of India',
    contact: { email: 'officer@highered.gov.in', phone: '011-23381234' },
    budget: { allocated: 25000000, disbursed: 0 },
    status: 'Active'
  });
  const dept2 = await Department.create({
    name: 'Department of Science, Technology & Innovation',
    code: 'DSTI-GOV',
    type: 'GOVERNMENT',
    provider: 'Ministry of Science & Technology',
    contact: { email: 'scitech@dst.gov.in', phone: '011-26567373' },
    budget: { allocated: 15000000, disbursed: 0 },
    status: 'Active'
  });
  const dept3 = await Department.create({
    name: 'Tata Educational & Social Welfare Trust',
    code: 'TATA-PVT',
    type: 'PRIVATE',
    provider: 'Tata Trusts India',
    contact: { email: 'grants@tatatrusts.org', phone: '022-66658282' },
    budget: { allocated: 8000000, disbursed: 0 },
    status: 'Active'
  });
  const dept4 = await Department.create({
    name: 'Reliance Foundation Education Initiatives',
    code: 'RF-CORP',
    type: 'CORPORATE',
    provider: 'Reliance Foundation CSR',
    contact: { email: 'scholarships@reliancefoundation.org', phone: '022-44770000' },
    budget: { allocated: 12000000, disbursed: 0 },
    status: 'Active'
  });
  console.log('Departments created');

  // Create admin user
  await User.create({
    name: 'State Nodal Administrator',
    email: 'admin@nsp.gov.in',
    password: adminHash,
    phone: '9876543210',
    role: 'ADMIN',
    status: 'Active'
  });
  console.log('Admin user created: admin@nsp.gov.in / admin123');

  // Create institute officers
  const io1 = await User.create({
    name: 'Prof. Rajesh Sharma',
    email: 'institute@nsp.gov.in',
    password: instHash,
    phone: '9811223344',
    role: 'INSTITUTE_OFFICER',
    institutionId: inst1._id,
    institutionName: inst1.name,
    status: 'Active'
  });
  inst1.assignedOfficer = io1._id;
  inst1.assignedOfficerName = io1.name;
  await inst1.save();

  const io2 = await User.create({
    name: 'Prof. Amit Saxena',
    email: 'institute.iitd@nsp.gov.in',
    password: instHash,
    phone: '9811223345',
    role: 'INSTITUTE_OFFICER',
    institutionId: inst2._id,
    institutionName: inst2.name,
    status: 'Active'
  });
  inst2.assignedOfficer = io2._id;
  inst2.assignedOfficerName = io2.name;
  await inst2.save();

  const io3 = await User.create({
    name: 'Prof. M. Senthil',
    email: 'institute.anna@nsp.gov.in',
    password: instHash,
    phone: '9811223346',
    role: 'INSTITUTE_OFFICER',
    institutionId: inst3._id,
    institutionName: inst3.name,
    status: 'Active'
  });
  inst3.assignedOfficer = io3._id;
  inst3.assignedOfficerName = io3.name;
  await inst3.save();
  console.log('Institute officers created:');
  console.log('  institute@nsp.gov.in / institute123 (NIT Delhi)');
  console.log('  institute.iitd@nsp.gov.in / institute123 (IIT Delhi)');
  console.log('  institute.anna@nsp.gov.in / institute123 (Anna University)');

  // Create department officers
  const do1 = await User.create({
    name: 'Dr. Sunita Verma',
    email: 'department@nsp.gov.in',
    password: deptHash,
    phone: '9822334455',
    role: 'DEPARTMENT_OFFICER',
    departmentId: dept1._id,
    departmentName: dept1.name,
    status: 'Active'
  });
  dept1.assignedOfficer = do1._id;
  dept1.assignedOfficerName = do1.name;
  await dept1.save();

  const do2 = await User.create({
    name: 'Dr. Vikram Nair',
    email: 'department.dst@nsp.gov.in',
    password: deptHash,
    phone: '9822334456',
    role: 'DEPARTMENT_OFFICER',
    departmentId: dept2._id,
    departmentName: dept2.name,
    status: 'Active'
  });

  const do3 = await User.create({
    name: 'Dr. Priya Mehta',
    email: 'department.tata@nsp.gov.in',
    password: deptHash,
    phone: '9822334457',
    role: 'DEPARTMENT_OFFICER',
    departmentId: dept3._id,
    departmentName: dept3.name,
    status: 'Active'
  });

  const do4 = await User.create({
    name: 'Dr. Arun Kapoor',
    email: 'department.rf@nsp.gov.in',
    password: deptHash,
    phone: '9822334458',
    role: 'DEPARTMENT_OFFICER',
    departmentId: dept4._id,
    departmentName: dept4.name,
    status: 'Active'
  });
  console.log('Department officers created:');
  console.log('  department@nsp.gov.in / department123');
  console.log('  department.dst@nsp.gov.in / department123');
  console.log('  department.tata@nsp.gov.in / department123');
  console.log('  department.rf@nsp.gov.in / department123');

  // === VERIFY ALL LOGINS ===
  console.log('\n=== VERIFYING LOGIN CREDENTIALS ===');

  const adminUser = await User.findOne({ email: 'admin@nsp.gov.in' });
  const adminOk = await bcrypt.compare('admin123', adminUser.password);
  console.log(`Admin (admin@nsp.gov.in / admin123): ${adminOk ? 'PASS ✓' : 'FAIL ✗'}`);

  const instUser = await User.findOne({ email: 'institute@nsp.gov.in' });
  const instOk = await bcrypt.compare('institute123', instUser.password);
  console.log(`Institute NIT (institute@nsp.gov.in / institute123): ${instOk ? 'PASS ✓' : 'FAIL ✗'}`);

  const annaUser = await User.findOne({ email: 'institute.anna@nsp.gov.in' });
  const annaOk = await bcrypt.compare('institute123', annaUser.password);
  console.log(`Institute Anna (institute.anna@nsp.gov.in / institute123): ${annaOk ? 'PASS ✓' : 'FAIL ✗'}`);

  const iitUser = await User.findOne({ email: 'institute.iitd@nsp.gov.in' });
  const iitOk = await bcrypt.compare('institute123', iitUser.password);
  console.log(`Institute IIT (institute.iitd@nsp.gov.in / institute123): ${iitOk ? 'PASS ✓' : 'FAIL ✗'}`);

  const deptUser = await User.findOne({ email: 'department@nsp.gov.in' });
  const deptOk = await bcrypt.compare('department123', deptUser.password);
  console.log(`Department (department@nsp.gov.in / department123): ${deptOk ? 'PASS ✓' : 'FAIL ✗'}`);

  console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
