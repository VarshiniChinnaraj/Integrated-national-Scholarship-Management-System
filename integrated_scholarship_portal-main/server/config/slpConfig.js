/**
 * Centralized Service Level Performance (SLP) & SLA Configuration
 * 
 * Supports:
 * - DEMO Mode: 1-minute (60 seconds) SLA per processing stage for live evaluations
 * - PRODUCTION Mode: 7-day (604,800 seconds) SLA per processing stage
 * 
 * Controlled by process.env.SLP_MODE ('DEMO' | 'PRODUCTION')
 */

const SLP_MODES = {
  DEMO: {
    key: 'DEMO',
    label: 'Demo Mode — SLA: 1 minute',
    shortLabel: 'Demo (1m SLA)',
    defaultStageSlaSeconds: 60, // 1 minute
    warningRatio: 0.75, // Warning at 45 seconds (75% elapsed)
    checkIntervalMs: 2500 // SLP Engine checks active stages every 2.5s in demo mode
  },
  PRODUCTION: {
    key: 'PRODUCTION',
    label: 'Production Mode — SLA: 7 days',
    shortLabel: 'Production (7d SLA)',
    defaultStageSlaSeconds: 7 * 24 * 60 * 60, // 7 days (604800 seconds)
    warningRatio: 0.75, // Warning at 5.25 days
    checkIntervalMs: 60000 // Check every minute in production
  }
};

const getSlpModeKey = () => {
  const envMode = (process.env.SLP_MODE || 'DEMO').toUpperCase().trim();
  return SLP_MODES[envMode] ? envMode : 'DEMO';
};

const getSlpConfig = () => {
  return SLP_MODES[getSlpModeKey()];
};

// Responsible officer roles mapped to stages
const STAGE_OFFICER_MAPPING = {
  SUBMITTED: {
    stageName: 'Institute Verification',
    role: 'INSTITUTE_OFFICER',
    desc: 'College-level scrutiny of marks, enrollment & attendance',
    escalatedTo: 'ADMIN'
  },
  INSTITUTE_VERIFIED: {
    stageName: 'Routed to Department',
    role: 'SYSTEM',
    desc: 'Automated routing to Ministry/Department',
    escalatedTo: 'ADMIN'
  },
  ROUTED_TO_DEPARTMENT: {
    stageName: 'Department Scrutiny',
    role: 'DEPARTMENT_OFFICER',
    desc: 'Eligibility scrutiny & quota allocation',
    escalatedTo: 'ADMIN'
  },
  DEPARTMENT_VERIFICATION: {
    stageName: 'Department Scrutiny',
    role: 'DEPARTMENT_OFFICER',
    desc: 'Eligibility scrutiny & quota allocation',
    escalatedTo: 'ADMIN'
  },
  APPROVED: {
    stageName: 'Sanction Order Generation',
    role: 'DEPARTMENT_OFFICER',
    desc: 'Official Sanction Order generation',
    escalatedTo: 'ADMIN'
  },
  SANCTIONED: {
    stageName: 'Payment Batch Processing',
    role: 'DEPARTMENT_OFFICER',
    desc: 'DBT Payment gateway dispatch batching',
    escalatedTo: 'ADMIN'
  },
  PAYMENT_PROCESSING: {
    stageName: 'Payment Disbursement',
    role: 'DEPARTMENT_OFFICER',
    desc: 'DBT Bank transfer completion (PFMS/NPCI)',
    escalatedTo: 'ADMIN'
  },
  DISBURSED: {
    stageName: 'Completed',
    role: 'SYSTEM',
    desc: 'Funds credited to student bank account',
    escalatedTo: null
  }
};

/**
 * Get SLA duration in seconds for a specific stage
 */
const getStageSlaSeconds = (stageKey) => {
  const config = getSlpConfig();
  return config.defaultStageSlaSeconds;
};

/**
 * Get warning threshold in seconds for a stage
 */
const getStageWarningSeconds = (stageKey) => {
  const slaSeconds = getStageSlaSeconds(stageKey);
  const config = getSlpConfig();
  return Math.round(slaSeconds * config.warningRatio);
};

/**
 * Calculate SLA deadline from start time
 */
const calculateSlaDeadline = (startedAt, stageKey) => {
  const startMs = new Date(startedAt || Date.now()).getTime();
  const slaSeconds = getStageSlaSeconds(stageKey);
  return new Date(startMs + slaSeconds * 1000);
};

/**
 * Format elapsed or remaining seconds into human-readable representation (MM:SS or d h m s)
 */
const formatDuration = (totalSeconds) => {
  const sec = Math.max(0, Math.round(totalSeconds));
  if (sec < 3600) {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  }
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  }
  return `${hours}h ${mins}m`;
};

module.exports = {
  SLP_MODES,
  getSlpModeKey,
  getSlpConfig,
  STAGE_OFFICER_MAPPING,
  getStageSlaSeconds,
  getStageWarningSeconds,
  calculateSlaDeadline,
  formatDuration
};
