import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const ScholarshipDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const res = await api.get(`/student/scholarships/${id}`);
        if (res.data.success) {
          setScholarship(res.data.scholarship);
        }
      } catch (err) {
        console.error('Failed to load scholarship details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScholarship();
  }, [id]);

  const checkEligibility = () => {
    if (!scholarship || !user) return;
    const prof = user.profile || {};

    const studentIncome = prof.familyIncome || 0;
    const studentMarks = prof.marksPercentage || 0;
    const studentCgpa = prof.cgpa || 0;

    const incomePass = studentIncome <= scholarship.incomeLimit;
    const marksPass = studentMarks >= scholarship.minPercentage || studentCgpa >= scholarship.minCgpa;

    const isEligible = incomePass && marksPass;

    setEligibilityResult({
      checked: true,
      isEligible,
      incomePass,
      marksPass,
      studentIncome,
      studentMarks,
      studentCgpa
    });
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Scholarship Scheme Details">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  if (!scholarship) {
    return (
      <PortalLayout pageTitle="Scheme Not Found">
        <div className="custom-card p-5 text-center">
          <h5>Scholarship scheme details not available</h5>
          <Link to="/student/scholarships" className="btn btn-primary btn-sm mt-3">
            Back to Scholarships
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle={scholarship.name}
      breadcrumbs={[
        { label: 'Student Portal', link: '/student/dashboard' },
        { label: 'Scholarships', link: '/student/scholarships' },
        { label: scholarship.code }
      ]}
    >
      <div className="row g-4">
        {/* Main Details Column */}
        <div className="col-12 col-lg-8">
          <div className="custom-card p-3 p-sm-4 p-md-5 mb-4">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(73,53,79,0.08)', color: 'var(--plum)', border: '1px solid rgba(73,53,79,0.15)' }}>
                {scholarship.providerType}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'var(--lavender-mist)', color: 'var(--muted-grey)', border: '1px solid var(--lavender-pale)' }}>
                Code: {scholarship.code}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(22,163,74,0.08)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.15)' }}>
                {scholarship.status}
              </span>
            </div>

            <h3 className="fw-bold text-dark mb-3 responsive-title">{scholarship.name}</h3>
            <p className="text-muted leading-relaxed mb-4 text-break" style={{ fontSize: '0.95rem' }}>
              {scholarship.description ||
                'This national scholarship scheme aims to provide direct financial assistance to students across India to pursue undergraduate and postgraduate education.'}
            </p>

            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Mandatory Eligibility Criteria</h5>
            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center px-0 py-2 gap-1 gap-sm-0">
                <span className="text-muted">Maximum Family Annual Income:</span>
                <span className="fw-bold text-dark">₹{scholarship.incomeLimit?.toLocaleString('en-IN')} per annum</span>
              </li>
              <li className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center px-0 py-2 gap-1 gap-sm-0">
                <span className="text-muted">Minimum Qualifying Percentage:</span>
                <span className="fw-bold text-dark">{scholarship.minPercentage}% marks in previous exam</span>
              </li>
              <li className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center px-0 py-2 gap-1 gap-sm-0">
                <span className="text-muted">Minimum Cumulative CGPA:</span>
                <span className="fw-bold text-dark">{scholarship.minCgpa} CGPA (on a 10-point scale)</span>
              </li>
              <li className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center px-0 py-2 gap-1 gap-sm-0">
                <span className="text-muted">Eligible Category Quota:</span>
                <span className="fw-bold text-dark">{scholarship.category}</span>
              </li>
              <li className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center px-0 py-2 gap-1 gap-sm-0">
                <span className="text-muted">Eligible Target Degree Level:</span>
                <span className="fw-bold text-dark">{scholarship.educationLevel}</span>
              </li>
            </ul>

            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Eligible Courses & Disciplines</h5>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {scholarship.eligibleCourses?.map((course, idx) => (
                <span key={idx} className="badge bg-light text-dark border px-3 py-2 text-wrap text-start">
                  {course}
                </span>
              ))}
            </div>

            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Application & Submission Instructions</h5>
            <div style={{ background: 'var(--lavender-mist)', padding: '14px 16px', borderRadius: 10, color: 'var(--muted-grey)', whiteSpace: 'pre-line', fontSize: '0.9rem', border: '1px solid var(--lavender-pale)' }}>
              {scholarship.applicationInstructions ||
                '1. Ensure your Student Profile is 100% complete before applying.\n2. Keep your bonafide certificate and income certificate ready.\n3. Make sure your bank account is active and seeded with Aadhaar.'}
            </div>
          </div>
        </div>

        {/* Sidebar Action / Eligibility Box */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-3 p-sm-4 sticky-lg-top" style={{ top: '90px' }}>
            <div className="text-center pb-3 border-bottom mb-3" style={{ borderColor: 'var(--lavender-pale)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted-grey)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scholarship Grant</span>
              <h3 style={{ fontWeight: 800, color: '#16A34A', marginBottom: 2 }}>{scholarship.amountDisplay || `₹${scholarship.scholarshipAmount?.toLocaleString('en-IN')}`}</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-grey)' }}>Disbursed directly via DBT</span>
            </div>

            <div className="d-flex flex-column gap-2 mb-4" style={{ fontSize: '0.85rem' }}>
              <div className="d-flex justify-content-between">
                <span style={{ color: 'var(--muted-grey)' }}>Provider:</span>
                <span style={{ fontWeight: 600, color: 'var(--charcoal)', textAlign: 'right' }}>{scholarship.provider}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span style={{ color: 'var(--muted-grey)' }}>Assigned Dept:</span>
                <span style={{ fontWeight: 600, color: 'var(--charcoal)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                  {scholarship.departmentName || scholarship.departmentId?.name || 'Department'}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span style={{ color: 'var(--muted-grey)' }}>Application Deadline:</span>
                <span style={{ fontWeight: 700, color: 'var(--plum)' }}>{new Date(scholarship.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Eligibility Quick Checker */}
            <div style={{ background: 'var(--lavender-mist)', padding: '14px', borderRadius: 10, marginBottom: '0.85rem', border: '1px solid var(--lavender-pale)' }}>
              <h6 className="fw-bold text-dark mb-2 small d-flex align-items-center gap-1">
                <ShieldCheck size={16} className="text-primary" />
                <span>Quick Eligibility Checker</span>
              </h6>
              <p className="text-muted small mb-2">Check if your saved profile qualifies for this scholarship.</p>
              <button
                type="button"
                onClick={checkEligibility}
                className="btn btn-outline-primary btn-sm w-100 mb-2"
              >
                Check My Eligibility
              </button>

              {eligibilityResult && (
                <div
                  className={`p-2 rounded mt-2 small ${
                    eligibilityResult.isEligible ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                  }`}
                >
                  <div className="fw-bold d-flex align-items-center gap-1 mb-1">
                    {eligibilityResult.isEligible ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{eligibilityResult.isEligible ? 'You are Eligible!' : 'Criteria Mismatch'}</span>
                  </div>
                  <div>Income: ₹{eligibilityResult.studentIncome?.toLocaleString('en-IN')} ({eligibilityResult.incomePass ? '✓ OK' : '✗ Exceeds Limit'})</div>
                  <div>Academic: {eligibilityResult.studentMarks}% / {eligibilityResult.studentCgpa} CGPA ({eligibilityResult.marksPass ? '✓ OK' : '✗ Below Cutoff'})</div>
                </div>
              )}
            </div>

            <Link
              to={`/student/apply/${scholarship._id}`}
              className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm text-center"
            >
              <span>Proceed to Application</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ScholarshipDetails;
