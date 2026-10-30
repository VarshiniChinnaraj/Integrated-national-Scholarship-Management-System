const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Scholarship = require('../models/Scholarship');
const Notification = require('../models/Notification');
const Application = require('../models/Application');

const seedDatabase = async (req, res) => {
  try {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const instPasswordHash = await bcrypt.hash('institute123', 10);
    const deptPasswordHash = await bcrypt.hash('department123', 10);

    // 0. Drop any stale indexes from old schema versions to prevent duplicate key errors
    try {
      const db = mongoose.connection.db;
      const instIndexes = await db.collection('institutions').indexes();
      for (const idx of instIndexes) {
        if (idx.name === 'institutionCode_1') {
          await db.collection('institutions').dropIndex('institutionCode_1');
          console.log('[Seed] Dropped stale institutionCode_1 index');
        }
      }
    } catch (idxErr) {
      // Collection may not exist yet — that's fine
    }

    // 1. Reset Institutions, Departments, Scholarships to clean master state
    await Institution.deleteMany({});
    await Department.deleteMany({});
    await Scholarship.deleteMany({});

    // 2. Remove ONLY Admin and Officer accounts + any leftover demo students
    // REAL registered students (role === 'STUDENT') and their applications are PRESERVED!
    await User.deleteMany({
      $or: [
        { role: { $in: ['ADMIN', 'SUPER_ADMIN', 'INSTITUTE_OFFICER', 'DEPARTMENT_OFFICER'] } },
        { email: { $in: ['student@nsp.gov.in', 'priya.patel@nsp.gov.in', 'rahul.verma@nsp.gov.in'] } }
      ]
    });

    // 3. Create Institutions Master Data
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

    // 4. Create Departments Master Data
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

    // 5. Create System Admin
    const adminUser = await User.create({
      name: 'State Nodal Administrator',
      email: 'admin@nsp.gov.in',
      password: adminPasswordHash,
      phone: '9876543210',
      role: 'ADMIN',
      status: 'Active'
    });

    // 6. Create Institute Officers for each institution
    const instituteOfficer1 = await User.create({
      name: 'Prof. Rajesh Sharma',
      email: 'institute@nsp.gov.in',
      password: instPasswordHash,
      phone: '9811223344',
      role: 'INSTITUTE_OFFICER',
      institutionId: inst1._id,
      institutionName: inst1.name,
      status: 'Active'
    });
    inst1.assignedOfficer = instituteOfficer1._id;
    inst1.assignedOfficerName = instituteOfficer1.name;
    await inst1.save();

    const instituteOfficer2 = await User.create({
      name: 'Prof. Amit Saxena',
      email: 'institute.iitd@nsp.gov.in',
      password: instPasswordHash,
      phone: '9811223345',
      role: 'INSTITUTE_OFFICER',
      institutionId: inst2._id,
      institutionName: inst2.name,
      status: 'Active'
    });
    inst2.assignedOfficer = instituteOfficer2._id;
    inst2.assignedOfficerName = instituteOfficer2.name;
    await inst2.save();

    const instituteOfficer3 = await User.create({
      name: 'Prof. M. Senthil',
      email: 'institute.anna@nsp.gov.in',
      password: instPasswordHash,
      phone: '9811223346',
      role: 'INSTITUTE_OFFICER',
      institutionId: inst3._id,
      institutionName: inst3.name,
      status: 'Active'
    });
    inst3.assignedOfficer = instituteOfficer3._id;
    inst3.assignedOfficerName = instituteOfficer3.name;
    await inst3.save();

    // 7. Create Department Officers for each department
    const departmentOfficer1 = await User.create({
      name: 'Dr. Sunita Verma',
      email: 'department@nsp.gov.in',
      password: deptPasswordHash,
      phone: '9822334455',
      role: 'DEPARTMENT_OFFICER',
      departmentId: dept1._id,
      departmentName: dept1.name,
      status: 'Active'
    });
    dept1.assignedOfficer = departmentOfficer1._id;
    dept1.assignedOfficerName = departmentOfficer1.name;
    await dept1.save();

    const departmentOfficer2 = await User.create({
      name: 'Dr. Vikram Nair',
      email: 'department.dst@nsp.gov.in',
      password: deptPasswordHash,
      phone: '9822334456',
      role: 'DEPARTMENT_OFFICER',
      departmentId: dept2._id,
      departmentName: dept2.name,
      status: 'Active'
    });
    dept2.assignedOfficer = departmentOfficer2._id;
    dept2.assignedOfficerName = departmentOfficer2.name;
    await dept2.save();

    const departmentOfficer3 = await User.create({
      name: 'Dr. Priya Mehta',
      email: 'department.tata@nsp.gov.in',
      password: deptPasswordHash,
      phone: '9822334457',
      role: 'DEPARTMENT_OFFICER',
      departmentId: dept3._id,
      departmentName: dept3.name,
      status: 'Active'
    });
    dept3.assignedOfficer = departmentOfficer3._id;
    dept3.assignedOfficerName = departmentOfficer3.name;
    await dept3.save();

    const departmentOfficer4 = await User.create({
      name: 'Dr. Arun Kapoor',
      email: 'department.rf@nsp.gov.in',
      password: deptPasswordHash,
      phone: '9822334458',
      role: 'DEPARTMENT_OFFICER',
      departmentId: dept4._id,
      departmentName: dept4.name,
      status: 'Active'
    });
    dept4.assignedOfficer = departmentOfficer4._id;
    dept4.assignedOfficerName = departmentOfficer4.name;
    await dept4.save();

    // 8. Create Scholarship Schemes linked to Departments
    await Scholarship.create({
      name: 'Central Sector Scheme of Scholarships for College and University Students (CSSS)',
      code: 'CSSS-2026',
      provider: 'Ministry of Education, Govt of India',
      providerType: 'GOVERNMENT',
      departmentId: dept1._id,
      departmentName: dept1.name,
      educationLevel: 'Undergraduate',
      eligibleCourses: ['B.Tech', 'B.E', 'B.Sc', 'B.Com', 'B.A', 'MBBS'],
      category: 'All',
      incomeLimit: 450000,
      minPercentage: 80,
      minCgpa: 7.5,
      scholarshipAmount: 20000,
      amountDisplay: '₹20,000 / Year',
      deadline: new Date('2026-12-31'),
      description: 'Provides financial assistance to meritorious students from low-income families to meet day-to-day expenses while pursuing higher studies.',
      eligibilityCriteria: 'Minimum 80th percentile in Class 12th Board Examination. Family annual income less than ₹4.5 Lakhs.',
      status: 'Active'
    });

    await Scholarship.create({
      name: 'National Merit-cum-Means Higher Education Grant',
      code: 'NMM-2026',
      provider: 'Department of Higher Education',
      providerType: 'GOVERNMENT',
      departmentId: dept1._id,
      departmentName: dept1.name,
      educationLevel: 'Undergraduate',
      eligibleCourses: ['All Degree Courses', 'B.Tech', 'B.Sc', 'Diploma'],
      category: 'All',
      incomeLimit: 250000,
      minPercentage: 65,
      minCgpa: 6.5,
      scholarshipAmount: 50000,
      amountDisplay: '₹50,000 / Year',
      deadline: new Date('2026-11-30'),
      description: 'Merit-cum-means financial grant for economically disadvantaged undergraduate students with consistent academic excellence.',
      eligibilityCriteria: 'Annual family income below ₹2.5 Lakhs. Minimum 65% aggregate in qualifying examination.',
      status: 'Active'
    });

    await Scholarship.create({
      name: 'AICTE Pragati & Saksham Scholarship for Technical Education',
      code: 'AICTE-PRAGATI',
      provider: 'Ministry of Science & Technology',
      providerType: 'GOVERNMENT',
      departmentId: dept2._id,
      departmentName: dept2.name,
      educationLevel: 'Undergraduate',
      eligibleCourses: ['B.Tech', 'B.E', 'B.Arch', 'B.Pharm'],
      category: 'All',
      incomeLimit: 800000,
      minPercentage: 60,
      minCgpa: 6.0,
      scholarshipAmount: 50000,
      amountDisplay: '₹50,000 / Year',
      deadline: new Date('2026-10-31'),
      description: 'Dedicated scheme to empower young women and specially-abled students admitted to AICTE approved technical degree/diploma programs.',
      eligibilityCriteria: 'Admitted to 1st year of Degree/Diploma program. Family income not exceeding ₹8 Lakhs.',
      status: 'Active'
    });

    await Scholarship.create({
      name: 'Tata Trusts Higher Education Grant for Engineering & Medicine',
      code: 'TATA-ENG-2026',
      provider: 'Tata Trusts India',
      providerType: 'PRIVATE',
      departmentId: dept3._id,
      departmentName: dept3.name,
      educationLevel: 'Undergraduate',
      eligibleCourses: ['B.Tech', 'B.E', 'MBBS', 'B.Sc Nursing'],
      category: 'All',
      incomeLimit: 350000,
      minPercentage: 75,
      minCgpa: 7.5,
      scholarshipAmount: 75000,
      amountDisplay: '₹75,000 / Year',
      deadline: new Date('2026-11-15'),
      description: 'Philanthropic grant supporting bright students in professional disciplines from across India.',
      status: 'Active'
    });

    await Scholarship.create({
      name: 'Reliance Foundation Undergraduate Scholarship',
      code: 'RF-UG-2026',
      provider: 'Reliance Foundation',
      providerType: 'CORPORATE',
      departmentId: dept4._id,
      departmentName: dept4.name,
      educationLevel: 'Undergraduate',
      eligibleCourses: ['All Undergraduate Streams'],
      category: 'All',
      incomeLimit: 1500000,
      minPercentage: 70,
      minCgpa: 7.0,
      scholarshipAmount: 200000,
      amountDisplay: 'Up to ₹2,00,000 / Duration',
      deadline: new Date('2026-12-15'),
      description: 'Prestigious undergraduate scholarship for visionary youth demonstrating leadership and academic excellence.',
      status: 'Active'
    });

    // 9. Re-link preserved students and their applications to the newly created institutions
    const institutionsList = [inst1, inst2, inst3];
    for (const inst of institutionsList) {
      await User.updateMany(
        {
          role: 'STUDENT',
          $or: [
            { institutionName: inst.name },
            { 'profile.collegeName': inst.name },
            { institutionName: { $regex: new RegExp(`^${inst.name}`, 'i') } }
          ]
        },
        {
          $set: {
            institutionId: inst._id,
            institutionName: inst.name
          }
        }
      );

      await Application.updateMany(
        {
          $or: [
            { institutionName: inst.name },
            { 'academicDetails.institutionName': inst.name },
            { institutionName: { $regex: new RegExp(`^${inst.name}`, 'i') } }
          ]
        },
        {
          $set: {
            institutionId: inst._id,
            institutionName: inst.name
          }
        }
      );
    }

    // NOTE: NO DEMO STUDENTS, NO DEMO APPLICATIONS, NO DEMO SANCTIONS/PAYMENTS CREATED.
    // The system relies exclusively on real students registered via the Student Portal.

    return res.status(200).json({
      success: true,
      message: 'Master institutions, departments, scholarships, and administrative accounts initialized successfully. Ready for real student registration!',
      credentials: {
        admin: { email: 'admin@nsp.gov.in', password: 'admin123', role: 'ADMIN' },
        instituteOfficer: { email: 'institute@nsp.gov.in', password: 'institute123', role: 'INSTITUTE_OFFICER', institution: inst1.name },
        departmentOfficer: { email: 'department@nsp.gov.in', password: 'department123', role: 'DEPARTMENT_OFFICER', department: dept1.name }
      }
    });
  } catch (error) {
    console.error('Seed Database Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database seed failed',
      error: error.message
    });
  }
};

module.exports = {
  seedDatabase
};
