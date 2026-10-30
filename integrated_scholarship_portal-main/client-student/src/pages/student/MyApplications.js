import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { FileText, Eye, AlertTriangle, Search, RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 15000;

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  const fetchApplications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/student/applications');
      if (res.data.success) {
        setApplications(res.data.applications || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(false);
    pollRef.current = setInterval(() => fetchApplications(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const filtered = applications.filter((app) => {
    const matchStatus = filterStatus === 'All' || app.status === filterStatus;
    const matchSearch =
      !search ||
      app.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.scholarshipName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <PortalLayout
      pageTitle="My Submitted Scholarship Applications"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'My Applications' }]}
    >
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, background: '#16a34a', animation: 'pulse 2s infinite' }} />
            <span className="small text-muted">
              Live — auto-refreshing every 15s
              {lastUpdated && <> · {lastUpdated.toLocaleTimeString()}</>}
            </span>
          </div>
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => fetchApplications(false)}>
            <RefreshCw size={13} /> Refresh Now
          </button>
        </div>
        <div className="row g-3 align-items-center justify-content-between">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by application number or scholarship..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-5 col-lg-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Lifecycle Statuses</option>
              <option value="SUBMITTED">Submitted (Pending Institute)</option>
              <option value="ROUTED_TO_DEPARTMENT">Routed to Department</option>
              <option value="APPROVED">Approved</option>
              <option value="SANCTIONED">Sanctioned</option>
              <option value="DISBURSED">Disbursed (DBT)</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="custom-card p-4 p-sm-5 text-center text-muted">
          <FileText size={48} className="mb-2 text-muted" />
          <h5>No applications found</h5>
          <p className="small">Browse available schemes and submit an online application.</p>
          <Link to="/student/scholarships" className="btn btn-primary btn-sm">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '680px' }}>
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Application Number</th>
                  <th>Scholarship Scheme</th>
                  <th>Applied Date</th>
                  <th>Current Status</th>
                  <th>Grant Amount</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app._id}
                    style={{
                      fontSize: '0.88rem',
                      backgroundColor: app.slpTracking?.slaStatus === 'SLA_BREACHED' ? '#fefce8' : 'transparent',
                      borderLeft: app.slpTracking?.slaStatus === 'SLA_BREACHED' ? '3px solid #eab308' : 'none'
                    }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--plum)', fontFamily: 'monospace', fontSize: '0.82rem' }} className="text-break">{app.applicationNumber}</td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '280px' }}>
                        {app.scholarshipName}
                      </div>
                      <span className="text-muted small text-truncate d-block" style={{ maxWidth: '280px' }}>{app.institutionName}</span>
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
                    <td>
                      {app.approvedAmount > 0 ? (
                        <div>
                          <span className="fw-bold text-success">₹{app.approvedAmount.toLocaleString('en-IN')}</span>
                          <span className="badge bg-success-subtle text-success ms-1 small">Approved</span>
                        </div>
                      ) : (
                        <span className="text-muted">₹{app.requestedAmount?.toLocaleString('en-IN')} (Req)</span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                        {app.status === 'CORRECTION_REQUIRED' && (
                          <Link
                            to={`/student/applications/${app._id}?action=fix`}
                            className="btn btn-warning btn-sm d-flex align-items-center gap-1 fw-semibold"
                          >
                            <AlertTriangle size={14} />
                            <span>Fix Corrections</span>
                          </Link>
                        )}
                        <Link
                          to={`/student/applications/${app._id}`}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        >
                          <Eye size={14} />
                          <span>Track & View</span>
                        </Link>
                      </div>
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

export default MyApplications;
