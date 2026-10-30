import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  User, 
  BookOpen, 
  DollarSign, 
  CreditCard, 
  FileCheck, 
  CheckSquare, 
  Send, 
  ArrowLeft, 
  ArrowRight
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Personal', icon: <User size={16} /> },
  { id: 2, name: 'Academic', icon: <BookOpen size={16} /> },
  { id: 3, name: 'Income', icon: <DollarSign size={16} /> },
  { id: 4, name: 'Bank', icon: <CreditCard size={16} /> },
  { id: 5, name: 'Documents', icon: <FileCheck size={16} /> },
  { id: 6, name: 'Review', icon: <CheckSquare size={16} /> },
  { id: 7, name: 'Submit', icon: <Send size={16} /> }
];

const ApplyScholarship = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [formData, setFormData] = useState({
    submissionType: 'Fresh Application',
    personalDetails: {
      fullName: '',
      dob: '',
      gender: 'Male',
      fatherName: 'Mr. Ramesh Sharma',
      motherName: 'Mrs. Sunita Sharma',
      category: 'General',
      religion: 'Hindu',
      phone: '',
      email: '',
      address: '',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    academicDetails: {
      institutionName: '',
      course: 'B.Tech in Computer Science',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      enrollmentNumber: '',
      registerNumber: '',
      previousClassPercentage: 85,
      cgpa: 8.5,
      attendancePercentage: 90
    },
    incomeDetails: {
      familyAnnualIncome: 180000,
      incomeCertificateNumber: 'INC-2026-92810',
      issuingAuthority: 'Tahsildar / Revenue Department',
      fatherOccupation: 'Self Employed',
      motherOccupation: 'Homemaker'
    },
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '38947291048',
      ifscCode: 'SBIN0001234',
      branchName: 'Main Campus Branch',
      accountHolderName: ''
    },
    documents: {
      aadhaarCard: 'Aadhaar_Card_Doc.pdf',
      incomeCertificate: 'Income_Certificate_2026.pdf',
      bonafideCertificate: 'College_Bonafide_Certificate.pdf',
      marksheet: 'Academic_Marksheet.pdf',
      communityCertificate: 'Community_Certificate.pdf',
      feeReceipt: 'College_Fee_Receipt.pdf'
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/student/scholarships/${id}`);
        if (res.data.success) {
          setScholarship(res.data.scholarship);
        }
      } catch (err) {
        console.error('Error loading scholarship:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (user) {
      const prof = user.profile || {};
      setFormData((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || '9876543210',
          dob: prof.dob || '2004-05-15',
          gender: prof.gender || 'Male',
          category: prof.category || 'General',
          address: prof.address || 'Hostel Block B, Campus',
          city: prof.city || 'New Delhi',
          state: prof.state || 'Delhi',
          pincode: prof.pincode || '110001'
        },
        academicDetails: {
          ...prev.academicDetails,
          institutionName: user.institutionName || prof.collegeName || 'National Institute of Technology',
          course: prof.course || 'B.Tech Computer Science',
          department: prof.academicDepartment || 'Computer Science',
          year: prof.year || '3rd Year',
          enrollmentNumber: prof.enrollmentNo || 'NITD/2023/CSE/042',
          registerNumber: prof.enrollmentNo || 'REG-2023-042',
          previousClassPercentage: prof.marksPercentage || 85,
          cgpa: prof.cgpa || 8.5,
          attendancePercentage: prof.attendancePercentage || 90
        },
        incomeDetails: {
          ...prev.incomeDetails,
          familyAnnualIncome: prof.familyIncome || 180000,
          incomeCertificateNumber: prof.incomeCertNo || 'INC-2026-92810'
        },
        bankDetails: {
          ...prev.bankDetails,
          bankName: prof.bankName || 'State Bank of India',
          accountNumber: prof.accountNumber || '38947291048',
          ifscCode: prof.ifscCode || 'SBIN0001234',
          branchName: prof.branchName || 'Main Campus Branch',
          accountHolderName: user.name || ''
        }
      }));
    }
  }, [id, user]);

  const handlePersonalChange = (e) => {
    setFormData({
      ...formData,
      personalDetails: { ...formData.personalDetails, [e.target.name]: e.target.value }
    });
  };

  const handleAcademicChange = (e) => {
    setFormData({
      ...formData,
      academicDetails: { ...formData.academicDetails, [e.target.name]: e.target.value }
    });
  };

  const handleIncomeChange = (e) => {
    setFormData({
      ...formData,
      incomeDetails: { ...formData.incomeDetails, [e.target.name]: e.target.value }
    });
  };

  const handleBankChange = (e) => {
    setFormData({
      ...formData,
      bankDetails: { ...formData.bankDetails, [e.target.name]: e.target.value }
    });
  };

  const nextStep = () => {
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async () => {
    if (!agreeTerms) {
      setError('You must confirm the final declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/student/apply/${scholarship._id}`, formData);
      if (res.data.success) {
        navigate(`/student/applications/${res.data.application._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout pageTitle="Application Wizard">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      pageTitle="7-Step Scholarship Application Wizard"
      breadcrumbs={[
        { label: 'Student Portal', link: '/student/dashboard' },
        { label: 'Scholarships', link: '/student/scholarships' },
        { label: 'Application Wizard' }
      ]}
    >
      <div className="custom-card p-3 p-sm-4 p-md-5 mb-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center border-bottom pb-3 mb-4 gap-2">
          <div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-1">
              Applying for Scheme
            </span>
            <h4 className="fw-bold text-dark mb-0 fs-5 fs-sm-4">{scholarship?.name}</h4>
            <span className="text-muted small">Grant: {scholarship?.amountDisplay} &bull; Code: {scholarship?.code}</span>
          </div>
          <div className="text-sm-end">
            <span className="badge bg-dark px-3 py-2">Step {currentStep} of 7</span>
          </div>
        </div>

        {/* Desktop Wizard Progress Bar */}
        <div className="wizard-steps-header d-none d-md-flex">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`step-item ${currentStep === step.id ? 'active' : ''} ${
                currentStep > step.id ? 'completed' : ''
              }`}
            >
              <div className="step-circle">{step.id}</div>
              <div className="step-title">{step.name}</div>
            </div>
          ))}
        </div>

        {/* Mobile Step Indicator */}
        <div className="d-md-none mb-4 p-3 bg-light rounded-3 border">
          <div className="d-flex justify-content-between align-items-center mb-1.5">
            <span className="fw-bold small text-primary">Step {currentStep} of 7: {STEPS[currentStep - 1].name}</span>
            <span className="small text-muted">{Math.round((currentStep / 7) * 100)}%</span>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-primary rounded-pill"
              role="progressbar"
              style={{ width: `${(currentStep / 7) * 100}%` }}
              aria-valuenow={(currentStep / 7) * 100}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2.5 mb-4 small">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 1: Personal Information</h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Applicant Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.personalDetails.fullName}
                  onChange={handlePersonalChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  className="form-control"
                  value={formData.personalDetails.dob}
                  onChange={handlePersonalChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Father's Name</label>
                <input
                  type="text"
                  name="fatherName"
                  className="form-control"
                  value={formData.personalDetails.fatherName}
                  onChange={handlePersonalChange}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Mother's Name</label>
                <input
                  type="text"
                  name="motherName"
                  className="form-control"
                  value={formData.personalDetails.motherName}
                  onChange={handlePersonalChange}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Category</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.personalDetails.category}
                  onChange={handlePersonalChange}
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.personalDetails.phone}
                  onChange={handlePersonalChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.personalDetails.email}
                  onChange={handlePersonalChange}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Permanent Residential Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="2"
                  value={formData.personalDetails.address}
                  onChange={handlePersonalChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Academic Details */}
        {currentStep === 2 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 2: Academic & Institutional Information</h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Institution Name</label>
                <input
                  type="text"
                  name="institutionName"
                  className="form-control bg-light"
                  value={formData.academicDetails.institutionName}
                  disabled
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Degree / Course</label>
                <input
                  type="text"
                  name="course"
                  className="form-control"
                  value={formData.academicDetails.course}
                  onChange={handleAcademicChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.academicDetails.department}
                  onChange={handleAcademicChange}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Current Year of Study</label>
                <input
                  type="text"
                  name="year"
                  className="form-control"
                  value={formData.academicDetails.year}
                  onChange={handleAcademicChange}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">College Enrollment / Roll No</label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  className="form-control"
                  value={formData.academicDetails.enrollmentNumber}
                  onChange={handleAcademicChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Previous Exam Percentage (%)</label>
                <input
                  type="number"
                  name="previousClassPercentage"
                  className="form-control"
                  value={formData.academicDetails.previousClassPercentage}
                  onChange={handleAcademicChange}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Current CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa"
                  className="form-control"
                  value={formData.academicDetails.cgpa}
                  onChange={handleAcademicChange}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Recorded Attendance (%)</label>
                <input
                  type="number"
                  name="attendancePercentage"
                  className="form-control"
                  value={formData.academicDetails.attendancePercentage}
                  onChange={handleAcademicChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Income Details */}
        {currentStep === 3 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 3: Family Financial & Income Details</h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Annual Family Income (in INR)</label>
                <input
                  type="number"
                  name="familyAnnualIncome"
                  className="form-control"
                  value={formData.incomeDetails.familyAnnualIncome}
                  onChange={handleIncomeChange}
                  required
                />
                <span className="text-muted small">Scheme Income Limit: ₹{scholarship?.incomeLimit?.toLocaleString('en-IN')}</span>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Income Certificate Number</label>
                <input
                  type="text"
                  name="incomeCertificateNumber"
                  className="form-control"
                  value={formData.incomeDetails.incomeCertificateNumber}
                  onChange={handleIncomeChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Issuing Authority</label>
                <input
                  type="text"
                  name="issuingAuthority"
                  className="form-control"
                  value={formData.incomeDetails.issuingAuthority}
                  onChange={handleIncomeChange}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Father's Occupation</label>
                <input
                  type="text"
                  name="fatherOccupation"
                  className="form-control"
                  value={formData.incomeDetails.fatherOccupation}
                  onChange={handleIncomeChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Bank Details */}
        {currentStep === 4 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 4: DBT Bank Account Details</h5>
            <div className="alert alert-info py-2 small mb-3">
              Direct Benefit Transfer (DBT) requires your bank account to be linked with your Aadhaar number.
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  className="form-control"
                  value={formData.bankDetails.bankName}
                  onChange={handleBankChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Bank Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  className="form-control"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleBankChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Bank IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  className="form-control"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleBankChange}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Branch Name</label>
                <input
                  type="text"
                  name="branchName"
                  className="form-control"
                  value={formData.bankDetails.branchName}
                  onChange={handleBankChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Documents */}
        {currentStep === 5 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 5: Document Uploads & Verification</h5>
            <p className="text-muted small mb-4">
              All documents are verified digitally and authenticated by your Institute Officer during physical/online scrutiny.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded bg-light">
                  <div className="fw-semibold text-dark small mb-1">1. Aadhaar Card (ID Proof)</div>
                  <span className="badge bg-success-subtle text-success">✓ {formData.documents.aadhaarCard}</span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded bg-light">
                  <div className="fw-semibold text-dark small mb-1">2. Income Certificate</div>
                  <span className="badge bg-success-subtle text-success">✓ {formData.documents.incomeCertificate}</span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded bg-light">
                  <div className="fw-semibold text-dark small mb-1">3. College Bonafide ID / Certificate</div>
                  <span className="badge bg-success-subtle text-success">✓ {formData.documents.bonafideCertificate}</span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded bg-light">
                  <div className="fw-semibold text-dark small mb-1">4. Previous Exam Marksheet</div>
                  <span className="badge bg-success-subtle text-success">✓ {formData.documents.marksheet}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review Summary */}
        {currentStep === 6 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 6: Review Complete Application Summary</h5>
            <div className="bg-light p-4 rounded-3 border">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <span className="text-muted small">Applicant Name:</span>
                  <div className="fw-bold text-dark">{formData.personalDetails.fullName}</div>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted small">Scheme Applied:</span>
                  <div className="fw-bold text-primary">{scholarship?.name}</div>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted small">Institution:</span>
                  <div className="fw-semibold text-dark">{formData.academicDetails.institutionName}</div>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted small">Course & Roll No:</span>
                  <div className="fw-semibold text-dark">{formData.academicDetails.course} ({formData.academicDetails.enrollmentNumber})</div>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted small">Family Income:</span>
                  <div className="fw-bold text-success">₹{Number(formData.incomeDetails.familyAnnualIncome).toLocaleString('en-IN')} / Year</div>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted small">DBT Bank Account:</span>
                  <div className="fw-semibold text-dark">{formData.bankDetails.bankName} - {formData.bankDetails.accountNumber} ({formData.bankDetails.ifscCode})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Final Submit & Declaration */}
        {currentStep === 7 && (
          <div>
            <h5 className="fw-bold text-dark mb-3">Step 7: Final Declaration & Submission</h5>
            <div className="custom-card p-4 bg-light border mb-4">
              <div className="d-flex align-items-start gap-3">
                <input
                  type="checkbox"
                  id="declarationCheck"
                  className="form-check-input mt-1"
                  style={{ width: '20px', height: '20px' }}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="declarationCheck" className="text-dark small leading-relaxed">
                  I hereby declare that the particulars given by me in this online application are true and correct to the best of my knowledge. I understand that if any information is found incorrect or misleading, my scholarship grant will be cancelled immediately and legal recovery proceedings may be initiated.
                </label>
              </div>
            </div>

            <div className="text-center py-3">
              <p className="text-muted small mb-3">
                Once submitted, your application status will become <span className="badge bg-primary">SUBMITTED</span> and queued for your College Institute Officer.
              </p>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submitting || !agreeTerms}
                className="btn btn-success btn-lg px-5 py-2.5 fw-bold shadow"
              >
                {submitting ? 'Submitting Application...' : 'Confirm & Final Submit Application'}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn btn-outline-secondary px-4 d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} />
            <span>Previous Step</span>
          </button>

          {currentStep < 7 && (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary px-4 d-flex align-items-center gap-1 fw-semibold"
            >
              <span>Next: {STEPS[currentStep].name}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ApplyScholarship;
