import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';
import Swal from 'sweetalert2';

const Profile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const fetchProfile = () => {
    setLoading(true);
    API.get('/auth/me')
      .then((res) => {
        if (res.data.success && res.data.student) {
          setStudent(res.data.student);
          setEditFormData(JSON.parse(JSON.stringify(res.data.student)));
          localStorage.setItem('student', JSON.stringify(res.data.student));
        }
      })
      .catch((err) => {
        console.error('Error fetching student profile:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const cachedStudent = localStorage.getItem('student')
      ? JSON.parse(localStorage.getItem('student'))
      : null;

    if (cachedStudent) {
      setStudent(cachedStudent);
      setEditFormData(JSON.parse(JSON.stringify(cachedStudent)));
    }

    fetchProfile();
  }, []);

  const handleEditChange = (section, field, value) => {
    if (!editFormData) return;
    if (section) {
      setEditFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [field]: value
        }
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedAcademicChange = (subSection, field, value) => {
    if (!editFormData) return;
    setEditFormData((prev) => ({
      ...prev,
      academic: {
        ...(prev.academic || {}),
        [subSection]: {
          ...(prev.academic?.[subSection] || {}),
          [field]: value
        }
      }
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await API.put('/auth/profile', editFormData);
      if (res.data.success && res.data.student) {
        setStudent(res.data.student);
        setEditFormData(JSON.parse(JSON.stringify(res.data.student)));
        localStorage.setItem('student', JSON.stringify(res.data.student));
        setIsEditing(false);

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated Successfully!',
          text: 'Your student profile and academic records have been saved.',
          timer: 1800,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Failed to update profile. Please try again.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (student) {
      setEditFormData(JSON.parse(JSON.stringify(student)));
    }
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">
              <i className="bi bi-person-badge-fill text-primary me-2"></i>
              Student Profile & Academic Record
            </h3>
            <p className="text-muted small mb-0">
              {isEditing ? 'Editing your personal credentials and academic marks' : 'Complete student credentials and verified records stored in National Database'}
            </p>
          </div>
          <div className="d-flex gap-2">
            {!isEditing ? (
              <button
                type="button"
                className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm"
                onClick={() => setIsEditing(true)}
              >
                <i className="bi bi-pencil-square me-2"></i> Edit Profile Details
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-4 fw-semibold"
                onClick={handleCancelEdit}
              >
                <i className="bi bi-x-circle me-1"></i> Cancel Edit
              </button>
            )}
            <Link to="/dashboard" className="btn btn-outline-primary rounded-pill px-3 fw-semibold">
              <i className="bi bi-house-door-fill me-1"></i> Dashboard
            </Link>
          </div>
        </div>

        {/* Profile Card Banner */}
        <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
            <div className="d-flex align-items-center">
              {student && student.photo ? (
                <img
                  src={student.photo}
                  alt={student.fullName}
                  className="rounded-circle border border-3 border-white shadow-sm me-3 flex-shrink-0"
                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="bg-white text-primary rounded-circle me-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                  style={{ width: '80px', height: '80px' }}
                >
                  <i className="bi bi-person-fill fs-1"></i>
                </div>
              )}
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h2 className="fw-bold mb-0 me-2">{student ? student.fullName : 'Student'}</h2>
                  <span className="badge bg-success rounded-pill px-3 py-1 fs-6">
                    <i className="bi bi-patch-check-fill me-1"></i> Verified Profile
                  </span>
                </div>
                <p className="mb-1 text-white-50 small">
                  {student?.college?.collegeName || 'National Scholarship System'}
                  {student?.college?.department ? ` • ${student.college.department}` : ''}
                </p>
                <div className="d-flex flex-wrap gap-3 small text-white-50">
                  <span><i className="bi bi-envelope me-1"></i>{student?.email || 'N/A'}</span>
                  <span><i className="bi bi-telephone me-1"></i>{student?.phone || 'N/A'}</span>
                  {student?.college?.registerNumber && (
                    <span><i className="bi bi-card-text me-1"></i>Reg: {student.college.registerNumber}</span>
                  )}
                  <span><i className="bi bi-award me-1"></i>UG CGPA: <strong className="text-warning">{student?.academic?.ug?.cgpa || 'N/A'}</strong></span>
                </div>
              </div>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-light btn-sm rounded-pill px-3 fw-semibold shadow-sm text-primary"
                onClick={fetchProfile}
                disabled={loading}
              >
                <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Registered Profile Details (View & Edit Modes) */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-2 p-sm-3">
            <ul className="nav nav-pills gap-1 gap-sm-2 flex-nowrap overflow-x-auto pb-1 pb-sm-0 text-nowrap" style={{ scrollbarWidth: 'none' }}>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold rounded-pill py-2 px-3 small ${activeTab === 'personal' ? 'active bg-primary text-white' : 'text-secondary bg-light'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <i className="bi bi-person-lines-fill me-1 me-sm-2"></i>Personal Details
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold rounded-pill py-2 px-3 small ${activeTab === 'college' ? 'active bg-primary text-white' : 'text-secondary bg-light'}`}
                  onClick={() => setActiveTab('college')}
                >
                  <i className="bi bi-building me-1 me-sm-2"></i>College Details
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold rounded-pill py-2 px-3 small ${activeTab === 'academic' ? 'active bg-primary text-white' : 'text-secondary bg-light'}`}
                  onClick={() => setActiveTab('academic')}
                >
                  <i className="bi bi-journal-text me-1 me-sm-2"></i>Academic Marks
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold rounded-pill py-2 px-3 small ${activeTab === 'address' ? 'active bg-primary text-white' : 'text-secondary bg-light'}`}
                  onClick={() => setActiveTab('address')}
                >
                  <i className="bi bi-geo-alt-fill me-1 me-sm-2"></i>Address Details
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            
            {/* VIEW MODE */}
            {!isEditing && (
              <>
                {/* TAB 1: Personal Details */}
                {activeTab === 'personal' && (
                  <div className="row g-4">
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Full Name</span>
                        <span className="fs-6 fw-bold text-dark">{student?.fullName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Father's Name</span>
                        <span className="fs-6 fw-bold text-dark">{student?.fatherName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Mother's Name</span>
                        <span className="fs-6 fw-bold text-dark">{student?.motherName || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Email Address</span>
                        <span className="fs-6 fw-bold text-dark">{student?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Phone Number</span>
                        <span className="fs-6 fw-bold text-dark">{student?.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Alternate Phone</span>
                        <span className="fs-6 fw-bold text-dark">{student?.alternatePhone || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Gender</span>
                        <span className="fs-6 fw-bold text-dark">{student?.gender || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Date of Birth</span>
                        <span className="fs-6 fw-bold text-dark">{formatDate(student?.dob)}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Blood Group</span>
                        <span className="fs-6 fw-bold text-dark">{student?.bloodGroup || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Nationality</span>
                        <span className="fs-6 fw-bold text-dark">{student?.nationality || 'Indian'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Religion</span>
                        <span className="fs-6 fw-bold text-dark">{student?.religion || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Community</span>
                        <span className="fs-6 fw-bold text-dark">{student?.community || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Category Quota</span>
                        <span className="badge bg-primary-subtle text-primary fs-6">{student?.category || 'General'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: College Details */}
                {activeTab === 'college' && (
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">College Name</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.collegeName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Affiliated University</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.university || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Department</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.department || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Degree</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.degree || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Student Type</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.studentType || 'Regular'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Enrollment Number</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.enrollmentNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Register Number</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.registerNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Admission Year</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.admissionYear || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Graduation Year</span>
                        <span className="fs-6 fw-bold text-dark">{student?.college?.graduationYear || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Current Year</span>
                        <span className="fs-6 fw-bold text-dark">Year {student?.college?.currentYear || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Current Semester</span>
                        <span className="fs-6 fw-bold text-dark">Semester {student?.college?.semester || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Academic Details */}
                {activeTab === 'academic' && (
                  <div className="d-flex flex-column gap-4">
                    {/* SSLC */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-journal-bookmark me-2"></i>SSLC / 10th Standard Details
                      </h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-8">
                          <span className="text-secondary small fw-bold d-block">School Name</span>
                          <span className="fw-semibold">{student?.academic?.sslc?.schoolName || 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-4">
                          <span className="text-secondary small fw-bold d-block">Board</span>
                          <span className="fw-semibold">{student?.academic?.sslc?.board || 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Register No.</span>
                          <span className="fw-semibold">{student?.academic?.sslc?.registerNumber || 'N/A'}</span>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Year of Passing</span>
                          <span className="fw-semibold">{student?.academic?.sslc?.yearOfPassing || 'N/A'}</span>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Percentage (%)</span>
                          <span className="fw-semibold text-success">{student?.academic?.sslc?.percentage ? `${student.academic.sslc.percentage}%` : 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Medium</span>
                          <span className="fw-semibold">{student?.academic?.sslc?.medium || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* HSC */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-journal-check me-2"></i>HSC / 12th Standard Details
                      </h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-8">
                          <span className="text-secondary small fw-bold d-block">School Name</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.schoolName || 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-4">
                          <span className="text-secondary small fw-bold d-block">Board</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.board || 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Register No.</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.registerNumber || 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-3">
                          <span className="text-secondary small fw-bold d-block">Group / Stream</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.group || 'N/A'}</span>
                        </div>
                        <div className="col-6 col-md-2">
                          <span className="text-secondary small fw-bold d-block">Year</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.yearOfPassing || 'N/A'}</span>
                        </div>
                        <div className="col-6 col-md-2">
                          <span className="text-secondary small fw-bold d-block">Percentage (%)</span>
                          <span className="fw-semibold text-success">{student?.academic?.hsc?.percentage ? `${student.academic.hsc.percentage}%` : 'N/A'}</span>
                        </div>
                        <div className="col-12 col-md-2">
                          <span className="text-secondary small fw-bold d-block">Medium</span>
                          <span className="fw-semibold">{student?.academic?.hsc?.medium || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* UG Performance */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="bi bi-award me-2"></i>Higher Education Performance (UG)
                      </h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <span className="text-secondary small fw-bold d-block">Cumulative CGPA</span>
                          <span className="fs-5 fw-bold text-primary">{student?.academic?.ug?.cgpa ?? 'N/A'} / 10.0</span>
                        </div>
                        <div className="col-12 col-md-4">
                          <span className="text-secondary small fw-bold d-block">Active Backlogs</span>
                          <span className="fw-semibold">{student?.academic?.ug?.currentBacklogs ?? 0}</span>
                        </div>
                        <div className="col-12 col-md-4">
                          <span className="text-secondary small fw-bold d-block">History of Backlogs</span>
                          <span className="fw-semibold">{student?.academic?.ug?.historyOfBacklogs ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Address Details */}
                {activeTab === 'address' && (
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Permanent Address</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.permanentAddress || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Temporary / Hostel Address</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.temporaryAddress || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Village / Town</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.village || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">City</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.city || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">District</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.district || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">State</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.state || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">Country</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.country || 'India'}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-secondary small fw-bold text-uppercase d-block mb-1">PIN Code</span>
                        <span className="fs-6 fw-bold text-dark">{student?.address?.pinCode || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* EDIT MODE FORM */}
            {isEditing && (
              <form onSubmit={handleSaveProfile}>
                
                {/* TAB 1: Edit Personal Details */}
                {activeTab === 'personal' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Full Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.fullName || ''}
                        onChange={(e) => handleEditChange(null, 'fullName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Father's Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.fatherName || ''}
                        onChange={(e) => handleEditChange(null, 'fatherName', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Mother's Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.motherName || ''}
                        onChange={(e) => handleEditChange(null, 'motherName', e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Phone Number <span className="text-danger">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editFormData?.phone || ''}
                        onChange={(e) => handleEditChange(null, 'phone', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Alternate Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editFormData?.alternatePhone || ''}
                        onChange={(e) => handleEditChange(null, 'alternatePhone', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <label className="form-label small fw-semibold text-secondary">Gender</label>
                      <select
                        className="form-select"
                        value={editFormData?.gender || 'Male'}
                        onChange={(e) => handleEditChange(null, 'gender', e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-secondary">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editFormData?.dob ? editFormData.dob.substring(0, 10) : ''}
                        onChange={(e) => handleEditChange(null, 'dob', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-secondary">Blood Group</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. O+"
                        value={editFormData?.bloodGroup || ''}
                        onChange={(e) => handleEditChange(null, 'bloodGroup', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-secondary">Religion</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.religion || ''}
                        onChange={(e) => handleEditChange(null, 'religion', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <label className="form-label small fw-semibold text-secondary">Category Quota</label>
                      <select
                        className="form-select"
                        value={editFormData?.category || 'General'}
                        onChange={(e) => handleEditChange(null, 'category', e.target.value)}
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: Edit College Details */}
                {activeTab === 'college' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">College / Institution Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.collegeName || ''}
                        onChange={(e) => handleEditChange('college', 'collegeName', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Affiliated University</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.university || ''}
                        onChange={(e) => handleEditChange('college', 'university', e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Department / Branch</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.department || ''}
                        onChange={(e) => handleEditChange('college', 'department', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Degree</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.degree || ''}
                        onChange={(e) => handleEditChange('college', 'degree', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Student Type</label>
                      <select
                        className="form-select"
                        value={editFormData?.college?.studentType || 'Regular'}
                        onChange={(e) => handleEditChange('college', 'studentType', e.target.value)}
                      >
                        <option value="Regular">Regular</option>
                        <option value="Lateral Entry">Lateral Entry</option>
                        <option value="Distance">Distance</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Register Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.registerNumber || ''}
                        onChange={(e) => handleEditChange('college', 'registerNumber', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Enrollment Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.enrollmentNumber || ''}
                        onChange={(e) => handleEditChange('college', 'enrollmentNumber', e.target.value)}
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Admission Year</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.admissionYear || ''}
                        onChange={(e) => handleEditChange('college', 'admissionYear', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Graduation Year</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.graduationYear || ''}
                        onChange={(e) => handleEditChange('college', 'graduationYear', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Current Year</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.currentYear || ''}
                        onChange={(e) => handleEditChange('college', 'currentYear', e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Current Semester</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.college?.semester || ''}
                        onChange={(e) => handleEditChange('college', 'semester', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: Edit Academic Details */}
                {activeTab === 'academic' && (
                  <div className="d-flex flex-column gap-4">
                    {/* SSLC 10th */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">10th Standard (SSLC)</h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-secondary">School Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData?.academic?.sslc?.schoolName || ''}
                            onChange={(e) => handleNestedAcademicChange('sslc', 'schoolName', e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-semibold text-secondary">Board</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData?.academic?.sslc?.board || ''}
                            onChange={(e) => handleNestedAcademicChange('sslc', 'board', e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-semibold text-secondary">SSLC Percentage (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={editFormData?.academic?.sslc?.percentage || ''}
                            onChange={(e) => handleNestedAcademicChange('sslc', 'percentage', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* HSC 12th */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">12th Standard (HSC)</h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-semibold text-secondary">School Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData?.academic?.hsc?.schoolName || ''}
                            onChange={(e) => handleNestedAcademicChange('hsc', 'schoolName', e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-semibold text-secondary">Board</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData?.academic?.hsc?.board || ''}
                            onChange={(e) => handleNestedAcademicChange('hsc', 'board', e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small fw-semibold text-secondary">12th Percentage (%) <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control fw-bold"
                            value={editFormData?.academic?.hsc?.percentage || ''}
                            onChange={(e) => handleNestedAcademicChange('hsc', 'percentage', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* UG Performance */}
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-primary mb-3">Higher Education (UG) Performance</h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <label className="form-label small fw-semibold text-secondary">Cumulative CGPA (out of 10.0) <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-lg fw-bold text-primary"
                            value={editFormData?.academic?.ug?.cgpa || ''}
                            onChange={(e) => handleNestedAcademicChange('ug', 'cgpa', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label small fw-semibold text-secondary">Current Active Backlogs</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editFormData?.academic?.ug?.currentBacklogs || 0}
                            onChange={(e) => handleNestedAcademicChange('ug', 'currentBacklogs', e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label small fw-semibold text-secondary">History of Backlogs</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editFormData?.academic?.ug?.historyOfBacklogs || 0}
                            onChange={(e) => handleNestedAcademicChange('ug', 'historyOfBacklogs', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Edit Address Details */}
                {activeTab === 'address' && (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Permanent Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={editFormData?.address?.permanentAddress || ''}
                        onChange={(e) => handleEditChange('address', 'permanentAddress', e.target.value)}
                      ></textarea>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Temporary Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={editFormData?.address?.temporaryAddress || ''}
                        onChange={(e) => handleEditChange('address', 'temporaryAddress', e.target.value)}
                      ></textarea>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">City / Town</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.address?.city || ''}
                        onChange={(e) => handleEditChange('address', 'city', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">District</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.address?.district || ''}
                        onChange={(e) => handleEditChange('address', 'district', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.address?.state || ''}
                        onChange={(e) => handleEditChange('address', 'state', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">PIN Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData?.address?.pinCode || ''}
                        onChange={(e) => handleEditChange('address', 'pinCode', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Save Changes Floating Action Bar */}
                <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success rounded-pill px-5 fw-bold shadow"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i> Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
