import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { School, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const InstituteLogin = () => {
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

    const res = await login(email, password, 'INSTITUTE_OFFICER');
    setLoading(false);

    if (res.success) {
      navigate('/institute/dashboard');
    } else {
      setError(res.message);
    }
  };

  const fillDemoInstitute = (instEmail = 'institute@nsp.gov.in') => {
    setError('');
    setEmail(instEmail);
    setPassword('institute123');
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
            <div className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 px-3 py-2 rounded-pill mb-3 fw-semibold">
              ðŸ« Institutional Level-1 Verification Authority
            </div>
            <h1 className="fw-extrabold display-5 mb-3 text-white">
              Institutional <span className="text-warning">Verification</span> Portal
            </h1>
            <p className="lead text-secondary mb-4 fs-6">
              Designated nodal officer desk for verifying applicant enrollment, academic records, fee details, and bona fide certification before forwarding to State/Central Departments.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-warning flex-shrink-0" />
                <span className="small">Verify Student Enrollment & Marksheets Digitally</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-warning flex-shrink-0" />
                <span className="small">One-Click Application Endorsement & Defect Rejection</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CheckCircle2 size={20} className="text-warning flex-shrink-0" />
                <span className="small">Real-time Institutional Application Roster & Analytics</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 text-warning small">
              <ShieldCheck size={18} className="flex-shrink-0" />
              <span>Official AISHE / Nodal Officer credentials required for access.</span>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="custom-card p-3 p-sm-4 p-md-5 bg-white shadow-2xl border-0 rounded-4 text-dark">
              
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="p-3 rounded-3 bg-warning text-dark shadow-sm flex-shrink-0">
                  <School size={28} />
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-0 fs-5 fs-sm-4">Institute Officer Login</h4>
                  <span className="text-muted small">College / University Verification Desk</span>
                </div>
              </div>

              {/* Demo Credentials Auto-Fill Buttons */}
              <div className="mb-3 p-3 rounded-3 bg-warning-subtle border border-warning-subtle">
                <div className="fw-bold text-dark small mb-2">Select Institute Officer Account:</div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                    <div>
                      <div className="fw-semibold text-dark small">Anna University Chennai</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>institute.anna@nsp.gov.in / institute123</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoInstitute('institute.anna@nsp.gov.in')}
                      className="btn btn-sm btn-outline-warning text-dark px-2.5 py-1 fw-semibold flex-shrink-0"
                    >
                      Fill
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                    <div>
                      <div className="fw-semibold text-dark small">NIT Delhi</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>institute@nsp.gov.in / institute123</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoInstitute('institute@nsp.gov.in')}
                      className="btn btn-sm btn-outline-warning text-dark px-2.5 py-1 fw-semibold flex-shrink-0"
                    >
                      Fill
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                    <div>
                      <div className="fw-semibold text-dark small">IIT Delhi</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>institute.iitd@nsp.gov.in / institute123</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoInstitute('institute.iitd@nsp.gov.in')}
                      className="btn btn-sm btn-outline-warning text-dark px-2.5 py-1 fw-semibold flex-shrink-0"
                    >
                      Fill
                    </button>
                  </div>
                </div>
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
                  <label className="form-label small fw-semibold text-dark">Nodal Officer Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. institute@nsp.gov.in"
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
                  className="btn btn-warning text-dark w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In as Institute Officer'}
                  <ArrowRight size={16} />
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-secondary small border-top border-secondary-subtle">
        National Scholarship Portal &bull; Institutional Verification Division &bull; Ministry of Education
      </footer>
    </div>
  );
};

export default InstituteLogin;

