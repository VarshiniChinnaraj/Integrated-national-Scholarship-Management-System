const mongoose = require('mongoose');
const SLPTracking = require('../models/SLPTracking');
const Application = require('../models/Application');
const {
  getSlpConfig,
  getSlpModeKey,
  STAGE_OFFICER_MAPPING,
  getStageSlaSeconds,
  formatDuration
} = require('../config/slpConfig');
const { checkActiveSLAs } = require('../services/slpService');

// @desc    Get Central SLP Configuration (Mode, Durations, Labels)
// @route   GET /api/slp/config
// @access  Public / Authenticated
const getPublicSlpConfig = (req, res) => {
  const config = getSlpConfig();
  return res.status(200).json({
    success: true,
    data: {
      mode: getSlpModeKey(),
      label: config.label,
      shortLabel: config.shortLabel,
      defaultStageSlaSeconds: config.defaultStageSlaSeconds,
      warningRatio: config.warningRatio,
      warningSeconds: Math.round(config.defaultStageSlaSeconds * config.warningRatio),
      formattedDuration: formatDuration(config.defaultStageSlaSeconds),
      stageMappings: STAGE_OFFICER_MAPPING
    }
  });
};

// @desc    Get SLP Tracking Record for a Specific Application
// @route   GET /api/slp/tracking/:id
// @access  Authenticated (Student / Officer / Admin)
const getApplicationSlpTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.isValidObjectId(id);

    const filter = isObjectId
      ? { $or: [{ applicationId: id }, { applicationNumber: id }] }
      : { applicationNumber: id };

    let tracking = await SLPTracking.findOne(filter);

    // If not found, try to locate Application and generate default tracking record
    if (!tracking && isObjectId) {
      const application = await Application.findById(id);
      if (application) {
        const { startStage } = require('../services/slpService');
        tracking = await startStage(application, application.status || 'SUBMITTED');
      }
    }

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No SLP tracking record found for this application'
      });
    }

    // Compute live elapsed seconds dynamically
    let liveElapsedSeconds = tracking.elapsedTime;
    let timerState = tracking.timerState || 'RUNNING';
    if (!tracking.stageCompletedAt) {
      const calcElapsed = Math.max(0, (Date.now() - tracking.stageStartedAt.getTime()) / 1000);
      if (tracking.slaStatus === 'SLA_BREACHED' || calcElapsed >= tracking.slaDuration) {
        liveElapsedSeconds = tracking.slaDuration;
        timerState = 'STOPPED';
      } else {
        liveElapsedSeconds = calcElapsed;
        timerState = 'RUNNING';
      }
    } else {
      timerState = 'COMPLETED';
    }

    return res.status(200).json({
      success: true,
      data: {
        ...tracking.toObject(),
        liveElapsedSeconds,
        timerState,
        formattedElapsed: formatDuration(liveElapsedSeconds),
        formattedDuration: formatDuration(tracking.slaDuration),
        stageMeta: STAGE_OFFICER_MAPPING[tracking.currentStage] || { stageName: tracking.currentStage }
      }
    });
  } catch (error) {
    console.error('Get Application SLP Tracking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve SLP tracking data',
      error: error.message
    });
  }
};

// @desc    Get Admin SLP Monitor Overview & Metrics
// @route   GET /api/slp/admin/overview
// @access  Private (Admin / Super Admin / Officers)
const getAdminSlpOverview = async (req, res) => {
  try {
    // Run an active check first to ensure up-to-date states
    await checkActiveSLAs();

    const { stage, status, search } = req.query;

    let filter = {};
    if (stage && stage !== 'ALL') {
      filter.currentStage = stage;
    }
    if (status && status !== 'ALL') {
      filter.slaStatus = status;
    }
    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { institutionName: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
        { assignedOfficerName: { $regex: search, $options: 'i' } }
      ];
    }

    const allActive = await SLPTracking.find({
      stageCompletedAt: null,
      currentStage: { $nin: ['DISBURSED', 'REJECTED'] }
    });

    const totalActive = allActive.length;
    const slaWithinLimit = allActive.filter((t) => t.slaStatus === 'WITHIN_SLA').length;
    const slaWarning = allActive.filter((t) => t.slaStatus === 'SLA_WARNING').length;
    const slaBreached = allActive.filter((t) => t.slaStatus === 'SLA_BREACHED').length;
    const escalated = allActive.filter((t) => t.escalationLevel > 0).length;
    const adminAttentionRequired = allActive.filter((t) => t.slaStatus === 'SLA_BREACHED' || t.escalationLevel > 0).length;

    // Fetch filtered list with sorting: Breached / Escalated first, then by oldest stageStartedAt
    const items = await SLPTracking.find(filter)
      .sort({ escalationLevel: -1, slaStatus: 1, stageStartedAt: 1 })
      .limit(100);

    const now = Date.now();
    const enrichedItems = items.map((item) => {
      const isCompleted = Boolean(item.stageCompletedAt);
      let elapsedSeconds = item.elapsedTime;
      let timerState = item.timerState || 'RUNNING';

      if (!isCompleted) {
        const rawElapsed = Math.max(0, (now - item.stageStartedAt.getTime()) / 1000);
        if (item.slaStatus === 'SLA_BREACHED' || rawElapsed >= item.slaDuration) {
          elapsedSeconds = item.slaDuration;
          timerState = 'STOPPED';
        } else {
          elapsedSeconds = rawElapsed;
          timerState = 'RUNNING';
        }
      } else {
        timerState = 'COMPLETED';
      }

      const stageMeta = STAGE_OFFICER_MAPPING[item.currentStage] || { stageName: item.currentStage };

      return {
        ...item.toObject(),
        stageName: stageMeta.stageName || item.currentStage,
        elapsedSeconds,
        timerState,
        overdueSeconds: 0,
        formattedElapsed: formatDuration(elapsedSeconds),
        formattedDuration: formatDuration(item.slaDuration)
      };
    });

    return res.status(200).json({
      success: true,
      config: {
        mode: getSlpModeKey(),
        label: getSlpConfig().label,
        defaultStageSlaSeconds: getSlpConfig().defaultStageSlaSeconds,
        formattedDuration: formatDuration(getSlpConfig().defaultStageSlaSeconds)
      },
      stats: {
        totalActive,
        slaWithinLimit,
        slaWarning,
        slaBreached,
        escalated,
        adminAttentionRequired
      },
      applications: enrichedItems
    });
  } catch (error) {
    console.error('Get Admin SLP Overview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load SLP monitor overview',
      error: error.message
    });
  }
};

// @desc    Trigger immediate SLP check (for tests / manual refresh)
// @route   POST /api/slp/check
// @access  Public / Authenticated
const triggerSlpCheck = async (req, res) => {
  try {
    await checkActiveSLAs();
    return res.status(200).json({
      success: true,
      message: 'Active SLAs checked and updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPublicSlpConfig,
  getApplicationSlpTracking,
  getAdminSlpOverview,
  triggerSlpCheck
};
