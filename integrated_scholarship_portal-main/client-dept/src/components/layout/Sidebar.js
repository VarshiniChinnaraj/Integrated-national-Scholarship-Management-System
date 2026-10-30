import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Award,
  DollarSign,
  BarChart3,
  Bell,
  MessageSquare,
  X,
  Landmark
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Ministry Scrutiny',
      links: [
        { to: '/department/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/department/applications', label: 'Application Queue', icon: <FileText size={18} /> },
        { to: '/department/sanctions', label: 'Sanction Orders', icon: <Award size={18} /> },
      ]
    },
    {
      title: 'Financials & Insights',
      links: [
        { to: '/department/disbursement', label: 'DBT Disbursement', icon: <DollarSign size={18} /> },
        { to: '/department/reports', label: 'Scheme Reports', icon: <BarChart3 size={18} /> },
        { to: '/department/notifications', label: 'Official Notices', icon: <Bell size={18} /> },
        { to: '/department/feedback', label: 'Feedback & Support', icon: <MessageSquare size={18} /> }
      ]
    }
  ];

  const portalRoleBadge = 'Level-2 Ministry Desk';
  const roleColor = '#A88BB5';
  const IconComponent = Landmark;

  return (
    <aside className={`sidebar-wrapper sidebar-theme-department ${isOpen ? 'show' : ''}`}>
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
              DEPARTMENT DESK
            </span>
            <span className="badge bg-purple bg-opacity-20 text-white border border-secondary border-opacity-25 d-flex align-items-center gap-1" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              <span className="rounded-circle bg-info" style={{ width: '5px', height: '5px' }}></span>
              Live Sync
            </span>
          </div>
          <div className="text-white fw-semibold text-truncate small">
            {user?.departmentName || 'State Ministry / Sanctions Department'}
          </div>
          <div className="text-white-50 text-truncate" style={{ fontSize: '0.7rem' }}>
            {user?.email || 'department@nsp.gov.in'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
