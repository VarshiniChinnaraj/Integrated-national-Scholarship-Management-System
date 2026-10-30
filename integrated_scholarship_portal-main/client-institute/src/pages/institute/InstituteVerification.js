import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  ArrowLeft,
  Zap
} from 'lucide-react';

const InstituteVerification = () => {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [slpTracking, setSlpTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verification Checklist & Form state
  const [checklist, setChecklist] = useState({
    identityVerified: true,
    enrollmentVerified: true,
    academicMarksVerified: true,
    attendanceVerified: true,
    incomeVerified: true,
    documentsVerified: true
  });
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const res = await api.get(`/institute/applications/${id}`);
      if (res.data.success) {
        setApplication(res.data.application);
        if (res.data.slpTracking) {
          setSlpTracking(res.data.slpTracking);
        } else {
          // Fallback fetch SLP tracking
          try {
            const slpRes = await api.get(`/slp/tracking/${id}`);
            if (slpRes.data.success) {
              setSlpTracking(slpRes.data.slpTracking);
            }
          } catch (_) {}
        }
        if (res.data.application.instituteVerification?.checklist) {
          setChecklist((prev) => ({
            ...prev,
            ...res.data.application.instituteVerification.checklist
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVerificationAction = async (actionType) => {
    if (actionType === 'REQUEST_CORRECTION' && !remarks.trim()) {
      setFeedback({ type: 'danger', message: 'Please provide specific remarks explaining what correction is needed.' });
      return;
    }
    if (actionType === 'REJECT' && !remarks.trim()) {
      setFeedback({ type: 'danger', message: 'Please provide reason for rejection.' });
      return;
    }

    setActionLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post(`/institute/applications/${id}/verify`, {
        action: actionType,
        remarks,
        checklist
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message:
            actionType === 'APPROVE'
              ? 'Application verified and automatically ROUTED TO DEPARTMENT for scrutiny!'
              : `Application updated successfully (${actionType}).`
        });
        setApplication(res.data.application);
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to submit verification.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Application Verification">
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
          <h5>Application record not found</h5>
          <Link to="/institute/applications" className="btn btn-primary btn-sm mt-3">
            Back to Applications
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isVerified = application.status !== 'SUBMITTED' && application.status !== 'CORRECTION_REQUIRED';

  return (
    <PortalLayout
      pageTitle={`Verification Desk: ${application.applicationNumber}`}
      breadcrumbs={[
        { label: 'Institute Portal', link: '/institute/dashboard' },
        { label: 'Applications', link: '/institute/applications' },
        { label: 'Side-by-Side Scrutiny' }
      ]}
    >
      {/* Top Banner with Scheme and Application Info */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span className="fw-bold text-primary fs-5 text-break">{application.applicationNumber}</span>
              <StatusBadge status={application.status} />
            </div>
            <h5 className="fw-bold text-dark mb-1 responsive-title">{application.scholarshipName}</h5>
            <span className="text-muted small">
              Target Routing Dept: <strong className="text-dark">{application.departmentName || application.scholarshipId?.departmentName || 'Welfare Dept'}</strong>
            </span>
          </div>

          <Link to="/institute/applications" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 align-self-start align-self-md-center">
            <ArrowLeft size={16} />
            <span>Back to Roster</span>
          </Link>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} py-2.5 mb-4 d-flex align-items-center gap-2`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-break">{feedback.message}</span>
        </div>
      )}

      {/* SLP SLA Live Status Card */}
      {slpTracking && (
        <div
          className={`p-3 rounded-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-xs ${
            slpTracking.slaStatus === 'SLA_BREACHED'
              ? 'border border-warning bg-warning bg-opacity-10 text-dark'
              : 'border border-primary border-opacity-25 bg-primary bg-opacity-10 text-dark'
          }`}
          style={{ borderLeft: slpTracking.slaStatus === 'SLA_BREACHED' ? '4px solid #eab308' : '4px solid #3b82f6' }}
        >
          <div className="d-flex align-items-center gap-2">
            <Zap size={18} className={slpTracking.slaStatus === 'SLA_BREACHED' ? 'text-warning' : 'text-primary'} />
            <div>
              <span className="fw-bold me-2">
                {slpTracking.slaStatus === 'SLA_BREACHED' ? '⚠️ SLA BREACHED — Action Overdue' : '⏱️ Institute Verification SLA Active'}
              </span>
              <span className="small text-secondary">
                Target SLA: 01:00 &bull; {slpTracking.slaStatus === 'SLA_BREACHED' ? 'Automatically Escalated to Central Admin Review' : 'Within Allowed Target'}
              </span>
            </div>
          </div>
          {slpTracking.slaStatus === 'SLA_BREACHED' && (
            <span className="badge badge-sla-breached px-3 py-1.5 fw-bold">
              SLA DELAYED &bull; LEVEL 1 ESCALATED
            </span>
          )}
        </div>
      )}

      {/* SIDE-BY-SIDE VERIFICATION INTERFACE */}
      <div className="row g-4">
        {/* LEFT COLUMN: Student Submitted Information */}
        <div className="col-12 col-lg-7">
          <div className="custom-card p-3 p-sm-4 verification-card">
            <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-2 mb-3 gap-2">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <User size={18} className="text-primary flex-shrink-0" />
                <span>Student Submitted Application</span>
              </h5>
              <span className="badge bg-light text-secondary border">Applicant Data</span>
            </div>

            {/* Personal Details Section */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2 small text-uppercase">1. Personal Details</h6>
              <div className="row g-2 bg-light p-3 rounded-3 border" style={{ fontSize: '0.85rem' }}>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Full Name:</span>
                  <div className="fw-bold text-dark text-break">{application.personalDetails?.fullName || application.studentName}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Date of Birth:</span>
                  <div className="fw-semibold text-dark">{application.personalDetails?.dob}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Gender & Category:</span>
                  <div className="fw-semibold text-dark">{application.personalDetails?.gender} ({application.personalDetails?.category})</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Contact Phone & Email:</span>
                  <div className="fw-semibold text-dark text-break">{application.personalDetails?.phone} &bull; {application.personalDetails?.email}</div>
                </div>
              </div>
            </div>

            {/* Academic Details Section */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2 small text-uppercase">2. Academic & Enrollment Details</h6>
              <div className="row g-2 bg-light p-3 rounded-3 border" style={{ fontSize: '0.85rem' }}>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">College Enrollment / Roll No:</span>
                  <div className="fw-bold text-primary text-break">{application.academicDetails?.enrollmentNumber}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Course / Degree:</span>
                  <div className="fw-bold text-dark text-break">{application.academicDetails?.course}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Department & Year:</span>
                  <div className="fw-semibold text-dark text-break">{application.academicDetails?.department} - {application.academicDetails?.year}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Previous Marks / CGPA:</span>
                  <div className="fw-bold text-success">{application.academicDetails?.previousClassPercentage}% &bull; {application.academicDetails?.cgpa} CGPA</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Recorded Attendance:</span>
                  <div className="fw-bold text-dark">{application.academicDetails?.attendancePercentage}%</div>
                </div>
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2 small text-uppercase">3. Income & Bank Details</h6>
              <div className="row g-2 bg-light p-3 rounded-3 border" style={{ fontSize: '0.85rem' }}>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Annual Family Income:</span>
                  <div className="fw-bold text-dark">₹{Number(application.incomeDetails?.familyAnnualIncome).toLocaleString('en-IN')}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Income Certificate No:</span>
                  <div className="fw-semibold text-dark text-break">{application.incomeDetails?.incomeCertificateNumber}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Bank Name & Branch:</span>
                  <div className="fw-semibold text-dark text-break">{application.bankDetails?.bankName} ({application.bankDetails?.branchName})</div>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted">Account No & IFSC:</span>
                  <div className="fw-semibold text-dark text-break">{application.bankDetails?.accountNumber} ({application.bankDetails?.ifscCode})</div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h6 className="fw-bold text-primary mb-2 small text-uppercase">4. Uploaded Verification Documents</h6>
              <div className="d-flex flex-column gap-2">
                <div className="p-2 border rounded d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-light small gap-1">
                  <span className="text-break">1. Aadhaar Card ID: <strong>{application.documents?.aadhaarCard}</strong></span>
                  <span className="badge bg-success-subtle text-success">Verified</span>
                </div>
                <div className="p-2 border rounded d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-light small gap-1">
                  <span className="text-break">2. Income Certificate: <strong>{application.documents?.incomeCertificate}</strong></span>
                  <span className="badge bg-success-subtle text-success">Verified</span>
                </div>
                <div className="p-2 border rounded d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-light small gap-1">
                  <span className="text-break">3. Bonafide Certificate: <strong>{application.documents?.bonafideCertificate}</strong></span>
                  <span className="badge bg-success-subtle text-success">Verified</span>
                </div>
                <div className="p-2 border rounded d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-light small gap-1">
                  <span className="text-break">4. Marksheet Copy: <strong>{application.documents?.marksheet}</strong></span>
                  <span className="badge bg-success-subtle text-success">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Institute Verification Fields & Decision */}
        <div className="col-12 col-lg-5">
          <div className="custom-card p-3 p-sm-4 verification-card d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-2 mb-3 gap-2">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <ShieldCheck size={18} className="text-success flex-shrink-0" />
                  <span>College Scrutiny Checklist</span>
                </h5>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Officer Decision</span>
              </div>

              <p className="text-muted small mb-3">
                Verify the submitted student credentials against institutional registers before taking verification action.
              </p>

              {/* Scrutiny Checklist Items */}
              <div className="d-flex flex-column gap-2.5 mb-4">
                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk1"
                    checked={checklist.identityVerified}
                    onChange={() => handleChecklistToggle('identityVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk1">
                    Student Identity & Photo Authenticated
                  </label>
                </div>

                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk2"
                    checked={checklist.enrollmentVerified}
                    onChange={() => handleChecklistToggle('enrollmentVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk2">
                    College Enrollment / Roll Number Verified
                  </label>
                </div>

                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk3"
                    checked={checklist.academicMarksVerified}
                    onChange={() => handleChecklistToggle('academicMarksVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk3">
                    Academic Marks & CGPA Cutoff Verified
                  </label>
                </div>

                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk4"
                    checked={checklist.attendanceVerified}
                    onChange={() => handleChecklistToggle('attendanceVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk4">
                    Mandatory Attendance Criteria Met (≥ 75%)
                  </label>
                </div>

                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk5"
                    checked={checklist.incomeVerified}
                    onChange={() => handleChecklistToggle('incomeVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk5">
                    Family Annual Income within Scheme Limit
                  </label>
                </div>

                <div className="form-check p-2.5 bg-light rounded border">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="chk6"
                    checked={checklist.documentsVerified}
                    onChange={() => handleChecklistToggle('documentsVerified')}
                  />
                  <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chk6">
                    Bonafide Certificate & Marksheet Verified
                  </label>
                </div>
              </div>

              {/* Remarks Field */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-dark">Officer Remarks / Instructions</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter remarks for approval, specific correction instructions, or reason for rejection..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <div className="d-flex flex-column gap-2 pt-3 border-top">
                <button
                  type="button"
                  onClick={() => handleVerificationAction('APPROVE')}
                  disabled={actionLoading}
                  className="btn btn-success py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-center"
                >
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <span>APPROVE & ROUTE TO DEPT</span>
                </button>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      onClick={() => handleVerificationAction('REQUEST_CORRECTION')}
                      disabled={actionLoading}
                      className="btn btn-warning w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                    >
                      <AlertTriangle size={15} className="flex-shrink-0" />
                      <span>Request Correction</span>
                    </button>
                  </div>
                  <div className="col-12 col-sm-6">
                    <button
                      type="button"
                      onClick={() => handleVerificationAction('REJECT')}
                      disabled={actionLoading}
                      className="btn btn-outline-danger w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                    >
                      <XCircle size={15} className="flex-shrink-0" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default InstituteVerification;
