import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Star } from 'lucide-react';

const StudentLogin = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password, 'STUDENT');
    setLoading(false);
    if (res.success) navigate('/student/dashboard');
    else setError(res.message);
  };

  const features = [
    'Unified Multi-Scheme Application via Single Form',
    'Direct Benefit Transfer (DBT) Directly to Bank Account',
    'Transparent Institutional & Departmental Verification Status',
    'Automated Email Reminders for Eligible Scheme Deadlines'
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #2C1F35 0%, #49354F 55%, #3A2940 100%)', color: '#f5f0f7' }}>
      {/* Decorative orbs */}
      <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,139,181,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', right: '-60px', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,139,181,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div className="row justify-content-center align-items-center g-4">

            {/* Left hero (desktop) */}
            <div className="col-12 col-lg-6 d-none d-lg-block pe-lg-5">
              {/* Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #A88BB5, #C3A8D1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(168,139,181,0.4)' }}>
                  <Star size={24} color="#fff" fill="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.01em' }}>NSP 2.0</div>
                  <div style={{ fontSize: '0.7rem', color: '#A88BB5', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>National Scholarship Portal</div>
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,139,181,0.15)', border: '1px solid rgba(168,139,181,0.25)', borderRadius: 30, padding: '6px 16px', marginBottom: '1.25rem' }}>
                <GraduationCap size={15} color="#A88BB5" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#A88BB5' }}>Student Direct Benefits Portal</span>
              </div>

              <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: '#fff', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                Unlock Your Academic{' '}
                <span style={{ color: '#A88BB5' }}>Potential</span>
              </h1>
              <p style={{ fontSize: '1rem', color: 'rgba(228,220,232,0.7)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                Apply for government, corporate, and institutional scholarships. Track your application verification in real time and receive direct DBT bank transfers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,139,181,0.12)' }}>
                    <CheckCircle2 size={18} color="#4ade80" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.87rem', color: 'rgba(228,220,232,0.85)' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right login card */}
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div style={{ background: '#fff', borderRadius: 20, padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 24px 60px rgba(42,25,50,0.35)', border: '1px solid rgba(168,139,181,0.15)' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.75rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #49354F, #A88BB5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GraduationCap size={24} color="#fff" />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, color: 'var(--charcoal)', margin: 0, fontSize: '1.15rem' }}>Student Sign In</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted-grey)' }}>Applicant & Beneficiary Account</span>
                  </div>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#b91c1c' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Student Email ID</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0">
                        <Mail size={17} />
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0"
                        placeholder="Enter registered student email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0">
                        <Lock size={17} />
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0 ps-0"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ padding: '0.7rem 1rem', fontSize: '0.92rem' }}
                  >
                    {loading ? 'Authenticating…' : 'Sign In to Student Portal'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--lavender-pale)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-grey)' }}>New Applicant? </span>
                  <Link to="/register" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--plum)', textDecoration: 'none' }}>
                    Register for Student Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'rgba(168,139,181,0.6)', borderTop: '1px solid rgba(168,139,181,0.1)' }}>
        National Scholarship Portal &bull; Student Services Division &bull; Ministry of Electronics and IT
      </footer>
    </div>
  );
};

export default StudentLogin;
