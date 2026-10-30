import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  MessageSquare,
  X,
  School
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Verification Desk',
      links: [
        { to: '/institute/dashboard', label: 'Officer Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/institute/applications', label: 'Application Scrutiny', icon: <FileText size={18} /> },
      ]
    },
    {
      title: 'Institute Records',
      links: [
        { to: '/institute/students', label: 'Enrolled Students', icon: <Users size={18} /> },
        { to: '/institute/notifications', label: 'Institute Alerts', icon: <Bell size={18} /> },
        { to: '/institute/feedback', label: 'Feedback & Support', icon: <MessageSquare size={18} /> }
      ]
    }
  ];

  const portalRoleBadge = 'Level-1 Nodal Desk';
  const roleColor = '#A88BB5';
  const IconComponent = School;

  return (
    <aside className={`sidebar-wrapper sidebar-theme-institute ${isOpen ? 'show' : ''}`}>
      {/* Brand Header */}
      <div className="p-3 px-4 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2 rounded-3 text-white shadow-sm d-flex align-items-center justify-content-center"
            style={{
              background: `linear-gradient(135deg, ${roleColor}, ${roleColor}bb)`,
              boxShadow: `0 4px 12px ${roleColor}40`
            }}
          >
            <IconComponent size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <h6 className="fw-bold mb-0 text-white tracking-wide" style={{ fontSize: '0.98rem' }}>
                NSP 2.0
              </h6>
              <span className="badge bg-white bg-opacity-10 text-white-50 border border-white border-opacity-10 px-1.5 py-0.5 rounded" style={{ fontSize: '0.62rem' }}>
                GOI
              </span>
            </div>
            <span
              className="text-truncate d-block fw-semibold"
              style={{
                fontSize: '0.72rem',
                color: roleColor,
                letterSpacing: '0.04em'
              }}
            >
              {portalRoleBadge}
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          className="btn btn-link text-white-50 d-lg-none p-1.5 rounded-circle hover-bg"
          onClick={onClose}
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="py-2 flex-grow-1 custom-dark-scrollbar" style={{ overflowY: 'auto' }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-2">
            <div className="nav-section-title d-flex align-items-center justify-content-between">
              <span>{section.title}</span>
            </div>
            <nav className="nav flex-column">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
                >
                  <span className="me-2.5 d-flex align-items-center opacity-85">
                    {link.icon}
                  </span>
                  <span className="text-truncate">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Context Widget */}
      <div className="p-2 border-top border-secondary border-opacity-10">
        <div className="sidebar-footer-card">
          <div className="d-flex align-items-center justify-content-between mb-1.5">
            <span className="text-white-50 fw-semibold" style={{ fontSize: '0.66rem', letterSpacing: '0.06em' }}>
              INSTITUTE DESK
            </span>
            <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25 d-flex align-items-center gap-1" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              <span className="rounded-circle bg-warning" style={{ width: '5px', height: '5px' }}></span>
              Live Sync
            </span>
          </div>
          <div className="text-white fw-semibold text-truncate small">
            {user?.institutionName || 'Institutional Verification Desk'}
          </div>
          <div className="text-white-50 text-truncate" style={{ fontSize: '0.7rem' }}>
            {user?.email || 'institute@nsp.gov.in'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
