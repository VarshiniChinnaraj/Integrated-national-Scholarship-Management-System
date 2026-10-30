import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Award, Printer, CheckCircle, PlusCircle, ShieldCheck, Download } from 'lucide-react';

const DepartmentSanctions = () => {
  const [sanctions, setSanctions] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSanction, setSelectedSanction] = useState(null);

  // Modal / Generate Form
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [orderRemarks, setOrderRemarks] = useState('');
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const pollRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchData = async (silent = false) => {
    if (silent && loading) return; // skip if already loading
    setLoading(true);
    try {
      const [sanctionsRes, appsRes] = await Promise.all([
        api.get('/department/sanctions'),
        api.get('/department/applications?status=APPROVED')
      ]);

      if (sanctionsRes.data.success) { setLastUpdated(new Date());
        setSanctions(sanctionsRes.data.sanctions || []);
        if (sanctionsRes.data.sanctions?.length > 0) {
          setSelectedSanction(sanctionsRes.data.sanctions[0]);
        }
      }
      if (appsRes.data.success) {
        setApprovedApplications(appsRes.data.applications || []);
        if (appsRes.data.applications?.length > 0) {
          setSelectedAppId(appsRes.data.applications[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load sanctions data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSanction = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      setFeedback({ type: 'danger', message: 'Please select an approved application.' });
      return;
    }

    setGenerating(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post('/department/sanctions/generate', {
        applicationId: selectedAppId,
        orderRemarks
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Official Sanction Order ${res.data.sanction.sanctionNumber} generated successfully!`
        });
        fetchData();
        setShowGenerateModal(false);
        setOrderRemarks('');
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to generate sanction order.'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="Sanction Order Management & Generation"
      breadcrumbs={[{ label: 'Department Portal', link: '/department/dashboard' }, { label: 'Sanction Management' }]}
    >
      {/* Action Header */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold text-dark mb-1 responsive-title">Official Sanction Orders (SAN-YYYY-XXXXXX)</h5>
            <p className="text-muted small mb-0">
              Generate and issue statutory financial sanction orders for approved scholarship beneficiaries.
            </p>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm"
          >
            <PlusCircle size={18} />
            <span>Generate Sanction Order</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} py-2.5 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2`}>
          <div className="d-flex align-items-center gap-2">
            <CheckCircle size={18} />
            <span className="text-break">{feedback.message}</span>
          </div>
          {feedback.type === 'success' && (
            <Link to="/department/disbursement" className="btn btn-sm btn-success fw-bold text-nowrap">
              Open DBT Disbursement Gateway ➔
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : sanctions.length === 0 ? (
        <div className="custom-card p-4 p-sm-5 text-center text-muted">
          <Award size={48} className="mb-2 text-muted" />
          <h5>No sanction orders issued yet</h5>
          <p className="small">Approve incoming applications and generate their sanction orders.</p>
          {approvedApplications.length > 0 && (
            <button onClick={() => setShowGenerateModal(true)} className="btn btn-warning btn-sm fw-bold">
              Generate Sanction for {approvedApplications.length} Approved Applicants
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {/* Left: Sanction Orders Table */}
          <div className="col-12 col-lg-6">
            <div className="custom-card p-3 p-sm-4">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Issued Sanction Orders</h5>
              <div className="d-flex flex-column gap-3">
                {sanctions.map((s) => (
                  <div
                    key={s._id}
                    className={`p-3 rounded-3 border ${
                      selectedSanction?._id === s._id ? 'border-primary bg-light shadow-sm' : 'bg-white'
                    }`}
                    onClick={() => setSelectedSanction(s)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
                      <span className="fw-bold text-primary text-break">{s.sanctionNumber}</span>
                      <span className="fw-bold text-success">â‚¹{s.approvedAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="fw-semibold text-dark small mb-1">{s.studentName}</div>
                    <div className="text-muted small text-truncate">{s.scholarshipName}</div>
                    <div className="d-flex flex-wrap justify-content-between text-secondary mt-2 pt-2 border-top gap-1" style={{ fontSize: '0.75rem' }}>
                      <span className="text-break">App Ref: {s.applicationNumber}</span>
                      <span>Date: {new Date(s.approvalDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Printable Sanction Order Document */}
          <div className="col-12 col-lg-6">
            {selectedSanction && (
              <div className="custom-card p-3 p-sm-4 p-md-5 document-border printable-document">
                <div className="text-center pb-3 border-bottom mb-4">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1 text-primary">
                    <ShieldCheck size={28} />
                    <h4 className="fw-bold mb-0">Government of India</h4>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-break">{selectedSanction.departmentName || 'Ministry of Higher Education'}</h6>
                  <span className="badge bg-dark text-white px-3 py-1 text-uppercase text-wrap">
                    Statutory Sanction Order
                  </span>
                </div>

                <div className="mb-4" style={{ fontSize: '0.88rem' }}>
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <span className="text-muted">Sanction Order No:</span>
                      <div className="fw-bold text-primary text-break">{selectedSanction.sanctionNumber}</div>
                    </div>
                    <div className="col-12 col-sm-6 text-sm-end">
                      <span className="text-muted">Sanction Date:</span>
                      <div className="fw-bold text-dark">{new Date(selectedSanction.approvalDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <p className="text-dark leading-relaxed mb-3 text-break">
                    Sanction is hereby accorded for the grant and disbursement of scholarship assistance under the{' '}
                    <strong>{selectedSanction.scholarshipName}</strong> to the below mentioned eligible beneficiary student:
                  </p>

                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="row g-2">
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small">Beneficiary Student:</span>
                        <div className="fw-bold text-dark text-break">{selectedSanction.studentName}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted small">Application Number:</span>
                        <div className="fw-semibold text-dark text-break">{selectedSanction.applicationNumber}</div>
                      </div>
                      <div className="col-12">
                        <span className="text-muted small">Institution:</span>
                        <div className="fw-semibold text-dark text-break">{selectedSanction.institutionName || 'National Institute of Technology'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-success-subtle border border-success-subtle rounded-3 text-center mb-4">
                    <span className="text-muted small text-uppercase fw-semibold">Sanctioned Financial Amount</span>
                    <h3 className="fw-bold text-success mb-0">â‚¹{selectedSanction.approvedAmount?.toLocaleString('en-IN')}</h3>
                    <span className="small text-muted">(Rupees {selectedSanction.approvedAmount} Only)</span>
                  </div>

                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-end gap-2 pt-4 border-top mt-4">
                    <div>
                      <span className="text-muted small">Sanctioning Officer:</span>
                      <div className="fw-bold text-dark text-break">{selectedSanction.officerName}</div>
                      <span className="text-muted small">Department Nodal Authority</span>
                    </div>
                    <div className="text-sm-end">
                      <span className="badge bg-success">Digitally Certified & Approved</span>
                    </div>
                  </div>
                </div>

                <div className="no-print pt-3 border-top d-flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Printer size={16} />
                    <span>Print Document</span>
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      window.open(`http://localhost:5000/api/department/sanctions/${selectedSanction.sanctionNumber}/pdf?token=${token}`, '_blank');
                    }}
                    className="btn btn-primary w-50 d-flex align-items-center justify-content-center gap-2"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Sanction Modal */}
      {showGenerateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-2 mx-sm-auto">
            <div className="modal-content custom-card p-3 p-sm-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Generate Sanction Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowGenerateModal(false)}
                />
              </div>
              <form onSubmit={handleGenerateSanction}>
                <div className="modal-body py-3">
                  {approvedApplications.length === 0 ? (
                    <div className="alert alert-warning small">
                      No approved applications waiting for sanction. Please approve pending applications first.
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Select Approved Applicant</label>
                        <select
                          className="form-select"
                          value={selectedAppId}
                          onChange={(e) => setSelectedAppId(e.target.value)}
                          required
                        >
                          {approvedApplications.map((app) => (
                            <option key={app._id} value={app._id}>
                              {app.applicationNumber} - {app.studentName} (â‚¹{app.approvedAmount?.toLocaleString('en-IN')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Sanction Order Official Remarks</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="e.g. Official Financial Sanction granted under Higher Education Merit Scheme for AY 2025-2026."
                          value={orderRemarks}
                          onChange={(e) => setOrderRemarks(e.target.value)}
                        />
                      </div>

                      <div className="p-3 rounded bg-light border small text-muted text-break">
                        Sanction number format will be generated as: <strong>SAN-2026-XXXXXX</strong>. Application status will move to <strong>SANCTIONED</strong>.
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0 pt-0 d-flex flex-column flex-sm-row justify-content-between gap-2">
                  <button
                    type="button"
                    className="btn btn-light w-100 w-sm-auto order-2 order-sm-1"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || approvedApplications.length === 0}
                    className="btn btn-success fw-bold w-100 w-sm-auto order-1 order-sm-2"
                  >
                    {generating ? 'Generating Order...' : 'Issue Sanction Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default DepartmentSanctions;

