const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const EmailLog = require('../models/EmailLog');
const Sanction = require('../models/Sanction');
const Application = require('../models/Application');

/**
 * Creates and configures Nodemailer transporter based on .env
 * Ensures correct Gmail SMTP configuration without mixing port and secure settings.
 */
const createTransporter = async (options = {}) => {
  // If in automated test mode and credentials are not in .env, use ethereal test SMTP server or jsonTransport
  if (options.useTestAccount || (process.env.NODE_ENV === 'test' && !process.env.SMTP_USER)) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      // Offline fallback for sandboxed test execution
      return nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  const host = options.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(options.port || process.env.SMTP_PORT, 10) || 465;
  // Port 465 must use secure: true; Port 587 must use secure: false
  const secure = options.secure !== undefined ? options.secure : (port === 465 ? true : (process.env.SMTP_SECURE === 'true'));
  const user = (options.user !== undefined ? options.user : (process.env.SMTP_USER || '')).trim();
  // Support 16-character Gmail App Passwords (stripping any accidental spaces)
  const pass = (options.pass !== undefined ? options.pass : (process.env.SMTP_PASSWORD || '')).replace(/\s+/g, '');

  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASSWORD');
    throw new Error(`SMTP configuration incomplete: Missing ${missing.join(', ')} in server/.env`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    // Helpful options for resilient SMTP handshake
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

/**
 * Generates responsive government-style HTML email template
 */
const generateSanctionApprovedEmailHtml = ({
  studentName,
  applicationNumber,
  scholarshipName,
  institutionName,
  sanctionNumber,
  sanctionDate,
  sanctionedAmount,
  sanctioningOfficer,
  trackingUrl
}) => {
  const formattedAmount = Number(sanctionedAmount || 0).toLocaleString('en-IN');
  const formattedDate = sanctionDate
    ? new Date(sanctionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scholarship Sanction Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Government Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 28px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 13px; font-weight: 700; color: #93c5fd; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                      Government of India &bull; Direct Benefit Transfer
                    </div>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">
                      NATIONAL SCHOLARSHIP PORTAL
                    </div>
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 4px 14px; margin-top: 10px;">
                      <span style="font-size: 11px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                        Official Sanction Dispatch
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; border-bottom: 1px solid #e2e8f0; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">
                SCHOLARSHIP SANCTION APPROVED
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
                Dear ${studentName || 'Student'},
              </p>

              <!-- Main message -->
              <p style="margin: 0 0 20px 0; font-size: 14.5px; line-height: 1.6; color: #334155;">
                We are pleased to inform you that your scholarship application has been successfully approved and sanctioned.
              </p>

              <!-- Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="background-color: #1e3a8a; padding: 10px 16px;">
                    <span style="font-size: 12px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.8px;">
                      Official Scholarship Summary
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b; width: 42%;">Student Name:</td>
                        <td style="padding: 6px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Application Number:</td>
                        <td style="padding: 6px 0; font-size: 13.5px; font-weight: 700; color: #1e40af;">${applicationNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Scholarship Scheme:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${scholarshipName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Institution:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${institutionName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Sanction Number:</td>
                        <td style="padding: 6px 0; font-size: 13.5px; font-weight: 800; color: #1e3a8a;">${sanctionNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Sanction Date:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Sanctioned Amount:</td>
                        <td style="padding: 6px 0; font-size: 16px; font-weight: 800; color: #059669;">₹${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Status:</td>
                        <td style="padding: 6px 0;">
                          <span style="display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11.5px; font-weight: 800; padding: 3px 10px; border-radius: 4px; border: 1px solid #86efac; text-transform: uppercase;">
                            SANCTIONED
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b;">Sanctioning Officer:</td>
                        <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${sanctioningOfficer}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Note -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13.5px; font-weight: 600; color: #1e40af; line-height: 1.5;">
                  📎 Your official Scholarship Sanction Order is attached to this email for your records.
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
                  File: Sanction_Order_${sanctionNumber}.pdf
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  VIEW APPLICATION STATUS
                </a>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 12.5px; color: #64748b; line-height: 1.5; text-align: center;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${trackingUrl}" target="_blank" style="color: #2563eb; word-break: break-all;">${trackingUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.8px;">
                National Scholarship Portal (NSP 2.0)
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                Ministry of Electronics & Information Technology / Department of Higher Education<br>
                Government of India
              </p>
              <div style="height: 1px; background-color: #334155; margin: 12px auto; max-width: 400px;"></div>
              <p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.4;">
                This is an automated statutory dispatch from the National Scholarship Management System. Please do not reply directly to this email.<br>
                For grievance redressal or queries, please log in to the National Scholarship Portal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Sends automated Sanction Approved email to applicant with Sanction Order PDF attached.
 * Features:
 * - Duplicate prevention via eventKey (SANCTION_APPROVED:sanctionNumber)
 * - Verifies SMTP connection before sending
 * - Validates PDF attachment exists
 * - Logs detailed debug output
 * - Updates EmailLog to SENT only when SMTP accepts the message
 * - Updates EmailLog to FAILED with error details if rejected or network fails
 * - Safe error handling: never throws unhandled errors to protect the sanction transaction
 *
 * @param {Object} params
 * @returns {Promise<Object>} Result object { success: boolean, emailLog: Object, duplicatePrevented?: boolean, error?: string }
 */
const sendSanctionApprovedEmail = async ({
  studentName,
  studentEmail,
  applicationNumber,
  scholarshipName,
  institutionName,
  sanctionNumber,
  sanctionDate,
  sanctionedAmount,
  sanctioningOfficer,
  pdfPath,
  trackingUrl,
  applicationId,
  studentId,
  sanctionId,
  isResend = false,
  existingLogId = null
}) => {
  const eventKey = `SANCTION_APPROVED:${sanctionNumber}`;
  let emailLog = null;

  try {
    if (!sanctionNumber) {
      throw new Error('Sanction number is required to send sanction approved email.');
    }

    if (!studentEmail) {
      throw new Error(`Student email is missing for sanction ${sanctionNumber}.`);
    }

    // 1. Duplicate Prevention: only one successful initial email allowed
    if (!isResend) {
      const existingSentLog = await EmailLog.findOne({
        eventKey,
        status: 'SENT'
      });

      if (existingSentLog) {
        console.log(`[EmailService] Sanction email already sent for event key ${eventKey} to ${studentEmail}. Skipping duplicate dispatch.`);
        return {
          success: true,
          duplicatePrevented: true,
          emailLog: existingSentLog,
          message: 'Duplicate email prevented. Email already sent for this sanction.'
        };
      }
    }

    // 2. Validate PDF attachment exists on disk
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw new Error('Sanction Order PDF not found');
    }

    const attachmentFileName = `Sanction_Order_${sanctionNumber}.pdf`;
    const subject = `Scholarship Sanction Approved — ${sanctionNumber}`;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT, 10) || 465;

    // 3. Create or load EmailLog in PENDING status
    if (existingLogId) {
      emailLog = await EmailLog.findById(existingLogId);
      if (emailLog) {
        emailLog.status = 'PENDING';
        emailLog.sentAt = new Date();
        emailLog.attachmentName = attachmentFileName;
        emailLog.attachmentPath = pdfPath;
        await emailLog.save();
      }
    }

    if (!emailLog) {
      emailLog = await EmailLog.create({
        recipient: studentEmail,
        emailType: 'SANCTION_APPROVED',
        eventKey,
        applicationId,
        applicationNumber: applicationNumber || '',
        studentId,
        studentName: studentName || '',
        sanctionId,
        sanctionNumber,
        subject,
        attachmentName: attachmentFileName,
        attachmentPath: pdfPath,
        status: 'PENDING',
        sentAt: new Date(),
        retryCount: 0
      });
    }

    // 4. Log detailed debug information
    console.log('\n====================================================');
    console.log('[SANCTION EMAIL]');
    console.log('Recipient:', studentEmail);
    console.log('Subject:', subject);
    console.log('PDF:', pdfPath);
    console.log('SMTP Host:', host);
    console.log('SMTP Port:', port);

    // 5. Build and verify SMTP transporter
    const transporter = await createTransporter();

    if (transporter.options && transporter.options.host) {
      try {
        await transporter.verify();
        console.log('\n[SMTP]');
        console.log('Connection: SUCCESS');
      } catch (verifyErr) {
        console.log('\n[SMTP]');
        console.log('Connection: FAILED');
        console.error('Error:', verifyErr.message);
        console.error('Error Code:', verifyErr.code || verifyErr.responseCode || 'N/A');
        if (verifyErr.command) console.error('Command:', verifyErr.command);
        if (verifyErr.response) console.error('Response:', verifyErr.response);
        throw verifyErr;
      }
    } else {
      console.log('\n[SMTP]');
      console.log('Connection: SUCCESS (Test Environment)');
    }

    // 6. Construct email message options
    const effectiveTrackingUrl =
      trackingUrl ||
      `${process.env.STUDENT_PORTAL_URL || 'http://localhost:3001'}/student/applications/${applicationNumber || applicationId}`;

    const htmlContent = generateSanctionApprovedEmailHtml({
      studentName,
      applicationNumber,
      scholarshipName,
      institutionName,
      sanctionNumber,
      sanctionDate,
      sanctionedAmount,
      sanctioningOfficer,
      trackingUrl: effectiveTrackingUrl
    });

    const senderName = process.env.MAIL_FROM_NAME || 'National Scholarship Portal';
    const senderEmail = process.env.SMTP_USER || 'no-reply@scholarships.gov.in';
    const fromAddress = process.env.MAIL_FROM || `"${senderName}" <${senderEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to: studentEmail,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: attachmentFileName,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    };

    // 7. Send mail and wait for actual SMTP response
    const info = await transporter.sendMail(mailOptions);

    console.log('\n[EMAIL]');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted || info.envelope?.to);
    console.log('Rejected:', info.rejected || []);
    console.log('Response:', info.response || '250 OK');
    console.log('====================================================\n');

    // 8. Determine if delivery succeeded based on accepted / rejected lists
    const acceptedRecipients = info.accepted || (info.envelope && info.envelope.to) || [];
    const rejectedRecipients = info.rejected || [];

    const wasAccepted =
      Array.isArray(acceptedRecipients) &&
      acceptedRecipients.some((addr) => String(addr).toLowerCase().includes(studentEmail.toLowerCase()));
    const wasRejected =
      Array.isArray(rejectedRecipients) &&
      rejectedRecipients.some((addr) => String(addr).toLowerCase().includes(studentEmail.toLowerCase()));

    if (wasAccepted && !wasRejected) {
      emailLog.status = 'SENT';
      emailLog.messageId = info.messageId || '';
      emailLog.smtpResponse = String(info.response || '250 OK');
      emailLog.sentAt = new Date();
      emailLog.errorMessage = null;
      emailLog.errorCode = null;
      await emailLog.save();

      return {
        success: true,
        emailLog,
        messageId: info.messageId,
        smtpResponse: info.response
      };
    } else {
      const rejectMsg = `Recipient rejected by SMTP server: ${JSON.stringify(info.rejected)}`;
      emailLog.status = 'FAILED';
      emailLog.messageId = info.messageId || '';
      emailLog.smtpResponse = String(info.response || '');
      emailLog.errorMessage = rejectMsg;
      emailLog.errorCode = 'SMTP_REJECTED';
      await emailLog.save();

      return {
        success: false,
        error: rejectMsg,
        emailLog
      };
    }
  } catch (error) {
    console.log('\n[EMAIL] Send Failed:');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code || error.responseCode || 'N/A');
    if (error.command) console.error('Command:', error.command);
    if (error.response) console.error('Response:', error.response);
    console.log('====================================================\n');

    // Update EmailLog to FAILED with exact error details
    if (emailLog) {
      emailLog.status = 'FAILED';
      emailLog.errorMessage = error.message;
      emailLog.errorCode = error.code || error.responseCode || 'SMTP_ERROR';
      emailLog.smtpResponse = error.response || '';
      await emailLog.save();
    } else {
      try {
        emailLog = await EmailLog.create({
          recipient: studentEmail || 'unknown',
          emailType: 'SANCTION_APPROVED',
          eventKey: `SANCTION_APPROVED:${sanctionNumber || 'UNKNOWN'}`,
          applicationId,
          applicationNumber: applicationNumber || '',
          studentId,
          studentName: studentName || '',
          sanctionId,
          sanctionNumber: sanctionNumber || 'UNKNOWN',
          subject: `Scholarship Sanction Approved — ${sanctionNumber || 'UNKNOWN'}`,
          attachmentName: `Sanction_Order_${sanctionNumber || 'UNKNOWN'}.pdf`,
          attachmentPath: pdfPath || '',
          status: 'FAILED',
          sentAt: new Date(),
          errorMessage: error.message,
          errorCode: error.code || error.responseCode || 'SMTP_ERROR',
          smtpResponse: error.response || '',
          retryCount: 0
        });
      } catch (logErr) {
        console.error('[EmailService] Failed to record failed email log:', logErr.message);
      }
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code || error.responseCode || 'SMTP_ERROR',
      emailLog
    };
  }
};

/**
 * Resends a previously logged email dispatch (triggered via Admin Resend action)
 * @param {string} emailLogId
 * @returns {Promise<Object>}
 */
const retrySanctionApprovedEmail = async (emailLogId) => {
  const log = await EmailLog.findById(emailLogId)
    .populate('sanctionId')
    .populate('applicationId');

  if (!log) {
    throw new Error('Email log record not found');
  }

  const { getSanctionOrderPdfPath, generateSanctionOrderPdf } = require('./pdfService');
  let pdfPath = log.attachmentPath;

  // 1. Locate existing or regenerate official Sanction Order PDF
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    const Sanction = require('../models/Sanction');
    const sanctionDoc =
      log.sanctionId ||
      (await Sanction.findById(log.sanctionId)) ||
      (await Sanction.findOne({ sanctionNumber: log.sanctionNumber }));

    if (!sanctionDoc) {
      throw new Error(`Associated Sanction record ${log.sanctionNumber} not found to generate PDF.`);
    }
    pdfPath = await generateSanctionOrderPdf(sanctionDoc);
  }

  const Application = require('../models/Application');
  const appDoc = log.applicationId || (await Application.findById(log.applicationId));

  // Increment retry count
  log.retryCount = (log.retryCount || 0) + 1;
  await log.save();

  // 2. Dispatch real email via sendSanctionApprovedEmail with isResend = true
  const result = await sendSanctionApprovedEmail({
    studentName: log.studentName || appDoc?.studentName,
    studentEmail: log.recipient,
    applicationNumber: log.applicationNumber || appDoc?.applicationNumber,
    scholarshipName: appDoc?.scholarshipName || 'Scholarship Scheme',
    institutionName: appDoc?.institutionName || '',
    sanctionNumber: log.sanctionNumber,
    sanctionDate: log.sentAt,
    sanctionedAmount: appDoc?.approvedAmount,
    sanctioningOfficer: 'Department Nodal Authority',
    pdfPath,
    applicationId: log.applicationId,
    studentId: log.studentId,
    sanctionId: log.sanctionId,
    isResend: true,
    existingLogId: log._id
  });

  return {
    success: result.success,
    emailLog: result.emailLog || log,
    error: result.error,
    errorCode: result.errorCode
  };
};

module.exports = {
  sendSanctionApprovedEmail,
  retrySanctionApprovedEmail,
  generateSanctionApprovedEmailHtml,
  createTransporter
};
