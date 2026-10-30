import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Bell,
  Clock,
  Play,
  Award,
  Sparkles
} from 'lucide-react';

const AdminEmailLogs = () => {
  const [activeTab, setActiveTab] = useState('sanctions'); // 'sanctions' or 'reminders'

  // Sanction email states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  // Deadline reminder states
  const [reminderLogs, setReminderLogs] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminderStatusFilter, setReminderStatusFilter] = useState('All');
  const [reminderTypeFilter, setReminderTypeFilter] = useState('All');
  const [reminderSearch, setReminderSearch] = useState('');
  const [retryingReminderId, setRetryingReminderId] = useState(null);
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);

  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (activeTab === 'sanctions') {
      fetchLogs();
    } else {
      fetchReminderLogs();
    }
  }, [activeTab, statusFilter, reminderStatusFilter, reminderTypeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/email-logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminderLogs = async () => {
    setLoadingReminders(true);
    try {
      const params = {};
      if (reminderStatusFilter !== 'All') params.status = reminderStatusFilter;
      if (reminderTypeFilter !== 'All') params.reminderType = reminderTypeFilter;
      if (reminderSearch) params.search = reminderSearch;

      const res = await api.get('/admin/reminders/logs', { params });
      if (res.data.success) {
        setReminderLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load reminder logs:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleReminderSearchSubmit = (e) => {
    e.preventDefault();
    fetchReminderLogs();
  };

  const handleRetryEmail = async (logId) => {
    setRetryingId(logId);
    setActionFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/admin/email-logs/${logId}/retry`);
      if (res.data.success) {
        setActionFeedback({
          type: 'success',
          message: 'Sanction approved email re-dispatched successfully!'
        });
        fetchLogs();
      } else {
        setActionFeedback({
          type: 'danger',
          message: res.data.message || res.data.error || 'Retry failed'
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Retry failed'
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleTriggerReminderScan = async () => {
    setIsTriggeringScan(true);
    setActionFeedback({ type: '', message: '' });
    try {
      const res = await api.post('/admin/reminders/trigger');
      if (res.data.success) {
        const stats = res.data.result || {};
        setActionFeedback({
          type: 'success',
          message: `Scan finished: Evaluated ${stats.evaluatedStudents || 0} students across ${stats.activeScholarships || 0} schemes. Dispatched ${stats.remindersSent || 0} reminders (${stats.remindersSkipped || 0} skipped).`
        });
        fetchReminderLogs();
      } else {
        setActionFeedback({
          type: 'danger',
          message: res.data.message || 'Failed to trigger scan'
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Failed to run scan'
      });
    } finally {
      setIsTriggeringScan(false);
    }
  };

  const handleRetryReminder = async (logId) => {
    setRetryingReminderId(logId);
    setActionFeedback({ type: '', message: '' });
    try {
      const res = await api.post(`/admin/reminders/logs/${logId}/retry`);
      if (res.data.success) {
        setActionFeedback({
          type: 'success',
          message: 'Deadline reminder email re-dispatched successfully!'
        });
        fetchReminderLogs();
      } else {
        setActionFeedback({
          type: 'danger',
          message: res.data.message || res.data.error || 'Retry failed'
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.message || err.message || 'Retry failed'
      });
    } finally {
      setRetryingReminderId(null);
    }
  };

  const formatReminderTypeBadge = (type) => {
    switch (type) {
      case 'REMINDER_48H':
        return <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold">48 Hours Before</span>;
      case 'REMINDER_24H':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle fw-bold">24 Hours Before</span>;
      case 'REMINDER_MORNING':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">Deadline Morning</span>;
      case 'REMINDER_FINAL':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">Final Hours</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary">{type}</span>;
    }
  };

  return (
    <PortalLayout
      pageTitle="Automated Email Dispatch & Reminder Monitor"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Email Dispatches' }]}
    >
      {/* Navigation Tabs */}
      <div className="d-flex gap-2 border-bottom pb-3 mb-4">
        <button
          onClick={() => { setActiveTab('sanctions'); setActionFeedback({ type: '', message: '' }); }}
          className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
            activeTab === 'sanctions' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
        >
          <Mail size={16} />
          <span>Sanction Order Dispatches</span>
          <span className="badge bg-white text-dark ms-1">{logs.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('reminders'); setActionFeedback({ type: '', message: '' }); }}
          className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
            activeTab === 'reminders' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
        >
          <Bell size={16} />
          <span>Smart Deadline Reminders</span>
          <span className="badge bg-white text-dark ms-1">{reminderLogs.length}</span>
        </button>
      </div>

      {actionFeedback.message && (
        <div className={`alert alert-${actionFeedback.type} py-2.5 mb-4 d-flex align-items-center gap-2`}>
          {actionFeedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* TAB 1: SANCTION ORDERS */}
      {activeTab === 'sanctions' && (
        <>
          <div className="custom-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">Sanction Order Email Dispatch Trail</h5>
                <span className="text-muted small">
                  Monitors automated statutory sanction order email deliveries with attached PDF copies and provides administrative retry capability.
                </span>
              </div>

              <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Student, App #, Sanction #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: '130px' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="SENT">SENT</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-1">
                  <Search size={16} />
                  <span>Filter</span>
                </button>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : logs.length === 0 ? (
            <div className="custom-card p-5 text-center text-muted">
              <Mail size={48} className="mb-2 text-muted" />
              <h5>No email dispatches recorded</h5>
              <p className="small">Automated emails are triggered when Department Officers generate Sanction Orders.</p>
            </div>
          ) : (
            <div className="custom-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr style={{ fontSize: '0.8rem' }}>
                      <th>Date & Time</th>
                      <th>Student</th>
                      <th>Application Number</th>
                      <th>Sanction Number</th>
                      <th>Recipient Email</th>
                      <th>Email Status</th>
                      <th>Attachment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} style={{ fontSize: '0.85rem' }}>
                        <td className="text-muted text-nowrap">
                          {new Date(log.sentAt || log.createdAt).toLocaleDateString()}{' '}
                          {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="fw-semibold text-dark">{log.studentName || 'Student'}</td>
                        <td className="fw-bold text-primary">{log.applicationNumber}</td>
                        <td className="fw-bold text-dark text-nowrap">{log.sanctionNumber}</td>
                        <td className="text-secondary">{log.recipient}</td>
                        <td>
                          {log.status === 'SENT' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-1">
                              SENT
                            </span>
                          ) : log.status === 'PENDING' ? (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle fw-bold px-2 py-1">
                              PENDING
                            </span>
                          ) : (
                            <div>
                              <span
                                className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold px-2 py-1 d-inline-block"
                                title={log.errorMessage || 'Dispatch failed'}
                              >
                                FAILED
                              </span>
                              {log.errorCode && (
                                <div className="text-danger small mt-0.5" style={{ fontSize: '0.7rem' }}>
                                  {log.errorCode}
                                </div>
                              )}
                            </div>
                          )}
                          {log.retryCount > 0 && (
                            <span className="badge bg-light text-muted border ms-1" title="Retry attempts">
                              +{log.retryCount}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="d-inline-flex align-items-center gap-1 text-primary small fw-semibold">
                            <FileText size={14} />
                            <span className="text-truncate" style={{ maxWidth: '170px' }}>
                              {log.attachmentName || `Sanction_Order_${log.sanctionNumber}.pdf`}
                            </span>
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {log.status === 'FAILED' ? (
                              <button
                                onClick={() => handleRetryEmail(log._id)}
                                disabled={retryingId === log._id}
                                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 fw-bold"
                                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                              >
                                <RefreshCw size={12} className={retryingId === log._id ? 'spin' : ''} />
                                <span>{retryingId === log._id ? 'Retrying...' : 'RETRY EMAIL'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRetryEmail(log._id)}
                                disabled={retryingId === log._id}
                                className="btn btn-light btn-sm text-secondary d-flex align-items-center gap-1"
                                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                title="Resend email"
                              >
                                <RefreshCw size={11} className={retryingId === log._id ? 'spin' : ''} />
                                <span>Resend</span>
                              </button>
                            )}

                            {log.previewUrl && (
                              <a
                                href={log.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-light btn-sm text-primary"
                                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                title="View Ethereal Preview"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: SMART SCHOLARSHIP DEADLINE REMINDERS */}
      {activeTab === 'reminders' && (
        <>
          <div className="custom-card p-4 mb-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold text-dark mb-0">Smart Scholarship Deadline Reminders</h5>
                  <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1">
                    <Sparkles size={12} /> Eligibility Aware
                  </span>
                </div>
                <span className="text-muted small">
                  Automated deadline alerts (48h, 24h, morning, final hours) sent strictly to eligible students based on category, income, and academics.
                </span>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  onClick={handleTriggerReminderScan}
                  disabled={isTriggeringScan}
                  className="btn btn-primary d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                  title="Check all open scholarships and run deadline schedule scan"
                >
                  <Play size={15} className={isTriggeringScan ? 'spin' : ''} />
                  <span>{isTriggeringScan ? 'Running Scan...' : 'Run Scan Now'}</span>
                </button>

                <button
                  onClick={fetchReminderLogs}
                  disabled={loadingReminders}
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  title="Refresh logs"
                >
                  <RefreshCw size={14} className={loadingReminders ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <hr className="my-3 opacity-25" />

            <form onSubmit={handleReminderSearchSubmit} className="row g-2 align-items-center">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search student name, email, or scholarship..."
                  value={reminderSearch}
                  onChange={(e) => setReminderSearch(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={reminderTypeFilter}
                  onChange={(e) => setReminderTypeFilter(e.target.value)}
                >
                  <option value="All">All Intervals</option>
                  <option value="REMINDER_48H">48 Hours Before</option>
                  <option value="REMINDER_24H">24 Hours Before</option>
                  <option value="REMINDER_MORNING">Deadline Morning</option>
                  <option value="REMINDER_FINAL">Final Hours</option>
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={reminderStatusFilter}
                  onChange={(e) => setReminderStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="SENT">SENT</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="col-md-2 d-flex">
                <button type="submit" className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
                  <Search size={14} />
                  <span>Filter</span>
                </button>
              </div>
            </form>
          </div>

          {loadingReminders ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : reminderLogs.length === 0 ? (
            <div className="custom-card p-5 text-center text-muted">
              <Bell size={48} className="mb-2 text-muted" />
              <h5>No deadline reminders sent yet</h5>
              <p className="small mb-3">
                Deadline reminders run automatically in the background via cron, sending alerts to verified eligible students 48h, 24h, morning, and final hours before closing.
              </p>
              <button
                onClick={handleTriggerReminderScan}
                disabled={isTriggeringScan}
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
              >
                <Play size={14} />
                <span>Trigger Manual Scan Now</span>
              </button>
            </div>
          ) : (
            <div className="custom-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr style={{ fontSize: '0.8rem' }}>
                      <th>Dispatched At</th>
                      <th>Student</th>
                      <th>Scholarship Scheme</th>
                      <th>Reminder Interval</th>
                      <th>Eligibility Match Details</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderLogs.map((log) => (
                      <tr key={log._id} style={{ fontSize: '0.85rem' }}>
                        <td className="text-muted text-nowrap">
                          {new Date(log.sentAt || log.createdAt).toLocaleDateString()}{' '}
                          {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{log.studentName || 'Student'}</div>
                          <div className="text-muted small">{log.studentEmail}</div>
                        </td>
                        <td>
                          <div className="fw-bold text-primary d-flex align-items-center gap-1">
                            <Award size={14} />
                            <span>{log.scholarshipName || 'Scholarship'}</span>
                          </div>
                        </td>
                        <td>{formatReminderTypeBadge(log.reminderType)}</td>
                        <td>
                          {log.eligibilitySummary ? (
                            <div className="small">
                              {log.eligibilitySummary.category && (
                                <span className="badge bg-light text-dark border me-1">
                                  Cat: {log.eligibilitySummary.category}
                                </span>
                              )}
                              {log.eligibilitySummary.income && (
                                <span className="badge bg-light text-dark border me-1">
                                  ₹{log.eligibilitySummary.income.toLocaleString()}
                                </span>
                              )}
                              {log.eligibilitySummary.percentage && (
                                <span className="badge bg-light text-dark border">
                                  {log.eligibilitySummary.percentage}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small">Verified Eligible</span>
                          )}
                        </td>
                        <td className="text-nowrap small text-muted">
                          {log.deadline ? (
                            <div className="d-flex align-items-center gap-1">
                              <Clock size={13} />
                              <span>{new Date(log.deadline).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td>
                          {log.status === 'SENT' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-1">
                              SENT
                            </span>
                          ) : (
                            <div>
                              <span
                                className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold px-2 py-1"
                                title={log.errorMessage || 'Failed'}
                              >
                                FAILED
                              </span>
                              {log.errorMessage && (
                                <div className="text-danger small mt-0.5" style={{ fontSize: '0.7rem', maxWidth: '140px' }}>
                                  {log.errorMessage}
                                </div>
                              )}
                            </div>
                          )}
                          {log.retryCount > 0 && (
                            <span className="badge bg-light text-muted border ms-1" title="Retry attempts">
                              +{log.retryCount}
                            </span>
                          )}
                        </td>
                        <td>
                          {log.status === 'FAILED' ? (
                            <button
                              onClick={() => handleRetryReminder(log._id)}
                              disabled={retryingReminderId === log._id}
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 fw-bold"
                              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                            >
                              <RefreshCw size={12} className={retryingReminderId === log._id ? 'spin' : ''} />
                              <span>{retryingReminderId === log._id ? 'Retrying...' : 'RETRY'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRetryReminder(log._id)}
                              disabled={retryingReminderId === log._id}
                              className="btn btn-light btn-sm text-secondary d-flex align-items-center gap-1"
                              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                              title="Resend reminder"
                            >
                              <RefreshCw size={11} className={retryingReminderId === log._id ? 'spin' : ''} />
                              <span>Resend</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default AdminEmailLogs;

