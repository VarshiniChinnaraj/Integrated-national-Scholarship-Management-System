import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { 
  Bell, 
  LogOut, 
  Menu, 
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Clock,
  CheckCheck
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently ignore in poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/admin/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    Swal.fire({
      title: 'Sign Out Session',
      text: 'Are you sure you want to end your administrator session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#49354F',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Sign Out'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login');
      }
    });
  };

  return (
    <header className="portal-navbar px-3 px-lg-4 d-flex align-items-center justify-content-between">
      {/* Left side: Hamburger and Portal Identification */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light d-lg-none p-2 border rounded-3 d-flex align-items-center justify-content-center text-dark"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Drawer"
          style={{ width: '38px', height: '38px' }}
        >
          <Menu size={20} />
        </button>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="p-1.5 rounded-3 d-flex align-items-center justify-content-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="fw-bold text-dark" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Admin
                </span>
              </div>
              <div className="text-muted d-none d-md-block" style={{ fontSize: '0.72rem' }}>
                Central Administration, Scheme Governance & Security Control
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Time Pill, Notifications, User Menu */}
      <div className="d-flex align-items-center gap-2.5">
        {/* System Time Pill */}
        <div className="d-none d-xl-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border text-muted small">
          <Clock size={13} className="text-secondary" />
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="position-relative" ref={notifRef}>
          <button
            className={`btn btn-light border position-relative p-0 rounded-circle d-flex align-items-center justify-content-center transition-all ${
              showNotifDropdown ? 'shadow-sm' + ' border-0' : 'text-secondary hover-bg'
            }`}
            style={{ width: '40px', height: '40px' }}
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            aria-label="Notifications"
          >
            <Bell size={18} className={showNotifDropdown ? 'text-white' : 'text-secondary'} />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-white"
                style={{ fontSize: '0.65rem', minWidth: '18px', height: '18px', padding: '2px 4px' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="position-absolute end-0 mt-2 dropdown-menu-glass shadow-lg p-0"
              style={{ width: '340px', maxWidth: 'calc(100vw - 24px)', zIndex: 1060 }}
            >
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold small text-dark">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill" style={{ fontSize: '0.68rem' }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="btn btn-link p-0 text-decoration-none small d-flex align-items-center gap-1"
                    style={{ fontSize: "0.75rem", color: "#49354F" }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="custom-dark-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted small">
                    <Bell size={24} className="opacity-25 mb-2 d-block mx-auto" />
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-bottom notification-item ${!n.read ? 'unread' : ''}`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                          {n.title}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-secondary text-truncate-2" style={{ lineHeight: '1.3' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 text-center border-top bg-light bg-opacity-50">
                <Link
                  to="/admin/notifications"
                  className="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                  onClick={() => setShowNotifDropdown(false)}
                >
                  <span>View All Notifications</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="position-relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="btn btn-light border rounded-pill p-1 ps-1.5 pe-3 d-flex align-items-center gap-2 hover-bg shadow-sm"
            style={{ height: '42px' }}
          >
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{
                width: '32px',
                height: '32px',
                fontSize: '0.88rem',
                background: 'linear-gradient(135deg, #49354F, #3A2940)'
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="d-none d-md-block text-start" style={{ lineHeight: '1.2' }}>
              <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem', maxWidth: '140px' }}>
                {user?.name || 'Administrator'}
              </div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                System Admin
              </div>
            </div>
            <ChevronDown size={14} className="text-muted d-none d-sm-block ms-1" />
          </button>

          {showUserDropdown && (
            <div
              className="position-absolute end-0 mt-2 dropdown-menu-glass shadow-lg p-0"
              style={{ width: '260px', zIndex: 1060 }}
            >
              {/* User Details Header */}
              <div className="p-3 border-bottom bg-light bg-opacity-70">
                <div className="fw-bold text-dark text-truncate">{user?.name || 'Administrator'}</div>
                <div className="text-muted text-truncate small mb-2" style={{ fontSize: "0.75rem", color: "#49354F" }}>
                  {user?.email || 'admin@nsp.gov.in'}
                </div>
                <div>
                  <span className="badge rounded-pill bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
                    Central Administrator
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-1.5">
                <Link
                  to="/admin/notifications"
                  className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2 text-dark small fw-semibold"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Bell size={16} style={{ color: "#49354F" }} />
                  <span>Notification Center</span>
                </Link>
              </div>

              <div className="border-top p-1.5">
                <button
                  onClick={handleLogout}
                  className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2 text-danger small fw-semibold hover-bg"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;


