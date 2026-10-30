import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Landmark, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const DepartmentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password, 'DEPARTMENT_OFFICER');
    setLoading(false);

    if (res.success) {
      navigate('/department/dashboard');
    } else {
      setError(res.message);
    }
  };

  const fillDemoDepartment = () => {
    setError('');
    setEmail('department@nsp.gov.in');
    setPassword('department123');
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedSuccess('');
    setError('');
    try {
      const res = await api.post('/seed');
      if (res.data.success) {
        setSeedSuccess('Demo database seeded successfully!');
      }
    } catch (err) {
      setError('Database seeding failed. Ensure MongoDB and backend server are running.');
    }
    setSeeding(false);
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(145deg, #3A2940, #49354F, #3A2940)', color: '#f8fafc' }}>
      {/* Main Content */}
      <main className="container my-auto py-4 py-md-5 px-3 px-sm-4">
        <div className="row justify-content-center align-items-center g-4">
          
          {/* Left Info Box (Desktop) */}
          <div className="col-12 col-lg-6 text-light d-none d-lg-block pe-lg-5">
            <div className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill mb-3 fw-semibold">
              ðŸ›ï¸ Ministry / State Level-2 Sanction Gateway
            </div>
            <h1 className="fw-extrabold display-5 mb-3 text-white">
              Department & <span className="text-info">Sanction</span> Portal
            </h1>
            <p className="lead text-secondary mb-4 fs-6">
              Official verification, merit list generation, budget allocation, and sanction order issuance for government welfare schemes, CSR programs, and trust funds.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-info flex-shrink-0" />
                <span className="small">State & Central Level Verification of Endorsed Candidates</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-info flex-shrink-0" />
                <span className="small">Sanction Order Generation with Digital Signatures</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-info flex-shrink-0" />
                <span className="small">PFMS / DBT Public Fund Disbursement Management</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 text-info small">
              <ShieldCheck size={18} className="flex-shrink-0" />
              <span>Restricted to authorized Ministry & Department Nodal Officers.</span>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="custom-card p-3 p-sm-4 p-md-5 bg-white shadow-2xl border-0 rounded-4 text-dark">
              
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="p-3 rounded-3 bg-info text-dark shadow-sm flex-shrink-0">
                  <Landmark size={28} />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-0 fs-5 fs-sm-4">Department Officer Login</h4>
                  <span className="text-muted small">Ministry Approval & Sanctions Desk</span>
                </div>
              </div>

              {/* Demo Credentials Auto-Fill Button */}
              <div className="mb-3 p-3 rounded-3 bg-info-subtle border border-info-subtle d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                <div className="min-w-0">
                  <div className="fw-bold text-dark small">Demo Department Account:</div>
                  <div className="text-muted text-break" style={{ fontSize: '0.75rem' }}>department@nsp.gov.in / department123</div>
                </div>
                <button
                  type="button"
                  onClick={fillDemoDepartment}
                  className="btn btn-sm btn-info px-3 py-1.5 fw-semibold shadow-sm text-dark flex-shrink-0"
                >
                  Auto-Fill
                </button>
              </div>

              {/* Initialize Database Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="btn btn-sm btn-outline-secondary w-100 py-1 fw-semibold"
                >
                  {seeding ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Initializing Database...</>
                  ) : (
                    'âš™ Initialize / Reset Demo Database'
                  )}
                </button>
                <div className="text-muted text-center mt-1" style={{ fontSize: '0.7rem' }}>
                  Run this once if demo credentials are not working
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {seedSuccess && (
                <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={16} className="flex-shrink-0" />
                  <span>{seedSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Department Officer Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. department@nsp.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-dark mb-0">Security Password</label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      className="form-control border-start-0 ps-0"
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-info text-dark w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                >
                  {loading ? 'Verifying Department Clearance...' : 'Sign In to Department Portal'}
                  <ArrowRight size={16} />
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-secondary small border-top border-secondary-subtle">
        National Scholarship Portal &bull; Department & Ministry Sanction Wing &bull; Government of India
      </footer>
    </div>
  );
};

export default DepartmentLogin;

