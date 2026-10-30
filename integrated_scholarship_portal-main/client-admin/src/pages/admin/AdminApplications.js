import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { FileText, Search, Filter, ShieldCheck, Download, Printer, AlertTriangle } from 'lucide-react';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [instFilter, setInstFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchFilterOptions();
  }, [statusFilter, instFilter, deptFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (instFilter !== 'All') params.institutionId = instFilter;
      if (deptFilter !== 'All') params.departmentId = deptFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/applications', { params });
      if (res.data.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load admin applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [instRes, deptRes] = await Promise.all([
        api.get('/admin/institutions'),
        api.get('/admin/departments')
      ]);
      if (instRes.data.success) setInstitutions(instRes.data.institutions || []);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
    } catch (err) {
      // Ignored
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  return (
    <PortalLayout
      pageTitle="Global Scholarship Application Monitoring"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Application Monitoring' }]}
    >
      {/* Comprehensive Filter Bar */}
      <div className="custom-card p-4 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted">Search Application</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="App #, student name, college..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold text-muted">Filter by Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ROUTED_TO_DEPARTMENT">Routed to Dept</option>
                <option value="APPROVED">Approved</option>
                <option value="SANCTIONED">Sanctioned</option>
                <option value="DISBURSED">Disbursed (DBT)</option>
                <option value="CORRECTION_REQUIRED">Correction Needed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted">Institution</label>
              <select
                className="form-select"
                value={instFilter}
                onChange={(e) => setInstFilter(e.target.value)}
              >
                <option value="All">All Colleges</option>
                {institutions.map((i) => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold text-muted">Department</label>
              <select
                className="form-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="All">All Depts</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-1 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100 py-2">
                <Search size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Global Applications Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : applications.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <FileText size={48} className="mb-2 text-muted" />
          <h5>No applications found</h5>
          <p className="small">Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Application Number</th>
                  <th>Beneficiary Student</th>
                  <th>Institution (College)</th>
                  <th>Department Body</th>
                  <th>Scholarship Scheme</th>
                  <th>Status</th>
                  <th>Grant Amount</th>
                  <th className="text-end pe-4">Date</th>
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
                    <td className="fw-bold text-primary">{app.applicationNumber}</td>
                    <td>
                      <div className="fw-semibold text-dark">{app.studentName}</div>
                      <span className="text-muted small">{app.studentEmail}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                        {app.institutionName}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                        {app.departmentName || 'Welfare Dept'}
                      </div>
                    </td>
                    <td>
                      <div className="text-dark text-truncate" style={{ maxWidth: '180px' }}>
                        {app.scholarshipName}
                      </div>
                    </td>
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
                      <span className="fw-bold text-success">
                        ₹{(app.approvedAmount || app.requestedAmount)?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="text-end pe-4 text-muted small">
                      {new Date(app.createdAt).toLocaleDateString()}
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

export default AdminApplications;
