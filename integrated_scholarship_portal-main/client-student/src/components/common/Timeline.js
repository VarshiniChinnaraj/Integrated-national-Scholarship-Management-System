import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertTriangle, X, ShieldAlert, Zap } from 'lucide-react';
import api from '../../services/api';

const STAGES = [
  { key: 'SUBMITTED', label: '1. Application Submitted', desc: 'Online application submitted by student' },
  { key: 'INSTITUTE_VERIFIED', label: '2. Institute Verification', desc: 'College verification of enrollment, marks & attendance' },
  { key: 'ROUTED_TO_DEPARTMENT', label: '3. Routed to Department', desc: 'Auto-routed to Welfare / Education Department' },
  { key: 'DEPARTMENT_VERIFICATION', label: '4. Department Scrutiny', desc: 'Eligibility scrutiny & quota allocation' },
  { key: 'APPROVED', label: '5. Department Approved', desc: 'Approved for scholarship grant' },
  { key: 'SANCTIONED', label: '6. Sanction Order Generated', desc: 'Official Sanction Order SAN-YYYY-XXXXXX generated' },
  { key: 'PAYMENT_PROCESSING', label: '7. Payment Processing', desc: 'DBT Bank gateway dispatch' },
  { key: 'DISBURSED', label: '8. Payment Disbursed', desc: 'Funds credited to student bank account (DBT)' }
];

const getStageIndex = (status, applicationDetails) => {
  const isDisbursed =
    ['DISBURSED', 'PAYMENT_DISBURSED'].includes(status) ||
    applicationDetails?.paymentId?.status === 'DISBURSED' ||
    Boolean(applicationDetails?.paymentId?.utr) ||
    applicationDetails?.status === 'DISBURSED' ||
    applicationDetails?.status === 'PAYMENT_DISBURSED' ||
    applicationDetails?.paymentStatus === 'DISBURSED';

  if (isDisbursed) return 7;

  if (['PAYMENT_PENDING', 'PAYMENT_PROCESSING'].includes(status) || applicationDetails?.paymentId?.status === 'PAYMENT_PROCESSING') return 6;
  if (status === 'SANCTIONED' || applicationDetails?.sanctionNumber) return 5;

  const isDeptApproved =
    ['APPROVED', 'DEPARTMENT_APPROVED'].includes(status) ||
    applicationDetails?.departmentVerification?.decision === 'APPROVED';

  if (isDeptApproved) return 4;
  if (status === 'DEPARTMENT_VERIFICATION') return 3;
  if (status === 'ROUTED_TO_DEPARTMENT') return 2;
  if (status === 'INSTITUTE_VERIFIED') return 1;
  if (status === 'SUBMITTED') return 0;
  if (status === 'CORRECTION_REQUIRED') return 1;
  if (status === 'REJECTED') return -1;
  return 0;
};

const formatSeconds = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
};

const Timeline = ({ currentStatus, auditLogs = [], applicationDetails, slpTracking: initialSlpTracking }) => {
  const currentIndex = getStageIndex(currentStatus, applicationDetails);
  const isRejected = currentStatus === 'REJECTED' || applicationDetails?.departmentVerification?.decision === 'REJECTED';
  const isCorrection = currentStatus === 'CORRECTION_REQUIRED';

  const [slpData, setSlpData] = useState(initialSlpTracking || null);
  const [slpConfig, setSlpConfig] = useState({
    mode: 'DEMO',
    label: 'Demo Mode — SLA: 1 minute',
    defaultStageSlaSeconds: 60
  });
  const [now, setNow] = useState(Date.now());

  // Fetch central SLP config & live tracking if not passed
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const res = await api.get('/slp/config');
        if (res.data?.success && isMounted) {
          setSlpConfig(res.data.data);
        }
      } catch (e) {
        // Fallback to default
      }
    };

    fetchConfig();

    const fetchTracking = async () => {
      const appId = applicationDetails?._id || applicationDetails?.applicationNumber;
      if (!appId) return;
      try {
        const res = await api.get(`/slp/tracking/${appId}`);
        if (res.data?.success && isMounted) {
          setSlpData(res.data.data);
        }
      } catch (e) {
        // Fallback
      }
    };

    if (!slpData && (applicationDetails?._id || applicationDetails?.applicationNumber)) {
      fetchTracking();
    }

    return () => {
      isMounted = false;
    };
  }, [applicationDetails?._id, applicationDetails?.applicationNumber]);

  // Keep live 1-second ticker for real-time countdown / overdue calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live timing for active stage
  const stageDuration = slpData?.slaDuration || slpConfig.defaultStageSlaSeconds || 60;
  const stageStartMs = slpData?.stageStartedAt ? new Date(slpData.stageStartedAt).getTime() : now;
  const rawElapsed = slpData?.stageCompletedAt
    ? (slpData.elapsedTime || 0)
    : Math.max(0, (now - stageStartMs) / 1000);

  const isStageBreached =
    slpData?.slaStatus === 'SLA_BREACHED' ||
    slpData?.escalationLevel > 0 ||
    slpData?.timerState === 'STOPPED' ||
    rawElapsed >= stageDuration;

  // FREEZE timer at stageDuration (01:00) once breached - DO NOT count past 01:00
  const elapsedSeconds = isStageBreached ? stageDuration : rawElapsed;
  const remainingSeconds = Math.max(0, stageDuration - elapsedSeconds);

  const isStageWarning =
    !isStageBreached &&
    (slpData?.slaStatus === 'SLA_WARNING' || rawElapsed >= stageDuration * 0.75);

  return (
    <div className="tracking-timeline py-2">
      {/* Central SLP Configuration Banner */}
      <div className="slp-mode-banner shadow-xs">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark fw-bold px-2 py-1 d-flex align-items-center gap-1">
            <Zap size={13} />
            {slpConfig.mode === 'DEMO' ? 'SLP DEMO' : 'SLP PRODUCTION'}
          </span>
          <span className="fw-semibold text-dark">{slpConfig.label}</span>
        </div>
        <span className="text-secondary small d-none d-md-inline font-monospace">
          {isStageBreached ? '⚠️ Auto-Escalation Active' : '⏱️ 1-Minute Evaluation Active'}
        </span>
      </div>

      {STAGES.map((stage, idx) => {
        let nodeClass = '';
        let icon = <span className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1 }}>○</span>;
        const isCurrentActive = idx === currentIndex && !isRejected && currentIndex < 7;

        if (isRejected) {
          const rejectStageIdx = applicationDetails?.departmentVerification?.decision === 'REJECTED' ? 3 : 1;
          if (idx < rejectStageIdx) {
            nodeClass = 'completed';
            icon = <Check size={12} />;
          } else if (idx === rejectStageIdx) {
            nodeClass = 'danger';
            icon = <X size={12} />;
          } else {
            nodeClass = '';
            icon = <span className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1 }}>○</span>;
          }
        } else if (isCorrection && idx === 1) {
          nodeClass = 'warning';
          icon = <AlertTriangle size={12} />;
        } else {
          if (idx < currentIndex) {
            nodeClass = 'completed';
            icon = <Check size={12} />;
          } else if (idx === currentIndex) {
            if (currentIndex === 7) {
              nodeClass = 'completed';
              icon = <Check size={12} />;
            } else if (currentIndex === 4) {
              // Department Approved - if sanctioned is not yet generated
              nodeClass = isStageBreached ? 'sla-breached' : 'completed current';
              icon = isStageBreached ? <AlertTriangle size={12} /> : <Check size={12} />;
            } else {
              // Active processing stage
              if (isStageBreached) {
                nodeClass = 'sla-breached';
                icon = <AlertTriangle size={12} />;
              } else if (isStageWarning) {
                nodeClass = 'sla-warning';
                icon = <Clock size={12} />;
              } else {
                nodeClass = 'current';
                icon = <Clock size={12} />;
              }
            }
          } else {
            nodeClass = '';
            icon = <span className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1 }}>○</span>;
          }
        }

        // Find relevant stage history from SLP Tracking or AuditLog
        const historyItem = slpData?.stageHistory?.find(
          (h) => h.stage === stage.key || (stage.key === 'DEPARTMENT_VERIFICATION' && h.stage === 'ROUTED_TO_DEPARTMENT')
        );

        const logEntry = auditLogs.find((l) => {
          if (stage.key === 'SUBMITTED' && l.newStatus === 'SUBMITTED') return true;
          if (stage.key === 'INSTITUTE_VERIFIED' && (l.newStatus === 'INSTITUTE_VERIFIED' || (l.previousStatus === 'SUBMITTED' && l.officerRole === 'INSTITUTE_OFFICER'))) return true;
          if (stage.key === 'ROUTED_TO_DEPARTMENT' && (l.newStatus === 'ROUTED_TO_DEPARTMENT' || (l.newStatus === 'INSTITUTE_VERIFIED' && l.remarks?.toLowerCase().includes('routed')))) return true;
          if (stage.key === 'DEPARTMENT_VERIFICATION' && l.newStatus === 'DEPARTMENT_VERIFICATION') return true;
          if (stage.key === 'APPROVED' && (['APPROVED', 'DEPARTMENT_APPROVED'].includes(l.newStatus) || (l.officerRole === 'DEPARTMENT_OFFICER' && (l.newStatus === 'APPROVED' || l.action === 'APPROVE')))) return true;
          if (stage.key === 'SANCTIONED' && (l.newStatus === 'SANCTIONED' || l.action === 'GENERATE_SANCTION')) return true;
          if (stage.key === 'PAYMENT_PROCESSING' && (['PAYMENT_PROCESSING', 'PAYMENT_PENDING'].includes(l.newStatus) || l.action === 'PROCESS_PAYMENT')) return true;
          if (stage.key === 'DISBURSED' && (['DISBURSED', 'PAYMENT_DISBURSED'].includes(l.newStatus) || l.action === 'DISBURSE')) return true;
          return false;
        });

        const isPastCompleted = idx < currentIndex || (idx === currentIndex && currentIndex === 7);
        const wasProcessedAfterSla = historyItem?.slaStatus === 'COMPLETED_AFTER_SLA';

        return (
          <div key={stage.key} className={`timeline-node ${nodeClass}`}>
            <div className="timeline-dot">{icon}</div>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-1.5">
              <div className="min-w-0 flex-grow-1">
                <h6
                  className="fw-bold mb-1"
                  style={{
                    color: nodeClass.includes('sla-breached')
                      ? '#b45309'
                      : nodeClass.includes('current')
                      ? '#2563eb'
                      : nodeClass.includes('completed')
                      ? '#0f172a'
                      : '#64748b'
                  }}
                >
                  {stage.label}
                </h6>
                <p className="text-muted mb-1" style={{ fontSize: '0.82rem' }}>
                  {stage.desc}
                </p>

                {/* Real-time Live SLA Monitoring Card for Active Stage */}
                {isCurrentActive && (
                  <div
                    className={`slp-timer-card shadow-xs ${
                      isStageBreached ? 'breached' : isStageWarning ? 'warning' : 'active-ok'
                    }`}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2">
                        {isStageBreached ? (
                          <>
                            <span className="badge bg-warning text-dark fw-bold px-2.5 py-1">
                              SLA BREACHED
                            </span>
                            <span className="badge border border-warning text-dark fw-bold px-2 py-0.5" style={{ backgroundColor: '#fef3c7' }}>
                              Timer: STOPPED
                            </span>
                          </>
                        ) : isStageWarning ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning fw-semibold px-2 py-1">
                            SLA WARNING
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border border-primary fw-semibold px-2 py-1">
                            WITHIN SLA
                          </span>
                        )}
                        <span className="small text-secondary fw-semibold">
                          SLA Limit: {formatSeconds(stageDuration)}
                        </span>
                      </div>

                      <div className="small font-monospace fw-bold">
                        {isStageBreached ? (
                          <span className="fw-bold d-inline-flex align-items-center gap-1" style={{ color: '#b45309' }}>
                            <Clock size={13} />
                            STOPPED: {formatSeconds(stageDuration)}
                          </span>
                        ) : (
                          <span className="text-primary d-inline-flex align-items-center gap-1">
                            <Clock size={13} />
                            {formatSeconds(remainingSeconds)} remaining
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-top border-warning border-opacity-25 small text-secondary d-flex flex-wrap justify-content-between align-items-center gap-1">
                      <span>
                        SLA Limit: <strong className="text-dark">{formatSeconds(stageDuration)}</strong> &bull; Status:{' '}
                        <strong style={{ color: isStageBreached ? '#b45309' : '#2563eb' }}>
                          {isStageBreached ? 'SLA BREACHED' : 'WITHIN SLA'}
                        </strong>
                      </span>
                      {isStageBreached ? (
                        <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: '#b45309' }}>
                          <ShieldAlert size={13} />
                          Administrative Attention Required &bull; Auto-Escalated
                        </span>
                      ) : (
                        <span className="text-success fw-medium">
                          Processing within SLA limits
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit Log / History Details for Completed Stages */}
                {logEntry && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">{logEntry.officerName} ({logEntry.officerRole}): </span>
                    {logEntry.remarks}
                    <span className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      {new Date(logEntry.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Fallback descriptions for completed stages */}
                {stage.key === 'APPROVED' && !logEntry && applicationDetails?.departmentVerification?.verifiedAt && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">
                      {applicationDetails.departmentVerification.officerName || 'Department Officer'} (DEPARTMENT_OFFICER):{' '}
                    </span>
                    {applicationDetails.departmentVerification.remarks || 'Department approval completed. Scrutinized and approved by Department Officer.'}
                    <span className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      {new Date(applicationDetails.departmentVerification.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {stage.key === 'DEPARTMENT_VERIFICATION' && idx < currentIndex && !logEntry && applicationDetails?.departmentVerification?.verifiedAt && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">
                      {applicationDetails.departmentVerification.officerName || 'Department Officer'} (DEPARTMENT_OFFICER):{' '}
                    </span>
                    Eligibility scrutiny and quota verification completed.
                    <span className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      {new Date(applicationDetails.departmentVerification.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {stage.key === 'ROUTED_TO_DEPARTMENT' && idx < currentIndex && !logEntry && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">System (WORKFLOW_ROUTER): </span>
                    Application automatically routed to Department queue following institute verification.
                  </div>
                )}

                {stage.key === 'SANCTIONED' && (idx <= currentIndex && currentIndex >= 5) && !logEntry && applicationDetails?.sanctionNumber && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">Ministry / Department Sanction Authority: </span>
                    Sanction Order issued: {applicationDetails.sanctionNumber} (Grant: ₹{applicationDetails.approvedAmount?.toLocaleString('en-IN')})
                  </div>
                )}

                {stage.key === 'PAYMENT_PROCESSING' && (idx <= currentIndex && currentIndex >= 6) && !logEntry && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">Banking Gateway (NPCI / PFMS): </span>
                    Payment reference {applicationDetails?.paymentReference || applicationDetails?.paymentId?.paymentReference || ''} dispatched for Direct Benefit Transfer processing.
                  </div>
                )}

                {stage.key === 'DISBURSED' && currentIndex === 7 && !logEntry && (
                  <div className="bg-light p-2 rounded small text-secondary mt-1 border">
                    <span className="fw-semibold text-dark">DBT Banking Gateway: </span>
                    Disbursement completed via Direct Benefit Transfer to bank account. UTR: {applicationDetails?.paymentId?.utr || 'Confirmed'}
                    <span className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                      {applicationDetails?.paymentId?.transactionDate ? new Date(applicationDetails.paymentId.transactionDate).toLocaleString() : new Date().toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Past SLA summary line */}
                {isPastCompleted && historyItem && (
                  <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                    <span className={wasProcessedAfterSla ? 'text-warning fw-semibold' : 'text-success fw-medium'}>
                      {wasProcessedAfterSla ? '⚠️ Completed After SLA' : '✓ Completed Within SLA'}
                    </span>
                    {' '}• Processing time: <strong>{formatSeconds(historyItem.elapsedSeconds || 0)}</strong> (Target: {formatSeconds(historyItem.slaDuration)})
                  </div>
                )}
              </div>

              {/* Status Badge in Header */}
              <div className="mt-1 mt-sm-0 flex-shrink-0">
                {isCurrentActive && isStageBreached && (
                  <span className="badge badge-sla-breached d-inline-flex align-items-center gap-1">
                    <AlertTriangle size={12} />
                    SLA Breached
                  </span>
                )}
                {isCurrentActive && !isStageBreached && isStageWarning && (
                  <span className="badge badge-sla-warning d-inline-flex align-items-center gap-1">
                    <Clock size={12} />
                    SLA Warning
                  </span>
                )}
                {isCurrentActive && !isStageBreached && !isStageWarning && (
                  <span className="badge bg-primary-subtle text-primary border border-primary">
                    In Progress
                  </span>
                )}
                {!isCurrentActive && isPastCompleted && wasProcessedAfterSla && (
                  <span className="badge bg-warning-subtle text-warning border border-warning">
                    Completed (After SLA)
                  </span>
                )}
                {!isCurrentActive && isPastCompleted && !wasProcessedAfterSla && (
                  <span className="badge bg-success-subtle text-success">
                    Completed
                  </span>
                )}
                {!isCurrentActive && !isPastCompleted && isCorrection && idx === 1 && (
                  <span className="badge bg-warning-subtle text-warning">
                    Action Required
                  </span>
                )}
                {!isCurrentActive && !isPastCompleted && isRejected && idx === 1 && (
                  <span className="badge bg-danger-subtle text-danger">
                    Rejected
                  </span>
                )}
                {!isCurrentActive && !isPastCompleted && !isCorrection && !isRejected && (
                  <span className="badge bg-light text-secondary border">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
