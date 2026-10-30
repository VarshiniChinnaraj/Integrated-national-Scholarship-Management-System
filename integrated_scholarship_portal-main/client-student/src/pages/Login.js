import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await API.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('student', JSON.stringify(response.data.student));

        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Logged in as ${response.data.student.fullName}`,
          timer: 1500,
          showConfirmButton: false
        });

        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || 'Unable to connect to server. Please check your internet connection.';
      setErrorMessage(msg);

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: msg,
        confirmButtonColor: '#0d6efd'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-4 px-2">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-lg overflow-hidden rounded-4">
              <div className="row g-0">
                
                {/* Left Section: Branding & Info (Visible on Desktop/Tablet) */}
                <div
                  className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative"
                  style={{
                    background: 'linear-gradient(135deg, #0d6efd 0%, #0a4b9c 100%)'
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-white rounded-circle p-2 text-primary me-3 shadow-sm">
                        <i className="bi bi-mortarboard-fill fs-2"></i>
                      </div>
                      <span className="fw-bold fs-5 tracking-wide text-uppercase text-light">
                        Govt. of India
                      </span>
                    </div>

                    <h1 className="fw-extrabold display-6 mb-3 lh-sm">
                      National Scholarship <br />
                      <span className="text-warning">Application Portal</span>
                    </h1>

                    <p className="lead fs-6 text-white-50 mb-4">
                      Empowering students through accessible and transparent scholarship services across the nation.
                    </p>
                  </div>

                  {/* Highlights List */}
                  <div className="my-4">
                    <div className="d-flex align-items-center mb-3 text-white">
                      <i className="bi bi-check-circle-fill text-warning me-3 fs-5"></i>
                      <span>Direct Benefit Transfer (DBT) Enabled</span>
                    </div>
                    <div className="d-flex align-items-center mb-3 text-white">
                      <i className="bi bi-shield-check text-warning me-3 fs-5"></i>
                      <span>Verified Academic Credentials</span>
                    </div>
                    <div className="d-flex align-items-center text-white">
                      <i className="bi bi-clock-history text-warning me-3 fs-5"></i>
                      <span>Real-time Application Status Tracking</span>
                    </div>
                  </div>

                  <div className="border-top border-white-50 pt-3">
                    <small className="text-white-50">
                      © 2026 National Scholarship Portal. All Rights Reserved.
                    </small>
                  </div>
                </div>

                {/* Right Section: Login Form */}
                <div className="col-12 col-lg-6 bg-white p-4 p-sm-5 d-flex flex-column justify-content-center">
                  
                  {/* Header Logo for Mobile */}
                  <div className="text-center d-lg-none mb-4">
                    <div className="bg-primary d-inline-flex rounded-circle p-3 text-white mb-2 shadow">
                      <i className="bi bi-mortarboard-fill fs-2"></i>
                    </div>
                    <h4 className="fw-bold text-primary mb-0">National Scholarship Portal</h4>
                    <small className="text-muted">Student Access System</small>
                  </div>

                  <div className="mb-4 text-start">
                    <h3 className="fw-bold text-dark mb-1">Student Login</h3>
                    <p className="text-muted small">
                      Login to access your scholarship portal and status
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-danger d-flex align-items-center mb-3 py-2" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{errorMessage}</div>
                    </div>
                  )}

                  <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                    
                    {/* Email Field */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold text-secondary small">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-envelope"></i>
                        </span>
                        <input
                          type="email"
                          className="form-control bg-light border-start-0"
                          id="email"
                          name="email"
                          placeholder="student@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter a valid email address.
                        </div>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold text-secondary small">
                        Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control bg-light border-start-0 border-end-0"
                          id="password"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary bg-light border-start-0 text-muted"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                        <div className="invalid-feedback">
                          Please enter your password.
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-semibold shadow-sm rounded-3 mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer Register Link */}
                  <div className="mt-4 pt-3 border-top text-center">
                    <p className="text-muted small mb-0">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary fw-bold text-decoration-none">
                        Create Student Account
                      </Link>
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
