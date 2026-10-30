const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/**
 * Record an immutable audit log entry
 */
const recordAuditLog = async ({
  applicationId,
  applicationNumber,
  previousStatus,
  newStatus,
  changedBy,
  officerName,
  officerRole,
  remarks,
  metadata
}) => {
  try {
    const log = await AuditLog.create({
      applicationId,
      applicationNumber,
      previousStatus: previousStatus || 'UNKNOWN',
      newStatus,
      changedBy: changedBy || null,
      officerName: officerName || 'System Automated',
      officerRole: officerRole || 'SYSTEM',
      remarks: remarks || '',
      metadata: metadata || {},
      timestamp: new Date()
    });
    return log;
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

/**
 * Create a notification for a user or role
 */
const createNotification = async ({
  userId,
  recipientRole,
  institutionId,
  departmentId,
  title,
  message,
  type = 'info',
  applicationNumber = '',
  link = ''
}) => {
  try {
    return await Notification.create({
      userId: userId || null,
      recipientRole: recipientRole || 'STUDENT',
      institutionId: institutionId || null,
      departmentId: departmentId || null,
      title,
      message,
      type,
      applicationNumber,
      link,
      isRead: false
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  recordAuditLog,
  createNotification
};
