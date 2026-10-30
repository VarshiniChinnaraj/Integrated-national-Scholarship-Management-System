import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/layout/PortalLayout';
import StatsCard from '../../components/common/StatsCard';
import api from '../../services/api';
import { BarChart3, DollarSign, Award, FileText, Printer } from 'lucide-react';

const DepartmentReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/department/reports');
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load department reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Department Reports & Analytics">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  const { metrics, schemeBreakdown } = reportData || { metrics: {}, schemeBreakdown: [] };

  return (
    <PortalLayout
      pageTitle="Department Financial Scrutiny & Sanction Reports"
      breadcrumbs={[{ label: 'Department Portal', link: '/department/dashboard' }, { label: 'Reports' }]}
    >
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-0">Financial & Scheme Audit Summary</h5>
          <span className="text-muted small">Generated on {new Date().toLocaleDateString()}</span>
        </div>
        <button onClick={() => window.print()} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <Printer size={15} />
          <span>Print Report</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Applications"
            value={metrics.totalApplications || 0}
            subtitle="Received for scrutiny"
            icon={<FileText size={22} />}
            iconBg="#e0f2fe"
            iconColor="#0369a1"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Sanctioned"
            value={`₹${(metrics.totalSanctioned || 0).toLocaleString('en-IN')}`}
            subtitle={`${metrics.totalSanctionsCount || 0} Sanction Orders`}
            icon={<Award size={22} />}
            iconBg="#fae8ff"
            iconColor="#86198f"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Total Disbursed"
            value={`₹${(metrics.totalDisbursed || 0).toLocaleString('en-IN')}`}
            subtitle={`${metrics.totalDisbursedCount || 0} DBT Bank Credits`}
            icon={<DollarSign size={22} />}
            iconBg="#ecfdf5"
            iconColor="#047857"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard
            title="Sanctions Rate"
            value={metrics.totalApplications > 0 ? `${Math.round(((metrics.totalSanctionsCount || 0) / metrics.totalApplications) * 100)}%` : '0%'}
            subtitle="Approval efficiency"
            icon={<BarChart3 size={22} />}
            iconBg="#fef3c7"
            iconColor="#b45309"
          />
        </div>
      </div>

      {/* Scheme Breakdown Table */}
      <div className="custom-card p-3 p-sm-4">
        <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Scheme-wise Financial Breakdown</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ minWidth: '640px' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.8rem' }}>
                <th>Scholarship Scheme</th>
                <th>Total Applications</th>
                <th>Approved for Grant</th>
                <th>DBT Disbursed</th>
                <th>Total Disbursed Amount</th>
              </tr>
            </thead>
            <tbody>
              {schemeBreakdown.map((s, idx) => (
                <tr key={idx} style={{ fontSize: '0.88rem' }}>
                  <td className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }}>{s.name}</td>
                  <td>{s.applications}</td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary">{s.approved}</span>
                  </td>
                  <td>
                    <span className="badge bg-success-subtle text-success">{s.disbursed}</span>
                  </td>
                  <td className="fw-bold text-success">
                    ₹{s.totalAmount?.toLocaleString('en-IN')}
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

export default DepartmentReports;
