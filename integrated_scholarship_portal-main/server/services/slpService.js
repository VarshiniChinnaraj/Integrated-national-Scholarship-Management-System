const mongoose = require('mongoose');
const SLPTracking = require('../models/SLPTracking');
const Application = require('../models/Application');
const { recordAuditLog, createNotification } = require('../utils/auditHelper');
const { broadcastSlpEvent } = require('../utils/socketManager');
const {
  getSlpConfig,
  getSlpModeKey,
  STAGE_OFFICER_MAPPING,
  getStageSlaSeconds,
  getStageWarningSeconds,
  calculateSlaDeadline,
  formatDuration
} = require('../config/slpConfig');

/**
 * Start or transition SLP tracking for a given stage
 */
const startStage = async (application, stageKey, officerInfo = {}) => {
  try {
    if (!application || !stageKey) return null;

    const appId = application._id;
    const appNumber = application.applicationNumber;
    const stageMeta = STAGE_OFFICER_MAPPING[stageKey] || {
      stageName: stageKey,
      role: 'SYSTEM',
      desc: '',
      escalatedTo: 'ADMIN'
    };

    const slaDuration = getStageSlaSeconds(stageKey);
    const stageStartedAt = new Date();
    const slaDeadline = calculateSlaDeadline(stageStartedAt, stageKey);

    let tracking = await SLPTracking.findOne({
      $or: [{ applicationId: appId }, { applicationNumber: appNumber }]
    });

    if (!tracking) {
      tracking = new SLPTracking({
        applicationId: appId,
        applicationNumber: appNumber,
        currentStage: stageKey,
        stageStartedAt,
        stageCompletedAt: null,
        slaDuration,
        slaDeadline,
        slaStatus: 'WITHIN_SLA',
        elapsedTime: 0,
        escalationLevel: 0,
        escalationStatus: 'NONE',
        assignedRole: stageMeta.role,
        assignedUser: officerInfo?.id || null,
        assignedOfficerName: officerInfo?.name || '',
        institutionId: application.institutionId || null,
        departmentId: application.departmentId || null,
        studentId: application.studentId || null,
        studentName: application.studentName || application.personalDetails?.fullName || '',
        institutionName: application.institutionName || '',
        departmentName: application.departmentName || '',
        scholarshipName: application.scholarshipName || '',
        stageHistory: [],
        escalationHistory: []
      });
    } else {
      tracking.currentStage = stageKey;
      tracking.stageStartedAt = stageStartedAt;
      tracking.stageCompletedAt = null;
      tracking.slaDuration = slaDuration;
      tracking.slaDeadline = slaDeadline;
      tracking.slaStatus = 'WITHIN_SLA';
      tracking.elapsedTime = 0;
      tracking.escalationLevel = 0;
      tracking.escalationStatus = 'NONE';
      tracking.assignedRole = stageMeta.role;
      if (officerInfo?.id) tracking.assignedUser = officerInfo.id;
      if (officerInfo?.name) tracking.assignedOfficerName = officerInfo.name;
      if (application.institutionName) tracking.institutionName = application.institutionName;
      if (application.departmentName) tracking.departmentName = application.departmentName;
    }

    await tracking.save();

    // Record SLP Stage Start Audit Log
    await recordAuditLog({
      applicationId: appId,
      applicationNumber: appNumber,
      previousStatus: tracking.currentStage,
      newStatus: stageKey,
      changedBy: officerInfo?.id || null,
      officerName: officerInfo?.name || 'SLP Automation Engine',
      officerRole: officerInfo?.role || 'SYSTEM',
      remarks: `SLP timer initiated for stage: "${stageMeta.stageName || stageKey}". SLA: ${formatDuration(slaDuration)} (${getSlpConfig().label}).`,
      metadata: {
        stage: stageKey,
        slaDuration,
        slaDeadline,
        slpMode: getSlpModeKey()
      }
    });

    // Broadcast WebSocket Event
    broadcastSlpEvent('slp_stage_started', {
      applicationId: appId,
      applicationNumber: appNumber,
      currentStage: stageKey,
      stageName: stageMeta.stageName,
      stageStartedAt,
      slaDeadline,
      slaDuration,
      slaStatus: 'WITHIN_SLA',
      slpMode: getSlpModeKey()
    });

    return tracking;
  } catch (error) {
    console.error('[SLP Service] Error in startStage:', error);
    return null;
  }
};

/**
 * Complete the current stage and record its history
 */
const completeStage = async (applicationId, stageKey, officerInfo = {}, actionType = 'VERIFY') => {
  try {
    const tracking = await SLPTracking.findOne({
      $or: [
        { applicationId: applicationId },
        { applicationNumber: String(applicationId) }
      ]
    });

    if (!tracking) return null;

    const completedAt = new Date();
    const elapsedSeconds = Math.max(0, (completedAt.getTime() - tracking.stageStartedAt.getTime()) / 1000);
    const wasBreached = tracking.slaStatus === 'SLA_BREACHED' || elapsedSeconds > tracking.slaDuration;
    const finalSlaStatus = wasBreached ? 'COMPLETED_AFTER_SLA' : 'COMPLETED_WITHIN_SLA';

    const stageMeta = STAGE_OFFICER_MAPPING[stageKey] || { stageName: stageKey };

    // Record to stage history
    tracking.stageHistory.push({
      stage: stageKey,
      stageName: stageMeta.stageName || stageKey,
      startedAt: tracking.stageStartedAt,
      completedAt,
      slaDuration: tracking.slaDuration,
      slaDeadline: tracking.slaDeadline,
      slaStatus: finalSlaStatus,
      elapsedSeconds,
      officerName: officerInfo?.name || tracking.assignedOfficerName || 'Authorized Officer',
      officerRole: officerInfo?.role || tracking.assignedRole || 'OFFICER',
      action: actionType,
      remarks: officerInfo?.remarks || (wasBreached ? 'Processed after SLA breach.' : 'Processed within SLA.')
    });

    tracking.stageCompletedAt = completedAt;
    tracking.slaStatus = finalSlaStatus;
    tracking.elapsedTime = elapsedSeconds;
    await tracking.save();

    // Record Audit Log
    const auditAction = wasBreached ? 'SLP_COMPLETED_AFTER_SLA' : 'SLP_STAGE_COMPLETED';
    await recordAuditLog({
      applicationId: tracking.applicationId,
      applicationNumber: tracking.applicationNumber,
      previousStatus: stageKey,
      newStatus: finalSlaStatus,
      changedBy: officerInfo?.id || null,
      officerName: officerInfo?.name || 'Processing Officer',
      officerRole: officerInfo?.role || tracking.assignedRole,
      remarks: `Stage "${stageMeta.stageName || stageKey}" ${wasBreached ? 'COMPLETED AFTER SLA BREACH' : 'COMPLETED WITHIN SLA'}. Processing time: ${formatDuration(elapsedSeconds)} (SLA: ${formatDuration(tracking.slaDuration)}).`,
      metadata: {
        stage: stageKey,
        elapsedSeconds,
        slaDuration: tracking.slaDuration,
        finalSlaStatus
      }
    });

    // Broadcast WebSocket Event
    broadcastSlpEvent('slp_stage_completed', {
      applicationId: tracking.applicationId,
      applicationNumber: tracking.applicationNumber,
      stage: stageKey,
      finalSlaStatus,
      elapsedSeconds,
      officerName: officerInfo?.name,
      completedAt
    });

    return tracking;
  } catch (error) {
    console.error('[SLP Service] Error in completeStage:', error);
    return null;
  }
};

/**
 * Background Heartbeat: Check active stages for Warning & Breach
 */
const checkActiveSLAs = async () => {
  try {
    const activeTrackings = await SLPTracking.find({
      stageCompletedAt: null,
      currentStage: { $nin: ['DISBURSED', 'REJECTED'] }
    });

    if (!activeTrackings || activeTrackings.length === 0) return;

    const now = Date.now();

    for (const tracking of activeTrackings) {
      const startMs = tracking.stageStartedAt.getTime();
      const elapsedSeconds = Math.max(0, (now - startMs) / 1000);
      tracking.elapsedTime = elapsedSeconds;

      const slaDuration = tracking.slaDuration;
      const warningSeconds = Math.round(slaDuration * getSlpConfig().warningRatio);

      // 1. Check for Breach (elapsedSeconds >= slaDuration)
      if (elapsedSeconds >= slaDuration) {
        // Freeze timer at exactly slaDuration (e.g., 60s / 01:00)
        tracking.elapsedTime = slaDuration;
        tracking.timerState = 'STOPPED';

        if (tracking.slaStatus !== 'SLA_BREACHED') {
          tracking.slaStatus = 'SLA_BREACHED';
          tracking.escalationLevel = 1;
          tracking.escalationStatus = 'ESCALATED';
          tracking.escalatedTo = 'ADMIN';
          tracking.escalatedAt = new Date();
          tracking.breachedAt = new Date();

          const stageMeta = STAGE_OFFICER_MAPPING[tracking.currentStage] || { stageName: tracking.currentStage };
          const reason = `${stageMeta.stageName || tracking.currentStage} stage exceeded configured SLA (${formatDuration(slaDuration)}). Administrative attention required.`;
          tracking.escalationReason = reason;

          tracking.escalationHistory.push({
            level: 1,
            escalatedTo: 'ADMIN',
            escalatedAt: new Date(),
            reason,
            stage: tracking.currentStage,
            notifiedRoles: ['ADMIN', tracking.assignedRole]
          });

          await tracking.save();

          // Create In-App Notification for Admin
          const stageLabel = stageMeta.stageName || tracking.currentStage;
          const slaLimitFormatted = formatDuration(slaDuration);
          await createNotification({
            recipientRole: 'ADMIN',
            title: 'SLA BREACH ALERT ⚠️',
            message: `Application: ${tracking.applicationNumber}\nStudent: ${tracking.studentName || 'Student'}\nInstitution: ${tracking.institutionName || 'N/A'}\nCurrent Stage: ${stageLabel}\nSLA: ${slaLimitFormatted}\nStatus: SLA BREACHED\nAction Required: Administrative Attention`,
            type: 'warning',
            applicationNumber: tracking.applicationNumber,
            link: '/admin/slp'
          });

          // Create AuditLog for SLA Breach
          await recordAuditLog({
            applicationId: tracking.applicationId,
            applicationNumber: tracking.applicationNumber,
            previousStatus: tracking.currentStage,
            newStatus: 'SLA_BREACHED',
            changedBy: null,
            officerName: 'SLP Automated Monitoring Engine',
            officerRole: 'SYSTEM',
            remarks: `SLA breached for stage "${stageMeta.stageName || tracking.currentStage}". Timer stopped at ${slaLimitFormatted}. Auto-escalated to Central Admin.`,
            metadata: {
              stage: tracking.currentStage,
              elapsedSeconds: slaDuration,
              slaDuration,
              timerState: 'STOPPED',
              escalationLevel: 1,
              escalatedTo: 'ADMIN'
            }
          });

          // Broadcast Real-time Events
          broadcastSlpEvent('slp_sla_breached', {
            applicationId: tracking.applicationId,
            applicationNumber: tracking.applicationNumber,
            currentStage: tracking.currentStage,
            stageName: stageMeta.stageName,
            elapsedSeconds: slaDuration,
            slaDuration,
            timerState: 'STOPPED',
            escalationLevel: 1,
            studentName: tracking.studentName,
            institutionName: tracking.institutionName,
            assignedOfficerName: tracking.assignedOfficerName || tracking.assignedRole
          });

          broadcastSlpEvent('slp_escalated', {
            applicationId: tracking.applicationId,
            applicationNumber: tracking.applicationNumber,
            currentStage: tracking.currentStage,
            escalationLevel: 1,
            escalatedTo: 'ADMIN',
            timerState: 'STOPPED',
            reason
          });
        }
      }
      // 2. Check for Warning (between 75% and 100%)
      else if (elapsedSeconds >= warningSeconds && tracking.slaStatus === 'WITHIN_SLA') {
        tracking.slaStatus = 'SLA_WARNING';
        tracking.escalationStatus = 'WARNING_ISSUED';
        await tracking.save();

        const stageMeta = STAGE_OFFICER_MAPPING[tracking.currentStage] || { stageName: tracking.currentStage };

        // Record Audit Log for SLA Warning
        await recordAuditLog({
          applicationId: tracking.applicationId,
          applicationNumber: tracking.applicationNumber,
          previousStatus: tracking.currentStage,
          newStatus: 'SLA_WARNING',
          changedBy: null,
          officerName: 'SLP Automated Monitoring Engine',
          officerRole: 'SYSTEM',
          remarks: `SLA Warning issued for stage "${stageMeta.stageName || tracking.currentStage}". 75% of processing duration elapsed (${formatDuration(elapsedSeconds)} / ${formatDuration(slaDuration)}).`,
          metadata: {
            stage: tracking.currentStage,
            elapsedSeconds,
            slaDuration
          }
        });

        // Broadcast Warning Event
        broadcastSlpEvent('slp_sla_warning', {
          applicationId: tracking.applicationId,
          applicationNumber: tracking.applicationNumber,
          currentStage: tracking.currentStage,
          stageName: stageMeta.stageName,
          elapsedSeconds,
          slaDuration
        });
      } else {
        // Normal tick: update elapsed time
        await SLPTracking.updateOne(
          { _id: tracking._id },
          { $set: { elapsedTime: elapsedSeconds } }
        );
      }
    }
  } catch (error) {
    console.error('[SLP Engine] Error in checkActiveSLAs:', error);
  }
};

let engineIntervalHandle = null;

const startSlpEngine = () => {
  if (engineIntervalHandle) return;
  const config = getSlpConfig();
  console.log(`[SLP Engine] Initialized in ${getSlpModeKey()} mode (Check interval: ${config.checkIntervalMs}ms, SLA: ${formatDuration(config.defaultStageSlaSeconds)}).`);
  engineIntervalHandle = setInterval(checkActiveSLAs, config.checkIntervalMs);
};

const stopSlpEngine = () => {
  if (engineIntervalHandle) {
    clearInterval(engineIntervalHandle);
    engineIntervalHandle = null;
  }
};

module.exports = {
  startStage,
  completeStage,
  checkActiveSLAs,
  startSlpEngine,
  stopSlpEngine
};
