import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import API from '../services/api';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, fresh: 0, renewal: 0 });

  const admin = localStorage.getItem('admin')
    ? JSON.parse(localStorage.getItem('admin'))
    : null;

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 15000); // 15s polling for live submissions
    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await API.get('/admin/applications');
      if (res.data.success) {
        const apps = res.data.applications || [];
        setApplications(apps);
        setStats({
          total: apps.length,
          pending: apps.filter((a) => a.status === 'Pending Verification').length,
          approved: apps.filter((a) => a.status === 'Approved').length,
          rejected: apps.filter((a) => a.status === 'Rejected').length,
          fresh: apps.filter((a) => !a.submissionType || a.submissionType === 'Fresh Application').length,
          renewal: apps.filter((a) => a.submissionType === 'Renewal Application').length
        });
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    const { value: remarks } = await Swal.fire({
      title: `${newStatus} Application?`,
      input: 'textarea',
      inputLabel: 'Add officer review remarks (optional)',
      inputPlaceholder: 'e.g. Verified with College Nodal Officer / Bank Account Validated...',
      showCancelButton: true,
      confirmButtonText: `Confirm ${newStatus}`,
      confirmButtonColor: newStatus === 'Approved' ? '#198754' : '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (remarks !== undefined) {
      try {
        await API.put(`/admin/applications/${appId}/status`, { status: newStatus, remarks });
        Swal.fire({
          icon: 'success',
          title: `Application ${newStatus}`,
          text: `Application status updated to ${newStatus}.`,
          timer: 1500,
          showConfirmButton: false
        });
        fetchApplications();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err.response?.data?.message || 'Failed to update status.'
        });
      }
    }
  };

  const getSubmissionTypeBadge = (type) => {
    switch (type) {
      case 'Renewal Application':
        return <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2 py-1"><i className="bi bi-arrow-repeat me-1"></i>Renewal</span>;
      case 'Merit-cum-Means Grant':
        return <span className="badge bg-warning-subtle text-dark border border-warning-subtle fw-semibold px-2 py-1"><i className="bi bi-trophy me-1"></i>Merit Grant</span>;
      case 'Fast-Track Verification':
        return <span className="badge bg-info-subtle text-info border border-info-subtle fw-semibold px-2 py-1"><i className="bi bi-lightning-charge me-1"></i>Fast-Track</span>;
      default:
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold px-2 py-1"><i className="bi bi-file-earmark-plus me-1"></i>Fresh</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge bg-success rounded-pill px-3 py-2"><i className="bi bi-check-circle-fill me-1"></i>Approved</span>;
      case 'Rejected':
        return <span className="badge bg-danger rounded-pill px-3 py-2"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
      default:
        return <span className="badge bg-warning text-dark rounded-pill px-3 py-2"><i className="bi bi-hourglass-split me-1"></i>Pending Review</span>;
    }
  };

  const filteredApplications = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (app.refNo || '').toLowerCase().includes(q) ||
      (app.studentName || '').toLowerCase().includes(q) ||
      (app.studentEmail || '').toLowerCase().includes(q) ||
      (app.collegeName || '').toLowerCase().includes(q) ||
      (app.schemeCode || '').toLowerCase().includes(q) ||
      (app.schemeTitle || '').toLowerCase().includes(q) ||
      (app.submissionType || '').toLowerCase().includes(q);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && app.status === statusFilter;
  });

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f0f2f5' }}>
      <AdminNavbar />

      <div className="container py-4">

        {/* Welcome Header */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center">
              <div className="bg-warning text-dark rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-speedometer2 fs-3"></i>
              </div>
              <div className="text-white">
                <h3 className="fw-bold mb-0">Management Portal Dashboard</h3>
                <p className="mb-0 text-white-50 small">Officer: {admin?.fullName || 'State Nodal Officer'} • Ministry of Higher Education & Scholarships</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill small">
                <i className="bi bi-record-circle-fill text-success me-1"></i> Live Real-Time Sync Active
              </span>
            </div>
          </div>
        </div>

        {/* Stats KPI Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex align-items-center">
                <div className="bg-primary-subtle text-primary rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-collection-fill fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Total Applied</p>
                  <h3 className="fw-bold text-dark mb-0">{stats.total}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex align-items-center">
                <div className="bg-warning-subtle text-warning rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-hourglass-split fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Pending Verification</p>
                  <h3 className="fw-bold text-warning mb-0">{stats.pending}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex align-items-center">
                <div className="bg-success-subtle text-success rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-check-circle-fill fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Sanctioned / Approved</p>
                  <h3 className="fw-bold text-success mb-0">{stats.approved}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex align-items-center">
                <div className="bg-danger-subtle text-danger rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-x-circle-fill fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small mb-0">Rejected / Returned</p>
                  <h3 className="fw-bold text-danger mb-0">{stats.rejected}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Filter and Search */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by Ref ID, student name, college, scheme, or submission type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex flex-wrap justify-content-md-end align-items-center gap-2">
              <div className="btn-group bg-light p-1 rounded-3 rounded-sm-pill border flex-wrap" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-2 px-sm-3 fw-semibold ${statusFilter === 'ALL' ? 'btn-primary text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All ({applications.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-2 px-sm-3 fw-semibold ${statusFilter === 'Pending Verification' ? 'btn-warning text-dark' : 'btn-light text-secondary'}`}
                  onClick={() => setStatusFilter('Pending Verification')}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-2 px-sm-3 fw-semibold ${statusFilter === 'Approved' ? 'btn-success text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setStatusFilter('Approved')}
                >
                  Approved ({stats.approved})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-2 px-sm-3 fw-semibold ${statusFilter === 'Rejected' ? 'btn-danger text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setStatusFilter('Rejected')}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>

              <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center" onClick={fetchApplications}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-file-earmark-text text-primary me-2"></i>
                Student Scholarship Applications Queue
              </h5>
              <p className="text-muted small mb-0">Real-time incoming scholarship submissions submitted by registered students</p>
            </div>
            <span className="badge bg-primary text-white px-3 py-2 rounded-pill">
              Showing {filteredApplications.length} of {applications.length} Records
            </span>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2 small">Loading submitted applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <h5 className="fw-bold text-secondary mt-2">No Applications Found</h5>
                <p className="text-muted small">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No applications match your filter/search criteria.'
                    : 'No student applications submitted yet. As soon as a student applies from the portal, it will appear here.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 small fw-bold text-uppercase text-secondary">Ref No</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Submission Type</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Student</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">College / Reg</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Scheme</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Amount</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Status</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Submitted</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app._id}>
                        <td className="px-4 py-3">
                          <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1">{app.refNo}</span>
                        </td>
                        <td className="px-3 py-3">
                          {getSubmissionTypeBadge(app.submissionType)}
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <span className="fw-semibold text-dark">{app.studentName}</span>
                            <br />
                            <small className="text-muted">{app.studentEmail}</small>
                            <br />
                            <small className="text-muted">{app.studentPhone || 'N/A'}</small>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <small className="text-dark fw-medium">{app.collegeName}</small>
                          <br />
                          <small className="text-muted">Reg: {app.registerNumber}</small>
                          <br />
                          <small className="text-success fw-bold">CGPA: {app.ugCgpa || 'N/A'}</small>
                        </td>
                        <td className="px-3 py-3">
                          <span className="badge bg-light text-dark border mb-1">{app.schemeCode}</span>
                          <br />
                          <small className="text-secondary">{app.schemeTitle}</small>
                        </td>
                        <td className="px-3 py-3">
                          <span className="fw-bold text-success">{app.amount}</span>
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(app.status)}</td>
                        <td className="px-3 py-3">
                          <small className="text-muted">{new Date(app.appliedAt || app.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</small>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            {app.status === 'Pending Verification' && (
                              <>
                                <button
                                  className="btn btn-success btn-sm rounded-pill px-2"
                                  title="Approve / Sanction"
                                  onClick={() => handleStatusChange(app._id, 'Approved')}
                                >
                                  <i className="bi bi-check-lg"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm rounded-pill px-2"
                                  title="Reject / Return"
                                  onClick={() => handleStatusChange(app._id, 'Rejected')}
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-outline-primary btn-sm rounded-pill px-2"
                              title="View Application Dossier"
                              onClick={() => {
                                Swal.fire({
                                  title: `Dossier: ${app.refNo}`,
                                  html: `
                                    <div class="text-start small p-2">
                                      <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="badge bg-primary fs-6">${app.submissionType || 'Fresh Application'}</span>
                                        <span class="badge ${app.status === 'Approved' ? 'bg-success' : app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'} fs-6">${app.status}</span>
                                      </div>

                                      <div class="p-3 bg-light rounded-3 mb-2 border">
                                        <h6 class="fw-bold text-primary mb-2">Applicant Particulars</h6>
                                        <div class="row g-1">
                                          <div class="col-6"><strong>Student Name:</strong> ${app.studentName}</div>
                                          <div class="col-6"><strong>Email:</strong> ${app.studentEmail}</div>
                                          <div class="col-6"><strong>Phone:</strong> ${app.studentPhone || 'N/A'}</div>
                                          <div class="col-6"><strong>Gender:</strong> ${app.gender || 'N/A'}</div>
                                          <div class="col-6"><strong>Category:</strong> ${app.category || 'N/A'}</div>
                                          <div class="col-6"><strong>Annual Income:</strong> ₹${app.annualIncome || 'N/A'}</div>
                                        </div>
                                      </div>

                                      <div class="p-3 bg-light rounded-3 mb-2 border">
                                        <h6 class="fw-bold text-primary mb-2">College & Academic Details</h6>
                                        <div class="row g-1">
                                          <div class="col-12"><strong>College:</strong> ${app.collegeName}</div>
                                          <div class="col-6"><strong>Department:</strong> ${app.department || 'N/A'}</div>
                                          <div class="col-6"><strong>Register Number:</strong> ${app.registerNumber}</div>
                                          <div class="col-6"><strong>UG CGPA:</strong> <span class="text-success fw-bold">${app.ugCgpa || 'N/A'} / 10.0</span></div>
                                          <div class="col-6"><strong>HSC 12th Score:</strong> ${app.hscPercentage || 'N/A'}%</div>
                                        </div>
                                      </div>

                                      <div class="p-3 bg-light rounded-3 mb-2 border">
                                        <h6 class="fw-bold text-primary mb-2">Scheme & DBT Bank Account</h6>
                                        <div class="row g-1">
                                          <div class="col-12"><strong>Scheme:</strong> ${app.schemeTitle} (${app.schemeCode})</div>
                                          <div class="col-6"><strong>Disbursement Amount:</strong> <span class="text-success fw-bold">${app.amount}</span></div>
                                          <div class="col-6"><strong>Bank Name:</strong> ${app.bankDetails?.bankName || 'N/A'}</div>
                                          <div class="col-6"><strong>Account Number:</strong> ${app.bankDetails?.accountNumber || 'N/A'}</div>
                                          <div class="col-6"><strong>IFSC Code:</strong> ${app.bankDetails?.ifscCode || 'N/A'}</div>
                                          <div class="col-6"><strong>Branch:</strong> ${app.bankDetails?.branchName || 'N/A'}</div>
                                        </div>
                                      </div>

                                      <div class="p-3 bg-light rounded-3 mb-2 border">
                                        <h6 class="fw-bold text-primary mb-1">Statement of Purpose</h6>
                                        <p class="text-secondary mb-0 fst-italic">"${app.statementOfPurpose || 'No statement provided.'}"</p>
                                      </div>

                                      <div class="p-3 bg-light rounded-3 border">
                                        <h6 class="fw-bold text-primary mb-2">Uploaded Verification Documents</h6>
                                        <ul class="list-unstyled mb-0 small">
                                          <li>✅ <strong>Aadhaar Card:</strong> ${app.submittedDocuments?.aadhaar || 'Uploaded'}</li>
                                          <li>✅ <strong>Income Certificate:</strong> ${app.submittedDocuments?.incomeCert || 'Uploaded'}</li>
                                          <li>✅ <strong>Community / Caste Certificate:</strong> ${app.submittedDocuments?.communityCert || 'N/A'}</li>
                                          <li>✅ <strong>College Bonafide / ID:</strong> ${app.submittedDocuments?.collegeId || 'Uploaded'}</li>
                                          <li>✅ <strong>Academic Marksheet:</strong> ${app.submittedDocuments?.marksheet || 'Uploaded'}</li>
                                        </ul>
                                      </div>

                                      ${app.remarks ? `<div class="p-2 mt-2 bg-warning-subtle rounded border"><strong>Officer Remarks:</strong> ${app.remarks}</div>` : ''}
                                    </div>
                                  `,
                                  confirmButtonColor: '#0d6efd',
                                  width: '650px'
                                });
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
