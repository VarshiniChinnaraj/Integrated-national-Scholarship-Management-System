import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Bell, Check, ExternalLink, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/student/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <PortalLayout
      pageTitle="Notifications & System Alerts"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'Notifications' }]}
    >
      <div className="custom-card p-3 p-sm-4">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <h5 className="fw-bold text-dark mb-0">Notification Inbox</h5>
          <span className="badge bg-primary">
            {notifications.filter((n) => !n.isRead).length} Unread
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Bell size={48} className="mb-2 text-muted" />
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                className="p-3 rounded-3 border d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3"
                style={{
                  background: n.isRead ? '#fff' : 'rgba(168,139,181,0.06)',
                  borderColor: n.isRead ? 'var(--lavender-pale)' : 'var(--lavender)',
                  borderLeft: `4px solid ${n.isRead ? 'var(--lavender-pale)' : 'var(--lavender)'}`
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {n.type === 'success' && <CheckCircle2 size={20} color="#16A34A" />}
                    {n.type === 'warning' && <AlertTriangle size={20} color="#D97706" />}
                    {n.type === 'danger'  && <AlertTriangle size={20} color="#DC2626" />}
                    {(!n.type || n.type === 'info') && <Info size={20} color="var(--plum)" />}
                  </div>
                  <div>
                    <h6 style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4 }} className="text-break">{n.title}</h6>
                    <p style={{ color: 'var(--muted-grey)', marginBottom: 8, fontSize: '0.88rem' }} className="text-break">{n.message}</p>
                    <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--muted-grey)' }}>
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.link && (
                        <Link to={n.link} style={{ color: 'var(--plum)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>View Details</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 align-self-end align-self-sm-start flex-shrink-0"
                    title="Mark as Read"
                  >
                    <Check size={14} />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Notifications;
