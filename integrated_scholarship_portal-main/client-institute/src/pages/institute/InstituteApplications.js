import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { FileText, Search, ShieldCheck, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 15000; // 15 seconds live refresh

const InstituteApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const pollRef = useRef(null);

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/institute/applications', { params });
      if (res.data.success) {
        setApplications(res.data.applications || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch institute applications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, search]);

  // Initial load + re-fetch when filter changes
  useEffect(() => {
    fetchApplications(false);
  }, [statusFilter]);

  // Live polling
  useEffect(() => {
    if (isLive) {
      pollRef.current = setInterval(() => fetchApplications(true), POLL_INTERVAL);
    }
    return () => clearInterval(pollRef.current);
  }, [isLive, fetchApplications]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications(false);
  };

  return (
    <PortalLayout
      pageTitle="Institutional Application Scrutiny & Verification"
      breadcrumbs={[{ label: 'Institute Portal', link: '/institute/dashboard' }, { label: 'Applications' }]}
    >
      {/* Search & Status Filters */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        {/* Live status bar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span
              className="rounded-circle d-inline-block"
              style={{ width: 8, height: 8, background: isLive ? '#16a34a' : '#7D7480', animation: isLive ? 'pulse 2s infinite' : 'none' }}
            />
            <span className="small text-muted">
              {isLive ? 'Live — auto-refreshing every 15s' : 'Paused'}
              {lastUpdated && <> · Last updated {lastUpdated.toLocaleTimeString()}</>}
            </span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => fetchApplications(false)}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setIsLive(v => !v)}
            >
              {isLive ? 'Pause Live' : 'Resume Live'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search application number, student, or scheme..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4 col-lg-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Application Statuses</option>
                <option value="SUBMITTED">Pending Verification (SUBMITTED)</option>
                <option value="ROUTED_TO_DEPARTMENT">Routed to Department</option>
                <option value="APPROVED">Approved</option>
                <option value="CORRECTION_REQUIRED">Correction Requested</option>
                <option value="REJECTED">Rejected</option>
                <option value="DISBURSED">Disbursed</option>
              </select>
            </div>

            <div className="col-12 col-md-3 col-lg-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary px-4 w-100">
                Filter Applications
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : applications.length === 0 ? (
        <div className="custom-card p-4 p-sm-5 text-center text-muted">
          <FileText size={48} className="mb-2 text-muted" />
          <h5>No applications found for this filter</h5>
          <p className="small">Try resetting your status or search query.</p>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '720px' }}>
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Application Number</th>
                  <th>Student Name</th>
                  <th>Scholarship Scheme</th>
                  <th>Target Department</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app._id}
                    style={{
                      fontSize: '0.88rem',
                      backgroundColor: app.slpTracking?.slaStatus === 'SLA_BREACHED' ? '#fefce8' : 'transparent',
                      borderLeft: app.slpTracking?.slaStatus === 'SLA_BREACHED' ? '3px solid #eab308' : 'none'
                    }}
                  >
                    <td className="fw-bold text-primary text-break">{app.applicationNumber}</td>
                    <td>
                      <div className="fw-semibold text-dark">{app.studentName}</div>
                      <span className="text-muted small text-break">{app.studentEmail}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }}>
                        {app.scholarshipName}
                      </div>
                      <span className="text-muted small">₹{app.requestedAmount?.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border text-wrap text-start">
                        {app.departmentName || app.departmentId?.name || 'Assigned Dept'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex flex-column gap-1 align-items-start">
                        <StatusBadge status={app.status} />
                        {app.slpTracking?.slaStatus === 'SLA_BREACHED' && (
                          <span className="badge badge-sla-breached d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                            <AlertTriangle size={11} />
                            SLA Delayed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      {app.status === 'SUBMITTED' ? (
                        <Link
                          to={`/institute/applications/${app._id}`}
                          className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 shadow-sm fw-semibold"
                        >
                          <ShieldCheck size={15} />
                          <span>Verify</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/institute/applications/${app._id}`}
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default InstituteApplications;
