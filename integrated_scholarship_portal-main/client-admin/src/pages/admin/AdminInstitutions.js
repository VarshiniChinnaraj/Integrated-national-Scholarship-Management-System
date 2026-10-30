import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { Building2, PlusCircle, Edit3, CheckCircle, Search } from 'lucide-react';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    district: '',
    state: 'Delhi',
    assignedOfficerName: '',
    contactEmail: '',
    phone: '',
    status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/institutions');
      if (res.data.success) {
        setInstitutions(res.data.institutions || []);
      }
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: `INST-${Math.floor(100 + Math.random() * 900)}`,
      district: 'Central Delhi',
      state: 'Delhi',
      assignedOfficerName: 'Prof. Rajesh Sharma',
      contactEmail: 'nodal@college.edu',
      phone: '011-27787500',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (inst) => {
    setEditingId(inst._id);
    setFormData({
      name: inst.name,
      code: inst.code,
      district: inst.district,
      state: inst.state,
      assignedOfficerName: inst.assignedOfficerName || inst.assignedOfficer?.name || '',
      contactEmail: inst.contactEmail || '',
      phone: inst.phone || '',
      status: inst.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      if (editingId) {
        await api.put(`/admin/institutions/${editingId}`, formData);
        setFeedback({ type: 'success', message: 'Institution details updated successfully!' });
      } else {
        await api.post('/admin/institutions', formData);
        setFeedback({ type: 'success', message: 'Institution registered successfully!' });
      }
      setShowModal(false);
      fetchInstitutions();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to save institution.' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = institutions.filter((inst) => {
    return (
      !search ||
      inst.name?.toLowerCase().includes(search.toLowerCase()) ||
      inst.code?.toLowerCase().includes(search.toLowerCase()) ||
      inst.district?.toLowerCase().includes(search.toLowerCase()) ||
      inst.state?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <PortalLayout
      pageTitle="Educational Institutions & Colleges Directory"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'Institutions' }]}
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
                placeholder="Search college by name, AISHE code, state or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <button onClick={handleOpenCreate} className="btn btn-primary d-flex align-items-center gap-2 fw-bold ms-auto">
              <PlusCircle size={18} />
              <span>Register Institution</span>
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
          <Building2 size={48} className="mb-2 text-muted" />
          <h5>No institutions found</h5>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm mt-3">
            Register Institution
          </button>
        </div>
      ) : (
        <div className="custom-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Institution Name & AISHE Code</th>
                  <th>District & State</th>
                  <th>Assigned Nodal Officer</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => (
                  <tr key={inst._id} style={{ fontSize: '0.88rem' }}>
                    <td>
                      <div className="fw-bold text-dark">{inst.name}</div>
                      <span className="badge bg-light text-primary border">AISHE: {inst.code}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{inst.district}</div>
                      <span className="text-muted small">{inst.state}</span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{inst.assignedOfficerName || inst.assignedOfficer?.name || 'Prof. Rajesh Sharma'}</div>
                      <span className="text-muted small">Institute Verification Officer</span>
                    </td>
                    <td className="text-muted small">
                      <div>{inst.contactEmail || 'nodal@college.ac.in'}</div>
                      <div>{inst.phone || '011-27787500'}</div>
                    </td>
                    <td>
                      <span className={`badge ${inst.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <button
                        onClick={() => handleOpenEdit(inst)}
                        className="btn btn-sm btn-outline-primary p-1.5"
                        title="Edit Institution"
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
                  {editingId ? 'Edit Institution Details' : 'Register New College / Institution'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Institution Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. National Institute of Technology Delhi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">AISHE / College Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. NITD-101"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">District</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. North Delhi"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">State / UT</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Delhi"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Assigned Officer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Prof. Rajesh Sharma"
                        value={formData.assignedOfficerName}
                        onChange={(e) => setFormData({ ...formData, assignedOfficerName: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Contact Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Contact Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary fw-bold">
                    {saving ? 'Saving...' : editingId ? 'Update Institution' : 'Register Institution'}
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

export default AdminInstitutions;
