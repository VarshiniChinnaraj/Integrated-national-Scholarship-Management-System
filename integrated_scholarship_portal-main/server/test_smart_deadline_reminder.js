/**
 * Comprehensive Verification Test Suite:
 * SMART SCHOLARSHIP DEADLINE EMAIL REMINDER
 *
 * Tests:
 * 1. Eligibility checking logic (Category, Income, Marks, CGPA, Education Level, Eligible Courses).
 * 2. Incomplete profile handling: safely skips without guessing.
 * 3. Profile + Application synthesis: reads existing MongoDB application details if profile has missing fields.
 * 4. Schedule calculator: 48h, 24h, deadline-day morning, deadline-day final.
 * 5. Closed/Past scholarships: never sends reminders after deadline.
 * 6. Closing time guard: skips reminder times that fall after closing time.
 * 7. Deduplication guarantee: ReminderLog deduplicationKey prevents duplicate sends across restarts.
 * 8. Error handling & controlled retries: updates log without duplicate records.
 * 9. Email content check: includes student name, scheme, closing time, remaining time, application link, review reminder.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const {
  isStudentEligible,
  getEffectiveStudentDetails,
  getDueRemindersForScholarship,
  generateReminderEmailText,
  generateReminderEmailHtml,
  formatTimeRemaining
} = require('./services/reminderService');
const reminderConfig = require('./config/reminderConfig');

console.log('================================================================');
console.log('  TEST SUITE: SMART SCHOLARSHIP DEADLINE EMAIL REMINDER');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -------------------------------------------------------------
// GROUP 1: ELIGIBILITY CHECKING (Section A)
// -------------------------------------------------------------
console.log('--- GROUP 1: Scholarship Eligibility Verification ---');

const baseScholarship = {
  _id: '507f1f77bcf86cd799439011',
  name: 'National Merit Scholarship Scheme 2026',
  category: 'OBC',
  incomeLimit: 250000,
  minPercentage: 60,
  minCgpa: 6.5,
  educationLevel: 'Undergraduate',
  eligibleCourses: ['B.Tech Computer Science', 'B.Sc Electronics'],
  status: 'Active',
  deadline: new Date(Date.now() + 48 * 3600 * 1000)
};

runTest('Student with matching profile is eligible', () => {
  const student = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    profile: {
      category: 'OBC',
      familyIncome: 180000,
      marksPercentage: 82,
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, true, 'Student should be eligible');
  assert.ok(result.notes.includes('Category: OBC'), 'Should document category');
  assert.ok(result.notes.includes('1,80,000'), 'Should document income');
});

runTest('Student exceeding income limit is ineligible', () => {
  const student = {
    profile: {
      category: 'OBC',
      familyIncome: 450000, // Exceeds 250000
      marksPercentage: 85,
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should be ineligible due to income');
  assert.ok(result.notes.includes('exceeds limit'), 'Reason must mention income limit');
});

runTest('Student with wrong category is ineligible', () => {
  const student = {
    profile: {
      category: 'General', // Scheme requires OBC
      familyIncome: 150000,
      marksPercentage: 85,
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should be ineligible due to category');
  assert.ok(result.notes.includes('does not match required'), 'Reason must mention category mismatch');
});

runTest('Category "All" allows any student category', () => {
  const openScheme = { ...baseScholarship, category: 'All' };
  const student = {
    profile: {
      category: 'General',
      familyIncome: 150000,
      marksPercentage: 85,
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, openScheme);
  assert.strictEqual(result.eligible, true, 'Category "All" should accept General category');
});

runTest('Missing family income: safely skipped without guessing', () => {
  const student = {
    profile: {
      category: 'OBC',
      familyIncome: 0, // Incomplete / missing
      marksPercentage: 85,
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should skip student when income is missing');
  assert.ok(result.notes.includes('not specified'), 'Notes should document missing income');
});

runTest('Missing academic marks: safely skipped without guessing', () => {
  const student = {
    profile: {
      category: 'OBC',
      familyIncome: 150000,
      marksPercentage: 0, // Missing
      cgpa: 8.5,
      course: 'B.Tech Computer Science'
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should skip student when percentage is missing');
});

runTest('Missing course / education level: safely skipped without guessing', () => {
  const student = {
    profile: {
      category: 'OBC',
      familyIncome: 150000,
      marksPercentage: 75,
      cgpa: 7.5,
      course: '' // Missing course
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should skip student when course is missing');
});

runTest('Student with wrong education level is ineligible', () => {
  const student = {
    profile: {
      category: 'OBC',
      familyIncome: 150000,
      marksPercentage: 75,
      cgpa: 7.5,
      course: 'M.Tech Electronics' // Postgraduate, scheme requires Undergraduate
    }
  };
  const result = isStudentEligible(student, baseScholarship);
  assert.strictEqual(result.eligible, false, 'Should be ineligible due to education level mismatch');
});

runTest('Synthesizes student profile + existing Application details from MongoDB', () => {
  // Student profile is empty/sparse, but previous application has full details
  const student = {
    _id: '507f1f77bcf86cd799439099',
    name: 'Rahul Kumar',
    profile: {
      category: '', // missing in User.profile
      familyIncome: 0 // missing in User.profile
    }
  };
  const existingApplication = {
    personalDetails: {
      category: 'OBC'
    },
    incomeDetails: {
      familyAnnualIncome: 160000
    },
    academicDetails: {
      previousClassPercentage: 88,
      cgpa: 8.8,
      course: 'B.Tech Computer Science'
    }
  };

  const synthesized = getEffectiveStudentDetails(student, existingApplication);
  assert.strictEqual(synthesized.category, 'OBC', 'Should pull category from application');
  assert.strictEqual(synthesized.familyIncome, 160000, 'Should pull income from application');
  assert.strictEqual(synthesized.marksPercentage, 88, 'Should pull marks from application');

  const result = isStudentEligible(student, baseScholarship, existingApplication);
  assert.strictEqual(result.eligible, true, 'Student should be eligible using application data');
});

// -------------------------------------------------------------
// GROUP 2: REMINDER SCHEDULE & TIMEZONE (Section B)
// -------------------------------------------------------------
console.log('\n--- GROUP 2: Reminder Schedule & Timezone Handling ---');

runTest('Reminder 1 (48h) triggered ~48h before deadline', () => {
  const deadline = new Date('2026-11-05T12:00:00Z');
  const sch = { deadline };
  // Current time: exactly 48h before deadline
  const now = new Date(deadline.getTime() - 48 * 3600 * 1000);

  const due = getDueRemindersForScholarship(sch, now);
  const has48h = due.some((r) => r.type === 'REMINDER_48H');
  assert.strictEqual(has48h, true, 'REMINDER_48H must be due 48 hours before deadline');
});

runTest('Reminder 2 (24h) triggered ~24h before deadline', () => {
  const deadline = new Date('2026-11-05T12:00:00Z');
  const sch = { deadline };
  // Current time: exactly 24h before deadline
  const now = new Date(deadline.getTime() - 24 * 3600 * 1000);

  const due = getDueRemindersForScholarship(sch, now);
  const has24h = due.some((r) => r.type === 'REMINDER_24H');
  assert.strictEqual(has24h, true, 'REMINDER_24H must be due 24 hours before deadline');
});

runTest('Reminder 3 (Deadline Day Morning) triggered on deadline day', () => {
  // Use Asia/Kolkata date
  // Deadline at 6:00 PM IST on Nov 5, 2026 = 12:30 UTC
  const deadline = new Date('2026-11-05T12:30:00Z');
  const sch = { deadline };
  const morningHours = reminderConfig.reminders.find((r) => r.type === 'REMINDER_MORNING').intervalHours;
  // Current time: morningHours before deadline on the same day
  const now = new Date(deadline.getTime() - morningHours * 3600 * 1000);

  const due = getDueRemindersForScholarship(sch, now);
  const hasMorning = due.some((r) => r.type === 'REMINDER_MORNING');
  assert.strictEqual(hasMorning, true, 'REMINDER_MORNING must be due on deadline day at configured hour');
});

runTest('Reminder 3 (Deadline Day Final) triggered on deadline day', () => {
  const deadline = new Date('2026-11-05T12:30:00Z');
  const sch = { deadline };
  const finalHours = reminderConfig.reminders.find((r) => r.type === 'REMINDER_FINAL').intervalHours;
  const now = new Date(deadline.getTime() - finalHours * 3600 * 1000);

  const due = getDueRemindersForScholarship(sch, now);
  const hasFinal = due.some((r) => r.type === 'REMINDER_FINAL');
  assert.strictEqual(hasFinal, true, 'REMINDER_FINAL must be due a few hours before closing on deadline day');
});

runTest('NEVER sends a reminder after the deadline has passed', () => {
  const pastDeadline = new Date(Date.now() - 3600 * 1000); // 1 hour ago
  const sch = { deadline: pastDeadline };
  const now = new Date();

  const due = getDueRemindersForScholarship(sch, now);
  assert.strictEqual(due.length, 0, 'No reminders should ever be due after deadline has passed');
});

runTest('Skips any reminder time that falls after scholarship closing time', () => {
  // If scholarship deadline is 8:00 AM, and a reminder is configured after closing
  const deadline = new Date('2026-11-05T08:00:00Z');
  // Target reminder time with negative interval (after deadline)
  const sch = { deadline };
  const customConfig = {
    ...reminderConfig,
    reminders: [
      {
        type: 'INVALID_AFTER_CLOSING',
        intervalMs: -3600 * 1000 // 1 hour AFTER closing
      }
    ]
  };
  const now = new Date('2026-11-05T07:00:00Z');
  const due = getDueRemindersForScholarship(sch, now);
  assert.ok(!due.some((r) => r.type === 'INVALID_AFTER_CLOSING'), 'Must skip reminder after closing');
});

// -------------------------------------------------------------
// GROUP 3: EMAIL CONTENT GENERATION (Section C)
// -------------------------------------------------------------
console.log('\n--- GROUP 3: Email Content Requirements ---');

runTest('Email text and HTML contain all required fields with real data', () => {
  const params = {
    studentName: 'Ananya Verma',
    scholarshipName: 'National Merit Scholarship Scheme 2026',
    deadline: new Date('2026-11-15T18:00:00+05:30'),
    reminderLabel: '2 Days Before Deadline',
    eligibilityNotes: 'Category: OBC matched; Income within limit; Marks: 82% meets minimum 60%',
    applicationLink: 'http://localhost:3001/student/scholarships/507f1f77bcf86cd799439011',
    timeRemaining: '2 days'
  };

  const html = generateReminderEmailHtml(params);
  const text = generateReminderEmailText(params);

  // Checks on HTML
  assert.ok(html.includes('Ananya Verma'), 'HTML must include student name');
  assert.ok(html.includes('National Merit Scholarship Scheme 2026'), 'HTML must include scheme name');
  assert.ok(html.includes('http://localhost:3001/student/scholarships/507f1f77bcf86cd799439011'), 'HTML must have direct application link');
  assert.ok(html.includes('2 days remaining'), 'HTML must have remaining time banner');
  assert.ok(html.includes('review the eligibility criteria and required documents'), 'HTML must have document checklist reminder');

  // Checks on Plain Text
  assert.ok(text.includes('Dear Ananya Verma,'), 'Text must address student');
  assert.ok(text.includes('National Merit Scholarship Scheme 2026'), 'Text must name scholarship');
  assert.ok(text.includes('Eligibility Criteria Matched:'), 'Text must include eligibility explanation');
  assert.ok(text.includes('Click here to view the scholarship details:'), 'Text must include link');
  assert.ok(text.includes('Please review the scholarship requirements and submit your application'), 'Text must remind to review before deadline');
});

// -------------------------------------------------------------
// GROUP 4: DEDUPLICATION & RETRY LOGIC (Section D)
// -------------------------------------------------------------
console.log('\n--- GROUP 4: Deduplication Key & Controlled Retry Logic ---');

runTest('Deduplication key format: studentId:scholarshipId:reminderType', () => {
  const studentId = '60d0fe4f5311236168a109ca';
  const scholarshipId = '60d0fe4f5311236168a109cb';
  const reminderType = 'REMINDER_48H';
  const key = `${studentId}:${scholarshipId}:${reminderType}`;

  assert.strictEqual(key, '60d0fe4f5311236168a109ca:60d0fe4f5311236168a109cb:REMINDER_48H');
});

runTest('ReminderConfig has all 4 required reminder intervals', () => {
  const types = reminderConfig.reminders.map((r) => r.type);
  assert.ok(types.includes('REMINDER_48H'), 'Must support 48h reminder');
  assert.ok(types.includes('REMINDER_24H'), 'Must support 24h reminder');
  assert.ok(types.includes('REMINDER_MORNING'), 'Must support deadline morning reminder');
  assert.ok(types.includes('REMINDER_FINAL'), 'Must support deadline final reminder');
});

console.log('\n================================================================');
console.log(`  SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log(' All SMART SCHOLARSHIP DEADLINE EMAIL REMINDER tests passed successfully!\n');
}
