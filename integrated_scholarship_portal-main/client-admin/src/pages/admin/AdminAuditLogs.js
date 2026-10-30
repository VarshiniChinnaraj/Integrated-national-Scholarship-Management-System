import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { History, Search, ShieldCheck, Clock, User, ArrowRight } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [roleFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  return (
    <PortalLayout
      pageTitle="Immutable Statutory Audit Trail & Scrutiny Logs"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Audit Trail' }]}
    >
      <div className="custom-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold text-dark mb-1">Application Lifecycle Audit Stream</h5>
            <span className="text-muted small">
              All status changes and officer actions are permanently sealed with cryptographic timestamps and actor IDs.
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search App # or Officer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="All">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="INSTITUTE_OFFICER">Institute Officer</option>
              <option value="DEPARTMENT_OFFICER">Department Officer</option>
              <option value="SYSTEM">System Automated</option>
            </select>
            <button type="submit" className="btn btn-primary">
              <Search size={16} />
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
          <History size={48} className="mb-2 text-muted" />
          <h5>No audit logs found</h5>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Timestamp</th>
                  <th>Application Number</th>
                  <th>Status Transition</th>
                  <th>Executing Actor</th>
                  <th>Officer Role</th>
                  <th>Official Remarks / Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ fontSize: '0.85rem' }}>
                    <td className="text-muted text-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="fw-bold text-primary">{log.applicationNumber}</td>
                    <td>
                      <div className="d-flex align-items-center gap-1.5 small">
                        <span className="badge bg-light text-secondary border">{log.previousStatus}</span>
                        <ArrowRight size={12} className="text-muted" />
                        <span className="badge bg-primary">{log.newStatus}</span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{log.officerName}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.officerRole === 'STUDENT'
                            ? 'bg-light text-dark border'
                            : log.officerRole === 'INSTITUTE_OFFICER'
                            ? 'bg-warning-subtle text-warning border'
                            : log.officerRole === 'DEPARTMENT_OFFICER'
                            ? 'bg-purple-subtle text-purple border'
                            : 'bg-primary-subtle text-primary border'
                        }`}
                        style={log.officerRole === 'DEPARTMENT_OFFICER' ? { backgroundColor: 'rgba(73,53,79,0.08)', color: '#49354F' } : {}}
                      >
                        {log.officerRole}
                      </span>
                    </td>
                    <td className="text-secondary small" style={{ maxWidth: '300px' }}>
                      {log.remarks || 'Status transition logged.'}
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

export default AdminAuditLogs;

