import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Banknote, Printer, ShieldCheck } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/student/payments');
      if (res.data.success) {
        setPayments(res.data.payments || []);
        if (res.data.payments?.length > 0) {
          setSelectedPayment(res.data.payments[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="Scholarship Payments & DBT Disbursement Tracking"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'Payments' }]}
    >
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : payments.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <Banknote size={48} className="mb-2 text-muted" />
          <h5>No disbursement records found</h5>
          <p className="small">Payments will appear here once your scholarship application is approved and sanctioned.</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left: Payment Transactions List */}
          <div className="col-12 col-lg-7">
            <div className="custom-card p-3 p-sm-4">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Disbursement Transactions</h5>
              <div className="d-flex flex-column gap-3">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 rounded-3 border"
                    onClick={() => setSelectedPayment(p)}
                    style={{
                      cursor: 'pointer',
                      borderColor: selectedPayment?._id === p._id ? 'var(--lavender)' : 'var(--lavender-pale)',
                      background: selectedPayment?._id === p._id ? 'rgba(168,139,181,0.06)' : '#fff',
                      boxShadow: selectedPayment?._id === p._id ? '0 2px 12px rgba(73,53,79,0.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <span className="fw-bold text-primary text-break">{p.paymentReference}</span>
                        <div className="fw-semibold text-dark small">{p.scholarshipName}</div>
                      </div>
                      <div className="text-sm-end">
                        <span className="fw-bold text-success fs-5">₹{p.amount?.toLocaleString('en-IN')}</span>
                        <div>
                          <span
                            className={`badge ${
                              p.status === 'DISBURSED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between text-muted small border-top pt-2 mt-2 gap-2">
                      <span className="text-break">UTR: {p.utr || 'Pending Generation'}</span>
                      <span>Date: {p.transactionDate ? new Date(p.transactionDate).toLocaleDateString() : 'In Process'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Printable Payment Voucher / Receipt */}
          <div className="col-12 col-lg-5">
            {selectedPayment && (
              <div className="custom-card p-3 p-sm-4 document-border printable-document">
                <div className="text-center pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1 text-primary">
                    <ShieldCheck size={24} />
                    <h5 className="fw-bold mb-0">National Scholarship Portal</h5>
                  </div>
                  <span className="text-muted small text-uppercase">Direct Benefit Transfer (DBT) Receipt</span>
                </div>

                <div className="row g-2 mb-3" style={{ fontSize: '0.82rem' }}>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted">Payment Reference:</span>
                    <div className="fw-bold text-dark text-break">{selectedPayment.paymentReference}</div>
                  </div>
                  <div className="col-12 col-sm-6 text-sm-end">
                    <span className="text-muted">Receipt Number:</span>
                    <div className="fw-bold text-dark text-break">{selectedPayment.receiptNumber || 'REC-2026-PENDING'}</div>
                  </div>
                  <div className="col-12">
                    <span className="text-muted">Scholarship Scheme:</span>
                    <div className="fw-semibold text-dark text-break">{selectedPayment.scholarshipName}</div>
                  </div>
                  <div className="col-12">
                    <span className="text-muted">Beneficiary Student:</span>
                    <div className="fw-semibold text-dark text-break">{selectedPayment.studentName}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted">Credited Bank:</span>
                    <div className="fw-semibold text-dark text-break">{selectedPayment.bankDetails?.bankName || 'State Bank of India'}</div>
                  </div>
                  <div className="col-12 col-sm-6 text-sm-end">
                    <span className="text-muted">Account Number:</span>
                    <div className="fw-semibold text-dark">••••{selectedPayment.bankDetails?.accountNumber?.slice(-4) || '9482'}</div>
                  </div>
                  <div className="col-12">
                    <span className="text-muted">Banking UTR Reference:</span>
                    <div className="fw-bold text-primary text-break">{selectedPayment.utr || 'Awaiting Bank Settlement'}</div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded text-center mb-4 border">
                  <span className="text-muted small text-uppercase">Total Disbursed Amount</span>
                  <h3 className="fw-bold text-success mb-0">₹{selectedPayment.amount?.toLocaleString('en-IN')}</h3>
                  <span className="badge bg-success-subtle text-success mt-1">Transaction Completed Successfully</span>
                </div>

                <div className="d-flex gap-2 no-print">
                  <button
                    onClick={() => window.print()}
                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                  >
                    <Printer size={15} />
                    <span>Print Official Receipt</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default Payments;
