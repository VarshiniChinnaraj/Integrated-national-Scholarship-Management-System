import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X,
  ChevronDown 
} from 'lucide-react';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const admin = localStorage.getItem('admin')
    ? JSON.parse(localStorage.getItem('admin'))
    : null;

  const handleLogout = () => {
    setDropdownOpen(false);
    Swal.fire({
      title: 'Management Sign Out',
      text: 'Are you sure you want to sign out of the Administrator session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Sign Out'
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="public-navbar-glass p-3">
      <div className="container d-flex align-items-center justify-content-between">
        {/* Brand Header */}
        <Link
          className="d-flex align-items-center gap-2.5 text-decoration-none"
          to="/admin/dashboard"
        >
          <div
            className="p-2 rounded-3 text-white shadow-sm d-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #49354F, #3A2940)',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span className="fw-bold text-white fs-5 mb-0" style={{ letterSpacing: '-0.01em' }}>
                NSP Admin Portal
              </span>
              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-30 px-2 py-0.5 rounded small">
                GOI Admin
              </span>
            </div>
            <small className="d-block text-secondary" style={{ fontSize: '0.72rem' }}>
              National Scholarship Governance & Management
            </small>
          </div>
        </Link>

        {/* Toggler */}
        <button
          className="btn btn-outline-secondary text-white d-lg-none p-2 rounded-3 border-secondary border-opacity-25"
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Navigation Links & Profile */}
        <div className="d-none d-lg-flex align-items-center gap-3">
          {/* Navigation Links */}
          <div className="d-flex align-items-center gap-1.5 me-3">
            <Link
              to="/admin/dashboard"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
                isActive('/admin/dashboard')
                  ? 'btn-danger text-white shadow-sm'
                  : 'btn-outline-secondary text-white-50 border-secondary border-opacity-25 hover-text-white'
              }`}
              style={{ fontSize: '0.82rem' }}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard & Apps</span>
            </Link>

            <Link
              to="/admin/students"
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 ${
                isActive('/admin/students')
                  ? 'btn-danger text-white shadow-sm'
                  : 'btn-outline-secondary text-white-50 border-secondary border-opacity-25 hover-text-white'
              }`}
              style={{ fontSize: '0.82rem' }}
            >
              <Users size={15} />
              <span>Registered Students</span>
            </Link>
          </div>

          {/* Quick Link to Student Portal */}
          <Link
            to="/login"
            className="btn btn-outline-secondary btn-sm text-white-50 border-secondary border-opacity-25 rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1 hover-text-white"
            style={{ fontSize: '0.82rem' }}
            title="Open Public Gateway"
          >
            <ExternalLink size={13} />
            <span>Public Gateway</span>
          </Link>

          {/* Officer Profile Badge & Dropdown */}
          <div className="position-relative">
            <button
              className="btn btn-dark border border-secondary border-opacity-25 text-white btn-sm rounded-pill p-1 ps-1.5 pe-3 d-flex align-items-center gap-2 hover-bg shadow-sm"
              style={{ height: '40px' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: '30px',
                  height: '30px',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #49354F, #3A2940)'
                }}
              >
                {admin?.fullName ? admin.fullName.charAt(0) : 'A'}
              </div>
              <div className="text-start pe-1" style={{ lineHeight: '1.2' }}>
                <span className="d-block fw-semibold text-white small">
                  {admin?.fullName || 'State Administrator'}
                </span>
                <small className="d-block text-danger" style={{ fontSize: '0.68rem' }}>
                  Central Authority
                </small>
              </div>
              <ChevronDown size={14} className="text-white-50 ms-1" />
            </button>

            {dropdownOpen && (
              <div
                className="position-absolute end-0 mt-2 dropdown-menu-dark-glass shadow-lg p-1.5"
                style={{ minWidth: '230px', zIndex: 1060 }}
              >
                <div className="p-2.5 border-bottom border-secondary border-opacity-10 mb-1">
                  <strong className="d-block text-white small">{admin?.fullName || 'State Administrator'}</strong>
                  <span className="text-white-50 small d-block" style={{ fontSize: '0.72rem' }}>
                    {admin?.email || 'admin@nsp.gov.in'}
                  </span>
                  <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25 mt-1 small">
                    {admin?.department || 'Higher Education Dept'}
                  </span>
                </div>
                <button
                  className="dropdown-item text-danger fw-semibold rounded-2 py-2 px-3 d-flex align-items-center gap-2 small hover-bg"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Collapse Navigation */}
      {mobileNavOpen && (
        <div className="container d-lg-none mt-3 pt-3 border-top border-secondary border-opacity-10">
          <div className="d-flex flex-column gap-2">
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileNavOpen(false)}
              className="btn btn-dark text-start py-2 px-3 rounded-3 text-white d-flex align-items-center gap-2"
            >
              <LayoutDashboard size={16} /> Dashboard & Applications
            </Link>
            <Link
              to="/admin/students"
              onClick={() => setMobileNavOpen(false)}
              className="btn btn-dark text-start py-2 px-3 rounded-3 text-white d-flex align-items-center gap-2"
            >
              <Users size={16} /> Registered Students
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="btn btn-dark text-start py-2 px-3 rounded-3 text-white-50 d-flex align-items-center gap-2"
            >
              <ExternalLink size={16} /> Public Gateway
            </Link>
            <button
              onClick={() => {
                setMobileNavOpen(false);
                handleLogout();
              }}
              className="btn btn-outline-danger text-start py-2 px-3 rounded-3 fw-semibold d-flex align-items-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;

