import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Bell, Send, CheckCircle, Info, Megaphone } from 'lucide-react';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('ALL');
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post('/admin/notifications/broadcast', {
        recipientRole: broadcastRole,
        title: broadcastTitle,
        message: broadcastMessage,
        type: 'info'
      });
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Broadcast notification dispatched successfully!' });
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchNotifications();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to send broadcast.' });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="System Alerts & Broadcast Notifications"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Notifications' }]}
    >
      <div className="row g-4">
        {/* Left: Broadcast Form */}
        <div className="col-12 col-lg-5">
          <div className="custom-card p-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              <span>Broadcast System Announcement</span>
            </h5>

            {feedback.message && (
              <div className={`alert alert-${feedback.type} py-2 small d-flex align-items-center gap-2 mb-3`}>
                <CheckCircle size={16} />
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Target Audience</label>
                <select
                  className="form-select"
                  value={broadcastRole}
                  onChange={(e) => setBroadcastRole(e.target.value)}
                >
                  <option value="ALL">All Users (Students & Officers)</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="INSTITUTE_OFFICER">Institute Officers Only</option>
                  <option value="DEPARTMENT_OFFICER">Department Officers Only</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Notification Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Scheme Application Deadline Extended"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Message Body</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter detailed broadcast alert message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              >
                <Send size={15} />
                <span>{broadcasting ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Notification Feed */}
        <div className="col-12 col-lg-7">
          <div className="custom-card p-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Admin Notification Feed</h5>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-muted small py-4 text-center">No notifications at this time.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {notifications.map((n) => (
                  <div key={n._id} className="p-3 rounded bg-light border">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="fw-bold text-dark">{n.title}</div>
                      <span className="badge bg-secondary">{n.recipientRole || 'ALL'}</span>
                    </div>
                    <p className="text-muted small mb-1">{n.message}</p>
                    <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
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

export default AdminNotifications;
