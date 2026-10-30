import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Users, Search } from 'lucide-react';

const InstituteStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/institute/students');
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    return (
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile?.enrollmentNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile?.course?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <PortalLayout
      pageTitle="Enrolled Student Directory"
      breadcrumbs={[{ label: 'Institute Portal', link: '/institute/dashboard' }, { label: 'Students' }]}
    >
      <div className="custom-card p-3 p-sm-4 mb-4">
        <div className="row g-3 justify-content-between align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search students by name, email, roll number or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <span className="badge bg-primary fs-6 px-3 py-2 text-wrap text-start">
              Total Enrolled Students: {students.length}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="custom-card p-4 p-sm-5 text-center text-muted">
          <Users size={48} className="mb-2 text-muted" />
          <h5>No students found</h5>
          <p className="small">Students registered under this institution will appear here.</p>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Student Name</th>
                  <th>Enrollment / Roll No</th>
                  <th>Course & Branch</th>
                  <th>Academic Score</th>
                  <th>Family Income</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} style={{ fontSize: '0.88rem' }}>
                    <td>
                      <div className="fw-bold text-dark">{s.name}</div>
                      <div className="text-muted small d-flex flex-wrap align-items-center gap-1">
                        <span className="text-break">{s.email}</span> &bull; <span>{s.phone}</span>
                      </div>
                    </td>
                    <td className="fw-semibold text-primary text-break">{s.profile?.enrollmentNo || 'ENR-PENDING'}</td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '200px' }}>{s.profile?.course || 'General'}</div>
                      <span className="text-muted small d-block text-truncate" style={{ maxWidth: '200px' }}>{s.profile?.academicDepartment || 'Engineering'} &bull; {s.profile?.year || '1st Year'}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-success">{s.profile?.marksPercentage || 80}%</span>
                      <span className="text-muted small ms-1">({s.profile?.cgpa || 8.0} CGPA)</span>
                    </td>
                    <td className="fw-semibold text-dark">
                      ₹{Number(s.profile?.familyIncome || 150000).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success">
                        {s.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default InstituteStudents;
