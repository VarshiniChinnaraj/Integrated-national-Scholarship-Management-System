import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import StatsCard from '../../components/common/StatsCard';
import api from '../../services/api';
import { BarChart3, Users, Building2, Building, Banknote, Printer } from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/dashboard-analytics');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <PortalLayout pageTitle="National Scholarship Reports">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  const { metrics, charts } = data || { metrics: {}, charts: {} };

  return (
    <PortalLayout
      pageTitle="National Platform Comprehensive Reports"
      breadcrumbs={[{ label: 'Admin Portal', link: '/admin/dashboard' }, { label: 'System Reports' }]}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-0">National Beneficiary & Financial Summary Report</h5>
          <span className="text-muted small">Generated on {new Date().toLocaleDateString()}</span>
        </div>
        <button onClick={() => window.print()} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <Printer size={15} />
          <span>Print Summary Report</span>
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Applications"
            value={metrics.totalApplications || 0}
            subtitle="Processed on portal"
            icon={<BarChart3 size={22} />}
            iconBg="#e0f2fe"
            iconColor="#0369a1"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Approved"
            value={metrics.approvedApplications || 0}
            subtitle="Department cleared"
            icon={<Building size={22} />}
            iconBg="#dcfce7"
            iconColor="#15803d"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Disbursed Funds"
            value={`₹${(metrics.totalDisbursedAmount || 0).toLocaleString('en-IN')}`}
            subtitle="Direct Benefit Transfer"
            icon={<Banknote size={22} />}
            iconBg="#ecfdf5"
            iconColor="#047857"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Active Colleges"
            value={metrics.totalInstitutions || 0}
            subtitle="Participating in scrutiny"
            icon={<Building2 size={22} />}
            iconBg="#fae8ff"
            iconColor="#86198f"
          />
        </div>
      </div>

      <div className="custom-card p-4">
        <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Department-wise Application Volumes</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ fontSize: '0.8rem' }}>
                <th>Department / Ministry Name</th>
                <th>Total Applications Routed</th>
              </tr>
            </thead>
            <tbody>
              {(charts?.departmentChart || []).map((dept, idx) => (
                <tr key={idx} style={{ fontSize: '0.88rem' }}>
                  <td className="fw-bold text-dark">{dept.name}</td>
                  <td>
                    <span className="badge bg-primary px-3 py-1.5">{dept.applications} Applications</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
};

export default AdminReports;
