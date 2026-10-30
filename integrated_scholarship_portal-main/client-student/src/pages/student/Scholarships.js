import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import api from '../../services/api';
import { 
  Search, 
  GraduationCap, 
  Calendar, 
  ArrowRight
} from 'lucide-react';

const Scholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState('All');
  const [educationLevel, setEducationLevel] = useState('All');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchScholarships();
  }, [providerType, educationLevel, category]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (providerType !== 'All') params.providerType = providerType;
      if (educationLevel !== 'All') params.educationLevel = educationLevel;
      if (category !== 'All') params.category = category;

      const res = await api.get('/student/scholarships', { params });
      if (res.data.success) {
        setScholarships(res.data.scholarships || []);
      }
    } catch (err) {
      console.error('Failed to fetch scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScholarships();
  };

  return (
    <PortalLayout
      pageTitle="Explore National Scholarships"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'Scholarships' }]}
    >
      {/* Search & Filter Bar */}
      <div className="custom-card p-3 p-sm-4 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-3">
            <div className="col-12 col-lg-5">
              <label className="form-label small fw-semibold text-muted">Search by Scheme or Keyword</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="e.g. Central Sector, Merit, AICTE, Tata..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-semibold text-muted">Provider Type</label>
              <select
                className="form-select"
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
              >
                <option value="All">All Providers</option>
                <option value="GOVERNMENT">Government</option>
                <option value="PRIVATE">Private Trust</option>
                <option value="CORPORATE">Corporate CSR</option>
                <option value="NGO">NGO Scheme</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-semibold text-muted">Education Level</label>
              <select
                className="form-select"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="All">All Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Class 11-12">Class 11-12</option>
                <option value="Doctorate / Ph.D">Doctorate / Ph.D</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-semibold text-muted">Category Quota</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-lg-1 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-1">
                <Search size={18} />
                <span className="d-lg-none small">Search</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Scholarship Catalog Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : scholarships.length === 0 ? (
        <div className="custom-card p-5 text-center text-muted">
          <GraduationCap size={48} className="mb-2 text-muted" />
          <h5>No scholarships match your filter criteria</h5>
          <p className="small">Try resetting your filters or search keyword.</p>
          <button
            onClick={() => {
              setSearch('');
              setProviderType('All');
              setEducationLevel('All');
              setCategory('All');
            }}
            className="btn btn-outline-primary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {scholarships.map((sch) => (
            <div key={sch._id} className="col-12 col-md-6 col-xl-4">
              <div className="custom-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: sch.providerType === 'GOVERNMENT'
                        ? 'rgba(73,53,79,0.08)' : sch.providerType === 'PRIVATE'
                        ? 'rgba(168,139,181,0.15)' : 'rgba(22,163,74,0.08)',
                      color: sch.providerType === 'GOVERNMENT'
                        ? 'var(--plum)' : sch.providerType === 'PRIVATE'
                        ? 'var(--lavender)' : '#16A34A',
                      border: `1px solid ${sch.providerType === 'GOVERNMENT' ? 'rgba(73,53,79,0.15)' : sch.providerType === 'PRIVATE' ? 'rgba(168,139,181,0.2)' : 'rgba(22,163,74,0.15)'}`
                    }}>
                      {sch.providerType}
                    </span>
                    <span style={{
                      fontSize: '0.67rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                      background: 'var(--lavender-mist)', color: 'var(--muted-grey)',
                      border: '1px solid var(--lavender-pale)'
                    }}>
                      {sch.code}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2 line-clamp-2" style={{ minHeight: '48px' }}>
                    {sch.name}
                  </h5>

                  <p className="text-muted small mb-3 line-clamp-2" style={{ minHeight: '38px' }}>
                    {sch.description || 'Provides financial grant support for deserving students.'}
                  </p>

                  <div style={{ background: 'var(--lavender-mist)', padding: '10px 12px', borderRadius: 10, marginBottom: '0.75rem', fontSize: '0.8rem', border: '1px solid var(--lavender-pale)' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'var(--muted-grey)' }}>Grant Amount:</span>
                      <span style={{ fontWeight: 700, color: '#16A34A' }}>{sch.amountDisplay || `₹${sch.scholarshipAmount?.toLocaleString('en-IN')}`}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span style={{ color: 'var(--muted-grey)' }}>Education Level:</span>
                      <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{sch.educationLevel}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span style={{ color: 'var(--muted-grey)' }}>Department:</span>
                      <span style={{ fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {sch.departmentName || sch.departmentId?.name || 'Department'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-1 mb-3" style={{ color: 'var(--plum)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Calendar size={14} />
                    <span>Deadline: {new Date(sch.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="d-flex gap-2">
                    <Link
                      to={`/student/scholarships/${sch._id}`}
                      className="btn btn-outline-secondary btn-sm flex-grow-1"
                    >
                      View Scheme
                    </Link>
                    <Link
                      to={`/student/apply/${sch._id}`}
                      className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Apply Now</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default Scholarships;
