import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PortalLayout = ({ children, pageTitle, breadcrumbs = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-wrapper">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-3 p-lg-4 flex-grow-1">
          {(pageTitle || breadcrumbs.length > 0) && (
            <div className="mb-4">
              {breadcrumbs.length > 0 && (
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-2" style={{ fontSize: '0.78rem' }}>
                    {breadcrumbs.map((b, idx) => (
                      <li
                        key={idx}
                        className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                      >
                        {b.link ? (
                          <a href={b.link} style={{ textDecoration: 'none', color: 'var(--muted-grey)' }}>
                            {b.label}
                          </a>
                        ) : (
                          b.label
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              {pageTitle && (
                <h3 style={{
                  fontWeight: 800, color: 'var(--plum)', margin: 0,
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', letterSpacing: '-0.01em'
                }}>
                  {pageTitle}
                </h3>
              )}
            </div>
          )}

          <div className="w-100">{children}</div>
        </main>

        <footer style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--lavender-pale)',
          background: 'var(--soft-white)',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--muted-grey)'
        }}>
          National Scholarship Verification, Approval &amp; Disbursement Tracking System &copy; {new Date().getFullYear()} &bull; Government of India
        </footer>
      </div>
    </div>
  );
};

export default PortalLayout;
