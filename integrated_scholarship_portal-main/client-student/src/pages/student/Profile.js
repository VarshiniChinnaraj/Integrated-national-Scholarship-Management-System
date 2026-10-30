import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, BookOpen, DollarSign, CreditCard, Save, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    category: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    collegeName: '',
    course: '',
    academicDepartment: '',
    year: '',
    enrollmentNo: '',
    marksPercentage: '',
    cgpa: '',
    attendancePercentage: '',
    familyIncome: '',
    incomeCertNo: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  });

  useEffect(() => {
    if (user) {
      const prof = user.profile || {};
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: prof.dob || '2004-05-15',
        gender: prof.gender || 'Male',
        category: prof.category || 'General',
        address: prof.address || '',
        city: prof.city || 'New Delhi',
        state: prof.state || 'Delhi',
        pincode: prof.pincode || '110001',
        collegeName: user.institutionName || prof.collegeName || 'National Institute of Technology',
        course: prof.course || 'B.Tech Computer Science',
        academicDepartment: prof.academicDepartment || 'Computer Science',
        year: prof.year || '3rd Year',
        enrollmentNo: prof.enrollmentNo || 'NITD/2023/CSE/042',
        marksPercentage: prof.marksPercentage || '85',
        cgpa: prof.cgpa || '8.5',
        attendancePercentage: prof.attendancePercentage || '90',
        familyIncome: prof.familyIncome || '180000',
        incomeCertNo: prof.incomeCertNo || 'INC-2026-9281',
        bankName: prof.bankName || 'State Bank of India',
        accountNumber: prof.accountNumber || '38947291048',
        ifscCode: prof.ifscCode || 'SBIN0001234',
        branchName: prof.branchName || 'Main Campus'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        profile: {
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          collegeName: formData.collegeName,
          course: formData.course,
          academicDepartment: formData.academicDepartment,
          year: formData.year,
          enrollmentNo: formData.enrollmentNo,
          marksPercentage: Number(formData.marksPercentage),
          cgpa: Number(formData.cgpa),
          attendancePercentage: Number(formData.attendancePercentage),
          familyIncome: Number(formData.familyIncome),
          incomeCertNo: formData.incomeCertNo,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branchName: formData.branchName
        }
      };

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        setSuccessMsg('Profile updated successfully! Information will auto-populate into scholarship application wizard.');
        updateUserProfile(res.data.user);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="Student Profile Management"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'My Profile' }]}
    >
      <div className="row g-4">
        {/* Navigation Tabs Header */}
        <div className="col-12">
          <div className="custom-card p-2 bg-white">
            <ul className="nav nav-pills nav-fill flex-column flex-sm-row gap-2" role="tablist">
              <li className="nav-item">
                <button
                  className={`nav-link py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 w-100 ${
                    activeTab === 'personal' ? 'active shadow-sm' : 'text-dark'
                  }`}
                  onClick={() => setActiveTab('personal')}
                >
                  <User size={18} />
                  <span>1. Personal Details</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 w-100 ${
                    activeTab === 'academic' ? 'active shadow-sm' : 'text-dark'
                  }`}
                  onClick={() => setActiveTab('academic')}
                >
                  <BookOpen size={18} />
                  <span>2. Academic Details</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 w-100 ${
                    activeTab === 'financial' ? 'active shadow-sm' : 'text-dark'
                  }`}
                  onClick={() => setActiveTab('financial')}
                >
                  <DollarSign size={18} />
                  <span>3. Financial Details</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 w-100 ${
                    activeTab === 'bank' ? 'active shadow-sm' : 'text-dark'
                  }`}
                  onClick={() => setActiveTab('bank')}
                >
                  <CreditCard size={18} />
                  <span>4. Bank Details</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content Form */}
        <div className="col-12">
          <div className="custom-card p-3 p-sm-4 p-md-5">
            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2.5">
                <CheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="alert alert-danger mb-4 py-2.5">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* TAB 1: Personal Information */}
              {activeTab === 'personal' && (
                <div>
                  <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Personal Information</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Full Name (as per Govt ID)</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Email Address (Read-only)</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={formData.email}
                        disabled
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="form-control"
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Gender</label>
                      <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Social Category</label>
                      <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                        <option value="Minority">Minority</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6 col-md-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-6">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-6">
                      <label className="form-label small fw-semibold">State / UT</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-6">
                      <label className="form-label small fw-semibold">PIN Code</label>
                      <input
                        type="text"
                        name="pincode"
                        className="form-control"
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Permanent Residential Address</label>
                      <textarea
                        name="address"
                        className="form-control"
                        rows="2"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Academic Information */}
              {activeTab === 'academic' && (
                <div>
                  <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Academic & College Details</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Enrolled Institution</label>
                      <input
                        type="text"
                        name="collegeName"
                        className="form-control bg-light"
                        value={formData.collegeName}
                        disabled
                      />
                      <span className="text-muted small">Assigned by institution verification roster</span>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Course / Degree Program</label>
                      <input
                        type="text"
                        name="course"
                        className="form-control"
                        value={formData.course}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Academic Department</label>
                      <input
                        type="text"
                        name="academicDepartment"
                        className="form-control"
                        value={formData.academicDepartment}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Current Year / Semester</label>
                      <input
                        type="text"
                        name="year"
                        className="form-control"
                        value={formData.year}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">College Enrollment / Roll No</label>
                      <input
                        type="text"
                        name="enrollmentNo"
                        className="form-control"
                        value={formData.enrollmentNo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Previous Exam Percentage (%)</label>
                      <input
                        type="number"
                        name="marksPercentage"
                        className="form-control"
                        value={formData.marksPercentage}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Cumulative CGPA (out of 10.0)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="cgpa"
                        className="form-control"
                        value={formData.cgpa}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label small fw-semibold">Current Attendance Percentage (%)</label>
                      <input
                        type="number"
                        name="attendancePercentage"
                        className="form-control"
                        value={formData.attendancePercentage}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Financial Information */}
              {activeTab === 'financial' && (
                <div>
                  <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Financial & Income Details</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Total Family Annual Income (₹ INR)</label>
                      <input
                        type="number"
                        name="familyIncome"
                        className="form-control"
                        value={formData.familyIncome}
                        onChange={handleChange}
                        required
                      />
                      <span className="text-muted small">Must match income certificate issued by Competent Authority</span>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Income Certificate Number</label>
                      <input
                        type="text"
                        name="incomeCertNo"
                        className="form-control"
                        value={formData.incomeCertNo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Bank Details */}
              {activeTab === 'bank' && (
                <div>
                  <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Direct Benefit Transfer (DBT) Bank Account</h5>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        className="form-control"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Bank Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        className="form-control"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        className="form-control"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Branch Name</label>
                      <input
                        type="text"
                        name="branchName"
                        className="form-control"
                        value={formData.branchName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Action Controls */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-5 pt-3 border-top">
                <div className="text-muted small">
                  All details are authenticated by Institute & Department Verification Officers.
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-4 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold w-100 w-sm-auto"
                >
                  <Save size={18} />
                  <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Profile;
