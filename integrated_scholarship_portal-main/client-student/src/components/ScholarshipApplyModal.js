import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const SUBMISSION_TYPES = [
  {
    id: 'Fresh Application',
    title: 'Fresh Application',
    badge: 'Standard',
    badgeClass: 'bg-primary',
    icon: 'bi-file-earmark-plus',
    description: 'First-time applying for this scholarship scheme for the current academic session.'
  },
  {
    id: 'Renewal Application',
    title: 'Renewal Application',
    badge: 'Continuing',
    badgeClass: 'bg-success',
    icon: 'bi-arrow-repeat',
    description: 'Continuing grant renewal from previous academic year with verified passing marks.'
  },
  {
    id: 'Merit-cum-Means Grant',
    title: 'Merit-cum-Means Grant',
    badge: 'Merit Award',
    badgeClass: 'bg-warning text-dark',
    icon: 'bi-trophy-fill',
    description: 'Special merit quota for top academic percentile and competitive CGPA scorers.'
  },
  {
    id: 'Fast-Track Verification',
    title: 'Fast-Track Verification',
    badge: 'Priority',
    badgeClass: 'bg-info text-dark',
    icon: 'bi-lightning-charge-fill',
    description: 'Expedited verification for students with authentic digital certificates.'
  }
];

const ScholarshipApplyModal = ({ show, scheme, student, reApplyData, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionType, setSubmissionType] = useState('Fresh Application');
  const [declared, setDeclared] = useState(false);

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    annualIncome: '',
    statementOfPurpose: ''
  });

  // Files start as null until explicitly chosen by student or attached via demo button
  const [documents, setDocuments] = useState({
    aadhaar: null,
    incomeCert: null,
    communityCert: null,
    collegeId: null,
    marksheet: null
  });

  useEffect(() => {
    if (!show) return;

    if (reApplyData) {
      setFormData({
        bankName: reApplyData.bankDetails?.bankName || 'State Bank of India',
        accountNumber: reApplyData.bankDetails?.accountNumber || '39482019384',
        ifscCode: reApplyData.bankDetails?.ifscCode || 'SBIN0001234',
        branchName: reApplyData.bankDetails?.branchName || 'Main Branch',
        annualIncome: reApplyData.annualIncome || '250000',
        statementOfPurpose: reApplyData.statementOfPurpose || 'Rectified application with updated verification documents.'
      });
      setSubmissionType(reApplyData.submissionType || 'Fast-Track Verification');
    } else {
      setFormData({
        bankName: 'State Bank of India',
        accountNumber: '39482019384',
        ifscCode: 'SBIN0001234',
        branchName: (student?.address?.city ? `${student.address.city} Branch` : 'Main Branch'),
        annualIncome: '250000',
        statementOfPurpose: 'Seeking financial grant to support higher education tuition fees.'
      });
      setSubmissionType('Fresh Application');
    }

    setCurrentStep(1);
    setDeclared(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, scheme?.id, reApplyData]);

  if (!show || !scheme) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setDocuments((prev) => ({
        ...prev,
        [name]: files[0].name
      }));
    }
  };

  const handleAutoFillDemo = () => {
    setFormData({
      bankName: 'State Bank of India',
      accountNumber: '39482019384',
      ifscCode: 'SBIN0004567',
      branchName: 'University Campus Branch',
      annualIncome: '240000',
      statementOfPurpose: 'Seeking financial grant to fund final year engineering project materials and university examination fees.'
    });
    setDocuments({
      aadhaar: 'Aadhaar_Card_Verified.pdf',
      incomeCert: 'Income_Certificate_Verified.pdf',
      communityCert: 'Community_Certificate_Verified.pdf',
      collegeId: 'College_Bonafide_ID_Verified.pdf',
      marksheet: 'UG_Semester_Marksheet_Verified.pdf'
    });
    setDeclared(true);
    Swal.fire({
      icon: 'success',
      title: 'Sample Data & Documents Loaded',
      text: 'Verified DBT bank details and sample certificates attached for demonstration.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleAttachDemoDocsOnly = () => {
    setDocuments({
      aadhaar: 'Aadhaar_Card_Verified.pdf',
      incomeCert: 'Income_Certificate_Verified.pdf',
      communityCert: 'Community_Certificate_Verified.pdf',
      collegeId: 'College_Bonafide_ID_Verified.pdf',
      marksheet: 'UG_Semester_Marksheet_Verified.pdf'
    });
    Swal.fire({
      icon: 'success',
      title: 'Digital Certificates Attached',
      text: 'Standard verified digital documents have been attached for testing.',
      timer: 1200,
      showConfirmButton: false
    });
  };

  // Validation to verify all mandatory details and documents are completed
  const isAllMandatoryFilled = () => {
    const hasBank =
      Boolean(formData.bankName && formData.bankName.trim()) &&
      Boolean(formData.accountNumber && formData.accountNumber.trim()) &&
      Boolean(formData.ifscCode && formData.ifscCode.trim()) &&
      Boolean(formData.branchName && formData.branchName.trim());

    const hasIncome =
      Boolean(formData.annualIncome && formData.annualIncome.toString().trim()) &&
      Boolean(formData.statementOfPurpose && formData.statementOfPurpose.trim());

    const attachedDocsCount = [
      documents.aadhaar,
      documents.incomeCert,
      documents.collegeId,
      documents.marksheet
    ].filter(Boolean).length;

    const hasDocs = attachedDocsCount === 4;
    const hasDecl = Boolean(declared);

    return {
      hasBank,
      hasIncome,
      hasDocs,
      attachedDocsCount,
      hasDecl,
      canSubmit: hasBank && hasIncome && hasDocs && hasDecl
    };
  };

  const readiness = isAllMandatoryFilled();

  const handleNext = () => {
    if (currentStep === 2) {
      if (!formData.bankName || !formData.accountNumber || !formData.ifscCode || !formData.annualIncome) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Fields Missing',
          text: 'Please complete Bank Name, Account Number, IFSC Code, and Annual Income to proceed.',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!readiness.canSubmit) {
      Swal.fire({
        icon: 'warning',
        title: 'Submission Requirements Not Met',
        text: 'Please choose all 4 mandatory files (Aadhaar, Income Cert, College ID, Marksheet) and confirm the declaration.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    const refNo = `NSP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const applicationPayload = {
      refNo,
      schemeId: scheme.id,
      schemeCode: scheme.code,
      schemeTitle: scheme.title,
      amount: scheme.amount,
      submissionType,
      studentName: student?.fullName || 'Student Applicant',
      studentEmail: student?.email || '',
      studentPhone: student?.phone || '',
      gender: student?.gender || 'All',
      category: student?.category || 'General',
      collegeName: student?.college?.collegeName || 'National Engineering College',
      department: student?.college?.department || 'Computer Science & Engineering',
      registerNumber: student?.college?.registerNumber || 'REG-2026-001',
      ugCgpa: Number(student?.academic?.ug?.cgpa || 8.0),
      hscPercentage: Number(student?.academic?.hsc?.percentage || 80),
      appliedAt: new Date().toISOString(),
      bankDetails: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName
      },
      annualIncome: formData.annualIncome,
      statementOfPurpose: formData.statementOfPurpose,
      submittedDocuments: {
        aadhaar: documents.aadhaar || 'Aadhaar_Card.pdf',
        incomeCert: documents.incomeCert || 'Income_Certificate.pdf',
        communityCert: documents.communityCert || 'Community_Certificate.pdf',
        collegeId: documents.collegeId || 'College_Bonafide_ID.pdf',
        marksheet: documents.marksheet || 'Marksheet_Copy.pdf'
      }
    };

    onSubmit(applicationPayload);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1055, overflowY: 'auto' }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered my-3 my-sm-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden d-flex flex-column" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          
          {/* Modal Header */}
          <div className="modal-header text-white p-3 p-sm-4 flex-shrink-0" style={{ background: reApplyData ? 'linear-gradient(135deg, #d90429, #ef233c, #b00020)' : 'linear-gradient(135deg, #0d6efd, #0b5ed7, #0a58ca)' }}>
            <div className="d-flex align-items-center flex-grow-1 pe-2">
              <div className="bg-white text-primary rounded-circle p-2 me-2 me-sm-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                <i className={`bi ${reApplyData ? 'bi-arrow-repeat text-danger' : 'bi-award-fill text-warning'} fs-4`}></i>
              </div>
              <div className="overflow-hidden">
                <div className="d-flex flex-wrap align-items-center gap-1 gap-sm-2 mb-1">
                  <span className="badge bg-warning text-dark fw-bold px-2 py-1 rounded-pill small">
                    {scheme.code} Scheme
                  </span>
                  <span className="badge bg-white text-primary fw-bold px-2 py-1 rounded-pill small">
                    {scheme.amount}
                  </span>
                  {reApplyData && (
                    <span className="badge bg-white text-danger fw-bold px-2 py-1 rounded-pill small">
                      Re-Application Mode
                    </span>
                  )}
                </div>
                <h5 className="modal-title fw-bold text-white mb-0 fs-6 fs-sm-5 text-truncate">{scheme.title}</h5>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white flex-shrink-0"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white border-bottom px-3 px-sm-4 py-2 py-sm-3 flex-shrink-0">
            <div className="row text-center g-2">
              <div className="col-4">
                <div className={`p-2 rounded-3 border transition-all ${currentStep === 1 ? 'bg-primary text-white border-primary shadow-sm' : currentStep > 1 ? 'bg-success-subtle text-success border-success' : 'bg-light text-muted'}`}>
                  <i className={`bi ${currentStep > 1 ? 'bi-check-circle-fill' : 'bi-1-circle-fill'} me-1`}></i>
                  <span className="fw-bold small d-none d-sm-inline"> 1. Submission Type</span>
                  <span className="fw-bold small d-sm-none"> 1. Type</span>
                </div>
              </div>
              <div className="col-4">
                <div className={`p-2 rounded-3 border transition-all ${currentStep === 2 ? 'bg-primary text-white border-primary shadow-sm' : currentStep > 2 ? 'bg-success-subtle text-success border-success' : 'bg-light text-muted'}`}>
                  <i className={`bi ${currentStep > 2 ? 'bi-check-circle-fill' : 'bi-2-circle-fill'} me-1`}></i>
                  <span className="fw-bold small d-none d-sm-inline"> 2. Bank & Income</span>
                  <span className="fw-bold small d-sm-none"> 2. Bank</span>
                </div>
              </div>
              <div className="col-4">
                <div className={`p-2 rounded-3 border transition-all ${currentStep === 3 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-light text-muted'}`}>
                  <i className="bi bi-3-circle-fill me-1"></i>
                  <span className="fw-bold small d-none d-sm-inline"> 3. Documents & Submit</span>
                  <span className="fw-bold small d-sm-none"> 3. Submit</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column overflow-hidden m-0 p-0" style={{ flex: '1 1 auto', minHeight: 0 }}>
            <div className="modal-body p-3 p-sm-4 bg-light overflow-y-auto" style={{ flex: '1 1 auto', minHeight: 0 }}>
              
              {/* Re-Application Mode Banner */}
              {reApplyData && (
                <div className="alert alert-warning border-warning shadow-sm rounded-3 mb-4 p-3">
                  <div className="d-flex align-items-center mb-1">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-2"></i>
                    <strong className="text-dark">Application Rectification & Re-Submission</strong>
                  </div>
                  <p className="mb-1 small text-secondary">
                    Your previous submission (Ref: <strong>{reApplyData.refNo}</strong>) was returned by the State Nodal Officer. Please correct your information/documents and re-submit.
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border border-danger text-danger small">
                    <strong><i className="bi bi-x-octagon-fill me-1"></i> Officer Rejection Remarks:</strong>
                    <p className="mb-0 mt-1 fst-italic">"{reApplyData.remarks || 'Document verification incomplete. Please upload updated certificates.'}"</p>
                  </div>
                </div>
              )}

              {/* STEP 1: Type & Applicant Profile */}
              {currentStep === 1 && (
                <div>
                  {/* Applicant Credentials Summary */}
                  <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-primary mb-0">
                        <i className="bi bi-person-check-fill me-2"></i>
                        Applicant Verified Profile
                      </h6>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={handleAutoFillDemo}
                      >
                        <i className="bi bi-magic me-1"></i> Auto-Fill Sample Data
                      </button>
                    </div>
                    <div className="row g-2 small text-secondary">
                      <div className="col-12 col-md-4">
                        <strong>Full Name:</strong> <span className="text-dark fw-semibold">{student?.fullName || 'Student Applicant'}</span>
                      </div>
                      <div className="col-12 col-md-4">
                        <strong>Email:</strong> <span className="text-dark fw-semibold">{student?.email || 'N/A'}</span>
                      </div>
                      <div className="col-12 col-md-4">
                        <strong>Phone:</strong> <span className="text-dark fw-semibold">{student?.phone || 'N/A'}</span>
                      </div>
                      <div className="col-12 col-md-4">
                        <strong>College:</strong> <span className="text-dark fw-semibold">{student?.college?.collegeName || 'National Engineering College'}</span>
                      </div>
                      <div className="col-12 col-md-4">
                        <strong>Register No:</strong> <span className="text-dark fw-semibold">{student?.college?.registerNumber || 'REG-2026'}</span>
                      </div>
                      <div className="col-12 col-md-4">
                        <strong>UG CGPA:</strong> <span className="text-success fw-bold">{student?.academic?.ug?.cgpa || '8.2'} / 10.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Type Cards */}
                  <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bold text-dark mb-0">
                        <i className="bi bi-ui-checks-grid me-2 text-primary"></i>
                        Select Scholarship Application Category <span className="text-danger">*</span>
                      </h6>
                      <span className="badge bg-primary text-white fw-semibold px-3 py-1 rounded-pill">
                        {submissionType}
                      </span>
                    </div>

                    <div className="row g-3">
                      {SUBMISSION_TYPES.map((type) => {
                        const isSelected = submissionType === type.id;
                        return (
                          <div className="col-12 col-md-6" key={type.id}>
                            <div
                              className={`p-3 rounded-3 border h-100 position-relative ${
                                isSelected
                                  ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                                  : 'border-light-subtle bg-white hover-shadow'
                              }`}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                borderWidth: isSelected ? '2px' : '1px'
                              }}
                              onClick={() => setSubmissionType(type.id)}
                            >
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center">
                                  <div
                                    className={`rounded-circle p-2 me-2 d-flex align-items-center justify-content-center ${
                                      isSelected ? 'bg-primary text-white' : 'bg-light text-secondary'
                                    }`}
                                    style={{ width: '32px', height: '32px' }}
                                  >
                                    <i className={`bi ${type.icon} small`}></i>
                                  </div>
                                  <h6 className={`fw-bold mb-0 ${isSelected ? 'text-primary' : 'text-dark'}`}>
                                    {type.title}
                                  </h6>
                                </div>
                                <span className={`badge ${type.badgeClass} rounded-pill px-2 py-1 small`}>
                                  {type.badge}
                                </span>
                              </div>
                              <p className="text-secondary small mb-0 ps-1" style={{ fontSize: '0.82rem' }}>
                                {type.description}
                              </p>
                              <div className="position-absolute bottom-0 end-0 p-2">
                                <input
                                  type="radio"
                                  name="submissionType"
                                  value={type.id}
                                  checked={isSelected}
                                  onChange={() => setSubmissionType(type.id)}
                                  className="form-check-input"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DBT Bank Account & Financial Details */}
              {currentStep === 2 && (
                <div>
                  <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="bi bi-bank me-2 text-primary"></i>
                      Direct Benefit Transfer (DBT) Bank Account Details
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Bank Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="bankName"
                          placeholder="e.g. State Bank of India"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Account Number <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="accountNumber"
                          placeholder="Enter Bank Account No."
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary">IFSC Code <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="ifscCode"
                          placeholder="e.g. SBIN0001234"
                          value={formData.ifscCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Branch Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="branchName"
                          placeholder="Branch Location"
                          value={formData.branchName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="bi bi-cash-stack me-2 text-primary"></i>
                      Annual Income & Statement of Purpose
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary">Family Annual Income (₹) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          name="annualIncome"
                          placeholder="e.g. 250000"
                          value={formData.annualIncome}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">Statement of Purpose / Reason for Applying <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows="2"
                          name="statementOfPurpose"
                          placeholder="Briefly state why you require financial assistance for your education..."
                          value={formData.statementOfPurpose}
                          onChange={handleInputChange}
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Document Uploads & Declaration */}
              {currentStep === 3 && (
                <div>
                  <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-file-earmark-arrow-up me-2 text-primary"></i>
                          Upload Verification Documents (4 Required)
                        </h6>
                        <small className="text-muted">Choose your PDF or Image files to attach</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={handleAttachDemoDocsOnly}
                      >
                        <i className="bi bi-paperclip me-1"></i> Auto-Attach Sample Files
                      </button>
                    </div>
                    
                    <div className="row g-3">
                      {/* Document 1: Aadhaar Card */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                          <span>1. Aadhaar Card <span className="text-danger">*</span></span>
                          {documents.aadhaar ? (
                            <span className="badge bg-success-subtle text-success border border-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Attached
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border small">
                              No file chosen
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="aadhaar"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        {documents.aadhaar && (
                          <div className="form-text text-success small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-file-earmark-check me-1"></i> {documents.aadhaar}
                          </div>
                        )}
                      </div>

                      {/* Document 2: Income Certificate */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                          <span>2. Income Certificate <span className="text-danger">*</span></span>
                          {documents.incomeCert ? (
                            <span className="badge bg-success-subtle text-success border border-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Attached
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border small">
                              No file chosen
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="incomeCert"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        {documents.incomeCert && (
                          <div className="form-text text-success small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-file-earmark-check me-1"></i> {documents.incomeCert}
                          </div>
                        )}
                      </div>

                      {/* Document 3: Community Certificate */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                          <span>3. Community / Caste Certificate</span>
                          {documents.communityCert ? (
                            <span className="badge bg-success-subtle text-success border border-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Attached
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border small">
                              Optional
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="communityCert"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        {documents.communityCert && (
                          <div className="form-text text-success small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-file-earmark-check me-1"></i> {documents.communityCert}
                          </div>
                        )}
                      </div>

                      {/* Document 4: College Bonafide / ID */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                          <span>4. College Bonafide / ID <span className="text-danger">*</span></span>
                          {documents.collegeId ? (
                            <span className="badge bg-success-subtle text-success border border-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Attached
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border small">
                              No file chosen
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="collegeId"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        {documents.collegeId && (
                          <div className="form-text text-success small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-file-earmark-check me-1"></i> {documents.collegeId}
                          </div>
                        )}
                      </div>

                      {/* Document 5: Marksheet Copy */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                          <span>5. Marksheet (10th / 12th / UG Sem) <span className="text-danger">*</span></span>
                          {documents.marksheet ? (
                            <span className="badge bg-success-subtle text-success border border-success small fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i> Attached
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border small">
                              No file chosen
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          name="marksheet"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        {documents.marksheet && (
                          <div className="form-text text-success small" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-file-earmark-check me-1"></i> {documents.marksheet}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Submission Readiness Checklist */}
                  <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-3">
                    <h6 className="fw-bold text-dark small mb-2">
                      <i className="bi bi-shield-check me-2 text-primary"></i>
                      Application Mandatory Completion Checklist
                    </h6>
                    <div className="row g-2 small">
                      <div className="col-12 col-md-4">
                        <div className={`p-2 rounded-2 border d-flex align-items-center justify-content-between ${readiness.hasBank ? 'bg-success-subtle text-success border-success' : 'bg-danger-subtle text-danger border-danger'}`}>
                          <span>1. DBT Bank Details</span>
                          <i className={`bi ${readiness.hasBank ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className={`p-2 rounded-2 border d-flex align-items-center justify-content-between ${readiness.hasDocs ? 'bg-success-subtle text-success border-success' : 'bg-danger-subtle text-danger border-danger'}`}>
                          <span>2. Documents ({readiness.attachedDocsCount}/4)</span>
                          <i className={`bi ${readiness.hasDocs ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className={`p-2 rounded-2 border d-flex align-items-center justify-content-between ${readiness.hasDecl ? 'bg-success-subtle text-success border-success' : 'bg-warning-subtle text-dark border-warning'}`}>
                          <span>3. Student Declaration</span>
                          <i className={`bi ${readiness.hasDecl ? 'bi-check-circle-fill' : 'bi-dash-circle-fill'}`}></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Declaration */}
                  <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4 border-start border-4 border-warning">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="declarationCheck"
                        style={{ width: '1.25em', height: '1.25em', cursor: 'pointer' }}
                        checked={declared}
                        onChange={(e) => setDeclared(e.target.checked)}
                      />
                      <label className="form-check-label small text-secondary ps-2" htmlFor="declarationCheck" style={{ cursor: 'pointer' }}>
                        <strong>Student Declaration:</strong> I hereby certify that all information submitted in this application form and attached certificates are authentic and accurate. I authorize the State Nodal Authority to verify my bank account for DBT grant disbursement.
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Navigation Footer */}
            <div className="modal-footer bg-white p-3 border-top flex-shrink-0 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2" style={{ position: 'sticky', bottom: 0, zIndex: 10, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
              <div className="d-flex justify-content-between align-items-center w-100 w-sm-auto mb-2 mb-sm-0">
                <span className="badge bg-secondary-subtle text-secondary me-2 text-truncate" style={{ maxWidth: '160px' }}>
                  <i className="bi bi-tag-fill me-1"></i> {submissionType}
                </span>
                <span className="badge bg-light text-muted border small">
                  Step {currentStep} of 3
                </span>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto">
                {currentStep === 1 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4 w-100 w-sm-auto order-2 order-sm-1"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm w-100 w-sm-auto order-1 order-sm-2"
                      onClick={handleNext}
                    >
                      Next: DBT Bank Details <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4 w-100 w-sm-auto order-2 order-sm-1"
                      onClick={handlePrev}
                    >
                      <i className="bi bi-arrow-left me-1"></i> Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm w-100 w-sm-auto order-1 order-sm-2"
                      onClick={handleNext}
                    >
                      Next: Documents & Submit <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4 w-100 w-sm-auto order-2 order-sm-1"
                      onClick={handlePrev}
                    >
                      <i className="bi bi-arrow-left me-1"></i> Back
                    </button>
                    {readiness.canSubmit ? (
                      <button
                        type="submit"
                        className="btn btn-success rounded-pill px-4 px-sm-5 fw-bold shadow-sm w-100 w-sm-auto order-1 order-sm-2"
                      >
                        <i className="bi bi-check-circle-fill me-2"></i> {reApplyData ? 'Re-Submit Application' : `Submit Application`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary rounded-pill px-3 px-sm-4 fw-semibold w-100 w-sm-auto order-1 order-sm-2"
                        disabled
                        style={{ opacity: 0.65, cursor: 'not-allowed' }}
                        title="Please choose all 4 required files and check the student declaration to enable submission."
                      >
                        <i className="bi bi-lock-fill me-2"></i> Attach 4 Docs ({readiness.attachedDocsCount}/4)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ScholarshipApplyModal;
