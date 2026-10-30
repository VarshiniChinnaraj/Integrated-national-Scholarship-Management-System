import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PortalLayout = ({ children, pageTitle, breadcrumbs = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-3 p-lg-4 flex-grow-1">
          {/* Breadcrumb & Header */}
          {(pageTitle || breadcrumbs.length > 0) && (
            <div className="mb-4">
              {breadcrumbs.length > 0 && (
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-1.5" style={{ fontSize: '0.8rem' }}>
                    {breadcrumbs.map((b, idx) => (
                      <li
                        key={idx}
                        className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active text-primary fw-semibold' : ''}`}
                      >
                        {b.link ? (
                          <a href={b.link} className="text-decoration-none text-muted hover-text-primary">
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
              {pageTitle && <h3 className="fw-bold text-dark mb-0 tracking-tight fs-5 fs-sm-4 fs-md-3 text-break">{pageTitle}</h3>}
            </div>
          )}

          {/* Child Page Content */}
          <div className="w-100">
            {children}
          </div>
        </main>

        <footer className="py-3 px-3 px-sm-4 border-top bg-white text-center text-muted" style={{ fontSize: '0.75rem' }}>
          National Scholarship Verification, Approval, and Disbursement Tracking System &copy; {new Date().getFullYear()} &bull; Government of India
        </footer>
      </div>
    </div>
  );
};

export default PortalLayout;
