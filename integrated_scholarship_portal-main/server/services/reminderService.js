/**
 * Scholarship Deadline Reminder Service
 *
 * Responsibilities:
 * 1. Identify active students who are ELIGIBLE for each open scholarship.
 * 2. Determine which reminder intervals are due (48h, 24h, deadline-day morning, deadline-day final).
 * 3. Send emails using the existing Nodemailer transporter from emailService.js.
 * 4. Record every attempt in ReminderLog with a unique deduplicationKey.
 * 5. Prevent duplicate sends after server restarts using the deduplicationKey unique index.
 * 6. Retry failed sends up to config.maxRetries without re-creating new log records.
 */

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const Application = require('../models/Application');
const ReminderLog = require('../models/ReminderLog');
const { createTransporter } = require('./emailService');
const reminderConfig = require('../config/reminderConfig');

let cachedTransporter = null;
const getTransporter = async () => {
  if (!cachedTransporter) {
    cachedTransporter = await createTransporter();
  }
  return cachedTransporter;
};

/* ============================================================
   ELIGIBILITY CHECKER
   Uses the same fields that Scholarship.js and User.js define.
   Reads both student profile and existing application details.
   Skips students with missing critical data rather than guessing.
   ============================================================ */

/**
 * Synthesize an effective student profile combining User.profile
 * and their latest Application details from MongoDB (if available).
 */
const getEffectiveStudentDetails = (student, application = null) => {
  const p = student.profile || {};
  const personal = application?.personalDetails || {};
  const academic = application?.academicDetails || {};
  const income = application?.incomeDetails || {};

  return {
    category: (p.category && p.category !== 'General') ? p.category : (personal.category || p.category || ''),
    familyIncome: (p.familyIncome && p.familyIncome > 0) ? p.familyIncome : (income.familyAnnualIncome || p.familyIncome || 0),
    marksPercentage: (p.marksPercentage && p.marksPercentage > 0) ? p.marksPercentage : (academic.previousClassPercentage || p.marksPercentage || 0),
    cgpa: (p.cgpa && p.cgpa > 0) ? p.cgpa : (academic.cgpa || p.cgpa || 0),
    course: p.course || academic.course || '',
    collegeName: p.collegeName || academic.institutionName || '',
    year: p.year || academic.year || '',
    gender: p.gender || personal.gender || '',
    state: p.state || personal.state || ''
  };
};

/**
 * Check if a student User document (and optional application details) is eligible for a Scholarship.
 *
 * @param {Object} student - Mongoose User doc
 * @param {Object} scholarship - Mongoose Scholarship doc
 * @param {Object} [application=null] - Optional Mongoose Application doc
 * @returns {{ eligible: boolean, notes: string }}
 */
const isStudentEligible = (student, scholarship, application = null) => {
  const notes = [];
  const profile = getEffectiveStudentDetails(student, application);

  // --- Category check ---
  if (scholarship.category && scholarship.category !== 'All') {
    const studentCategory = (profile.category || '').trim();
    if (!studentCategory) {
      return { eligible: false, notes: 'Student category not specified in profile or application.' };
    }
    if (studentCategory.toLowerCase() !== scholarship.category.toLowerCase()) {
      return {
        eligible: false,
        notes: `Student category '${studentCategory}' does not match required '${scholarship.category}'.`
      };
    }
    notes.push(`Category: ${studentCategory}`);
  } else {
    notes.push('Category: All eligible');
  }

  // --- Family Income check ---
  if (scholarship.incomeLimit && scholarship.incomeLimit > 0) {
    const familyIncome = profile.familyIncome;
    if (familyIncome === undefined || familyIncome === null || familyIncome <= 0) {
      return { eligible: false, notes: 'Family income not specified in profile or application.' };
    }
    if (familyIncome > scholarship.incomeLimit) {
      return {
        eligible: false,
        notes: `Family income ₹${familyIncome.toLocaleString('en-IN')} exceeds limit ₹${scholarship.incomeLimit.toLocaleString('en-IN')}.`
      };
    }
    notes.push(`Income: ₹${familyIncome.toLocaleString('en-IN')} within limit`);
  }

  // --- Academic Percentage check ---
  if (scholarship.minPercentage && scholarship.minPercentage > 0) {
    const marksPercentage = profile.marksPercentage;
    if (marksPercentage === undefined || marksPercentage === null || marksPercentage <= 0) {
      return { eligible: false, notes: 'Academic percentage not specified in profile or application.' };
    }
    if (marksPercentage < scholarship.minPercentage) {
      return {
        eligible: false,
        notes: `Academic percentage ${marksPercentage}% is below minimum ${scholarship.minPercentage}%.`
      };
    }
    notes.push(`Marks: ${marksPercentage}% meets minimum`);
  }

  // --- CGPA check ---
  if (scholarship.minCgpa && scholarship.minCgpa > 0) {
    const cgpa = profile.cgpa;
    if (cgpa === undefined || cgpa === null || cgpa <= 0) {
      return { eligible: false, notes: 'CGPA not specified in profile or application.' };
    }
    if (cgpa < scholarship.minCgpa) {
      return {
        eligible: false,
        notes: `CGPA ${cgpa} is below minimum required CGPA ${scholarship.minCgpa}.`
      };
    }
    notes.push(`CGPA: ${cgpa} meets minimum`);
  }

  // --- Education Level check ---
  if (scholarship.educationLevel && scholarship.educationLevel !== 'All') {
    const studentCourse = (profile.course || '').toLowerCase();
    if (!studentCourse) {
      return {
        eligible: false,
        notes: `Student course / education level not specified in profile or application for '${scholarship.educationLevel}'.`
      };
    }

    const level = scholarship.educationLevel.toLowerCase();
    let levelMatch = false;

    if (level.includes('undergraduate') || level.includes('ug')) {
      levelMatch = studentCourse.includes('b.tech') || studentCourse.includes('b.e')
        || studentCourse.includes('b.sc') || studentCourse.includes('b.com')
        || studentCourse.includes('b.a') || studentCourse.includes('bba')
        || studentCourse.includes('bca') || studentCourse.includes('ug');
    } else if (level.includes('postgraduate') || level.includes('pg')) {
      levelMatch = studentCourse.includes('m.tech') || studentCourse.includes('m.e')
        || studentCourse.includes('m.sc') || studentCourse.includes('m.com')
        || studentCourse.includes('mba') || studentCourse.includes('mca')
        || studentCourse.includes('pg');
    } else if (level.includes('class 11') || level.includes('class 12')) {
      levelMatch = studentCourse.includes('class 11') || studentCourse.includes('class 12')
        || studentCourse.includes('higher secondary');
    } else if (level.includes('diploma') || level.includes('polytechnic')) {
      levelMatch = studentCourse.includes('diploma') || studentCourse.includes('polytechnic');
    } else if (level.includes('doctorate') || level.includes('ph.d')) {
      levelMatch = studentCourse.includes('ph.d') || studentCourse.includes('doctorate')
        || studentCourse.includes('phd');
    } else {
      levelMatch = true;
    }

    if (!levelMatch) {
      return {
        eligible: false,
        notes: `Student course '${profile.course}' does not match required education level '${scholarship.educationLevel}'.`
      };
    }
    notes.push(`Education Level: ${scholarship.educationLevel} matched`);
  }

  // --- Eligible Courses check (if configured) ---
  if (scholarship.eligibleCourses && scholarship.eligibleCourses.length > 0) {
    const studentCourse = (profile.course || '').toLowerCase();
    if (!studentCourse) {
      return { eligible: false, notes: 'Student course not specified in profile or application.' };
    }
    const courseMatch = scholarship.eligibleCourses.some(
      (c) => studentCourse.includes(c.toLowerCase()) || c.toLowerCase().includes(studentCourse)
    );
    if (!courseMatch) {
      return {
        eligible: false,
        notes: `Student course '${profile.course}' is not in the list of eligible courses for this scheme.`
      };
    }
    notes.push(`Eligible Course: ${profile.course} matched`);
  }

  return { eligible: true, notes: notes.join('; ') };
};

/* ============================================================
   EMAIL CONTENT GENERATOR (Plum + Lavender themed HTML)
   ============================================================ */

/**
 * Generate a responsive HTML email for a scholarship deadline reminder.
 */
const generateReminderEmailHtml = ({
  studentName,
  scholarshipName,
  deadline,
  reminderLabel,
  eligibilityNotes,
  applicationLink,
  timeRemaining
}) => {
  const formattedDeadline = new Date(deadline).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = new Date(deadline).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: reminderConfig.timezone,
    timeZoneName: 'short'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scholarship Deadline Reminder — ${scholarshipName}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#F5F0F7;color:#302A32;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F5F0F7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(73,53,79,0.12);border:1px solid #E4DCE8;">

          <!-- Plum Header -->
          <tr>
            <td style="background:#49354F;padding:28px 24px;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#A88BB5;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">
                National Scholarship Portal &bull; Government of India
              </div>
              <div style="font-size:21px;font-weight:800;color:#FFFFFF;letter-spacing:0.4px;text-transform:uppercase;">
                Scholarship Deadline Reminder
              </div>
              <div style="display:inline-block;background:rgba(168,139,181,0.25);border:1px solid rgba(168,139,181,0.4);border-radius:20px;padding:4px 14px;margin-top:10px;">
                <span style="font-size:11px;font-weight:700;color:#E4DCE8;text-transform:uppercase;letter-spacing:1px;">
                  ${reminderLabel}
                </span>
              </div>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="background:#F5F0F7;padding:14px 24px;border-bottom:1px solid #E4DCE8;text-align:center;">
              <span style="font-size:13px;font-weight:700;color:#49354F;">
                ⏰ ${timeRemaining} remaining before the application deadline closes
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#302A32;">
                Dear ${studentName || 'Student'},
              </p>

              <p style="margin:0 0 20px 0;font-size:14.5px;line-height:1.65;color:#49354F;">
                Based on the details in your profile, you appear to meet the configured eligibility criteria for the following scholarship scheme. Please review the requirements and submit your application before the deadline.
              </p>

              <!-- Scholarship Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F0F7;border:1px solid #E4DCE8;border-radius:10px;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="background:#49354F;padding:10px 16px;">
                    <span style="font-size:12px;font-weight:700;color:#E4DCE8;text-transform:uppercase;letter-spacing:0.8px;">
                      Scholarship Details
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7D7480;width:42%;">Scheme Name:</td>
                        <td style="padding:7px 0;font-size:14px;font-weight:700;color:#302A32;">${scholarshipName}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7D7480;">Application Deadline:</td>
                        <td style="padding:7px 0;font-size:13px;font-weight:700;color:#49354F;">${formattedDeadline}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7D7480;">Closes At:</td>
                        <td style="padding:7px 0;font-size:13px;font-weight:700;color:#49354F;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7D7480;">Time Remaining:</td>
                        <td style="padding:7px 0;">
                          <span style="display:inline-block;background:#A88BB5;color:#FFFFFF;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;">
                            ${timeRemaining}
                          </span>
                        </td>
                      </tr>
                      ${eligibilityNotes ? `<tr>
                        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#7D7480;vertical-align:top;">Eligibility Match:</td>
                        <td style="padding:7px 0;font-size:12.5px;color:#302A32;line-height:1.5;">${eligibilityNotes}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important Note -->
              <div style="background:#F5F0F7;border-left:4px solid #A88BB5;padding:14px 16px;border-radius:4px;margin-bottom:24px;">
                <p style="margin:0;font-size:13.5px;font-weight:600;color:#49354F;line-height:1.5;">
                  📋 Please review the eligibility criteria and required documents before submitting your application. Ensure your income certificate, bonafide certificate, and academic marksheet are ready.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0 20px 0;">
                <a href="${applicationLink}" target="_blank"
                   style="display:inline-block;background:#49354F;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;box-shadow:0 3px 12px rgba(73,53,79,0.35);text-transform:uppercase;letter-spacing:0.5px;">
                  View Scholarship &amp; Apply Now
                </a>
              </div>

              <p style="margin:16px 0 0 0;font-size:12.5px;color:#7D7480;line-height:1.5;text-align:center;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${applicationLink}" target="_blank" style="color:#A88BB5;word-break:break-all;">${applicationLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#302A32;padding:22px 24px;text-align:center;border-top:1px solid #49354F;">
              <p style="margin:0 0 5px 0;font-size:12px;font-weight:700;color:#E4DCE8;text-transform:uppercase;letter-spacing:0.8px;">
                National Scholarship Portal (NSP 2.0)
              </p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#A88BB5;line-height:1.4;">
                Ministry of Electronics &amp; Information Technology / Department of Higher Education<br>Government of India
              </p>
              <div style="height:1px;background:#49354F;margin:10px auto;max-width:400px;"></div>
              <p style="margin:0;font-size:10.5px;color:#7D7480;line-height:1.4;">
                This is an automated reminder from the Scholarship Management System. Please do not reply to this email.<br>
                Reminders are sent only for scholarships for which your profile indicates eligibility. Verify scheme requirements before applying.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generate a clean plain text email for a scholarship deadline reminder.
 */
const generateReminderEmailText = ({
  studentName,
  scholarshipName,
  deadline,
  reminderLabel,
  eligibilityNotes,
  applicationLink,
  timeRemaining
}) => {
  const formattedDeadline = new Date(deadline).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = new Date(deadline).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: reminderConfig.timezone,
    timeZoneName: 'short'
  });

  return `Scholarship Deadline Reminder — ${scholarshipName}
(${reminderLabel})

Dear ${studentName || 'Student'},

Based on the details in your profile, you appear to meet the configured eligibility criteria for ${scholarshipName}.
${eligibilityNotes ? `\nEligibility Criteria Matched: ${eligibilityNotes}\n` : ''}
The application deadline is ${formattedDeadline} at ${formattedTime}.
Time remaining: ${timeRemaining} remaining before the application deadline closes.

Please review the scholarship requirements and submit your application before the deadline if you wish to apply.

Click here to view the scholarship details:
${applicationLink}

This is an automated reminder. Please verify the scheme requirements before submitting your application.

Regards,
Scholarship Management System`;
};

/* ============================================================
   TIME REMAINING FORMATTER
   ============================================================ */

const formatTimeRemaining = (deadlineDate) => {
  const now = new Date();
  const diff = new Date(deadlineDate) - now;
  if (diff <= 0) return 'Deadline has passed';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return `${hours} hours`;
  return `${hours}h ${minutes}m`;
};

/* ============================================================
   CORE REMINDER SENDING FUNCTION
   ============================================================ */

/**
 * Send a single reminder email and record the result in ReminderLog.
 * Uses the deduplicationKey unique constraint to prevent duplicate sends.
 *
 * @param {Object} params
 * @returns {Promise<Object>} result
 */
const sendReminder = async ({
  student,
  scholarship,
  reminderType,
  reminderLabel,
  eligibilityNotes
}) => {
  const deduplicationKey = `${student._id}:${scholarship._id}:${reminderType}`;
  let logDoc = null;

  try {
    // --- Duplicate prevention: check for already-sent log ---
    const existingLog = await ReminderLog.findOne({ deduplicationKey });

    if (existingLog && existingLog.status === 'SENT') {
      console.log(
        `[ReminderService] SKIP (already sent): ${deduplicationKey}`
      );
      return { success: true, duplicatePrevented: true };
    }

    // Use existing FAILED log for retry, or create a new one
    if (existingLog && existingLog.status === 'FAILED') {
      if ((existingLog.retryCount || 0) >= reminderConfig.maxRetries) {
        console.log(
          `[ReminderService] SKIP (max retries reached): ${deduplicationKey}`
        );
        return { success: false, error: 'Max retries exceeded' };
      }
      logDoc = existingLog;
      logDoc.retryCount = (logDoc.retryCount || 0) + 1;
      logDoc.status = 'PENDING';
      logDoc.scheduledAt = new Date();
      await logDoc.save();
    } else if (!existingLog) {
      // Create new log record
      logDoc = await ReminderLog.create({
        studentId: student._id,
        studentEmail: student.email,
        studentName: student.name,
        scholarshipId: scholarship._id,
        scholarshipName: scholarship.name,
        scholarshipDeadline: scholarship.deadline,
        reminderType,
        deduplicationKey,
        status: 'PENDING',
        scheduledAt: new Date(),
        eligibilityNotes
      });
    }

    const deadline = new Date(scholarship.deadline);
    const timeRemaining = formatTimeRemaining(deadline);
    const portalUrl = process.env.STUDENT_PORTAL_URL || 'http://localhost:3001';
    const applicationLink = `${portalUrl}/student/scholarships/${scholarship._id}`;

    const subject = `Scholarship Deadline Reminder — ${scholarship.name}`;
    const htmlContent = generateReminderEmailHtml({
      studentName: student.name,
      scholarshipName: scholarship.name,
      deadline,
      reminderLabel,
      eligibilityNotes,
      applicationLink,
      timeRemaining
    });
    const textContent = generateReminderEmailText({
      studentName: student.name,
      scholarshipName: scholarship.name,
      deadline,
      reminderLabel,
      eligibilityNotes,
      applicationLink,
      timeRemaining
    });

    const senderName = process.env.MAIL_FROM_NAME || 'National Scholarship Portal';
    const senderEmail = process.env.SMTP_USER || 'no-reply@scholarships.gov.in';
    const fromAddress = process.env.MAIL_FROM || `"${senderName}" <${senderEmail}>`;

    // Get shared transporter (validates SMTP credentials on first init)
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: student.email,
      subject,
      text: textContent,
      html: htmlContent
    });

    // Evaluate actual delivery
    const accepted = info.accepted || (info.envelope && info.envelope.to) || [];
    const rejected = info.rejected || [];
    const wasAccepted = Array.isArray(accepted)
      && accepted.some((a) => String(a).toLowerCase().includes(student.email.toLowerCase()));
    const wasRejected = Array.isArray(rejected)
      && rejected.some((a) => String(a).toLowerCase().includes(student.email.toLowerCase()));

    if (wasAccepted && !wasRejected) {
      if (logDoc) {
        logDoc.status = 'SENT';
        logDoc.sentAt = new Date();
        logDoc.messageId = info.messageId || '';
        logDoc.smtpResponse = String(info.response || '250 OK');
        logDoc.errorMessage = null;
        logDoc.errorCode = null;
        await logDoc.save();
      }
      console.log(
        `[ReminderService] ✓ Sent ${reminderType} to ${student.email} for "${scholarship.name}"`
      );
      return { success: true, messageId: info.messageId };
    } else {
      const rejectMsg = `Recipient rejected: ${JSON.stringify(rejected)}`;
      if (logDoc) {
        logDoc.status = 'FAILED';
        logDoc.errorMessage = rejectMsg;
        logDoc.errorCode = 'SMTP_REJECTED';
        await logDoc.save();
      }
      return { success: false, error: rejectMsg };
    }
  } catch (error) {
    console.error(
      `[ReminderService] ✗ Failed to send ${reminderType} to ${student.email}:`,
      error.message
    );
    if (logDoc) {
      try {
        logDoc.status = 'FAILED';
        logDoc.errorMessage = error.message;
        logDoc.errorCode = error.code || 'SEND_ERROR';
        logDoc.smtpResponse = error.response || '';
        await logDoc.save();
      } catch (logErr) {
        console.error('[ReminderService] Failed to update log:', logErr.message);
      }
    }
    return { success: false, error: error.message };
  }
};

/* ============================================================
   SCHEDULE CALCULATOR & TIMEZONE HELPER
   ============================================================ */

/**
 * Format a Date to YYYY-MM-DD in the configured timezone.
 * Used for safe day comparisons without UTC/local time discrepancies.
 */
const getLocalDateString = (date, timeZone) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || reminderConfig.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
};

/**
 * Determine which reminders are currently due for a given scholarship.
 *
 * Rules:
 * - Never send after the deadline has passed.
 * - Skip any reminder time that falls after the scholarship closing time.
 * - For deadline-day-only reminders, verify today is the deadline day in the configured timezone.
 * - Match against the configured reminder intervals within the window.
 *
 * @param {Object} scholarship - Scholarship document
 * @param {Date} [now=new Date()]
 * @param {Object} [options={}]
 * @returns {Array<Object>} due reminders
 */
const getDueRemindersForScholarship = (scholarship, now = new Date(), options = {}) => {
  const deadline = new Date(scholarship.deadline);
  const msToDeadline = deadline.getTime() - now.getTime();

  // Never send a reminder after the deadline has passed
  if (msToDeadline <= 0) {
    return [];
  }

  const timezone = reminderConfig.timezone || 'Asia/Kolkata';
  const nowDayStr = getLocalDateString(now, timezone);
  const deadlineDayStr = getLocalDateString(deadline, timezone);
  const isDeadlineDay = nowDayStr === deadlineDayStr;

  return reminderConfig.reminders.filter((reminder) => {
    // If testing / force option specifies a particular reminder type
    if (options.forceReminderType && options.forceReminderType === reminder.type) {
      return true;
    }

    // For deadline-day-only reminders, ensure today is actually the deadline day in the configured timezone
    if (reminder.deadlineDayOnly && !isDeadlineDay) {
      return false;
    }

    const intervalMs = reminder.intervalMs || (reminder.intervalHours * 3600 * 1000);
    const targetReminderTime = new Date(deadline.getTime() - intervalMs);

    // If the reminder target time falls after the closing time, skip it
    if (targetReminderTime.getTime() >= deadline.getTime()) {
      return false;
    }

    // If options.force is set (e.g. manual admin trigger for all due/upcoming), check future window
    if (options.force) {
      return true;
    }

    // Window check: is current time within windowMs of the target reminder time?
    const diff = Math.abs(now.getTime() - targetReminderTime.getTime());
    return diff <= reminderConfig.windowMs;
  });
};

/* ============================================================
   MAIN SCHEDULER RUNNER
   Called by the cron job every hour or manually via Admin API.
   ============================================================ */

/**
 * Process all eligible scholarships and students, sending due reminders.
 * This function is safe to call repeatedly — duplicate prevention is handled
 * at the ReminderLog model level.
 *
 * @param {Object} [options={}] - Optional overrides (force, scholarshipId, studentId)
 * @returns {Promise<Object>} Summary counts
 */
const processScheduledReminders = async (options = {}) => {
  const now = new Date();
  console.log(`\n[ReminderScheduler] Starting reminder run at ${now.toISOString()}`);

  try {
    const scholarshipQuery = {
      status: 'Active',
      deadline: { $gt: now }
    };
    if (options.scholarshipId) {
      scholarshipQuery._id = options.scholarshipId;
    }

    // Find active scholarships with future deadlines
    const activeScholarships = await Scholarship.find(scholarshipQuery);

    if (activeScholarships.length === 0) {
      console.log('[ReminderScheduler] No active scholarships with future deadlines found.');
      return { success: true, totalSent: 0, totalSkipped: 0, totalFailed: 0, count: 0 };
    }

    console.log(`[ReminderScheduler] Found ${activeScholarships.length} active scholarship(s) to check.`);

    // Find all active student users
    const studentQuery = {
      role: 'STUDENT',
      status: 'Active',
      email: { $exists: true, $ne: '' }
    };
    if (options.studentId) {
      studentQuery._id = options.studentId;
    }

    const students = await User.find(studentQuery);

    if (students.length === 0) {
      console.log('[ReminderScheduler] No active students found.');
      return { success: true, totalSent: 0, totalSkipped: 0, totalFailed: 0, count: 0 };
    }

    console.log(`[ReminderScheduler] Checking ${students.length} active student(s).`);

    let totalSent = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const scholarship of activeScholarships) {
      // Determine due reminders for this scholarship
      const dueReminders = getDueRemindersForScholarship(scholarship, now, options);

      if (dueReminders.length === 0) {
        continue;
      }

      console.log(
        `[ReminderScheduler] Scholarship: "${scholarship.name}" — due reminders: ${dueReminders.map((r) => r.type).join(', ')}`
      );

      // Get students who have already applied for this scholarship (skip them if configured)
      let appliedStudentIds = new Set();
      if (reminderConfig.skipIfApplied) {
        const existingApps = await Application.find({
          scholarshipId: scholarship._id,
          status: { $nin: ['REJECTED'] }
        }).select('studentId');
        appliedStudentIds = new Set(existingApps.map((a) => String(a.studentId)));
      }

      for (const student of students) {
        // Skip required profile fields check
        const missingField = reminderConfig.minProfileFields.find((f) => !student[f]);
        if (missingField) {
          totalSkipped++;
          continue;
        }

        // Skip if already applied
        if (appliedStudentIds.has(String(student._id))) {
          totalSkipped++;
          continue;
        }

        // Read student's existing application details from MongoDB to complement profile
        const latestApp = await Application.findOne({ studentId: student._id }).sort({ createdAt: -1 });

        // Check eligibility with student profile and existing application details
        const { eligible, notes } = isStudentEligible(student, scholarship, latestApp);
        if (!eligible) {
          totalSkipped++;
          continue;
        }

        // Send each due reminder
        for (const reminder of dueReminders) {
          const result = await sendReminder({
            student,
            scholarship,
            reminderType: reminder.type,
            reminderLabel: reminder.label,
            eligibilityNotes: notes
          });

          if (result.duplicatePrevented) {
            totalSkipped++;
          } else if (result.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        }
      }
    }

    console.log(
      `[ReminderScheduler] Run complete — Sent: ${totalSent}, Skipped/Dedup: ${totalSkipped}, Failed: ${totalFailed}\n`
    );

    return {
      success: true,
      totalSent,
      totalSkipped,
      totalFailed
    };
  } catch (error) {
    console.error('[ReminderScheduler] Fatal error during reminder run:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get scholarships the given student is eligible for.
 * Used by the API endpoint to power the frontend "Eligible Scholarships" widget.
 *
 * @param {Object} student - Mongoose User document
 * @returns {Promise<Array>}
 */
const getEligibleScholarshipsForStudent = async (student) => {
  const now = new Date();
  const activeScholarships = await Scholarship.find({
    status: 'Active',
    deadline: { $gt: now }
  }).sort({ deadline: 1 });

  // Get already-applied scholarship IDs for this student
  const existingApps = await Application.find({
    studentId: student._id,
    status: { $nin: ['REJECTED'] }
  }).select('scholarshipId');
  const appliedIds = new Set(existingApps.map((a) => String(a.scholarshipId)));

  // Read student's existing application details if available
  const latestApp = await Application.findOne({ studentId: student._id }).sort({ createdAt: -1 });

  const eligible = [];
  for (const scholarship of activeScholarships) {
    const { eligible: isEligible, notes } = isStudentEligible(student, scholarship, latestApp);
    if (isEligible) {
      eligible.push({
        scholarship,
        eligibilityNotes: notes,
        alreadyApplied: appliedIds.has(String(scholarship._id))
      });
    }
  }

  return eligible;
};

module.exports = {
  isStudentEligible,
  getEffectiveStudentDetails,
  getDueRemindersForScholarship,
  generateReminderEmailText,
  generateReminderEmailHtml,
  sendReminder,
  processScheduledReminders,
  getEligibleScholarshipsForStudent
};
