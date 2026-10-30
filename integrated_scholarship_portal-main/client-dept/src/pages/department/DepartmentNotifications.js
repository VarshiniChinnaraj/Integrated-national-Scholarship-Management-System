import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Bell, Info, ExternalLink } from 'lucide-react';

const DepartmentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/department/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load department notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <PortalLayout
      pageTitle="Department Officer Notifications"
      breadcrumbs={[{ label: 'Department Portal', link: '/department/dashboard' }, { label: 'Notifications' }]}
    >
      <div className="custom-card p-3 p-sm-4">
        <h5 className="fw-bold text-dark border-bottom pb-3 mb-4">Department Officer Alerts</h5>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Bell size={48} className="mb-2 text-muted" />
            <p>No department alerts at this time.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notifications.map((n) => (
              <div key={n._id} className="p-3 rounded-3 border bg-light d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
                <div className="d-flex align-items-start gap-3">
                  <Info size={20} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold text-dark mb-1 text-break">{n.title}</h6>
                    <p className="text-muted mb-2 small text-break">{n.message}</p>
                    <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {n.link && (
                  <Link to={n.link} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 align-self-end align-self-sm-start flex-shrink-0">
                    <span>Inspect</span>
                    <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default DepartmentNotifications;
