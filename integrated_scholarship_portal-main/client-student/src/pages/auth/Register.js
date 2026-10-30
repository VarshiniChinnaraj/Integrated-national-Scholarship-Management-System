import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ShieldCheck, User, Mail, Lock, Phone, Building2, ArrowRight } from 'lucide-react';

const Register = () => {
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    institutionId: '',
    course: 'B.Tech in Computer Science',
    dob: '2004-05-15',
    gender: 'Male',
    category: 'General',
    familyIncome: '200000',
    bankName: 'State Bank of India',
    accountNumber: '',
    ifscCode: 'SBIN0001234'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await api.get('/auth/institutions');
        if (res.data.success) {
          setInstitutions(res.data.institutions);
          if (res.data.institutions.length > 0) {
            setFormData((prev) => ({ ...prev, institutionId: res.data.institutions[0]._id }));
          }
        }
      } catch (err) {
        // Default fallback
      }
    };
    fetchInstitutions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await registerStudent(formData);
    setLoading(false);

    if (res.success) {
      navigate('/student/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(160deg, #2C1F35 0%, #49354F 60%, #3A2940 100%)' }}>
      <div className="container py-4 py-md-5 my-auto px-3 px-sm-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="custom-card p-3 p-sm-4 p-md-5 bg-white rounded-4" style={{ boxShadow: '0 24px 60px rgba(42,25,50,0.35)', border: '1px solid rgba(168,139,181,0.15)' }}>
              <div className="text-center mb-4">
                <div className="d-inline-flex p-3 rounded-circle bg-primary text-white mb-2">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="fw-bold text-dark mb-1 fs-5 fs-sm-4">Student Portal Registration</h4>
                <p className="text-muted small">Create your national scholarship account to apply and track grants</p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Full Name (as per Aadhaar)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><User size={16} /></span>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Mail size={16} /></span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="e.g. student@college.edu"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Phone size={16} /></span>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Enrolled Institution / College</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Building2 size={16} /></span>
                      <select
                        name="institutionId"
                        className="form-select"
                        value={formData.institutionId}
                        onChange={handleChange}
                      >
                        {institutions.length > 0 ? (
                          institutions.map((inst) => (
                            <option key={inst._id} value={inst._id}>
                              {inst.name} ({inst.code})
                            </option>
                          ))
                        ) : (
                          <option value="">National Institute of Technology (NIT Delhi)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Current Course / Degree</label>
                    <input
                      type="text"
                      name="course"
                      className="form-control"
                      placeholder="e.g. B.Tech Computer Science"
                      value={formData.course}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Gender</label>
                    <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Category</label>
                    <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Lock size={16} /></span>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Confirm Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><Lock size={16} /></span>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 py-2.5 mt-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Complete Student Registration'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="mt-4 text-center border-top pt-3">
                <span className="text-muted small">Already registered? </span>
                <Link to="/student/login" className="small text-primary fw-bold text-decoration-none">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="p-3 text-center text-secondary small border-top border-secondary-subtle">
        National Scholarship Portal &bull; Student Services Division &bull; Ministry of Electronics and IT
      </footer>
    </div>
  );
};

export default Register;
