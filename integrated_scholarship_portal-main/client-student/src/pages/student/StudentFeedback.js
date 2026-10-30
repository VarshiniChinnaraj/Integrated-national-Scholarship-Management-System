import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CornerDownRight,
  RefreshCw,
  Info
} from 'lucide-react';

const StudentFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [msgBanner, setMsgBanner] = useState(null);

  const [formData, setFormData] = useState({
    category: 'SLA Delay / Processing Bottleneck',
    applicationNumber: '',
    priority: 'Normal',
    subject: '',
    message: ''
  });

  const categories = [
    'SLA Delay / Processing Bottleneck',
    'Application Status Query',
    'Document Verification Query',
    'Portal Usability & Technical Glitch',
    'Disbursement & DBT Payment Query',
    'General Grievance / Suggestion'
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback/my');
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error('Failed to load feedback history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setMsgBanner({ type: 'danger', text: 'Please complete all required fields.' });
      return;
    }

    setSubmitting(true);
    setMsgBanner(null);

    try {
      const res = await api.post('/feedback', formData);
      if (res.data.success) {
        setMsgBanner({
          type: 'success',
          text: 'Your feedback has been submitted successfully to the Administration Desk.'
        });
        setFormData({
          category: 'SLA Delay / Processing Bottleneck',
          applicationNumber: '',
          priority: 'Normal',
          subject: '',
          message: ''
        });
        fetchFeedbacks();
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setMsgBanner({
        type: 'danger',
        text: err.response?.data?.message || 'Error submitting feedback. Please try again.'
      });
    } finally {
      setSubmitting(false);
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
      pageTitle="Feedback & Support Helpdesk"
      breadcrumbs={[
        { label: 'Student Portal', link: '/student/dashboard' },
        { label: 'Feedback & Support' }
      ]}
    >
      {msgBanner && (
        <div className={`alert alert-${msgBanner.type} alert-dismissible fade show mb-4`} role="alert">
          {msgBanner.text}
          <button type="button" className="btn-close" onClick={() => setMsgBanner(null)} />
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Submission Form */}
        <div className="col-12 col-xl-5">
          <div className="custom-card p-4 h-100 shadow-sm border-0 rounded-3 bg-white">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <MessageSquare className="text-primary" size={22} />
              <div>
                <h5 className="fw-bold mb-0 text-dark">Submit Feedback</h5>
                <small className="text-muted">Report SLA bottlenecks, verification queries or technical issues</small>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Feedback Category <span className="text-danger">*</span>
                </label>
                <select
                  name="category"
                  className="form-select form-select-sm"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Application Number (Optional)
                </label>
                <input
                  type="text"
                  name="applicationNumber"
                  className="form-control form-control-sm"
                  placeholder="e.g. NSP2026-..."
                  value={formData.applicationNumber}
                  onChange={handleChange}
                />
                <div className="form-text text-muted small">
                  Attach your Application ID if this concerns an active application SLA delay.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Urgency / Priority
                </label>
                <div className="d-flex gap-3">
                  {['Normal', 'Important', 'Urgent'].map((p) => (
                    <div className="form-check" key={p}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        id={`p_${p}`}
                        value={p}
                        checked={formData.priority === p}
                        onChange={handleChange}
                      />
                      <label className="form-check-label small" htmlFor={`p_${p}`}>
                        {p}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">
                  Subject / Summary <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  className="form-control form-control-sm"
                  placeholder="Briefly state your concern..."
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-secondary">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  name="message"
                  className="form-control form-control-sm"
                  rows="5"
                  placeholder="Provide complete details so administration can investigate..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit to Administration
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Submitted Tickets & Responses */}
        <div className="col-12 col-xl-7">
          <div className="custom-card p-4 h-100 shadow-sm border-0 rounded-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold mb-0 text-dark">My Feedback Tickets</h5>
                <small className="text-muted">Track status updates and official administration responses</small>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={fetchFeedbacks}
                title="Refresh Tickets"
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="text-muted small mt-2">Loading ticket history...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <MessageSquare size={48} className="mb-2 text-muted opacity-50" />
                <h6 className="fw-semibold">No feedback submitted yet</h6>
                <p className="small text-muted">
                  Use the form on the left to report queries, delays, or issues.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb._id}
                    className={`card border rounded-3 p-3 transition-all ${
                      selectedFeedback?._id === fb._id ? 'border-primary shadow-sm bg-light-subtle' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedFeedback(selectedFeedback?._id === fb._id ? null : fb)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {getStatusBadge(fb.status)}
                        {getPriorityBadge(fb.priority)}
                        <span className="badge bg-light text-dark border small">{fb.category}</span>
                        {fb.applicationNumber && (
                          <span className="badge bg-secondary-subtle text-secondary border small">
                            <FileText size={12} className="me-1" />
                            {fb.applicationNumber}
                          </span>
                        )}
                      </div>
                      <small className="text-muted d-flex align-items-center gap-1">
                        <Clock size={13} />
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    <h6 className="fw-bold text-dark mb-1">{fb.subject}</h6>
                    <p className="text-muted small mb-2 text-truncate">{fb.message}</p>

                    {/* Admin Response Preview or Highlight */}
                    {fb.adminResponse ? (
                      <div className="mt-2 p-2.5 rounded bg-success-subtle border border-success-subtle text-success-emphasis">
                        <div className="d-flex align-items-center gap-1.5 fw-semibold small mb-1">
                          <CheckCircle2 size={15} className="text-success" />
                          Official Response from {fb.respondedByName || 'Admin Desk'}:
                        </div>
                        <div className="small text-dark" style={{ whiteSpace: 'pre-line' }}>
                          {fb.adminResponse}
                        </div>
                        {fb.respondedAt && (
                          <div className="text-muted small mt-1 text-end" style={{ fontSize: '0.72rem' }}>
                            Responded on {new Date(fb.respondedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-1 text-muted small mt-1">
                        <Clock size={13} />
                        <span>Awaiting administration review</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default StudentFeedback;
