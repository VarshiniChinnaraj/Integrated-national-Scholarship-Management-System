import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Building, PlusCircle, Edit3, CheckCircle, Search, Mail, Phone } from 'lucide-react';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'GOVERNMENT',
    provider: 'Government of India',
    assignedOfficerName: '',
    contactEmail: '',
    contactPhone: '',
    budgetAllocated: 10000000,
    status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: `DEP-${Math.floor(100 + Math.random() * 900)}`,
      type: 'GOVERNMENT',
      provider: 'Ministry of Education',
      assignedOfficerName: 'Dr. Sunita Verma',
      contactEmail: 'officer@dept.gov.in',
      contactPhone: '011-23381234',
      budgetAllocated: 15000000,
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingId(dept._id);
    setFormData({
      name: dept.name,
      code: dept.code,
      type: dept.type,
      provider: dept.provider,
      assignedOfficerName: dept.assignedOfficerName || dept.assignedOfficer?.name || '',
      contactEmail: dept.contact?.email || '',
      contactPhone: dept.contact?.phone || '',
      budgetAllocated: dept.budget?.allocated || 10000000,
      status: dept.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        provider: formData.provider,
        assignedOfficerName: formData.assignedOfficerName,
        contact: {
          email: formData.contactEmail,
          phone: formData.contactPhone
        },
        budget: {
          allocated: Number(formData.budgetAllocated),
          disbursed: 0
        },
        status: formData.status
      };

      if (editingId) {
        await api.put(`/admin/departments/${editingId}`, payload);
        setFeedback({ type: 'success', message: 'Department updated successfully!' });
      } else {
        await api.post('/admin/departments', payload);
        setFeedback({ type: 'success', message: 'Department created successfully!' });
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to save department.' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = departments.filter((d) => {
    return (
      !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.provider?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <PortalLayout
      pageTitle="Department Directory & Body Management"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Departments' }]}
    >
      <div className="custom-card p-4 mb-4">
        <div className="row g-3 justify-content-between align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search department by name, code or provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <button onClick={handleOpenCreate} className="btn btn-primary d-flex align-items-center gap-2 fw-bold ms-auto">
              <PlusCircle size={18} />
              <span>Add Department</span>
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
      ) : filtered.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <Building size={48} className="mb-2 text-muted" />
          <h5>No departments registered</h5>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm mt-3">
            Add Department
          </button>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Department Name & Code</th>
                  <th>Type</th>
                  <th>Provider Body</th>
                  <th>Assigned Officer</th>
                  <th>Budget Allocated</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id} style={{ fontSize: '0.88rem' }}>
                    <td>
                      <div className="fw-bold text-dark">{d.name}</div>
                      <span className="badge bg-light text-secondary border">Code: {d.code}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          d.type === 'GOVERNMENT'
                            ? 'bg-primary-subtle text-primary border border-primary-subtle'
                            : d.type === 'PRIVATE'
                            ? 'bg-purple-subtle text-purple border'
                            : 'bg-success-subtle text-success border border-success-subtle'
                        }`}
                        style={d.type === 'PRIVATE' ? { backgroundColor: 'rgba(168,139,181,0.12)', color: '#49354F' } : {}}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="text-dark small fw-semibold">{d.provider}</td>
                    <td>
                      <div className="fw-semibold text-dark">{d.assignedOfficerName || d.assignedOfficer?.name || 'Dr. Sunita Verma'}</div>
                      <span className="text-muted small">{d.contact?.email || 'officer@dept.gov.in'}</span>
                    </td>
                    <td className="fw-bold text-success">
                      â‚¹{Number(d.budget?.allocated || 5000000).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${d.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="btn btn-sm btn-outline-primary p-1.5"
                        title="Edit Department"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingId ? 'Edit Department Details' : 'Add New Department'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Department Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Ministry of Higher Education & Welfare"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Department Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. MOHE-GOV"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Department Type</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="GOVERNMENT">GOVERNMENT</option>
                        <option value="PRIVATE">PRIVATE</option>
                        <option value="CORPORATE">CORPORATE</option>
                        <option value="NGO">NGO</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Provider Organization</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Department of Higher Education"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Assigned Officer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Dr. Sunita Verma"
                        value={formData.assignedOfficerName}
                        onChange={(e) => setFormData({ ...formData, assignedOfficerName: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Budget Allocation (â‚¹ INR)</label>
                      <input
                        type="number"
                        className="form-control fw-bold text-success"
                        value={formData.budgetAllocated}
                        onChange={(e) => setFormData({ ...formData, budgetAllocated: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary fw-bold">
                    {saving ? 'Saving...' : editingId ? 'Update Department' : 'Create Department'}
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

export default AdminDepartments;

