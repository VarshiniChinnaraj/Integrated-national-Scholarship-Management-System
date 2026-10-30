import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import Timeline from '../../components/common/Timeline';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import {
  Award,
  AlertTriangle,
  Send,
  Printer,
  CheckCircle,
  Download,
  RefreshCw
} from 'lucide-react';

const POLL_INTERVAL = 10000; // 10s for tracking — faster so students see status changes quickly

const ApplicationTracking = () => {
  const { id } = useParams();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [slpTracking, setSlpTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  // Correction Form state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');
  const [resubmitError, setResubmitError] = useState('');

  const fetchApplicationDetails = async (silent = false) => {
    try {
      const res = await api.get(`/student/applications/${id}`);
      if (res.data.success) {
        setApplication(res.data.application);
        setAuditLogs(res.data.auditLogs || []);
        setSlpTracking(res.data.slpTracking || null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails(false);
    if (location.search.includes('action=fix')) {
      setShowCorrectionModal(true);
    }
    // Live polling — auto-refresh every 10s
    pollRef.current = setInterval(() => fetchApplicationDetails(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [id, location.search]);

  const handleResubmitCorrection = async (e) => {
    e.preventDefault();
    setResubmitting(true);
    setResubmitSuccess('');
    setResubmitError('');

    try {
      const res = await api.put(`/student/applications/${id}/resubmit-correction`, {
        notes: correctionNotes
      });
      if (res.data.success) {
        setResubmitSuccess('Corrections resubmitted successfully! Your application is forwarded back to your Institute Officer.');
        fetchApplicationDetails();
        setShowCorrectionModal(false);
      }
    } catch (err) {
      setResubmitError(err.response?.data?.message || 'Failed to resubmit corrections.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Application Lifecycle Tracking">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  if (!application) {
    return (
      <PortalLayout pageTitle="Application Not Found">
        <div className="custom-card p-5 text-center">
          <h5>Application details not available</h5>
          <Link to="/student/applications" className="btn btn-primary btn-sm mt-3">
            Back to Applications
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isPaymentDisbursed =
    ['DISBURSED', 'PAYMENT_DISBURSED'].includes(application.status) ||
    application.paymentId?.status === 'DISBURSED' ||
    Boolean(application.paymentId?.utr);

  const effectiveStatus = isPaymentDisbursed
    ? (application.status === 'PAYMENT_DISBURSED' ? 'PAYMENT_DISBURSED' : 'DISBURSED')
    : (application.departmentVerification?.decision === 'APPROVED' &&
      ['ROUTED_TO_DEPARTMENT', 'DEPARTMENT_VERIFICATION'].includes(application.status))
      ? 'APPROVED'
      : application.status;

  return (
    <PortalLayout
      pageTitle={`Tracking: ${application.applicationNumber}`}
      breadcrumbs={[
        { label: 'Student Portal', link: '/student/dashboard' },
        { label: 'My Applications', link: '/student/applications' },
        { label: application.applicationNumber }
      ]}
    >
      {/* Top Application Header Card */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span style={{ fontWeight: 800, color: 'var(--plum)', fontSize: '1.1rem' }} className="text-break">{application.applicationNumber}</span>
              <StatusBadge status={effectiveStatus} />
              {slpTracking?.slaStatus === 'SLA_BREACHED' && (
                <span className="badge badge-sla-breached d-inline-flex align-items-center gap-1 px-2.5 py-1">
                  <AlertTriangle size={13} />
                  SLA Delayed (Breached)
                </span>
              )}
              <span className="d-inline-flex align-items-center gap-1 small text-muted">
                <span className="rounded-circle d-inline-block" style={{ width: 6, height: 6, background: '#16a34a', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                Live{lastUpdated && <> · {lastUpdated.toLocaleTimeString()}</>}
              </span>
            </div>
            <h5 className="fw-bold text-dark mb-1 responsive-title">{application.scholarshipName}</h5>
            <div className="text-muted small">
              Applied on {new Date(application.createdAt).toLocaleDateString()} &bull; Enrolled at {application.institutionName}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {application.status === 'CORRECTION_REQUIRED' && (
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="btn btn-warning d-flex align-items-center gap-2 fw-semibold"
              >
                <AlertTriangle size={16} />
                <span>Fix Requested Correction</span>
              </button>
            )}

            {application.sanctionNumber && (
              <>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    window.open(`http://localhost:5000/api/student/applications/${application._id}/sanction-pdf?token=${token}`, '_blank');
                  }}
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                >
                  <Download size={16} />
                  <span className="d-none d-sm-inline">Download Sanction PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                >
                  <Printer size={16} />
                  <span className="d-none d-sm-inline">Print</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {resubmitSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2.5">
          <CheckCircle size={18} />
          <span>{resubmitSuccess}</span>
        </div>
      )}

      {/* Correction Notice Alert if needed */}
      {application.status === 'CORRECTION_REQUIRED' && (
        <div className="alert alert-warning border-warning p-3 mb-4">
          <div className="d-flex align-items-start gap-2">
            <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h6 className="fw-bold text-dark mb-1">Correction Required by Officer</h6>
              <p className="mb-2 small text-dark">
                Remarks: "{application.correctionRemarks || application.instituteVerification?.remarks || application.departmentVerification?.remarks}"
              </p>
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="btn btn-sm btn-dark"
              >
                Update Documents & Resubmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Timeline (Left) & Application Details (Right) */}
      <div className="row g-4">
        {/* Left Column: Visual Lifecycle Timeline */}
        <div className="col-12 col-lg-5">
          <div className="custom-card p-3 p-sm-4 h-100">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Verification & Disbursement Timeline</h5>
            <Timeline
              currentStatus={effectiveStatus}
              auditLogs={auditLogs}
              applicationDetails={application}
              slpTracking={slpTracking}
            />
          </div>
        </div>

        {/* Right Column: Application Data & Sanction Details */}
        <div className="col-12 col-lg-7">
          <div className="custom-card p-3 p-sm-4 mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Application Summary</h5>
            <div className="row g-3" style={{ fontSize: '0.88rem' }}>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Applicant Full Name:</span>
                <div className="fw-semibold text-dark text-break">{application.studentName}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Student Email & Phone:</span>
                <div className="fw-semibold text-dark text-break">{application.studentEmail} &bull; {application.studentPhone}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">College / Institution:</span>
                <div className="fw-semibold text-dark text-break">{application.institutionName}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Course & Roll Number:</span>
                <div className="fw-semibold text-dark text-break">{application.academicDetails?.course} ({application.academicDetails?.enrollmentNumber})</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Academic Score:</span>
                <div className="fw-semibold text-dark">{application.academicDetails?.previousClassPercentage}% Marks &bull; {application.academicDetails?.cgpa} CGPA</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Annual Family Income:</span>
                <div className="fw-semibold text-dark">₹{application.incomeDetails?.familyAnnualIncome?.toLocaleString('en-IN')} / Year</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">DBT Bank Account:</span>
                <div className="fw-semibold text-dark text-break">{application.bankDetails?.bankName} ({application.bankDetails?.accountNumber})</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Bank IFSC Code:</span>
                <div className="fw-semibold text-dark">{application.bankDetails?.ifscCode}</div>
              </div>
            </div>
          </div>

          {/* Sanction & Disbursement Official Record */}
          {(application.sanctionNumber || application.paymentReference) && (
            <div className="custom-card p-3 p-sm-4 bg-light border">
              <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                <Award size={20} />
                <h5 className="fw-bold text-dark mb-0">Official Sanction & Disbursement Order</h5>
              </div>

              {application.sanctionNumber && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2">
                  <CheckCircle size={18} className="text-success flex-shrink-0" />
                  <div>
                    <strong className="d-block text-success">✓ Sanction Order Generated</strong>
                    <div className="small text-dark">Sanction Order has been sent to your registered email.</div>
                  </div>
                </div>
              )}

              <div className="row g-3" style={{ fontSize: '0.88rem' }}>
                {application.sanctionNumber && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">Sanction Order Number:</span>
                    <div className="fw-bold text-primary text-break">{application.sanctionNumber}</div>
                  </div>
                )}
                <div className="col-12 col-sm-6">
                  <span className="text-muted small">Approved Grant Amount:</span>
                  <div className="fw-bold text-success">
                    ₹{(application.paymentId?.amount || application.approvedAmount)?.toLocaleString('en-IN')}
                  </div>
                </div>
                {(application.paymentId?.paymentReference || application.paymentReference) && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">DBT Payment ID:</span>
                    <div className="fw-bold text-dark text-break">
                      {application.paymentId?.paymentReference || application.paymentReference}
                    </div>
                  </div>
                )}
                {application.paymentId?.utr && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">Banking UTR Number:</span>
                    <div className="fw-bold text-dark text-break">{application.paymentId.utr}</div>
                  </div>
                )}
                {application.paymentId?.receiptNumber && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">DBT Receipt Number:</span>
                    <div className="fw-bold text-dark text-break">{application.paymentId.receiptNumber}</div>
                  </div>
                )}
                {(application.paymentId?.transactionDate || application.paymentId?.disbursedAt) && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">Disbursement Date:</span>
                    <div className="fw-bold text-dark text-break">
                      {new Date(application.paymentId.transactionDate || application.paymentId.disbursedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {isPaymentDisbursed && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small">DBT Transfer Status:</span>
                    <div>
                      <span className="badge bg-success-subtle text-success fw-bold">Disbursed — Completed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correction Fix Modal / Inline Overlay */}
      {showCorrectionModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-2 mx-sm-auto">
            <div className="modal-content custom-card p-3 p-sm-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Fix Application Corrections</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCorrectionModal(false)}
                />
              </div>
              <form onSubmit={handleResubmitCorrection}>
                <div className="modal-body py-3">
                  <div className="alert alert-warning py-2 small mb-3">
                    <strong>Officer Remarks:</strong> {application.correctionRemarks || 'Please update the requested documents.'}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Explanation / Correction Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Uploaded revised valid Income Certificate and updated academic marksheet."
                      value={correctionNotes}
                      onChange={(e) => setCorrectionNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-3 border rounded bg-light small mb-2 text-break">
                    <div className="fw-semibold mb-1">Attached Document Set:</div>
                    <div>✓ Aadhaar_Card_Verified_v2.pdf</div>
                    <div>✓ Income_Certificate_Updated.pdf</div>
                    <div>✓ College_Bonafide_ID.pdf</div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 d-flex flex-column flex-sm-row justify-content-between gap-2">
                  <button
                    type="button"
                    className="btn btn-light w-100 w-sm-auto order-2 order-sm-1"
                    onClick={() => setShowCorrectionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitting}
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-1 w-100 w-sm-auto order-1 order-sm-2"
                  >
                    <Send size={15} />
                    <span>{resubmitting ? 'Submitting...' : 'Resubmit to Institute'}</span>
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

export default ApplicationTracking;
