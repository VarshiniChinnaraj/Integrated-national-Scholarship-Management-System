import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Swal from 'sweetalert2';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('admin@nsp.gov.in');
    setPassword('admin123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/admin/login', { email, password });

      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('admin', JSON.stringify(res.data.admin));

        Swal.fire({
          icon: 'success',
          title: 'Management Authentication Successful',
          text: `Welcome, ${res.data.admin.fullName}`,
          timer: 1500,
          showConfirmButton: false
        });

        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1600);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Failed',
        text: error.response?.data?.message || 'Invalid administrative credentials.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background: 'radial-gradient(circle at 10% 20%, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}
    >
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '490px', width: '100%' }}>
        
        {/* Header */}
        <div
          className="p-4 text-center text-white position-relative"
          style={{ background: 'linear-gradient(135deg, #0d1b2a, #1b263b, #415a77)' }}
        >
          <div
            className="bg-warning text-dark rounded-circle p-3 d-inline-flex align-items-center justify-content-center shadow mb-3"
            style={{ width: '68px', height: '68px' }}
          >
            <i className="bi bi-shield-lock-fill fs-2"></i>
          </div>
          <h3 className="fw-bold mb-1">State Management Portal</h3>
          <p className="text-white-50 mb-0 small">
            National Scholarship System • Officer & Administrator Access
          </p>
        </div>

        {/* Form Body */}
        <div className="p-4 p-md-5 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">
                <i className="bi bi-envelope-at me-1"></i> Officer Email ID
              </label>
              <input
                type="email"
                className="form-control form-control-lg rounded-3 fs-6"
                placeholder="admin@nsp.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-secondary mb-0">
                  <i className="bi bi-key me-1"></i> Security Password
                </label>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <><i className="bi bi-eye-slash me-1"></i>Hide</>
                  ) : (
                    <><i className="bi bi-eye me-1"></i>Show</>
                  )}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-lg rounded-3 fs-6"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm py-2"
              style={{ background: 'linear-gradient(135deg, #1b263b, #0f3460)' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifying Officer Credentials...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check me-2"></i> Sign In to Management Portal
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper Box */}
          <div className="mt-4 p-3 bg-light rounded-3 border">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted d-block">Default Officer Credentials:</small>
                <strong className="small text-dark">admin@nsp.gov.in / admin123</strong>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                onClick={fillDemoCredentials}
              >
                Auto-Fill
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              className="btn btn-link text-decoration-none small text-muted"
              onClick={() => navigate('/login')}
            >
              <i className="bi bi-arrow-left me-1"></i> Return to Student Portal Login
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
