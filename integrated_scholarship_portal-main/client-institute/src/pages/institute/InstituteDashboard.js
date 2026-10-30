import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Building2,
  ShieldCheck
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

const InstituteDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/institute/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load institute dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <PortalLayout pageTitle="Institute Officer Portal">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  const { institution, stats, statusDistribution, monthlyStats, recentApplications } = data || {
    institution: {},
    stats: {},
    statusDistribution: [],
    monthlyStats: [],
    recentApplications: []
  };

  return (
    <PortalLayout
      pageTitle="Institute Nodal Officer Dashboard"
      breadcrumbs={[{ label: 'Institute Portal', link: '/institute/dashboard' }, { label: 'Dashboard' }]}
    >
      {/* College Identity Banner */}
      <div className="custom-card p-3 p-sm-4 mb-4 border-0 text-white" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Building2 size={24} className="text-warning flex-shrink-0" />
              <h4 className="fw-bold mb-0 text-white responsive-title text-break">{institution?.name || 'Assigned Institution'}</h4>
            </div>
            <span className="text-white-50 small text-break">
              AISHE / College Code: {institution?.code || 'INST-101'} &bull; District: {institution?.district || 'Capital Region'} &bull; State: {institution?.state || 'Delhi'}
            </span>
          </div>
          <div>
            <span className="badge bg-warning text-dark px-3 py-2 fw-bold text-wrap text-start">
              Institutional Verification Desk
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Pending Verification"
            value={stats.pending || 0}
            subtitle="Requires Scrutiny"
            icon={<Clock size={22} />}
            iconBg="#fef3c7"
            iconColor="#b45309"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Verified & Forwarded"
            value={stats.verified || 0}
            subtitle="Routed to Department"
            icon={<CheckCircle2 size={22} />}
            iconBg="#dcfce7"
            iconColor="#15803d"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Correction Requests"
            value={stats.correction || 0}
            subtitle="Sent back to student"
            icon={<AlertTriangle size={22} />}
            iconBg="#fef2f2"
            iconColor="#b91c1c"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Enrolled Students"
            value={stats.totalStudents || 0}
            subtitle="Registered in College"
            icon={<Users size={22} />}
            iconBg="#e0f2fe"
            iconColor="#0369a1"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-5">
          <div className="custom-card p-3 p-sm-4 h-100">
            <h5 className="fw-bold text-dark mb-3">Application Status Breakdown</h5>
            <div style={{ height: '260px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="custom-card p-3 p-sm-4 h-100">
            <h5 className="fw-bold text-dark mb-3">Monthly Verification Activity</h5>
            <div style={{ height: '260px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" name="Applications Handled" fill="#A88BB5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="custom-card p-3 p-sm-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <h5 className="fw-bold text-dark mb-0">Incoming Applications Awaiting Verification</h5>
          <Link to="/institute/applications" className="small text-primary fw-semibold text-decoration-none">
            View All Applications &rarr;
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <p className="text-muted small py-4 text-center">No student applications submitted yet for this institution.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '680px' }}>
              <thead className="table-light">
                <tr style={{ fontSize: '0.8rem' }}>
                  <th>Application #</th>
                  <th>Student Name</th>
                  <th>Scholarship Scheme</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app._id} style={{ fontSize: '0.85rem' }}>
                    <td className="fw-bold text-primary text-break">{app.applicationNumber}</td>
                    <td className="fw-semibold text-dark">{app.studentName}</td>
                    <td className="text-dark text-truncate" style={{ maxWidth: '240px' }}>{app.scholarshipName}</td>
                    <td className="text-muted">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/institute/applications/${app._id}`}
                        className="btn btn-sm btn-primary py-1 px-3 d-inline-flex align-items-center gap-1"
                      >
                        <ShieldCheck size={14} />
                        <span>Verify</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default InstituteDashboard;

