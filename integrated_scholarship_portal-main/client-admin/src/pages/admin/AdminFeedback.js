import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  User,
  Building2,
  Landmark,
  FileText,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inReviewCount: 0,
    resolvedCount: 0,
    closedCount: 0,
    urgentCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected feedback for modal
  const [activeItem, setActiveItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [roleFilter, statusFilter, priorityFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/feedback/admin/all', { params });
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load admin feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFeedbacks();
  };

  const openReviewModal = async (item) => {
    try {
      // Call detail endpoint to mark as IN_REVIEW if NEW
      const res = await api.get(`/feedback/${item._id}`);
      if (res.data.success) {
        setActiveItem(res.data.feedback);
        setReplyText(res.data.feedback.adminResponse || '');
        setReplyStatus(res.data.feedback.status === 'NEW' ? 'RESOLVED' : res.data.feedback.status);
      } else {
        setActiveItem(item);
      }
    } catch (err) {
      setActiveItem(item);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter an official response before submitting.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/feedback/${activeItem._id}/reply`, {
        response: replyText.trim(),
        status: replyStatus
      });

      if (res.data.success) {
        setBanner({
          type: 'success',
          text: `Official response successfully dispatched to ${activeItem.senderName} (${activeItem.senderRole}).`
        });
        setActiveItem(res.data.feedback);
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Failed to dispatch response:', err);
      alert(err.response?.data?.message || 'Failed to send response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/feedback/${activeItem._id}/status`, {
        status: newStatus
      });

      if (res.data.success) {
        setActiveItem(res.data.feedback);
        setReplyStatus(newStatus);
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'STUDENT':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Student</span>;
      case 'INSTITUTE_OFFICER':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Institute Officer</span>;
      case 'DEPARTMENT_OFFICER':
        return <span className="badge bg-purple-subtle text-indigo border" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>Dept Officer</span>;
      default:
        return <span className="badge bg-light text-dark border">{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="badge bg-primary text-white">NEW</span>;
      case 'IN_REVIEW':
        return <span className="badge bg-warning text-dark">IN REVIEW</span>;
      case 'RESOLVED':
        return <span className="badge bg-success text-white">RESOLVED</span>;
      case 'CLOSED':
        return <span className="badge bg-secondary text-white">CLOSED</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="badge bg-danger-subtle text-danger border border-danger">Urgent</span>;
      case 'Important':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">Important</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border">Normal</span>;
    }
  };

  return (
    <PortalLayout
      pageTitle="Feedback & Grievance Central Desk"
      breadcrumbs={[
        { label: 'Central Admin', link: '/admin/dashboard' },
        { label: 'Feedback Desk' }
      ]}
    >
      {banner && (
        <div className={`alert alert-${banner.type} alert-dismissible fade show mb-4`} role="alert">
          {banner.text}
          <button type="button" className="btn-close" onClick={() => setBanner(null)} />
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white">
            <small className="text-muted fw-semibold d-block mb-1">Total Tickets</small>
            <h3 className="fw-bold mb-0 text-dark">{stats.total}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white">
            <small className="text-muted fw-semibold d-block mb-1">New Unread</small>
            <h3 className="fw-bold mb-0 text-primary">{stats.newCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white">
            <small className="text-muted fw-semibold d-block mb-1">In Review</small>
            <h3 className="fw-bold mb-0 text-warning">{stats.inReviewCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white">
            <small className="text-muted fw-semibold d-block mb-1">Resolved</small>
            <h3 className="fw-bold mb-0 text-success">{stats.resolvedCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white">
            <small className="text-muted fw-semibold d-block mb-1">Closed</small>
            <h3 className="fw-bold mb-0 text-secondary">{stats.closedCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="custom-card p-3 text-center border-0 shadow-sm rounded-3 bg-white border-start border-danger border-4">
            <small className="text-muted fw-semibold d-block mb-1">Urgent Priority</small>
            <h3 className="fw-bold mb-0 text-danger">{stats.urgentCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="custom-card p-4 border-0 shadow-sm rounded-3 bg-white">
        {/* Filters and Search Bar */}
        <div className="row g-3 align-items-center mb-4 pb-3 border-bottom">
          <div className="col-12 col-lg-5">
            <form onSubmit={handleSearchSubmit} className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search subject, message, sender name or app #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-outline-primary">
                Search
              </button>
            </form>
          </div>

          <div className="col-12 col-lg-7 d-flex gap-2 flex-wrap justify-content-lg-end">
            <select
              className="form-select form-select-sm w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Sender Roles</option>
              <option value="STUDENT">Students</option>
              <option value="INSTITUTE_OFFICER">Institute Officers</option>
              <option value="DEPARTMENT_OFFICER">Department Officers</option>
            </select>

            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              className="form-select form-select-sm w-auto"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>

            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={fetchFeedbacks}
              title="Reload list"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted small mt-2">Loading feedback records...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <MessageSquare size={48} className="mb-2 opacity-50" />
            <h6 className="fw-semibold">No feedback records match the active filters</h6>
            <p className="small text-muted">Try clearing the search query or changing filter options.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small fw-semibold text-uppercase">
                <tr>
                  <th style={{ minWidth: '130px' }}>Sender</th>
                  <th style={{ minWidth: '110px' }}>Role / Entity</th>
                  <th style={{ minWidth: '120px' }}>App #</th>
                  <th style={{ minWidth: '220px' }}>Subject & Category</th>
                  <th style={{ minWidth: '90px' }}>Priority</th>
                  <th style={{ minWidth: '100px' }}>Status</th>
                  <th style={{ minWidth: '100px' }}>Submitted</th>
                  <th style={{ minWidth: '120px' }} className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr key={fb._id}>
                    <td>
                      <div className="fw-semibold text-dark">{fb.senderName}</div>
                      <small className="text-muted">{fb.senderEmail}</small>
                    </td>
                    <td>
                      <div>{getRoleBadge(fb.senderRole)}</div>
                      <small className="text-muted d-block text-truncate" style={{ maxWidth: '160px' }}>
                        {fb.institutionName || fb.departmentName || '—'}
                      </small>
                    </td>
                    <td>
                      {fb.applicationNumber ? (
                        <span className="badge bg-light text-dark border small font-monospace">
                          {fb.applicationNumber}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '280px' }}>
                        {fb.subject}
                      </div>
                      <small className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                        {fb.category}
                      </small>
                    </td>
                    <td>{getPriorityBadge(fb.priority)}</td>
                    <td>{getStatusBadge(fb.status)}</td>
                    <td>
                      <small className="text-muted">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={() => openReviewModal(fb)}
                      >
                        Review & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Reply Modal */}
      {activeItem && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-light">
                <div className="d-flex align-items-center gap-2">
                  <MessageSquare className="text-primary" size={20} />
                  <h5 className="modal-title fw-bold text-dark mb-0">Feedback Ticket Details</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveItem(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Meta details header */}
                <div className="p-3 rounded-3 bg-light border mb-4">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Sender Details</small>
                      <div className="fw-bold text-dark">{activeItem.senderName}</div>
                      <div className="small text-muted">{activeItem.senderEmail}</div>
                      <div className="mt-1">{getRoleBadge(activeItem.senderRole)}</div>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Institution / Department</small>
                      <div className="fw-semibold text-dark">
                        {activeItem.institutionName || activeItem.departmentName || 'Direct Applicant'}
                      </div>
                      {activeItem.applicationNumber && (
                        <div className="mt-1">
                          <small className="text-muted me-1">Application Ref:</small>
                          <span className="badge bg-white text-dark border font-monospace">
                            {activeItem.applicationNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {activeItem.category}
                      </span>
                      {getPriorityBadge(activeItem.priority)}
                      {getStatusBadge(activeItem.status)}
                    </div>
                    <small className="text-muted">
                      Submitted on: {new Date(activeItem.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{activeItem.subject}</h5>
                  <div className="p-3 rounded-2 bg-light border text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                    {activeItem.message}
                  </div>
                </div>

                {/* Previous Admin Response if exists */}
                {activeItem.adminResponse && (
                  <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle mb-4">
                    <div className="d-flex align-items-center gap-1.5 fw-semibold text-success-emphasis mb-1">
                      <CheckCircle2 size={16} className="text-success" />
                      Dispatched Response (by {activeItem.respondedByName || 'Admin Desk'}):
                    </div>
                    <div className="text-dark small" style={{ whiteSpace: 'pre-wrap' }}>
                      {activeItem.adminResponse}
                    </div>
                    {activeItem.respondedAt && (
                      <div className="text-muted small mt-2 text-end" style={{ fontSize: '0.72rem' }}>
                        Timestamp: {new Date(activeItem.respondedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Reply & Action Box */}
                <div className="border rounded-3 p-3 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Compose Administration Response</h6>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Set Ticket Status
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value)}
                      >
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div className="col-sm-6 d-flex align-items-end">
                      <div className="d-flex gap-2 w-100">
                        {['IN_REVIEW', 'RESOLVED', 'CLOSED'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`btn btn-sm flex-fill ${activeItem.status === st ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => handleStatusChange(st)}
                            disabled={actionLoading || activeItem.status === st}
                          >
                            Mark {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Official Written Response
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Type official grievance reply or operational resolution instructions..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setActiveItem(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
                      onClick={handleSendReply}
                      disabled={actionLoading || !replyText.trim()}
                    >
                      {actionLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Dispatch Response & Update Status
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminFeedback;
