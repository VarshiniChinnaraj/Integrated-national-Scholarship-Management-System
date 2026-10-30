import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import Timeline from '../../components/common/Timeline';
import api from '../../services/api';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Eye,
  Building2,
  User,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const formatSeconds = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
};

const AdminSLPMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalActive: 0,
    slaWithinLimit: 0,
    slaWarning: 0,
    slaBreached: 0,
    escalated: 0,
    adminAttentionRequired: 0
  });
  const [slpConfig, setSlpConfig] = useState({
    mode: 'DEMO',
    label: 'Demo Mode — SLA: 1 minute',
    defaultStageSlaSeconds: 60,
    formattedDuration: '01:00'
  });
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Modal State for inspecting application SLP dossier
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalAppDetails, setModalAppDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Live 1-second ticker for continuous countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedStage !== 'ALL') params.stage = selectedStage;
      if (search) params.search = search;

      const res = await api.get('/slp/admin/overview', { params });
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setApplications(res.data.applications || []);
        if (res.data.config) setSlpConfig(res.data.config);
      }
    } catch (err) {
      console.error('Failed to fetch SLP overview:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // Auto-poll every 5 seconds to ensure backend state synchronization
    const pollInterval = setInterval(() => {
      fetchOverview();
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [selectedStatus, selectedStage, search]);

  const handleInspect = async (app) => {
    setSelectedApp(app);
    setModalLoading(true);
    try {
      const res = await api.get(`/student/applications/${app.applicationId || app.applicationNumber}`);
      if (res.data?.success) {
        setModalAppDetails(res.data.application);
      }
    } catch (e) {
      console.error('Failed to load application dossier:', e);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="Service Level Performance (SLP) Monitor"
      breadcrumbs={[
        { label: 'Admin Portal', link: '/admin/dashboard' },
        { label: 'SLP Monitor & Auto-Escalation' }
      ]}
    >
      {/* Top Banner: Mode & Central SLA Policy */}
      <div className="custom-card p-3 p-sm-4 mb-4 border-start border-warning border-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 d-inline-flex align-items-center gap-1.5">
                <Zap size={14} />
                {slpConfig.mode === 'DEMO' ? 'DEMO MODE ACTIVE' : 'PRODUCTION MODE ACTIVE'}
              </span>
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2 py-0.5">
                Auto-Escalation: Level 1 (Central Admin)
              </span>
            </div>
            <h4 className="fw-bold text-dark mb-1">{slpConfig.label}</h4>
            <p className="text-secondary small mb-0">
              Real-time administrative monitoring of scholarship application verification throughput across all accredited colleges & state ministries.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Executive SLP KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Total Active */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-primary border-3">
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-semibold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Total Active
              </span>
              <Clock size={16} className="text-primary" />
            </div>
            <h3 className="fw-bold text-dark mb-0">{stats.totalActive}</h3>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Applications in Pipeline</span>
          </div>
        </div>

        {/* Within Limit */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-success border-3">
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-semibold text-uppercase text-success" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Within SLA
              </span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <h3 className="fw-bold text-success mb-0">{stats.slaWithinLimit}</h3>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Processing on track</span>
          </div>
        </div>

        {/* Warning */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-warning border-3">
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-semibold text-uppercase text-warning" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                SLA Warning
              </span>
              <Clock size={16} className="text-warning" />
            </div>
            <h3 className="fw-bold text-warning mb-0">{stats.slaWarning}</h3>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>&gt;75% time elapsed</span>
          </div>
        </div>

        {/* Breached */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-danger border-3" style={{ background: '#fefce8' }}>
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-bold text-uppercase text-danger" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                SLA Breached
              </span>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <h3 className="fw-bold text-danger mb-0">{stats.slaBreached}</h3>
            <span className="text-danger fw-semibold" style={{ fontSize: '0.72rem' }}>Exceeded deadline</span>
          </div>
        </div>

        {/* Escalated */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-warning border-3" style={{ background: '#fffbeb' }}>
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Escalated
              </span>
              <ShieldAlert size={16} className="text-warning" />
            </div>
            <h3 className="fw-bold text-dark mb-0">{stats.escalated}</h3>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Level 1 to Admin</span>
          </div>
        </div>

        {/* Admin Attention Required */}
        <div className="col-6 col-lg-2">
          <div className="custom-card p-3 h-100 border-top border-danger border-3" style={{ background: '#fff1f2' }}>
            <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
              <span className="fw-bold text-uppercase text-danger" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Admin Action
              </span>
              <AlertCircle size={16} className="text-danger" />
            </div>
            <h3 className="fw-bold text-danger mb-0">{stats.adminAttentionRequired}</h3>
            <span className="text-danger fw-semibold" style={{ fontSize: '0.72rem' }}>Review Required</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="custom-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search Application No, Student, College, Officer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All SLA Statuses</option>
              <option value="WITHIN_SLA">Within SLA</option>
              <option value="SLA_WARNING">SLA Warning</option>
              <option value="SLA_BREACHED">SLA Breached (Delayed)</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="ALL">All Processing Stages</option>
              <option value="SUBMITTED">1. Application Submitted (Institute Pending)</option>
              <option value="ROUTED_TO_DEPARTMENT">3. Routed to Department</option>
              <option value="DEPARTMENT_VERIFICATION">4. Department Scrutiny</option>
              <option value="APPROVED">5. Department Approved</option>
              <option value="SANCTIONED">6. Sanction Order Generated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master SLP Monitoring Table */}
      <div className="custom-card overflow-hidden shadow-sm">
        <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-bold mb-0 text-dark">Active Applications SLA Ledger</h6>
            <span className="badge bg-secondary rounded-pill">{applications.length}</span>
          </div>
          <span className="small text-muted font-monospace d-none d-sm-inline">
            Stage SLA Ceiling: {slpConfig.formattedDuration || '01:00'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Clock size={36} className="mb-2 opacity-50" />
            <h6>No active applications matching filter</h6>
            <p className="small mb-0">Applications will appear here as soon as students submit fresh scholarship claims.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light" style={{ fontSize: '0.78rem' }}>
                <tr>
                  <th className="ps-3">Application No.</th>
                  <th>Student</th>
                  <th>Institution</th>
                  <th>Current Stage</th>
                  <th>Responsible Officer</th>
                  <th>SLA</th>
                  <th>Timer State</th>
                  <th>Status</th>
                  <th>Escalation</th>
                  <th className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {applications.map((app) => {
                  const stageStartMs = new Date(app.stageStartedAt).getTime();
                  const rawElapsed = app.stageCompletedAt
                    ? (app.elapsedTime || 0)
                    : Math.max(0, (now - stageStartMs) / 1000);
                  const isBreached =
                    app.slaStatus === 'SLA_BREACHED' ||
                    app.timerState === 'STOPPED' ||
                    rawElapsed >= app.slaDuration;
                  const isWarning =
                    !isBreached &&
                    (app.slaStatus === 'SLA_WARNING' || rawElapsed >= app.slaDuration * 0.75);

                  // Freeze elapsed time at slaDuration (01:00) once breached
                  const liveElapsed = isBreached ? app.slaDuration : rawElapsed;
                  const remaining = Math.max(0, app.slaDuration - liveElapsed);

                  return (
                    <tr
                      key={app._id}
                      style={{
                        backgroundColor: isBreached ? '#fefce8' : 'transparent',
                        borderLeft: isBreached ? '4px solid #eab308' : 'none'
                      }}
                    >
                      {/* App Number */}
                      <td className="ps-3">
                        <span className="fw-bold text-primary font-monospace">{app.applicationNumber}</span>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {app.scholarshipName || 'Scholarship Scheme'}
                        </div>
                      </td>

                      {/* Student */}
                      <td>
                        <div className="fw-semibold text-dark">{app.studentName || 'Student'}</div>
                      </td>

                      {/* Institution */}
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '160px' }} title={app.institutionName}>
                          {app.institutionName || 'NIT Delhi'}
                        </div>
                      </td>

                      {/* Current Stage */}
                      <td>
                        <span className="badge bg-light text-dark border fw-medium px-2 py-1">
                          {app.stageName || app.currentStage}
                        </span>
                      </td>

                      {/* Responsible Officer */}
                      <td>
                        <div className="fw-semibold text-dark small">
                          {app.assignedOfficerName || (app.assignedRole === 'INSTITUTE_OFFICER' ? 'Prof. Rajesh Sharma' : 'Dr. Sunita Verma')}
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {app.assignedRole}
                        </span>
                      </td>

                      {/* SLA */}
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border font-monospace fw-bold">
                          {formatSeconds(app.slaDuration)}
                        </span>
                      </td>

                      {/* Timer State - STOPPED at 01:00 if breached */}
                      <td>
                        <div className="font-monospace fw-bold">
                          {isBreached ? (
                            <span className="fw-bold d-inline-flex align-items-center gap-1" style={{ color: '#b45309' }}>
                              <Clock size={13} />
                              STOPPED ({formatSeconds(app.slaDuration)})
                            </span>
                          ) : isWarning ? (
                            <span className="text-warning d-inline-flex align-items-center gap-1">
                              <Clock size={13} />
                              {formatSeconds(remaining)} rem
                            </span>
                          ) : (
                            <span className="text-primary d-inline-flex align-items-center gap-1">
                              <Clock size={13} />
                              {formatSeconds(remaining)} rem
                            </span>
                          )}
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {isBreached ? 'Limit: 01:00 Reached' : `Elapsed: ${formatSeconds(liveElapsed)}`}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {isBreached ? (
                          <span className="badge badge-sla-breached px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                            SLA BREACHED
                          </span>
                        ) : isWarning ? (
                          <span className="badge badge-sla-warning px-2.5 py-1.5 d-inline-flex align-items-center gap-1">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            SLA WARNING
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 d-inline-flex align-items-center gap-1">
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            WITHIN SLA
                          </span>
                        )}
                      </td>

                      {/* Escalation */}
                      <td>
                        {isBreached || app.escalationLevel > 0 ? (
                          <span className="badge bg-warning text-dark fw-bold border border-warning px-2 py-1 d-inline-flex align-items-center gap-1">
                            <ShieldAlert size={12} />
                            Escalated
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2 py-1">
                            None
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="text-end pe-3">
                        <button
                          onClick={() => handleInspect(app)}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-2.5 py-1 fw-semibold"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect SLP Dossier Modal */}
      {selectedApp && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white p-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <ShieldAlert size={20} className="text-warning" />
                  <h6 className="modal-title fw-bold text-white mb-0">
                    SLP Lifecycle Dossier: {selectedApp.applicationNumber}
                  </h6>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setSelectedApp(null);
                    setModalAppDetails(null);
                  }}
                />
              </div>

              <div className="modal-body p-3 p-sm-4 custom-scrollbar">
                {/* Status Callout Banner */}
                <div className="p-3 rounded-3 mb-4" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                  <div className="d-flex align-items-start gap-2.5">
                    <AlertTriangle size={22} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h6 className="fw-bold text-dark mb-1">
                        Administrative Attention & Escalation Overview
                      </h6>
                      <p className="text-secondary small mb-1">
                        Application <strong>{selectedApp.applicationNumber}</strong> ({selectedApp.studentName}) submitted for <strong>{selectedApp.scholarshipName}</strong> is assigned to{' '}
                        <strong>{selectedApp.assignedOfficerName || selectedApp.assignedRole}</strong>.
                      </p>
                      <div className="small text-danger fw-semibold">
                        SLA Ceiling: {formatSeconds(selectedApp.slaDuration)} &bull; Escalation: Level 1 (Central Administration)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Lifecycle Timeline with Real-time Clock */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                  Interactive Processing Timeline & SLA Status
                </h6>
                <Timeline
                  currentStatus={modalAppDetails?.status || selectedApp.currentStage}
                  auditLogs={modalAppDetails?.auditLogs || []}
                  applicationDetails={modalAppDetails || {
                    applicationNumber: selectedApp.applicationNumber,
                    scholarshipName: selectedApp.scholarshipName,
                    institutionName: selectedApp.institutionName
                  }}
                  slpTracking={selectedApp}
                />

                {/* Escalation History */}
                {selectedApp.escalationHistory && selectedApp.escalationHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-top">
                    <h6 className="fw-bold text-dark mb-2">Escalation Audit Trail</h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered small mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Level</th>
                            <th>Escalated To</th>
                            <th>Trigger Reason</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedApp.escalationHistory.map((esc, i) => (
                            <tr key={i}>
                              <td>
                                <span className="badge bg-warning text-dark">Level {esc.level}</span>
                              </td>
                              <td className="fw-semibold">{esc.escalatedTo}</td>
                              <td>{esc.reason}</td>
                              <td className="text-muted">{new Date(esc.escalatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light p-3">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3"
                  onClick={() => {
                    setSelectedApp(null);
                    setModalAppDetails(null);
                  }}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminSLPMonitor;
