import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../services/api';
import Swal from 'sweetalert2';
import { 
  GraduationCap, 
  Bell, 
  User, 
  LogOut, 
  LayoutDashboard, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  ChevronDown 
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const studentData = localStorage.getItem('student')
    ? JSON.parse(localStorage.getItem('student'))
    : null;

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/admin/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await API.put(`/admin/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setNotifDropdownOpen(false);

    Swal.fire({
      title: notif.title,
      html: `
        <div class="text-start small p-2">
          <p class="mb-2 text-dark fs-6">${notif.message}</p>
          ${notif.refNo ? `<div class="p-2 bg-light rounded mb-2 border"><strong>Application Ref:</strong> ${notif.refNo}</div>` : ''}
          ${notif.remarks ? `<div class="p-2 bg-danger-subtle rounded text-danger border"><strong>Officer Rejection Reason:</strong> "${notif.remarks}"</div>` : ''}
          <div class="text-muted small mt-2">Received: ${new Date(notif.createdAt).toLocaleString()}</div>
        </div>
      `,
      icon: notif.type === 'success' ? 'success' : notif.type === 'danger' ? 'error' : 'info',
      confirmButtonColor: '#2563eb',
      confirmButtonText: notif.type === 'danger' ? 'Go to Dashboard' : 'Close'
    }).then((res) => {
      if (res.isConfirmed && notif.type === 'danger') {
        navigate('/dashboard');
      }
    });
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    Swal.fire({
      title: 'Sign Out Session',
      text: 'Are you sure you want to log out of your session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Log Out'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('student');
        navigate('/login', { replace: true });
      }
    });
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <nav className="portal-navbar px-3 px-lg-4 d-flex align-items-center justify-content-between shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between px-0">
        {/* Brand Logo & Name */}
        <Link className="d-flex align-items-center gap-2.5 text-decoration-none" to="/dashboard">
          <div
            className="p-2 rounded-3 text-white shadow-sm d-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span className="fw-bold text-dark fs-5 mb-0" style={{ letterSpacing: '-0.01em' }}>
                Student
              </span>
            </div>
          </div>
        </Link>

        {studentData && (
          <div className="d-flex align-items-center gap-3">
            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              className={`btn btn-sm ${
                location.pathname === '/dashboard'
                  ? 'btn-primary shadow-sm'
                  : 'btn-light border'
              } rounded-pill px-3.5 py-1.5 fw-semibold d-none d-md-flex align-items-center gap-1.5`}
              style={{ fontSize: '0.82rem' }}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>

            {/* Notification Bell Button */}
            <div className="position-relative" ref={notifDropdownRef}>
              <button
                type="button"
                className={`btn btn-light border position-relative p-0 rounded-circle d-flex align-items-center justify-content-center ${
                  notifDropdownOpen ? 'bg-primary text-white border-primary shadow-sm' : 'text-secondary hover-bg'
                }`}
                style={{ width: '40px', height: '40px' }}
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                aria-expanded={notifDropdownOpen}
                title="Notifications"
              >
                <Bell size={18} className={notifDropdownOpen ? 'text-white' : 'text-secondary'} />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" style={{ fontSize: '0.65rem' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {notifDropdownOpen && (
                <div
                  className="position-absolute end-0 mt-2 dropdown-menu-glass shadow-lg p-0"
                  style={{ width: '340px', maxWidth: 'calc(100vw - 32px)', zIndex: 1060 }}
                >
                  <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light bg-opacity-50">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold small text-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.68rem' }}>
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none small text-primary"
                        onClick={handleMarkAllRead}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="d-flex flex-column" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <Bell size={24} className="opacity-25 mb-2 d-block mx-auto" />
                        <p className="small mb-0">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 border-bottom notification-item ${!notif.read ? 'unread' : ''}`}
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <strong className="text-dark text-truncate" style={{ fontSize: '0.82rem', maxWidth: '200px' }}>
                              {notif.title}
                            </strong>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-secondary mb-1" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile Dropdown */}
            <div className="position-relative" ref={profileDropdownRef}>
              <button
                type="button"
                className="btn btn-light border rounded-pill p-1 ps-1.5 pe-3 d-flex align-items-center gap-2 hover-bg shadow-sm"
                style={{ height: '42px' }}
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                aria-expanded={profileDropdownOpen}
              >
                {studentData.photo ? (
                  <img
                    src={studentData.photo}
                    alt={studentData.fullName}
                    className="rounded-circle border"
                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '0.88rem',
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    }}
                  >
                    {studentData?.fullName?.charAt(0) || 'S'}
                  </div>
                )}
                <span className="fw-bold text-dark d-none d-sm-inline small">{studentData.fullName}</span>
                <ChevronDown size={14} className="text-muted d-none d-sm-block ms-1" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  className="position-absolute end-0 mt-2 dropdown-menu-glass shadow-lg p-1.5"
                  style={{ minWidth: '220px', zIndex: 1060 }}
                >
                  <div className="p-2.5 border-bottom bg-light bg-opacity-70 rounded-2 mb-1">
                    <div className="fw-bold text-dark small">{studentData.fullName}</div>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Student Portal</div>
                  </div>

                  <button
                    type="button"
                    className="dropdown-item rounded-2 py-2 px-3 d-flex align-items-center gap-2 small fw-semibold text-dark"
                    onClick={handleProfileClick}
                  >
                    <User size={16} className="text-primary" />
                    <span>My Profile</span>
                  </button>

                  <div className="border-top my-1"></div>

                  <button
                    type="button"
                    className="dropdown-item rounded-2 py-2 px-3 d-flex align-items-center gap-2 small fw-semibold text-danger hover-bg"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
