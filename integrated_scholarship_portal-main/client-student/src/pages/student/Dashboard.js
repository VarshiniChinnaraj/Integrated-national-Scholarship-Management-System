import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  Banknote,
  ArrowRight,
  Calendar,
  ChevronRight,
  Bell,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';

/* ---- helpers ---- */
const msToDeadline = (deadline) => new Date(deadline) - new Date();

const deadlineLabel = (deadline) => {
  const ms = msToDeadline(deadline);
  if (ms <= 0) return { text: 'Closed', cls: 'urgent' };
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return { text: `${hrs}h left`, cls: 'urgent' };
  const days = Math.floor(hrs / 24);
  if (days <= 2) return { text: `${days}d left`, cls: 'warning' };
  return { text: `${days} days left`, cls: 'normal' };
};

const StudentDashboard = () => {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [eligible, setEligible]           = useState([]);
  const [eligibleLoading, setEligibleLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchEligible = async () => {
      try {
        const res = await api.get('/student/eligible-scholarships');
        if (res.data.success) setEligible(res.data.eligibleScholarships || []);
      } catch {
        /* silently ignore — feature is additive */
      } finally {
        setEligibleLoading(false);
      }
    };
    fetchEligible();
  }, []);

  if (loading) {
    return (
      <PortalLayout pageTitle="Student Dashboard">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border" style={{ color: 'var(--plum)' }} role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const { user, stats, recentApplications, notifications } = data || {
    user: {}, stats: {}, recentApplications: [], notifications: []
  };

  const completeness = user?.profileCompleteness || 0;

  return (
    <PortalLayout
      pageTitle="Student Dashboard"
      breadcrumbs={[{ label: 'Student Portal', link: '/student/dashboard' }, { label: 'Dashboard' }]}
    >
      {/* ── Welcome Banner ── */}
      <div className="plum-welcome-banner p-3 p-sm-4 p-md-5 mb-4" style={{ border: '1px solid rgba(168,139,181,0.2)' }}>
        <div className="row align-items-center g-3" style={{ position: 'relative', zIndex: 2 }}>
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                background: 'rgba(168,139,181,0.25)', border: '1px solid rgba(168,139,181,0.3)',
                color: '#E4DCE8'
              }}>Academic Year 2025–2026</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                background: 'rgba(168,139,181,0.4)', color: '#fff'
              }}>Active Scheme Cycle</span>
            </div>
            <h3 style={{ fontWeight: 800, color: '#fff', marginBottom: 4, fontSize: 'clamp(1.1rem,2.5vw,1.5rem)' }}>
              Welcome back, {user?.name || 'Scholar'}! 🎓
            </h3>
            <p style={{ color: 'rgba(228,220,232,0.65)', marginBottom: 0, fontSize: '0.86rem' }}>
              Enrolled at <strong style={{ color: '#E4DCE8' }}>{user?.institutionName || 'National Institute of Technology'}</strong>
            </p>
          </div>

          <div className="col-12 col-lg-4 mt-2 mt-lg-0 text-lg-end">
            <div style={{
              display: 'inline-block', width: '100%', maxWidth: 320,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(168,139,181,0.25)',
              borderRadius: 14, padding: '14px 16px', backdropFilter: 'blur(8px)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: '0.76rem', color: 'rgba(228,220,232,0.65)', fontWeight: 600 }}>Profile Completeness</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#A88BB5' }}>{completeness}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 6, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${completeness}%`, background: 'linear-gradient(90deg,#A88BB5,#C3A8D1)', borderRadius: 6, transition: 'width 0.6s ease' }} />
              </div>
              <Link to="/student/profile" className="d-flex align-items-center justify-content-between text-decoration-none mt-2"
                style={{ fontSize: '0.76rem', color: '#C3A8D1', fontWeight: 600 }}>
                <span>{completeness === 100 ? 'View Full Profile' : 'Complete Profile Requirements'}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Total Applications" value={stats.totalApplications || 0}
            subtitle="Submitted grants" icon={<FileText size={20} />}
            iconBg="rgba(73,53,79,0.1)" iconColor="var(--plum)" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Pending Verification" value={stats.pendingApplications || 0}
            subtitle="Institute / Dept Scrutiny" icon={<Clock size={20} />}
            iconBg="rgba(217,119,6,0.1)" iconColor="#D97706" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Approved & Sanctioned" value={stats.approvedApplications || 0}
            subtitle="Granted for disbursement" icon={<CheckCircle2 size={20} />}
            iconBg="rgba(22,163,74,0.1)" iconColor="#16A34A" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Total Disbursed" value={`₹${(stats.disbursedAmount || 0).toLocaleString('en-IN')}`}
            subtitle="Direct Benefit Transfer (DBT)" icon={<Banknote size={20} />}
            iconBg="rgba(168,139,181,0.15)" iconColor="var(--lavender)" />
        </div>
      </div>

      {/* ── Eligible Scholarships Reminder Widget ── */}
      {!eligibleLoading && eligible.length > 0 && (
        <div className="custom-card p-4 mb-4" style={{ border: '1px solid var(--lavender-pale)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(73,53,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="var(--plum)" />
              </div>
              <div>
                <h6 style={{ fontWeight: 700, color: 'var(--charcoal)', margin: 0, fontSize: '0.95rem' }}>
                  Eligible Scholarships — Deadline Reminders
                </h6>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted-grey)', margin: 0 }}>
                  Based on your profile, you qualify for {eligible.length} scheme{eligible.length > 1 ? 's' : ''} with upcoming deadlines
                </p>
              </div>
            </div>
            <Link to="/student/scholarships"
              style={{ fontSize: '0.78rem', color: 'var(--plum)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="row g-3">
            {eligible.slice(0, 3).map(({ scholarship: sch, eligibilityNotes, alreadyApplied }) => {
              const dl = deadlineLabel(sch.deadline);
              return (
                <div key={sch._id} className="col-12 col-md-6 col-xl-4">
                  <div className={`eligible-scheme-card deadline-${dl.cls}`}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span style={{
                        fontSize: '0.67rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(73,53,79,0.08)', color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>
                        {sch.providerType}
                      </span>
                      <span className={`deadline-countdown ${dl.cls}`}>
                        {dl.cls === 'urgent' && <AlertTriangle size={11} />}
                        {dl.cls === 'warning' && <Clock size={11} />}
                        {dl.text}
                      </span>
                    </div>

                    <h6 style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4, fontSize: '0.88rem', lineHeight: 1.35 }}
                      className="text-truncate-2">
                      {sch.name}
                    </h6>

                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-grey)', marginBottom: 8 }}>
                      <Calendar size={11} style={{ marginRight: 4 }} />
                      Deadline: <strong>{new Date(sch.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </p>

                    <p style={{ fontSize: '0.72rem', color: 'var(--muted-grey)', marginBottom: 10, lineHeight: 1.4 }}
                      className="text-truncate-2">
                      {eligibilityNotes || 'You meet the eligibility criteria for this scheme.'}
                    </p>

                    <div className="d-flex gap-2">
                      {alreadyApplied ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Applied
                        </span>
                      ) : (
                        <>
                          <Link to={`/student/scholarships/${sch._id}`}
                            className="btn btn-outline-primary btn-sm flex-grow-1"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            Details
                          </Link>
                          <Link to={`/student/apply/${sch._id}`}
                            className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            Apply <ArrowRight size={12} />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Row: Recent Applications + Notifications ── */}
      <div className="row g-4 mb-4">
        {/* Recent Applications */}
        <div className="col-12 col-lg-8">
          <div className="custom-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h5 style={{ fontWeight: 700, color: 'var(--charcoal)', margin: 0, fontSize: '1rem' }}>My Recent Applications</h5>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted-grey)' }}>
                  Live multi-stage verification status from your institution and nodal ministry
                </p>
              </div>
              <Link to="/student/applications"
                style={{ fontSize: '0.78rem', color: 'var(--plum)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--lavender-mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <FileText size={32} color="var(--muted-grey)" />
                </div>
                <h6 style={{ fontWeight: 700, color: 'var(--charcoal)' }}>No Applications Yet</h6>
                <p style={{ fontSize: '0.84rem', color: 'var(--muted-grey)', maxWidth: 360, margin: '0 auto 16px' }}>
                  You haven't submitted any scholarship applications yet.
                </p>
                <Link to="/student/scholarships" className="btn btn-primary btn-sm rounded-pill px-4 py-2">
                  Browse Open Schemes
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Application #</th>
                      <th>Scholarship Scheme</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr key={app._id} style={{ fontSize: '0.84rem' }}>
                        <td>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem',
                            background: 'var(--lavender-mist)', color: 'var(--plum)',
                            border: '1px solid var(--lavender-pale)', borderRadius: 6, padding: '3px 8px'
                          }}>
                            {app.applicationNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--charcoal)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.scholarshipName}
                          </div>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(22,163,74,0.08)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.15)'
                          }}>
                            ₹{app.requestedAmount?.toLocaleString('en-IN')} Grant
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted-grey)', fontSize: '0.82rem' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Calendar size={12} color="var(--muted-grey)" />
                            {new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td><StatusBadge status={app.status} /></td>
                        <td className="text-end">
                          <Link to={`/student/applications/${app._id}`}
                            className="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.76rem', padding: '4px 12px', borderColor: 'var(--plum)', color: 'var(--plum)' }}>
                            Track <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-4 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h6 style={{ fontWeight: 700, color: 'var(--charcoal)', margin: 0, fontSize: '0.95rem' }}>Recent Alerts</h6>
              <Link to="/student/notifications" style={{ fontSize: '0.78rem', color: 'var(--plum)', fontWeight: 600, textDecoration: 'none' }}>
                View All
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="p-3 text-center rounded-3 flex-grow-1 d-flex align-items-center justify-content-center"
                style={{ background: 'var(--lavender-mist)', color: 'var(--muted-grey)', fontSize: '0.84rem' }}>
                <div>
                  <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div>No new notifications right now.</div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 flex-grow-1">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif._id} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--lavender-mist)',
                    borderLeft: '3px solid var(--lavender)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: 2 }}>{notif.title}</div>
                    <div className="text-truncate-2" style={{ color: 'var(--muted-grey)', lineHeight: 1.35 }}>{notif.message}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-2 mb-2">
                <GraduationCap size={15} color="var(--lavender)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--plum)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick Access
                </span>
              </div>
              <Link to="/student/scholarships"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: '0.83rem', padding: '8px 14px' }}>
                Browse Open Schemes <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default StudentDashboard;
