import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  FileText,
  CreditCard,
  Bell,
  MessageSquare,
  X,
  Star
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Core Services',
      links: [
        { to: '/student/dashboard',   label: 'Dashboard',        icon: <LayoutDashboard size={17} /> },
        { to: '/student/profile',     label: 'Student Profile',  icon: <User size={17} /> },
        { to: '/student/scholarships',label: 'Explore Schemes',  icon: <GraduationCap size={17} /> },
      ]
    },
    {
      title: 'Tracking & Records',
      links: [
        { to: '/student/applications',   label: 'My Applications', icon: <FileText size={17} /> },
        { to: '/student/payments',       label: 'DBT Payments',    icon: <CreditCard size={17} /> },
        { to: '/student/notifications',  label: 'Alerts & Messages', icon: <Bell size={17} /> },
        { to: '/student/feedback',       label: 'Feedback & Support', icon: <MessageSquare size={17} /> }
      ]
    }
  ];

  return (
    <aside className={`sidebar-wrapper ${isOpen ? 'show' : ''}`}>
      {/* Brand Header */}
      <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid rgba(168,139,181,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Logo mark */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #A88BB5, #C3A8D1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(168,139,181,0.35)',
            flexShrink: 0
          }}>
            <Star size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h6 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '0.97rem', letterSpacing: '-0.01em' }}>NSP 2.0</h6>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'rgba(168,139,181,0.9)',
                background: 'rgba(168,139,181,0.15)', border: '1px solid rgba(168,139,181,0.2)',
                borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>GOI</span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#A88BB5', letterSpacing: '0.04em' }}>
              Applicant Portal
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          style={{ background: 'none', border: 'none', color: 'rgba(228,220,232,0.5)', padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex' }}
          className="d-lg-none"
          onClick={onClose}
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="custom-dark-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '0.5rem' }}>
            <div className="nav-section-title">{section.title}</div>
            <nav>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
                >
                  <span style={{ marginRight: '0.65rem', display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                    {link.icon}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.label}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer user widget */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid rgba(168,139,181,0.12)' }}>
        <div className="sidebar-footer-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.07em', fontWeight: 700, color: 'rgba(168,139,181,0.6)', textTransform: 'uppercase' }}>
              Current Session
            </span>
            <span style={{
              fontSize: '0.62rem', padding: '2px 7px', borderRadius: 10,
              background: 'rgba(34,197,94,0.15)', color: '#4ade80',
              border: '1px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', gap: 3
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Live
            </span>
          </div>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Student Beneficiary'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(168,139,181,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {user?.email || 'student@nsp.gov.in'}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
