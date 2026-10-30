import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const AdminLogin = () => {
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

    const res = await login(email, password, 'ADMIN');
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.message);
    }
  };

  const fillDemoAdmin = () => {
    setError('');
    setEmail('admin@nsp.gov.in');
    setPassword('admin123');
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
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(145deg, #3A2940 0%, #49354F 50%, #3A2940 100%)', color: '#f8fafc' }}>
      {/* Main Content */}
      <main className="container my-auto py-4 py-md-5 px-3 px-sm-4">
        <div className="row justify-content-center align-items-center g-4">
          
          {/* Left Info Box (Desktop) */}
          <div className="col-12 col-lg-6 text-light d-none d-lg-block pe-lg-5">
            <div className="badge border fw-semibold px-3 py-2 rounded-pill mb-3 fw-semibold">
              ðŸ”’ High-Security Administrative Gateway
            </div>
            <h1 className="fw-extrabold display-5 mb-3 text-white">
              State & Central <span style={{ color: "#C3A8D1" }}>Admin Console</span>
            </h1>
            <p className="lead text-secondary mb-4 fs-6">
              Complete oversight, scheme configuration, institution & department onboarding, user role provisioning, system audit trails, and macro financial disbursement tracking.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} style={{ color: "#A88BB5", flexShrink: 0 }} />
                <span className="small">Institution & Department Onboarding & Verification Desk</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} style={{ color: "#A88BB5", flexShrink: 0 }} />
                <span className="small">Scholarship Schemes Lifecyle & Quota Configuration</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} style={{ color: "#A88BB5", flexShrink: 0 }} />
                <span className="small">Immutable Audit Logging & Anti-Fraud Security Monitoring</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 small" style={{ color: "#C3A8D1" }}>
              <ShieldAlert size={18} className="flex-shrink-0" />
              <span>All administrative actions are logged and subject to statutory audit.</span>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="custom-card p-3 p-sm-4 p-md-5 bg-white shadow-2xl border-0 rounded-4 text-dark">
              
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="p-3 rounded-3 text-white shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #49354F, #3A2940)' }}>
                  <Shield size={28} />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-0 fs-5 fs-sm-4">Administrator Sign In</h4>
                  <span className="text-muted small">Super Admin &amp; State Governance Desk</span>
                </div>
              </div>

              {/* Demo Credentials Auto-Fill Button */}
              <div className="mb-3 p-3 rounded-3 border d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                <div className="min-w-0">
                  <div className="fw-bold small" style={{ color: '#49354F' }}>Demo Admin Account:</div>
                  <div className="text-muted text-break" style={{ fontSize: '0.75rem' }}>admin@nsp.gov.in / admin123</div>
                </div>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="btn btn-sm btn-primary px-3 fw-semibold shadow-sm flex-shrink-0"
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
                  <label className="form-label small fw-semibold text-dark">Administrator Official Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. admin@nsp.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-dark mb-0">Master Password</label>
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
                  className="btn btn-danger w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
                >
                  {loading ? 'Verifying Admin Authority...' : 'Sign In to Admin Portal'}
                  <ArrowRight size={16} />
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-secondary small border-top border-secondary-subtle">
        National Scholarship Portal &bull; Central Administrative Control &bull; Government of India
      </footer>
    </div>
  );
};

export default AdminLogin;

