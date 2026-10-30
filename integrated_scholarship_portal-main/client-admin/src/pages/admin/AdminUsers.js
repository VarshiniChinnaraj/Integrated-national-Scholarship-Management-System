import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Users, UserPlus, Search, CheckCircle, ShieldCheck, Lock, Mail, Building2, Building } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'INSTITUTE_OFFICER',
    institutionId: '',
    departmentId: '',
    status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [instRes, deptRes] = await Promise.all([
        api.get('/admin/institutions'),
        api.get('/admin/departments')
      ]);
      if (instRes.data.success) setInstitutions(instRes.data.institutions || []);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
    } catch (err) {
      // Ignored
    }
  };

  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.put(`/admin/users/${userObj._id}/status`, { status: newStatus });
      if (res.data.success) {
        setFeedback({ type: 'success', message: `User status changed to ${newStatus}` });
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to update user status.' });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post('/admin/users', formData);
      if (res.data.success) {
        setFeedback({ type: 'success', message: `${formData.role} account created successfully!` });
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout
      pageTitle="System User Directory & Role-Based Access Control"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'User Management' }]}
    >
      <div className="custom-card p-4 mb-4">
        <div className="row g-3 justify-content-between align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by name, email, role or institution..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All System Roles</option>
              <option value="STUDENT">Students</option>
              <option value="INSTITUTE_OFFICER">Institute Officers</option>
              <option value="DEPARTMENT_OFFICER">Department Officers</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>

          <div className="col-12 col-md-3 text-md-end">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary d-flex align-items-center gap-2 fw-bold ms-auto"
            >
              <UserPlus size={18} />
              <span>Create Officer User</span>
            </button>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} py-2.5 mb-4 d-flex align-items-center gap-2`}>
          <CheckCircle size={18} />
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : users.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <Users size={48} className="mb-2 text-muted" />
          <h5>No users found</h5>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>User Full Name & Email</th>
                  <th>System Role</th>
                  <th>Associated Entity (College / Dept)</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ fontSize: '0.88rem' }}>
                    <td>
                      <div className="fw-bold text-dark">{u.name}</div>
                      <span className="text-muted small">{u.email}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'STUDENT'
                            ? 'bg-primary-subtle text-primary border border-primary-subtle'
                            : u.role === 'INSTITUTE_OFFICER'
                            ? 'bg-warning-subtle text-warning border border-warning-subtle'
                            : u.role === 'DEPARTMENT_OFFICER'
                            ? 'bg-purple-subtle text-purple border'
                            : 'bg-danger-subtle text-danger border border-danger-subtle'
                        }`}
                        style={u.role === 'DEPARTMENT_OFFICER' ? { backgroundColor: 'rgba(73,53,79,0.08)', color: '#49354F' } : {}}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '220px' }}>
                        {u.institutionName || u.departmentName || 'National Portal Central'}
                      </div>
                    </td>
                    <td className="text-muted small">{u.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge ${u.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn btn-sm ${u.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      >
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Officer Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Provision New Officer Account</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">User Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="INSTITUTE_OFFICER">Institute Officer</option>
                        <option value="DEPARTMENT_OFFICER">Department Officer</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Prof. R. K. Saxena"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Official Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. officer@nsp.gov.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>

                    {formData.role === 'INSTITUTE_OFFICER' && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-primary">Assign to College / Institution</label>
                        <select
                          className="form-select border-primary"
                          value={formData.institutionId}
                          onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                        >
                          <option value="">Select Institution</option>
                          {institutions.map((inst) => (
                            <option key={inst._id} value={inst._id}>
                              {inst.name} ({inst.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.role === 'DEPARTMENT_OFFICER' && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-primary">Assign to Department / Ministry</label>
                        <select
                          className="form-select border-primary"
                          value={formData.departmentId}
                          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary fw-bold">
                    {saving ? 'Creating...' : 'Create Officer Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminUsers;

