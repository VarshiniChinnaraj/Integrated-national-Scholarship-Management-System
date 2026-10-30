import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  CreditCard,
  Bell,
  Building2,
  Users,
  BarChart3,
  Building,
  History,
  MessageSquare,
  X,
  Shield,
  Zap,
  Mail
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Central Governance',
      links: [
        { to: '/admin/dashboard', label: 'Command Center', icon: <LayoutDashboard size={18} /> },
        { to: '/admin/slp', label: 'SLP SLA Monitor', icon: <Zap size={18} /> },
        { to: '/admin/scholarships', label: 'Scheme Portfolio', icon: <GraduationCap size={18} /> },
        { to: '/admin/applications', label: 'Global Applications', icon: <FileText size={18} /> },
      ]
    },
    {
      title: 'Entities & Access',
      links: [
        { to: '/admin/institutions', label: 'Colleges & Universities', icon: <Building2 size={18} /> },
        { to: '/admin/departments', label: 'State Ministries', icon: <Building size={18} /> },
        { to: '/admin/users', label: 'User Directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Auditing & System',
      links: [
        { to: '/admin/reports', label: 'Analytics & Insights', icon: <BarChart3 size={18} /> },
        { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: <History size={18} /> },
        { to: '/admin/email-logs', label: 'Email Dispatches', icon: <Mail size={18} /> },
        { to: '/admin/notifications', label: 'System Dispatches', icon: <Bell size={18} /> },
        { to: '/admin/feedback', label: 'Feedback Desk', icon: <MessageSquare size={18} /> }
      ]
    }
  ];

  const portalRoleBadge = 'System Governance';
  const roleColor = '#A88BB5';
  const IconComponent = Shield;

  return (
    <aside className={`sidebar-wrapper sidebar-theme-admin ${isOpen ? 'show' : ''}`}>
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
              ADMIN SESSION
            </span>
            <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              <span className="rounded-circle bg-danger" style={{ width: '5px', height: '5px' }}></span>
              Live Sync
            </span>
          </div>
          <div className="text-white fw-semibold text-truncate small">
            National Central System
          </div>
          <div className="text-white-50 text-truncate" style={{ fontSize: '0.7rem' }}>
            {user?.email || 'admin@nsp.gov.in'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
