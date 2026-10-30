import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { GraduationCap, PlusCircle, Edit3, Trash2, CheckCircle, Search, Calendar, DollarSign } from 'lucide-react';

const AdminScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    provider: 'Government of India',
    providerType: 'GOVERNMENT',
    departmentId: '',
    educationLevel: 'Undergraduate',
    category: 'All',
    incomeLimit: 250000,
    minPercentage: 60,
    minCgpa: 6.5,
    scholarshipAmount: 50000,
    deadline: '2026-12-31',
    description: '',
    status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, deptRes] = await Promise.all([
        api.get('/admin/scholarships'),
        api.get('/admin/departments')
      ]);

      if (schRes.data.success) setScholarships(schRes.data.scholarships || []);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments || []);
        if (deptRes.data.departments?.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: deptRes.data.departments[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      provider: 'Government of India',
      providerType: 'GOVERNMENT',
      departmentId: departments[0]?._id || '',
      educationLevel: 'Undergraduate',
      category: 'All',
      incomeLimit: 250000,
      minPercentage: 60,
      minCgpa: 6.5,
      scholarshipAmount: 50000,
      deadline: '2026-12-31',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingId(sch._id);
    setFormData({
      name: sch.name,
      code: sch.code,
      provider: sch.provider,
      providerType: sch.providerType,
      departmentId: sch.departmentId?._id || sch.departmentId || '',
      educationLevel: sch.educationLevel,
      category: sch.category,
      incomeLimit: sch.incomeLimit,
      minPercentage: sch.minPercentage,
      minCgpa: sch.minCgpa,
      scholarshipAmount: sch.scholarshipAmount,
      deadline: sch.deadline ? new Date(sch.deadline).toISOString().split('T')[0] : '2026-12-31',
      description: sch.description || '',
      status: sch.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      if (editingId) {
        const res = await api.put(`/admin/scholarships/${editingId}`, formData);
        if (res.data.success) {
          setFeedback({ type: 'success', message: 'Scholarship scheme updated successfully!' });
        }
      } else {
        const res = await api.post('/admin/scholarships', formData);
        if (res.data.success) {
          setFeedback({ type: 'success', message: 'New Scholarship scheme published successfully!' });
        }
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to save scholarship.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scholarship scheme?')) {
      try {
        await api.delete(`/admin/scholarships/${id}`);
        setFeedback({ type: 'success', message: 'Scholarship deleted successfully.' });
        fetchData();
      } catch (err) {
        setFeedback({ type: 'danger', message: 'Failed to delete scholarship.' });
      }
    }
  };

  const filtered = scholarships.filter((s) => {
    return (
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <PortalLayout
      pageTitle="National Scholarship Scheme Management"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Scholarships' }]}
    >
      {/* Header Actions */}
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
                placeholder="Search scholarship by scheme name, code or provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <button onClick={handleOpenCreate} className="btn btn-primary d-flex align-items-center gap-2 fw-bold ms-auto">
              <PlusCircle size={18} />
              <span>Create New Scholarship</span>
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

      {/* Scholarships List Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <GraduationCap size={48} className="mb-2 text-muted" />
          <h5>No scholarships found</h5>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm mt-3">
            Create Scholarship Scheme
          </button>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Scheme Name & Code</th>
                  <th>Assigned Department (Routing)</th>
                  <th>Type & Category</th>
                  <th>Grant Amount</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} style={{ fontSize: '0.88rem' }}>
                    <td>
                      <div className="fw-bold text-dark">{s.name}</div>
                      <span className="badge bg-light text-primary border">Code: {s.code}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                        {s.departmentName || s.departmentId?.name || 'Department'}
                      </div>
                      <span className="text-muted small">Auto-routing key</span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary me-1">{s.providerType}</span>
                      <span className="badge bg-light text-secondary border">{s.category}</span>
                    </td>
                    <td className="fw-bold text-success">
                      {s.amountDisplay || `₹${s.scholarshipAmount?.toLocaleString('en-IN')}`}
                    </td>
                    <td className="text-danger small fw-semibold">
                      {new Date(s.deadline).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="btn btn-sm btn-outline-primary p-1.5"
                          title="Edit Scheme"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="btn btn-sm btn-outline-danger p-1.5"
                          title="Delete Scheme"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content custom-card p-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingId ? 'Edit Scholarship Scheme' : 'Create & Publish New Scholarship'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold">Scholarship Scheme Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. National Merit-cum-Means Grant"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Scheme Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. NMM-2026"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-primary">
                        Assigned Routing Department (departmentId) *
                      </label>
                      <select
                        className="form-select border-primary"
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        required
                      >
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.code} - {d.type})
                          </option>
                        ))}
                      </select>
                      <span className="text-muted small">Applications will auto-route to this department on college approval</span>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Provider Body</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Ministry of Higher Education"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Provider Type</label>
                      <select
                        className="form-select"
                        value={formData.providerType}
                        onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                      >
                        <option value="GOVERNMENT">GOVERNMENT</option>
                        <option value="PRIVATE">PRIVATE</option>
                        <option value="CORPORATE">CORPORATE</option>
                        <option value="NGO">NGO</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Target Education Level</label>
                      <select
                        className="form-select"
                        value={formData.educationLevel}
                        onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                      >
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="Postgraduate">Postgraduate</option>
                        <option value="Class 11-12">Class 11-12</option>
                        <option value="Doctorate / Ph.D">Doctorate / Ph.D</option>
                        <option value="All">All Levels</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Social Category Quota</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="All">All</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Grant Amount (₹ INR)</label>
                      <input
                        type="number"
                        className="form-control fw-bold text-success"
                        value={formData.scholarshipAmount}
                        onChange={(e) => setFormData({ ...formData, scholarshipAmount: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Annual Income Limit (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.incomeLimit}
                        onChange={(e) => setFormData({ ...formData, incomeLimit: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">Application Deadline</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Min Percentage Required (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.minPercentage}
                        onChange={(e) => setFormData({ ...formData, minPercentage: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Min CGPA Required</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={formData.minCgpa}
                        onChange={(e) => setFormData({ ...formData, minCgpa: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Scheme Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary fw-bold">
                    {saving ? 'Saving...' : editingId ? 'Update Scheme' : 'Publish Scheme'}
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

export default AdminScholarships;
