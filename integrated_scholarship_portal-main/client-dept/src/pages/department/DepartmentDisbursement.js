import React, { useState, useEffect, useRef } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { 
  CreditCard, 
  Banknote, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  DollarSign, 
  Building,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const DepartmentDisbursement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const pollRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchPayments();
    pollRef.current = setInterval(() => fetchPayments(true), 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchPayments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/department/disbursement');
      if (res.data.success) {
        setPayments(res.data.payments || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSimulateDisbursement = async (paymentId, step) => {
    setProcessingId(paymentId);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post(`/department/disbursement/${paymentId}/simulate`, { step });
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message:
            step === 'PROCESS'
              ? `Payment moved to PROCESSING stage (${res.data.payment.paymentReference}).`
              : `Disbursement completed via Direct Benefit Transfer! UTR: ${res.data.payment.utr}`
        });
        fetchPayments();
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to simulate disbursement.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'PAYMENT_PENDING');
  const processingPayments = payments.filter((p) => p.status === 'PAYMENT_PROCESSING');
  const completedPayments = payments.filter((p) => p.status === 'DISBURSED');

  return (
    <PortalLayout
      pageTitle="DBT Payment & Disbursement Processing Gateway"
      breadcrumbs={[{ label: 'Department Portal', link: '/department/dashboard' }, { label: 'Disbursement Gateway' }]}
    >
      {/* Overview Banner */}
      <div className="custom-card p-3 p-sm-4 mb-4 border-0 text-white" style={{ background: 'linear-gradient(135deg, #065f46, #047857)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Banknote size={24} className="text-warning flex-shrink-0" />
              <h4 className="fw-bold mb-0 text-white responsive-title text-break">Direct Benefit Transfer (DBT) Disbursement Engine</h4>
            </div>
            <span className="text-white-50 small text-break">
              Integrated National Payment Corporation (NPCI) & PFMS Bank Gateway Simulator
            </span>
          </div>

          <button onClick={() => fetchPayments(false)} className="btn btn-light btn-sm fw-bold d-flex align-items-center justify-content-center gap-1 align-self-start align-self-md-center">
            <RefreshCw size={15} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} py-2.5 mb-4 d-flex align-items-center gap-2`}>
          <CheckCircle2 size={18} />
          <span className="text-break">{feedback.message}</span>
        </div>
      )}

      {/* 3 Pipeline Columns (Pending -> Processing -> Disbursed) */}
      <div className="row g-4 mb-4">
        {/* 1. Payment Pending */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-3 h-100 bg-light">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <Clock size={16} className="text-warning flex-shrink-0" />
                <span>1. Queued for Banking</span>
              </h6>
              <span className="badge bg-warning-subtle text-warning">{pendingPayments.length} Queued</span>
            </div>

            {pendingPayments.length === 0 ? (
              <p className="text-muted small py-4 text-center">No payments currently in queued stage.</p>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {pendingPayments.map((p) => (
                  <div key={p._id} className="custom-card p-3 bg-white border">
                    <div className="d-flex justify-content-between align-items-start mb-1 gap-1">
                      <span className="fw-bold text-primary small text-break">{p.paymentReference}</span>
                      <span className="fw-bold text-dark small flex-shrink-0">â‚¹{p.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="fw-semibold text-dark small">{p.studentName}</div>
                    <div className="text-muted small text-truncate mb-2">{p.scholarshipName}</div>
                    <div className="text-secondary small mb-3 text-break">
                      Bank: {p.bankDetails?.bankName} ({p.bankDetails?.ifscCode})
                    </div>
                    <button
                      onClick={() => handleSimulateDisbursement(p._id, 'PROCESS')}
                      disabled={processingId === p._id}
                      className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                    >
                      <Send size={14} />
                      <span>{processingId === p._id ? 'Sending...' : 'Dispatch to Gateway'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Payment Processing */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-3 h-100 bg-light">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <RefreshCw size={16} className="text-primary flex-shrink-0" />
                <span>2. Gateway Processing</span>
              </h6>
              <span className="badge bg-primary-subtle text-primary">{processingPayments.length} Active</span>
            </div>

            {processingPayments.length === 0 ? (
              <p className="text-muted small py-4 text-center">No transactions currently processing.</p>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {processingPayments.map((p) => (
                  <div key={p._id} className="custom-card p-3 bg-white border-primary">
                    <div className="d-flex justify-content-between align-items-start mb-1 gap-1">
                      <span className="fw-bold text-primary small text-break">{p.paymentReference}</span>
                      <span className="fw-bold text-dark small flex-shrink-0">â‚¹{p.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="fw-semibold text-dark small">{p.studentName}</div>
                    <div className="text-muted small text-truncate mb-2">{p.scholarshipName}</div>
                    <div className="alert alert-info p-2 small mb-3 text-break">
                      NPCI / Bank Server Verification in Progress...
                    </div>
                    <button
                      onClick={() => handleSimulateDisbursement(p._id, 'COMPLETE')}
                      disabled={processingId === p._id}
                      className="btn btn-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 size={15} />
                      <span>{processingId === p._id ? 'Completing...' : 'Execute DBT Credit (Disburse)'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Disbursed (Completed) */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-3 h-100 bg-light">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span>3. Disbursed (Completed)</span>
              </h6>
              <span className="badge bg-success-subtle text-success">{completedPayments.length} Credited</span>
            </div>

            {completedPayments.length === 0 ? (
              <p className="text-muted small py-4 text-center">No completed disbursements yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2.5" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {completedPayments.map((p) => (
                  <div key={p._id} className="custom-card p-3 bg-white border">
                    <div className="d-flex justify-content-between align-items-start mb-1 gap-1">
                      <span className="fw-bold text-success small text-break">{p.paymentReference}</span>
                      <span className="fw-bold text-dark small flex-shrink-0">â‚¹{p.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="fw-semibold text-dark small">{p.studentName}</div>
                    <div className="text-muted small text-truncate">{p.scholarshipName}</div>
                    <div className="p-2 bg-success-subtle rounded mt-2 text-success small text-break">
                      <div className="fw-bold">UTR: {p.utr}</div>
                      <div>Credited: {new Date(p.transactionDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default DepartmentDisbursement;

