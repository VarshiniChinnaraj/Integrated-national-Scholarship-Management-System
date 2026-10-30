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
  Award,
  ArrowLeft,
  History,
  Zap,
  Download,
  Send,
  Banknote,
  ArrowRight
} from 'lucide-react';

const DepartmentVerification = () => {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [slpTracking, setSlpTracking] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Department Scrutiny Form state
  const [approvedAmount, setApprovedAmount] = useState(50000);
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState({
    eligibilityMet: true,
    budgetAvailable: true,
    quotaVerified: true,
    bankDetailsValid: true
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const res = await api.get(`/department/applications/${id}`);
      if (res.data.success) {
        setApplication(res.data.application);
        setAuditLogs(res.data.auditLogs || []);
        setApprovedAmount(res.data.application.approvedAmount || res.data.application.requestedAmount || 50000);
        if (res.data.slpTracking) {
          setSlpTracking(res.data.slpTracking);
        } else {
          try {
            const slpRes = await api.get(`/slp/tracking/${id}`);
            if (slpRes.data.success) setSlpTracking(slpRes.data.slpTracking);
          } catch (_) {}
        }
        if (res.data.application.departmentVerification?.checklist) {
          setChecklist((prev) => ({
            ...prev,
            ...res.data.application.departmentVerification.checklist
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      setErrorMsg(err.response?.data?.message || 'Application record not found in assigned department queue');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDepartmentAction = async (actionType) => {
    if (actionType === 'APPROVE' && (!approvedAmount || approvedAmount <= 0)) {
      setFeedback({ type: 'danger', message: 'Please enter a valid Approved Scholarship Amount.' });
      return;
    }
    if ((actionType === 'REQUEST_CORRECTION' || actionType === 'REJECT') && !remarks.trim()) {
      setFeedback({ type: 'danger', message: 'Please enter remarks explaining your decision.' });
      return;
    }

    setActionLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post(`/department/applications/${id}/verify`, {
        action: actionType,
        approvedAmount: Number(approvedAmount),
        remarks,
        checklist
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message:
            actionType === 'APPROVE'
              ? `Application APPROVED & Official Sanction Order ${res.data.sanction?.sanctionNumber || res.data.application?.sanctionNumber || ''} generated! Queued for DBT banking disbursement.`
              : `Department action ${actionType} recorded successfully.`
        });
        setApplication(res.data.application);
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to complete department scrutiny.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSanction = async () => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post('/department/sanctions/generate', {
        applicationId: application._id,
        orderRemarks: remarks || `Official Sanction Order approved by Department Officer for ${application.scholarshipName}.`
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Official Sanction Order ${res.data.sanction.sanctionNumber} generated successfully and queued for DBT disbursement!`
        });
        fetchApplicationDetails();
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to generate sanction order.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Department Scrutiny">
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
          <h5>{errorMsg || 'Application record not found in assigned department queue'}</h5>
          <Link to="/department/applications" className="btn btn-primary btn-sm mt-3">
            Back to Applications
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle={`Department Scrutiny & Sanction Desk: ${application.applicationNumber}`}
      breadcrumbs={[
        { label: 'Department Portal', link: '/department/dashboard' },
        { label: 'Applications', link: '/department/applications' },
        { label: 'Scrutiny' }
      ]}
    >
      {/* Header Banner */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <span className="fw-bold text-primary fs-5 text-break">{application.applicationNumber}</span>
              <StatusBadge status={application.status} />
            </div>
            <h5 className="fw-bold text-dark mb-1 responsive-title">{application.scholarshipName}</h5>
            <span className="text-muted small">
              College: <strong className="text-dark">{application.institutionName}</strong> &bull; Student: <strong className="text-dark">{application.studentName}</strong>
            </span>
          </div>

          <div className="d-flex flex-wrap gap-2 align-self-start align-self-md-center">
            {application.status === 'APPROVED' && (
              <Link to="/department/sanctions" className="btn btn-warning d-flex align-items-center gap-1 fw-semibold btn-sm">
                <Award size={16} />
                <span>Issue Sanction Order</span>
              </Link>
            )}
            <Link to="/department/applications" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <ArrowLeft size={16} />
              <span>Back to Queue</span>
            </Link>
          </div>
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
                {slpTracking.slaStatus === 'SLA_BREACHED' ? '⚠️ SLA BREACHED — Department Action Overdue' : '⏱️ Department Scrutiny SLA Active'}
              </span>
              <span className="small text-secondary">
                Target SLA: 01:00 &bull; {slpTracking.slaStatus === 'SLA_BREACHED' ? 'Escalated to Central Admin Dashboard with Breach Alert' : 'Within Allowed Target'}
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

      {/* Scrutiny Interface Grid */}
      <div className="row g-4">
        {/* Left Column: Institute Verified Records & Student Dossier */}
        <div className="col-12 col-lg-7">
          {/* Institute Verification Result Card */}
          <div className="custom-card p-3 p-sm-4 mb-4 border-start border-4 border-success">
            <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-success flex-shrink-0" />
              <span>Institutional Level Verification Clearance</span>
            </h6>
            <div className="row g-2 bg-light p-3 rounded-3" style={{ fontSize: '0.85rem' }}>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Verified Officer:</span>
                <div className="fw-semibold text-dark text-break">{application.instituteVerification?.officerName || 'Institute Nodal Officer'}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Verification Decision:</span>
                <div className="fw-bold text-success">
                  {application.instituteVerification?.decision || 'APPROVED'}
                </div>
              </div>
              <div className="col-12">
                <span className="text-muted">Institute Remarks:</span>
                <div className="fw-semibold text-dark text-break">"{application.instituteVerification?.remarks || 'All college records and attendance verified.'}"</div>
              </div>
            </div>
          </div>

          {/* Student Dossier */}
          <div className="custom-card p-3 p-sm-4 mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Applicant Dossier & Financial Standing</h5>
            <div className="row g-3" style={{ fontSize: '0.85rem' }}>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Applicant Name:</span>
                <div className="fw-bold text-dark text-break">{application.studentName}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Course & Enrollment:</span>
                <div className="fw-semibold text-dark text-break">{application.academicDetails?.course} ({application.academicDetails?.enrollmentNumber})</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Academic Percentage & CGPA:</span>
                <div className="fw-bold text-success">{application.academicDetails?.previousClassPercentage}% &bull; {application.academicDetails?.cgpa} CGPA</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Recorded Attendance:</span>
                <div className="fw-semibold text-dark">{application.academicDetails?.attendancePercentage}%</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Declared Family Income:</span>
                <div className="fw-bold text-primary">₹{Number(application.incomeDetails?.familyAnnualIncome).toLocaleString('en-IN')} / Year</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Income Certificate No:</span>
                <div className="fw-semibold text-dark text-break">{application.incomeDetails?.incomeCertificateNumber}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">DBT Bank Account:</span>
                <div className="fw-semibold text-dark text-break">{application.bankDetails?.bankName} ({application.bankDetails?.accountNumber})</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted">Bank IFSC Code:</span>
                <div className="fw-semibold text-dark text-break">{application.bankDetails?.ifscCode}</div>
              </div>
            </div>
          </div>

          {/* Audit History */}
          <div className="custom-card p-3 p-sm-4">
            <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
              <History size={18} className="text-secondary" />
              <span>Immutable Audit Trail</span>
            </h6>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {auditLogs.map((log) => (
                <div key={log._id} className="p-2 rounded bg-light border small">
                  <div className="d-flex justify-content-between flex-wrap gap-1">
                    <span className="fw-bold text-dark">{log.officerName} ({log.officerRole})</span>
                    <span className="badge bg-secondary">{log.newStatus}</span>
                  </div>
                  <div className="text-muted text-break">{log.remarks}</div>
                  <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Department Scrutiny & Approval Actions */}
        <div className="col-12 col-lg-5">
          <div className="custom-card p-3 p-sm-4 sticky-lg-top" style={{ top: '90px' }}>
            {['SANCTIONED', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'DISBURSED'].includes(application.status) ? (
              <div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <Award size={20} className="text-warning" />
                    <span>Official Sanction Issued</span>
                  </h5>
                  <StatusBadge status={application.status} />
                </div>

                <div className="p-3 bg-success-subtle border border-success-subtle rounded-3 mb-3">
                  <span className="text-muted small text-uppercase fw-semibold d-block">Sanction Order Number</span>
                  <div className="fs-5 fw-bold text-primary text-break">
                    {application.sanctionNumber || application.sanctionId?.sanctionNumber || 'SAN-GENERATED'}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-success-subtle">
                    <span className="small text-muted">Sanctioned Grant:</span>
                    <span className="fs-5 fw-bold text-success">₹{Number(application.approvedAmount || application.requestedAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Pipeline Step Tracker */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <h6 className="fw-bold text-dark small mb-2">Disbursement Pipeline Tracker:</h6>
                  <div className="d-flex flex-column gap-2 small">
                    <div className="d-flex align-items-center gap-2 text-success fw-semibold">
                      <CheckCircle2 size={16} />
                      <span>1. Scrutiny Approved & Sanction Generated</span>
                    </div>
                    <div className={`d-flex align-items-center gap-2 ${application.status === 'SANCTIONED' || application.status === 'PAYMENT_PENDING' ? 'text-primary fw-bold' : 'text-success fw-semibold'}`}>
                      <CheckCircle2 size={16} />
                      <span>2. Queued for DBT Banking ({application.paymentReference || 'DBT-QUEUED'})</span>
                    </div>
                    <div className={`d-flex align-items-center gap-2 ${application.status === 'PAYMENT_PROCESSING' ? 'text-primary fw-bold' : application.status === 'DISBURSED' ? 'text-success fw-semibold' : 'text-muted'}`}>
                      <Banknote size={16} />
                      <span>3. Gateway Processing (NPCI/Bank)</span>
                    </div>
                    <div className={`d-flex align-items-center gap-2 ${application.status === 'DISBURSED' ? 'text-success fw-bold' : 'text-muted'}`}>
                      <CheckCircle2 size={16} />
                      <span>4. Disbursed to Bank Account {application.status === 'DISBURSED' ? '✓' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      const sNum = application.sanctionNumber || application.sanctionId?.sanctionNumber;
                      if (sNum) {
                        window.open(`http://localhost:5000/api/department/sanctions/${sNum}/pdf?token=${token}`, '_blank');
                      }
                    }}
                    className="btn btn-outline-primary py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  >
                    <Download size={16} />
                    <span>Download Sanction Order PDF</span>
                  </button>

                  <Link
                    to="/department/disbursement"
                    className="btn btn-success py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-center"
                  >
                    <Send size={16} />
                    <span>Proceed to DBT Disbursement Gateway</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : application.status === 'APPROVED' ? (
              <div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h5 className="fw-bold text-dark mb-0">Department Approved</h5>
                  <StatusBadge status="APPROVED" />
                </div>

                <div className="alert alert-warning py-3 mb-3">
                  <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                    <Award size={18} />
                    <span>Sanction Order Pending Generation</span>
                  </div>
                  <span className="small">
                    This scholarship application has been verified for ₹{Number(application.approvedAmount || application.requestedAmount).toLocaleString('en-IN')}. Generate the official statutory sanction order to queue for direct bank disbursement.
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Sanction Order Official Remarks</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Official Financial Sanction granted under Higher Education Merit Scheme."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSanction}
                  disabled={actionLoading}
                  className="btn btn-warning py-3 fw-bold w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                >
                  <Award size={18} />
                  <span>{actionLoading ? 'Generating Order...' : 'GENERATE SANCTION ORDER & QUEUE FOR DBT'}</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h5 className="fw-bold text-dark mb-0">Department Final Approval Desk</h5>
                  <span className="badge bg-primary">Scrutiny Stage</span>
                </div>

                {/* Checklist */}
                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="form-check p-2.5 bg-light rounded border">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="chkD1"
                      checked={checklist.eligibilityMet}
                      onChange={() => handleChecklistToggle('eligibilityMet')}
                    />
                    <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chkD1">
                      Department Scheme Eligibility Criteria Verified
                    </label>
                  </div>

                  <div className="form-check p-2.5 bg-light rounded border">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="chkD2"
                      checked={checklist.budgetAvailable}
                      onChange={() => handleChecklistToggle('budgetAvailable')}
                    />
                    <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chkD2">
                      Department Budget Allocation Available
                    </label>
                  </div>

                  <div className="form-check p-2.5 bg-light rounded border">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="chkD3"
                      checked={checklist.quotaVerified}
                      onChange={() => handleChecklistToggle('quotaVerified')}
                    />
                    <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chkD3">
                      Social Category Quota Verified
                    </label>
                  </div>

                  <div className="form-check p-2.5 bg-light rounded border">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="chkD4"
                      checked={checklist.bankDetailsValid}
                      onChange={() => handleChecklistToggle('bankDetailsValid')}
                    />
                    <label className="form-check-label small fw-semibold text-dark text-break" htmlFor="chkD4">
                      Bank Account & IFSC Validated for DBT
                    </label>
                  </div>
                </div>

                {/* Approved Scholarship Amount Field */}
                <div className="mb-3 p-3 bg-light rounded-3 border">
                  <label className="form-label small fw-bold text-dark">
                    Approved Scholarship Grant Amount (₹ INR)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white fw-bold text-success">₹</span>
                    <input
                      type="number"
                      className="form-control fw-bold fs-5 text-success"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      required
                    />
                  </div>
                  <span className="text-muted small">Scheme Default: ₹{application.requestedAmount?.toLocaleString('en-IN')}</span>
                </div>

                {/* Remarks */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-dark">Department Scrutiny Remarks</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Enter remarks for approval, correction, or rejection..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="d-flex flex-column gap-2 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => handleDepartmentAction('APPROVE')}
                    disabled={actionLoading}
                    className="btn btn-success py-2.5 fw-bold d-flex flex-column align-items-center justify-content-center shadow-sm text-center"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={18} className="flex-shrink-0" />
                      <span>APPROVE & ISSUE SANCTION ORDER</span>
                    </div>
                    <span className="small text-white-50 mt-0.5" style={{ fontSize: '0.72rem' }}>
                      Automatically issues official Sanction Order & queues for DBT Banking
                    </span>
                  </button>

                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <button
                        type="button"
                        onClick={() => handleDepartmentAction('REQUEST_CORRECTION')}
                        disabled={actionLoading}
                        className="btn btn-warning w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                      >
                        <AlertTriangle size={15} className="flex-shrink-0" />
                        <span>Correction</span>
                      </button>
                    </div>
                    <div className="col-12 col-sm-6">
                      <button
                        type="button"
                        onClick={() => handleDepartmentAction('REJECT')}
                        disabled={actionLoading}
                        className="btn btn-outline-danger w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                      >
                        <XCircle size={15} className="flex-shrink-0" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default DepartmentVerification;
