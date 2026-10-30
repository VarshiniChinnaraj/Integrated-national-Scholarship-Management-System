import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import API from '../services/api';
import Swal from 'sweetalert2';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get('/admin/students');
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.college?.collegeName || '').toLowerCase().includes(q) ||
      (s.college?.registerNumber || '').toLowerCase().includes(q) ||
      (s.college?.department || '').toLowerCase().includes(q);

    if (categoryFilter === 'ALL') return matchesSearch;
    return matchesSearch && (s.category || '').toUpperCase() === categoryFilter.toUpperCase();
  });

  const viewStudentDetails = (student) => {
    Swal.fire({
      title: student.fullName,
      html: `
        <div class="text-start small p-2">
          <div class="text-center mb-3">
            ${student.photo
              ? `<img src="${student.photo}" alt="Photo" class="rounded-circle border shadow" style="width:85px;height:85px;object-fit:cover;"/>`
              : `<div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width:85px;height:85px;"><i class="bi bi-person-fill fs-1"></i></div>`
            }
            <h5 class="fw-bold mt-2 mb-0">${student.fullName}</h5>
            <span class="badge bg-primary-subtle text-primary mt-1">${student.category || 'General'} Quota</span>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-person-vcard me-2"></i>Personal Particulars</h6>
            <div class="row g-1">
              <div class="col-6"><strong>Email:</strong> ${student.email}</div>
              <div class="col-6"><strong>Phone:</strong> ${student.phone}</div>
              <div class="col-6"><strong>Alt Phone:</strong> ${student.alternatePhone || 'N/A'}</div>
              <div class="col-6"><strong>Gender:</strong> ${student.gender || 'N/A'}</div>
              <div class="col-6"><strong>DOB:</strong> ${student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
              <div class="col-6"><strong>Blood Group:</strong> ${student.bloodGroup || 'N/A'}</div>
              <div class="col-6"><strong>Father's Name:</strong> ${student.fatherName || 'N/A'}</div>
              <div class="col-6"><strong>Mother's Name:</strong> ${student.motherName || 'N/A'}</div>
              <div class="col-6"><strong>Nationality:</strong> ${student.nationality || 'Indian'}</div>
              <div class="col-6"><strong>Religion / Community:</strong> ${student.religion || 'N/A'} / ${student.community || 'N/A'}</div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-building me-2"></i>College Enrollment Information</h6>
            <div class="row g-1">
              <div class="col-12"><strong>Institution:</strong> ${student.college?.collegeName || 'N/A'}</div>
              <div class="col-6"><strong>Department / Branch:</strong> ${student.college?.department || 'N/A'}</div>
              <div class="col-6"><strong>Degree:</strong> ${student.college?.degree || 'N/A'}</div>
              <div class="col-6"><strong>Affiliated University:</strong> ${student.college?.university || 'N/A'}</div>
              <div class="col-6"><strong>Register Number:</strong> ${student.college?.registerNumber || 'N/A'}</div>
              <div class="col-6"><strong>Enrollment Number:</strong> ${student.college?.enrollmentNumber || 'N/A'}</div>
              <div class="col-6"><strong>Year & Semester:</strong> Year ${student.college?.currentYear || 'N/A'} / Sem ${student.college?.semester || 'N/A'}</div>
              <div class="col-6"><strong>Admission / Grad Year:</strong> ${student.college?.admissionYear || 'N/A'} - ${student.college?.graduationYear || 'N/A'}</div>
              <div class="col-6"><strong>Enrollment Type:</strong> ${student.college?.studentType || 'Regular'}</div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-mortarboard me-2"></i>Academic Record & CGPA</h6>
            <div class="row g-1">
              <div class="col-6"><strong>10th (SSLC) Percentage:</strong> <span class="fw-bold">${student.academic?.sslc?.percentage || 'N/A'}%</span> (${student.academic?.sslc?.board || 'Board'})</div>
              <div class="col-6"><strong>12th (HSC) Percentage:</strong> <span class="fw-bold">${student.academic?.hsc?.percentage || 'N/A'}%</span> (${student.academic?.hsc?.group || 'General'})</div>
              <div class="col-6"><strong>UG Cumulative CGPA:</strong> <span class="fw-bold text-success fs-6">${student.academic?.ug?.cgpa || 'N/A'} / 10.0</span></div>
              <div class="col-6"><strong>Active Backlogs:</strong> ${student.academic?.ug?.currentBacklogs || 0}</div>
              <div class="col-6"><strong>History of Backlogs:</strong> ${student.academic?.ug?.historyOfBacklogs || 0}</div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 border">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-geo-alt me-2"></i>Registered Address</h6>
            <p class="mb-1"><strong>Permanent Address:</strong> ${student.address?.permanentAddress || 'N/A'}</p>
            <div class="row g-1">
              <div class="col-6"><strong>City / Village:</strong> ${student.address?.city || student.address?.village || 'N/A'}</div>
              <div class="col-6"><strong>District:</strong> ${student.address?.district || 'N/A'}</div>
              <div class="col-6"><strong>State:</strong> ${student.address?.state || 'N/A'}</div>
              <div class="col-6"><strong>PIN Code:</strong> ${student.address?.pinCode || 'N/A'}</div>
            </div>
          </div>
        </div>
      `,
      confirmButtonColor: '#0d6efd',
      width: '680px'
    });
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f0f2f5' }}>
      <AdminNavbar />

      <div className="container py-4">

        {/* Page Header */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center">
              <div className="bg-info text-dark rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow" style={{ width: '55px', height: '55px' }}>
                <i className="bi bi-people-fill fs-3"></i>
              </div>
              <div className="text-white">
                <h3 className="fw-bold mb-0">Registered Students Directory</h3>
                <p className="mb-0 text-white-50 small">All students registered and authenticated in the National Scholarship System</p>
              </div>
            </div>
            <div>
              <span className="badge bg-warning text-dark fw-bold fs-6 rounded-pill px-4 py-2 shadow-sm">
                <i className="bi bi-person-check-fill me-1"></i> {students.length} Registered Students
              </span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by student name, email, phone, college, register no, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-5 d-flex justify-content-between justify-content-md-end gap-2">
              <select
                className="form-select form-select-sm rounded-pill flex-grow-1 flex-md-grow-0 w-auto px-3"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="GENERAL">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>

              <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center" onClick={fetchStudents}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              Registered Students Master List
            </h5>
            <span className="text-muted small">Showing {filteredStudents.length} of {students.length} students</span>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2 small">Loading registered student profiles...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-person-x fs-1 text-muted"></i>
                <h5 className="fw-bold text-secondary mt-2">No Students Found</h5>
                <p className="text-muted small">
                  {searchQuery ? 'No students match your search criteria.' : 'No students have registered in the portal yet.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 small fw-bold text-uppercase text-secondary">#</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Photo</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Student Name</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Contact</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">College Details</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Dept & Reg No</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Category</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">UG CGPA</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary">Registered</th>
                      <th className="px-3 py-3 small fw-bold text-uppercase text-secondary text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student._id}>
                        <td className="px-4 py-3 fw-semibold text-muted">{index + 1}</td>
                        <td className="px-3 py-3">
                          {student.photo ? (
                            <img
                              src={student.photo}
                              alt={student.fullName}
                              className="rounded-circle border shadow-sm"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <i className="bi bi-person-fill"></i>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="fw-semibold text-dark">{student.fullName}</span>
                          <br />
                          <span className="badge bg-light text-secondary border small">{student.gender || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <small className="text-dark fw-medium">{student.email}</small>
                          <br />
                          <small className="text-muted"><i className="bi bi-telephone me-1"></i>{student.phone}</small>
                        </td>
                        <td className="px-3 py-3">
                          <small className="text-dark fw-semibold">{student.college?.collegeName || 'N/A'}</small>
                          <br />
                          <small className="text-muted">{student.college?.degree || 'Degree'}</small>
                        </td>
                        <td className="px-3 py-3">
                          <small className="text-secondary">{student.college?.department || 'N/A'}</small>
                          <br />
                          <span className="badge bg-light text-dark border">{student.college?.registerNumber || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="badge bg-primary-subtle text-primary">{student.category || 'General'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="fw-bold text-success">{student.academic?.ug?.cgpa || 'N/A'}</span>
                          <br />
                          <small className="text-muted">12th: {student.academic?.hsc?.percentage || 'N/A'}%</small>
                        </td>
                        <td className="px-3 py-3">
                          <small className="text-muted">{new Date(student.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            className="btn btn-outline-primary btn-sm rounded-pill px-3"
                            onClick={() => viewStudentDetails(student)}
                            title="View Complete Student Dossier"
                          >
                            <i className="bi bi-eye me-1"></i> View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminStudents;
