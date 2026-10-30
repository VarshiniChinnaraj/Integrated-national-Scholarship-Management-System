import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Swal from 'sweetalert2';

const Register = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // Personal Details
    photo: '',
    fullName: '',
    fatherName: '',
    motherName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    nationality: 'Indian',
    religion: '',
    community: '',
    category: '',

    // College Details
    collegeName: '',
    department: '',
    degree: '',
    university: '',
    enrollmentNumber: '',
    registerNumber: '',
    admissionYear: new Date().getFullYear(),
    graduationYear: new Date().getFullYear() + 4,
    semester: '1',
    currentYear: '1',
    studentType: 'Regular',

    // SSLC Academic Details
    sslcSchoolName: '',
    sslcBoard: '',
    sslcRegisterNumber: '',
    sslcYearOfPassing: '',
    sslcPercentage: '',
    sslcMedium: 'English',

    // HSC Academic Details
    hscSchoolName: '',
    hscBoard: '',
    hscRegisterNumber: '',
    hscYearOfPassing: '',
    hscPercentage: '',
    hscGroup: '',
    hscMedium: 'English',

    // UG Academic Details
    ugCgpa: '',
    ugCurrentBacklogs: '0',
    ugHistoryOfBacklogs: '0',

    // Address Details
    permanentAddress: '',
    temporaryAddress: '',
    village: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pinCode: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (e.g. JPG, PNG, WEBP).',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: 'Please select an image smaller than 3MB.',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData((prev) => ({
          ...prev,
          photo: uploadEvent.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validatePasswordStrength = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    return minLength && hasUpper && hasLower && hasNum;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Check basic HTML5 validity
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all mandatory fields correctly.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    // Password Complexity Validation
    if (!validatePasswordStrength(formData.password)) {
      setPasswordError('Password must be at least 8 characters with 1 uppercase, 1 lowercase letter, and 1 number.');
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    // Confirm Password Matching Validation
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Password and Confirm Password do not match.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    setValidated(true);
    setLoading(true);

    // Structure request payload to match MongoDB Mongoose Schema
    const payload = {
      photo: formData.photo,
      fullName: formData.fullName,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      email: formData.email,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      gender: formData.gender,
      dob: formData.dob,
      bloodGroup: formData.bloodGroup,
      nationality: formData.nationality,
      religion: formData.religion,
      community: formData.community,
      category: formData.category,

      college: {
        collegeName: formData.collegeName,
        department: formData.department,
        degree: formData.degree,
        university: formData.university,
        enrollmentNumber: formData.enrollmentNumber,
        registerNumber: formData.registerNumber,
        admissionYear: Number(formData.admissionYear),
        graduationYear: Number(formData.graduationYear),
        semester: Number(formData.semester),
        currentYear: Number(formData.currentYear),
        studentType: formData.studentType
      },

      academic: {
        sslc: {
          schoolName: formData.sslcSchoolName,
          board: formData.sslcBoard,
          registerNumber: formData.sslcRegisterNumber,
          yearOfPassing: Number(formData.sslcYearOfPassing),
          percentage: Number(formData.sslcPercentage),
          medium: formData.sslcMedium
        },
        hsc: {
          schoolName: formData.hscSchoolName,
          board: formData.hscBoard,
          registerNumber: formData.hscRegisterNumber,
          yearOfPassing: Number(formData.hscYearOfPassing),
          percentage: Number(formData.hscPercentage),
          group: formData.hscGroup,
          medium: formData.hscMedium
        },
        ug: {
          cgpa: Number(formData.ugCgpa),
          currentBacklogs: Number(formData.ugCurrentBacklogs || 0),
          historyOfBacklogs: Number(formData.ugHistoryOfBacklogs || 0)
        }
      },

      address: {
        permanentAddress: formData.permanentAddress,
        temporaryAddress: formData.temporaryAddress,
        village: formData.village,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        pinCode: formData.pinCode
      }
    };

    try {
      const response = await API.post('/auth/register', payload);

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          html: 'Your student account has been created successfully.<br/><br/>Please login using your registered email and password.',
          confirmButtonColor: '#0d6efd',
          confirmButtonText: 'Proceed to Login'
        }).then(() => {
          navigate('/login');
        });
      }
    } catch (error) {
      console.error('Registration API error:', error);
      const msg = error.response?.data?.message || 'Server error occurred during registration. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: msg,
        confirmButtonColor: '#0d6efd'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">

        {/* Top Header Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
            <div className="mb-3 mb-md-0">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-plus-fill fs-2 me-3 text-warning"></i>
                <h2 className="fw-bold mb-0">Student Account Registration</h2>
              </div>
              <p className="mb-0 text-white-50">
                National Scholarship Application Verification & Disbursement Tracking System
              </p>
            </div>
            <div>
              <Link to="/login" className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                <i className="bi bi-arrow-left me-2"></i>Back to Login
              </Link>
            </div>
          </div>
        </div>

        <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>

          {/* SECTION 1: Personal Details */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-primary mb-0 d-flex align-items-center">
                <span className="badge bg-primary rounded-circle me-2">1</span>
                Personal Details
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">

                {/* Choose Photo */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Choose Photo</label>
                  <div className="d-flex align-items-center gap-2">
                    {formData.photo ? (
                      <div className="d-flex align-items-center justify-content-between border rounded p-2 bg-light w-100">
                        <div className="d-flex align-items-center me-2 overflow-hidden">
                          <img
                            src={formData.photo}
                            alt="Student Preview"
                            className="rounded-circle border me-2 flex-shrink-0"
                            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                          />
                          <span className="small text-success fw-semibold text-truncate">
                            <i className="bi bi-check-circle-fill me-1"></i>Photo Selected
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm rounded-pill px-2 py-0"
                          onClick={handleRemovePhoto}
                          title="Change Photo"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="form-control"
                        name="photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    )}
                  </div>
                  <div className="form-text">Choose student profile photo (JPEG, PNG)</div>
                </div>

                {/* Full Name */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Full Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    placeholder="Enter student full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Full Name is required.</div>
                </div>

                {/* Father Name */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Father Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="fatherName"
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Father Name is required.</div>
                </div>

                {/* Mother Name */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Mother Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="motherName"
                    placeholder="Enter mother's name"
                    value={formData.motherName}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Mother Name is required.</div>
                </div>

                {/* Email */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Valid Email is required.</div>
                </div>

                {/* Phone Number */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    placeholder="10-digit Mobile Number"
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Please enter a valid 10-digit mobile number.</div>
                </div>

                {/* Alternate Phone Number */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Alternate Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="alternatePhone"
                    placeholder="Optional 10-digit number"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      name="password"
                      placeholder="Min 8 chars (1 Upper, 1 Lower, 1 Num)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {passwordError && <div className="text-danger small mt-1">{passwordError}</div>}
                </div>

                {/* Confirm Password */}
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Confirm Password <span className="text-danger">*</span></label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Please confirm your password.</div>
                </div>

                {/* Gender */}
                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label fw-semibold text-secondary">Gender <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                  <div className="invalid-feedback">Gender is required.</div>
                </div>

                {/* Date of Birth */}
                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label fw-semibold text-secondary">Date of Birth <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Date of Birth is required.</div>
                </div>

                {/* Blood Group */}
                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label fw-semibold text-secondary">Blood Group</label>
                  <select
                    className="form-select"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Nationality */}
                <div className="col-12 col-md-6 col-lg-3">
                  <label className="form-label fw-semibold text-secondary">Nationality</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                </div>

                {/* Religion */}
                <div className="col-12 col-md-4 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Religion</label>
                  <input
                    type="text"
                    className="form-control"
                    name="religion"
                    placeholder="e.g. Hindu, Muslim, Christian, Sikh"
                    value={formData.religion}
                    onChange={handleChange}
                  />
                </div>

                {/* Community */}
                <div className="col-12 col-md-4 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Community</label>
                  <input
                    type="text"
                    className="form-control"
                    name="community"
                    placeholder="Community Name"
                    value={formData.community}
                    onChange={handleChange}
                  />
                </div>

                {/* Category */}
                <div className="col-12 col-md-4 col-lg-4">
                  <label className="form-label fw-semibold text-secondary">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* SECTION 2: College Details */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-primary mb-0 d-flex align-items-center">
                <span className="badge bg-primary rounded-circle me-2">2</span>
                College Details
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">

                {/* College Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">College Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="collegeName"
                    placeholder="Full College / Institution Name"
                    value={formData.collegeName}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">College Name is required.</div>
                </div>

                {/* University */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">University <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="university"
                    placeholder="Affiliated University Name"
                    value={formData.university}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">University is required.</div>
                </div>

                {/* Department */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">Department <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    placeholder="e.g. Computer Science, Mechanical"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Department is required.</div>
                </div>

                {/* Degree */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">Degree <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="degree"
                    placeholder="e.g. B.Tech, B.E., B.Sc, M.Tech"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Degree is required.</div>
                </div>

                {/* Student Type */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">Student Type <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="studentType"
                    value={formData.studentType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Regular">Regular</option>
                    <option value="Lateral Entry">Lateral Entry</option>
                  </select>
                </div>

                {/* Enrollment Number */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">Enrollment Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="enrollmentNumber"
                    placeholder="College Enrollment No."
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Enrollment Number is required.</div>
                </div>

                {/* Register Number */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">Register Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="registerNumber"
                    placeholder="University Register No."
                    value={formData.registerNumber}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">Register Number is required.</div>
                </div>

                {/* Admission Year */}
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold text-secondary">Admission Year <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    name="admissionYear"
                    placeholder="2023"
                    value={formData.admissionYear}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Expected Graduation Year */}
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold text-secondary">Graduation Year <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    name="graduationYear"
                    placeholder="2027"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Current Semester */}
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold text-secondary">Current Semester <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-control"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Current Year */}
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold text-secondary">Current Year <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control"
                    name="currentYear"
                    value={formData.currentYear}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>
            </div>
          </div>

          {/* SECTION 3: Academic Details */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-primary mb-0 d-flex align-items-center">
                <span className="badge bg-primary rounded-circle me-2">3</span>
                Academic Details
              </h5>
            </div>
            <div className="card-body p-4">

              {/* Sub-section: SSLC */}
              <div className="p-3 bg-light rounded-3 mb-4 border">
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-journal-bookmark me-2 text-primary"></i>
                  SSLC / 10th Standard Details
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-8 col-lg-8">
                    <label className="form-label small fw-semibold text-secondary">School Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="sslcSchoolName"
                      placeholder="SSLC School Name"
                      value={formData.sslcSchoolName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4 col-lg-4">
                    <label className="form-label small fw-semibold text-secondary">Board <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="sslcBoard"
                      placeholder="State Board / CBSE / ICSE"
                      value={formData.sslcBoard}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Register No. <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="sslcRegisterNumber"
                      placeholder="SSLC Reg No."
                      value={formData.sslcRegisterNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-3 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Year of Passing <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="sslcYearOfPassing"
                      placeholder="2020"
                      value={formData.sslcYearOfPassing}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-3 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Percentage (%) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="sslcPercentage"
                      placeholder="90.5"
                      value={formData.sslcPercentage}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Medium <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="sslcMedium"
                      placeholder="English"
                      value={formData.sslcMedium}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sub-section: HSC / 12th */}
              <div className="p-3 bg-light rounded-3 mb-4 border">
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-journal-check me-2 text-primary"></i>
                  HSC / 12th Standard Details
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-8 col-lg-8">
                    <label className="form-label small fw-semibold text-secondary">School Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="hscSchoolName"
                      placeholder="HSC School Name"
                      value={formData.hscSchoolName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4 col-lg-4">
                    <label className="form-label small fw-semibold text-secondary">Board <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="hscBoard"
                      placeholder="State Board / CBSE"
                      value={formData.hscBoard}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Register No. <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="hscRegisterNumber"
                      placeholder="HSC Reg No."
                      value={formData.hscRegisterNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-semibold text-secondary">Group / Stream <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="hscGroup"
                      placeholder="Bio-Maths / CS"
                      value={formData.hscGroup}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-4 col-lg-2">
                    <label className="form-label small fw-semibold text-secondary">Year of Passing <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      name="hscYearOfPassing"
                      placeholder="2022"
                      value={formData.hscYearOfPassing}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6 col-md-4 col-lg-2">
                    <label className="form-label small fw-semibold text-secondary">Percentage (%) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="hscPercentage"
                      placeholder="92.0"
                      value={formData.hscPercentage}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4 col-lg-2">
                    <label className="form-label small fw-semibold text-secondary">Medium <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="hscMedium"
                      placeholder="English"
                      value={formData.hscMedium}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sub-section: UG Performance */}
              <div className="p-3 bg-light rounded-3 border">
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-award me-2 text-primary"></i>
                  Current Higher Education Performance (UG)
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Current CGPA <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="form-control"
                      name="ugCgpa"
                      placeholder="e.g. 8.75"
                      value={formData.ugCgpa}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Current Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="ugCurrentBacklogs"
                      value={formData.ugCurrentBacklogs}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">History of Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="ugHistoryOfBacklogs"
                      value={formData.ugHistoryOfBacklogs}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 4: Address Details */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-primary mb-0 d-flex align-items-center">
                <span className="badge bg-primary rounded-circle me-2">4</span>
                Address Details
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">

                {/* Permanent Address */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">Permanent Address <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="permanentAddress"
                    placeholder="House No., Street Name, Area"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    required
                  ></textarea>
                  <div className="invalid-feedback">Permanent Address is required.</div>
                </div>

                {/* Temporary Address */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold text-secondary">Temporary / Hostel Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="temporaryAddress"
                    placeholder="Same as permanent or hostel address"
                    value={formData.temporaryAddress}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {/* Village */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">Village / Town</label>
                  <input
                    type="text"
                    className="form-control"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                  />
                </div>

                {/* City */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">City <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">City is required.</div>
                </div>

                {/* District */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">District <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="district"
                    placeholder="District"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">District is required.</div>
                </div>

                {/* State */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">State <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">State is required.</div>
                </div>

                {/* Country */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>

                {/* PIN Code */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold text-secondary">PIN Code <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="pinCode"
                    placeholder="600001"
                    pattern="[0-9]{6}"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                  />
                  <div className="invalid-feedback">6-digit PIN code required.</div>
                </div>

              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-4 text-end bg-white">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
              <span className="text-muted small text-start">
                <i className="bi bi-shield-check text-success me-1"></i>
                All submitted data is encrypted and securely stored in National Database.
              </span>
              <button
                type="submit"
                className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm flex-shrink-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting Student Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Register Student Account
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
