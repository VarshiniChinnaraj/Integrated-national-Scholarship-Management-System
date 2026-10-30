import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Swal from 'sweetalert2';
import {
  Bell,
  LogOut,
  User as UserIcon,
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
  const [notifications, setNotifications]       = useState([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown]   = useState(false);
  const [currentTime, setCurrentTime]           = useState(new Date());

  const notifRef = useRef(null);
  const userRef  = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUserDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/student/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/student/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { setUnreadCount(0); }
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to end your student session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#49354F',
      cancelButtonColor: '#7D7480',
      confirmButtonText: 'Yes, Sign Out'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/student/login');
      }
    });
  };

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <header className="portal-navbar px-3 px-lg-4 d-flex align-items-center justify-content-between">
      {/* Left: Hamburger + Portal ID */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light d-lg-none p-2 border rounded-3 d-flex align-items-center justify-content-center"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Drawer"
          style={{ width: 38, height: 38, borderColor: 'var(--lavender-pale)' }}
        >
          <Menu size={20} color="var(--plum)" />
        </button>

        <div className="d-flex align-items-center gap-2">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #49354F, #A88BB5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={17} color="#fff" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                Student
              </span>
            </div>
            <div className="d-none d-md-block" style={{ fontSize: '0.7rem', color: 'var(--muted-grey)' }}>
              Scholarship Application & DBT Tracking
            </div>
          </div>
        </div>
      </div>

      {/* Right: Time, Notifications, User */}
      <div className="d-flex align-items-center gap-2">
        {/* Time pill */}
        <div className="d-none d-xl-flex align-items-center gap-2 px-3 py-1" style={{
          borderRadius: 30, background: 'var(--lavender-mist)', border: '1px solid var(--lavender-pale)'
        }}>
          <Clock size={12} color="var(--muted-grey)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--muted-grey)' }}>
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            &nbsp;&bull;&nbsp;
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications */}
        <div className="position-relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="position-relative d-flex align-items-center justify-content-center"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--lavender-pale)',
              background: showNotifDropdown ? 'var(--plum)' : 'var(--soft-white)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            aria-label="Notifications"
          >
            <Bell size={17} color={showNotifDropdown ? '#fff' : 'var(--muted-grey)'} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: '#DC2626', color: '#fff',
                fontSize: '0.62rem', fontWeight: 700,
                minWidth: 17, height: 17, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff', padding: '0 3px'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="position-absolute end-0 mt-2 dropdown-menu-glass"
              style={{ width: 340, maxWidth: 'calc(100vw - 24px)', zIndex: 1060 }}>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center"
                style={{ background: 'var(--lavender-mist)' }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: 'var(--plum)', color: '#fff',
                      fontSize: '0.65rem', fontWeight: 700,
                      padding: '1px 7px', borderRadius: 20
                    }}>{unreadCount} New</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--plum)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }} className="custom-dark-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center" style={{ color: 'var(--muted-grey)', fontSize: '0.82rem' }}>
                    <Bell size={24} style={{ opacity: 0.25, display: 'block', margin: '0 auto 8px' }} />
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n._id} className={`p-3 border-bottom notification-item ${!n.isRead ? 'unread' : ''}`}
                      style={{ fontSize: '0.8rem' }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span style={{ fontWeight: 700, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.67rem', color: 'var(--muted-grey)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-truncate-2" style={{ color: 'var(--muted-grey)', lineHeight: 1.35 }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 text-center border-top" style={{ background: 'var(--lavender-mist)' }}>
                <Link to="/student/notifications"
                  style={{ fontSize: '0.78rem', color: 'var(--plum)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowNotifDropdown(false)}>
                  View All Notifications <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="position-relative" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{
              height: 42, borderRadius: 30, border: '1px solid var(--lavender-pale)',
              background: 'var(--soft-white)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 0 6px',
              boxShadow: '0 1px 4px rgba(73,53,79,0.06)', transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #49354F, #A88BB5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: '#fff'
            }}>
              {avatarLetter}
            </div>
            <div className="d-none d-md-block text-start" style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.82rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Student'}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--muted-grey)' }}>Applicant</div>
            </div>
            <ChevronDown size={13} color="var(--muted-grey)" className="d-none d-sm-block" />
          </button>

          {showUserDropdown && (
            <div className="position-absolute end-0 mt-2 dropdown-menu-glass"
              style={{ width: 260, zIndex: 1060 }}>
              <div className="p-3 border-bottom" style={{ background: 'var(--lavender-mist)' }}>
                <div style={{ fontWeight: 700, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{user?.email}</div>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(73,53,79,0.08)', color: 'var(--plum)',
                  border: '1px solid rgba(73,53,79,0.15)'
                }}>Student Beneficiary</span>
              </div>

              <div className="p-1">
                <Link to="/student/profile"
                  className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2"
                  style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--charcoal)' }}
                  onClick={() => setShowUserDropdown(false)}>
                  <UserIcon size={15} color="var(--plum)" />
                  <span>My Profile</span>
                </Link>
                <Link to="/student/notifications"
                  className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2"
                  style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--charcoal)' }}
                  onClick={() => setShowUserDropdown(false)}>
                  <Bell size={15} color="var(--lavender)" />
                  <span>Notifications</span>
                </Link>
              </div>

              <div className="border-top p-1">
                <button onClick={handleLogout}
                  className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2 w-100"
                  style={{ fontSize: '0.84rem', fontWeight: 600, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <LogOut size={15} />
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
