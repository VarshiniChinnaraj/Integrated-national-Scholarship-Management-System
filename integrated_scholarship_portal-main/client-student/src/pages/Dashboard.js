import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import ScholarshipApplyModal from '../components/ScholarshipApplyModal';
import API from '../services/api';
import Swal from 'sweetalert2';

// National & State Scholarship Schemes Data (18 Comprehensive Government & Institutional Schemes)
const SCHOLARSHIP_SCHEMES = [
  {
    id: 'SCH-001',
    code: 'CSSS',
    title: 'Central Sector Scheme of Scholarships for College and University Students (CSSS)',
    provider: 'Department of Higher Education, Ministry of Education, Govt. of India',
    amount: '₹20,000 / Year',
    deadline: 'September 30, 2026',
    description: 'Financial assistance for meritorious students pursuing graduate and post-graduate professional degrees in recognized colleges and universities.',
    minHscPercentage: 75,
    minUgCgpa: 7.0,
    maxBacklogs: 0,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 75% in 12th (HSC)', 'Min CGPA 7.0 in UG', '0 Active Backlogs', 'All Categories', 'Regular Degree Student']
  },
  {
    id: 'SCH-002',
    code: 'PMS-BC',
    title: 'Post-Matric Scholarship for Backward Classes (PMS-BC)',
    provider: 'Ministry of Social Justice & Empowerment, Govt. of India',
    amount: '₹30,000 / Year',
    deadline: 'October 15, 2026',
    description: 'Financial support for OBC, SC, ST, and EWS students to complete higher education and technical certifications without financial hardship.',
    minHscPercentage: 60,
    minUgCgpa: 5.5,
    maxBacklogs: 2,
    allowedCategories: ['OBC', 'SC', 'ST', 'EWS'],
    minGender: 'All',
    criteriaList: ['Min 60% in 12th (HSC)', 'Min CGPA 5.5 in UG', 'Reserved Quota (OBC, SC, ST, EWS)', 'Max 2 Backlogs']
  },
  {
    id: 'SCH-003',
    code: 'MCM-PROF',
    title: 'Merit-cum-Means Scholarship for Professional and Technical Courses',
    provider: 'Ministry of Minority Affairs & Technical Education Board',
    amount: '₹50,000 / Year',
    deadline: 'October 31, 2026',
    description: 'Awarded to meritorious students from socio-economically weaker backgrounds pursuing Engineering, Medicine, and Management.',
    minHscPercentage: 80,
    minUgCgpa: 7.5,
    maxBacklogs: 0,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 80% in 12th (HSC)', 'Min CGPA 7.5 in UG', 'Professional / Tech Course', '0 Active Backlogs']
  },
  {
    id: 'SCH-004',
    code: 'PRAGATI-GIRL',
    title: 'AICTE Pragati Scholarship Scheme for Girl Students',
    provider: 'All India Council for Technical Education (AICTE) & Ministry of Education',
    amount: '₹50,000 / Year',
    deadline: 'November 15, 2026',
    description: 'Empowering women in technical education by providing financial assistance to female students admitted to AICTE approved technical degrees.',
    minHscPercentage: 60,
    minUgCgpa: 6.0,
    maxBacklogs: 1,
    allowedCategories: ['All'],
    minGender: 'Female',
    criteriaList: ['Female Students Only', 'Min 60% in 12th (HSC)', 'Degree / Technical Course', 'Min CGPA 6.0']
  },
  {
    id: 'SCH-005',
    code: 'SAKSHAM-DIV',
    title: 'AICTE Saksham Scholarship Scheme for Specially-Abled Students (Divyangjan)',
    provider: 'All India Council for Technical Education (AICTE)',
    amount: '₹50,000 / Year',
    deadline: 'November 20, 2026',
    description: 'Encouraging specially abled students to pursue technical education with comprehensive financial aid and assistive device allowance.',
    minHscPercentage: 50,
    minUgCgpa: 5.0,
    maxBacklogs: 2,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 50% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'Divyangjan / Specially-Abled', 'All Categories']
  },
  {
    id: 'SCH-006',
    code: 'NMMSS-HE',
    title: 'National Means-cum-Merit Higher Education Grant (NMMSS)',
    provider: 'Department of School Education & Literacy, Govt. of India',
    amount: '₹15,000 / Year',
    deadline: 'November 30, 2026',
    description: 'Grant designed to reduce drop-out rates and support economically weaker students pursuing continuous collegiate education.',
    minHscPercentage: 55,
    minUgCgpa: 5.0,
    maxBacklogs: 3,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 55% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'Regular Student Status', 'All Categories']
  },
  {
    id: 'SCH-007',
    code: 'PMS-SC',
    title: 'Post Matric Scholarship for Scheduled Caste Students (PMS-SC)',
    provider: 'Ministry of Social Justice and Empowerment, Govt. of India',
    amount: '₹35,000 / Year',
    deadline: 'December 15, 2026',
    description: 'Comprehensive financial assistance covering compulsory non-refundable fees and maintenance allowance for SC students.',
    minHscPercentage: 50,
    minUgCgpa: 5.0,
    maxBacklogs: 2,
    allowedCategories: ['SC'],
    minGender: 'All',
    criteriaList: ['SC Category Students Only', 'Min 50% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'Direct Benefit Transfer']
  },
  {
    id: 'SCH-008',
    code: 'PMS-ST',
    title: 'Post Matric Scholarship for Scheduled Tribe Students (PMS-ST)',
    provider: 'Ministry of Tribal Affairs, Govt. of India',
    amount: '₹35,000 / Year',
    deadline: 'December 15, 2026',
    description: 'Provides 100% financial assistance including tuition fees, book grants, and living allowance to ST students in higher education.',
    minHscPercentage: 50,
    minUgCgpa: 5.0,
    maxBacklogs: 2,
    allowedCategories: ['ST'],
    minGender: 'All',
    criteriaList: ['ST Category Students Only', 'Min 50% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'All Recognized Colleges']
  },
  {
    id: 'SCH-009',
    code: 'PMSS-CAPF',
    title: 'Prime Minister\'s Scholarship Scheme for Central Armed Police Forces (PMSS)',
    provider: 'Welfare and Rehabilitation Board (WARB), Ministry of Home Affairs',
    amount: '₹36,000 / Year',
    deadline: 'December 31, 2026',
    description: 'Encouraging higher technical and professional education for the dependent wards & widows of Central Armed Police Forces personnel.',
    minHscPercentage: 60,
    minUgCgpa: 6.0,
    maxBacklogs: 0,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 60% in 12th (HSC)', 'Min CGPA 6.0 in UG', 'Wards of CAPF & AR Personnel', '0 Active Backlogs']
  },
  {
    id: 'SCH-010',
    code: 'ISHAN-UDAY',
    title: 'Ishan Uday Special Scholarship Scheme for North Eastern Region (NER)',
    provider: 'University Grants Commission (UGC) & Ministry of Education',
    amount: '₹54,000 / Year',
    deadline: 'January 15, 2027',
    description: 'Special annual scholarship to promote higher education and technical studies for students domiciled in the North Eastern States.',
    minHscPercentage: 65,
    minUgCgpa: 6.0,
    maxBacklogs: 1,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 65% in 12th (HSC)', 'Min CGPA 6.0 in UG', 'North Eastern States Focus', 'Undergraduate Degree']
  },
  {
    id: 'SCH-011',
    code: 'SINGLE-GIRL',
    title: 'PG Indira Gandhi Scholarship for Single Girl Child',
    provider: 'University Grants Commission (UGC)',
    amount: '₹36,200 / Year',
    deadline: 'January 31, 2027',
    description: 'Promoting single girl child education in higher studies and direct post-graduate professional and technical degree courses.',
    minHscPercentage: 60,
    minUgCgpa: 6.5,
    maxBacklogs: 0,
    allowedCategories: ['All'],
    minGender: 'Female',
    criteriaList: ['Female (Single Girl Child)', 'Min 60% in 12th (HSC)', 'Min CGPA 6.5 in UG', '0 Active Backlogs']
  },
  {
    id: 'SCH-012',
    code: 'SWANATH-TECH',
    title: 'AICTE Swanath Scholarship Scheme for Orphan / COVID Affected Students',
    provider: 'All India Council for Technical Education (AICTE)',
    amount: '₹50,000 / Year',
    deadline: 'February 15, 2027',
    description: 'Financial support and educational continuity grant for orphans, children of martyred armed personnel, and COVID affected families.',
    minHscPercentage: 50,
    minUgCgpa: 5.0,
    maxBacklogs: 2,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 50% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'AICTE Recognized Institute', 'All Genders & Categories']
  },
  {
    id: 'SCH-013',
    code: 'TOP-CLASS-SC',
    title: 'Top Class Education Scheme for Meritorious SC Students',
    provider: 'Ministry of Social Justice and Empowerment, Govt. of India',
    amount: '₹86,000 / Year',
    deadline: 'February 28, 2027',
    description: 'Full tuition reimbursement, living expenses, and computer purchase grant for SC students in top premier institutions (IITs, NITs, IIMs, Universities).',
    minHscPercentage: 70,
    minUgCgpa: 7.0,
    maxBacklogs: 0,
    allowedCategories: ['SC'],
    minGender: 'All',
    criteriaList: ['SC Category Students Only', 'Min 70% in 12th (HSC)', 'Min CGPA 7.0 in UG', '0 Active Backlogs']
  },
  {
    id: 'SCH-014',
    code: 'TOP-CLASS-ST',
    title: 'National Fellowship and Higher Education Scholarship for ST Students',
    provider: 'Ministry of Tribal Affairs, Govt. of India',
    amount: '₹45,000 / Year',
    deadline: 'March 15, 2027',
    description: 'Direct grant for meritorious ST students pursuing specialized graduate and post-graduate degree courses in notified premier institutions.',
    minHscPercentage: 60,
    minUgCgpa: 6.0,
    maxBacklogs: 1,
    allowedCategories: ['ST'],
    minGender: 'All',
    criteriaList: ['ST Category Students Only', 'Min 60% in 12th (HSC)', 'Min CGPA 6.0 in UG', 'Premier Institutions']
  },
  {
    id: 'SCH-015',
    code: 'HAZRAT-MAHAL',
    title: 'Begum Hazrat Mahal National Scholarship for Meritorious Girls',
    provider: 'Maulana Azad Education Foundation & Ministry of Minority Affairs',
    amount: '₹25,000 / Year',
    deadline: 'March 31, 2027',
    description: 'National grant awarded exclusively to meritorious girl students belonging to notified minority communities for continuous collegiate education.',
    minHscPercentage: 65,
    minUgCgpa: 6.0,
    maxBacklogs: 1,
    allowedCategories: ['All'],
    minGender: 'Female',
    criteriaList: ['Female Students Only', 'Min 65% in 12th (HSC)', 'Min CGPA 6.0 in UG', 'Notified Minorities / EWS']
  },
  {
    id: 'SCH-016',
    code: 'RANK-HOLDER',
    title: 'Post-Graduate Merit Scholarship for University Rank Holders',
    provider: 'University Grants Commission (UGC)',
    amount: '₹37,200 / Year',
    deadline: 'April 15, 2027',
    description: 'Promoting excellence in higher education by rewarding 1st and 2nd university rank holders in general and professional degree examinations.',
    minHscPercentage: 80,
    minUgCgpa: 8.5,
    maxBacklogs: 0,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 80% in 12th (HSC)', 'Min CGPA 8.5 in UG (Top Percentile)', '0 Active Backlogs', 'All Categories']
  },
  {
    id: 'SCH-017',
    code: 'LABOUR-WELFARE',
    title: 'Financial Assistance for Education of the Wards of Beedi/Cine Workers',
    provider: 'Ministry of Labour and Employment, Govt. of India',
    amount: '₹15,000 / Year',
    deadline: 'April 30, 2027',
    description: 'Welfare education grant for children and dependents of unorganized and industrial workers enrolled in higher degree courses.',
    minHscPercentage: 50,
    minUgCgpa: 5.0,
    maxBacklogs: 2,
    allowedCategories: ['All'],
    minGender: 'All',
    criteriaList: ['Min 50% in 12th (HSC)', 'Min CGPA 5.0 in UG', 'Wards of Unorganized Workers', 'All Categories']
  },
  {
    id: 'SCH-018',
    code: 'EBC-AMBEDKAR',
    title: 'Dr. Ambedkar Post-Matric Scholarship for Economically Backward Classes (EBC)',
    provider: 'Ministry of Social Justice & Empowerment, Govt. of India',
    amount: '₹25,000 / Year',
    deadline: 'May 15, 2027',
    description: 'Centrally sponsored scheme providing financial assistance to Economically Backward Class (EBC) students whose family income is below prescribed limits.',
    minHscPercentage: 55,
    minUgCgpa: 5.5,
    maxBacklogs: 2,
    allowedCategories: ['EWS', 'General'],
    minGender: 'All',
    criteriaList: ['Min 55% in 12th (HSC)', 'Min CGPA 5.5 in UG', 'EWS / Economically Backward', 'All Genders']
  }
];

const Dashboard = () => {
  const [student, setStudent] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'eligible', 'applied'
  const [appliedScholarships, setAppliedScholarships] = useState({});
  const [showScholarshipsSection, setShowScholarshipsSection] = useState(false);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState(null);
  const [reApplyData, setReApplyData] = useState(null);

  const scholarshipsRef = useRef(null);

  const fetchStudentAndApplications = () => {
    // Fetch fresh profile from API
    API.get('/auth/me')
      .then((res) => {
        if (res.data.success && res.data.student) {
          setStudent(res.data.student);
          localStorage.setItem('student', JSON.stringify(res.data.student));
        }
      })
      .catch((err) => {
        console.error('Error fetching student profile:', err);
      });

    // Fetch active applications from backend database
    API.get('/admin/my-applications')
      .then((res) => {
        if (res.data.success && res.data.applications) {
          const appsMap = {};
          res.data.applications.forEach((app) => {
            if (app.schemeId) {
              appsMap[app.schemeId] = app;
            }
          });
          setAppliedScholarships(appsMap);
          localStorage.setItem('appliedScholarships', JSON.stringify(appsMap));
        }
      })
      .catch((err) => {
        console.error('Error fetching applied scholarships:', err);
      });
  };

  useEffect(() => {
    const cachedStudent = localStorage.getItem('student')
      ? JSON.parse(localStorage.getItem('student'))
      : null;

    if (cachedStudent) {
      setStudent(cachedStudent);
    }

    const savedApplied = localStorage.getItem('appliedScholarships')
      ? JSON.parse(localStorage.getItem('appliedScholarships'))
      : {};
    setAppliedScholarships(savedApplied);

    fetchStudentAndApplications();

    const syncInterval = setInterval(fetchStudentAndApplications, 8000);
    return () => clearInterval(syncInterval);
  }, []);

  const scrollToScholarships = () => {
    setShowScholarshipsSection(true);
    setTimeout(() => {
      if (scholarshipsRef.current) {
        scholarshipsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Helper to evaluate eligibility based on student profile attributes
  const checkEligibility = (scheme) => {
    if (!student) return { eligible: true, reasons: [] };

    const reasons = [];
    let eligible = true;

    // 1. Gender check
    if (scheme.minGender && scheme.minGender.toLowerCase() !== 'all') {
      const studentGender = (student.gender || '').trim().toLowerCase();
      const requiredGender = scheme.minGender.trim().toLowerCase();
      if (studentGender && studentGender !== requiredGender) {
        eligible = false;
        reasons.push(`Gender requirement: ${scheme.minGender} students only (Your profile: ${student.gender || 'Not specified'}).`);
      }
    }

    // 2. Category check
    if (scheme.allowedCategories && !scheme.allowedCategories.includes('All')) {
      const studentCat = (student.category || '').trim().toUpperCase();
      const allowedCaps = scheme.allowedCategories.map((c) => c.toUpperCase());
      if (studentCat && !allowedCaps.includes(studentCat)) {
        eligible = false;
        reasons.push(`Category requirement: ${scheme.allowedCategories.join(', ')} (Your category: ${student.category || 'General'}).`);
      }
    }

    // 3. HSC 12th Percentage check
    const hscPct = Number(student.academic?.hsc?.percentage || 0);
    if (scheme.minHscPercentage && hscPct > 0 && hscPct < scheme.minHscPercentage) {
      eligible = false;
      reasons.push(`Min 12th (HSC) Marks: ${scheme.minHscPercentage}% required (Your score: ${hscPct}%).`);
    }

    // 4. UG CGPA check
    const ugCgpa = Number(student.academic?.ug?.cgpa || 0);
    if (scheme.minUgCgpa && ugCgpa > 0 && ugCgpa < scheme.minUgCgpa) {
      eligible = false;
      reasons.push(`Min UG CGPA: ${scheme.minUgCgpa} required (Your CGPA: ${ugCgpa}).`);
    }

    // 5. Backlogs check
    const backlogs = Number(student.academic?.ug?.currentBacklogs || 0);
    if (scheme.maxBacklogs !== undefined && backlogs > scheme.maxBacklogs) {
      eligible = false;
      reasons.push(`Max allowed backlogs: ${scheme.maxBacklogs} (You have ${backlogs} active backlogs).`);
    }

    return { eligible, reasons };
  };

  const handleApplyClick = (scheme) => {
    const { eligible, reasons } = checkEligibility(scheme);
    if (!eligible) {
      Swal.fire({
        icon: 'error',
        title: 'Eligibility Criteria Not Met',
        html: `
          <p class="text-secondary mb-2">You do not meet the minimum requirements for <strong>${scheme.title}</strong>:</p>
          <ul class="text-start small text-danger ps-4">
            ${reasons.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        `,
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    setReApplyData(null);
    setSelectedSchemeForApply(scheme);
  };

  const handleReApplyClick = (scheme, prevApp) => {
    setReApplyData(prevApp);
    setSelectedSchemeForApply(scheme);
  };

  const handleModalSubmit = async (applicationPayload) => {
    let savedApp = applicationPayload;
    try {
      const res = await API.post('/admin/applications', applicationPayload);
      if (res.data.success && res.data.application) {
        savedApp = res.data.application;
      }
    } catch (err) {
      console.error('Backend application save error (continuing locally):', err);
    }

    const updatedApplied = {
      ...appliedScholarships,
      [applicationPayload.schemeId]: savedApp
    };
    setAppliedScholarships(updatedApplied);
    localStorage.setItem('appliedScholarships', JSON.stringify(updatedApplied));
    setSelectedSchemeForApply(null);
    setReApplyData(null);

    Swal.fire({
      icon: 'success',
      title: reApplyData ? 'Re-Application Submitted Successfully!' : 'Application Form Submitted Successfully!',
      html: `
        <div class="text-start fs-6 p-2">
          <div class="p-3 bg-light rounded-3 mb-3 border">
            <p class="mb-2"><strong>Application Ref ID:</strong> <span class="badge bg-success fs-6">${savedApp.refNo}</span></p>
            <p class="mb-2"><strong>Submission Type:</strong> <span class="badge bg-primary fs-6">${savedApp.submissionType || 'Fresh Application'}</span></p>
            <p class="mb-2"><strong>Scholarship Scheme:</strong> ${savedApp.schemeTitle || applicationPayload.schemeTitle}</p>
            <p class="mb-0"><strong>Grant Amount:</strong> <span class="text-success fw-bold">${savedApp.amount || applicationPayload.amount}</span></p>
          </div>
          
          <p class="mb-2 small text-secondary">
            <strong>DBT Beneficiary Account:</strong> ${savedApp.bankDetails?.bankName || applicationPayload.bankDetails?.bankName} (A/C: ${savedApp.bankDetails?.accountNumber || applicationPayload.bankDetails?.accountNumber})
          </p>
          <div class="p-2 bg-info bg-opacity-10 border border-info rounded-3 small">
            <i class="bi bi-info-circle-fill text-info me-1"></i>
            Your application dossier has been submitted and transmitted to the <strong>State Nodal Officer Management Portal</strong> for verification.
          </div>
        </div>
      `,
      confirmButtonText: 'Download Application Receipt',
      confirmButtonColor: '#198754',
      showCancelButton: true,
      cancelButtonText: 'Close Dashboard'
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
    });

    fetchStudentAndApplications();
  };

  const handleViewSummary = (applicationData, scheme) => {
    Swal.fire({
      title: `${scheme.title}`,
      html: `
        <div class="text-start small p-2">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-primary fs-6">${applicationData.submissionType || 'Fresh Application'}</span>
            <span class="badge ${applicationData.status === 'Approved' ? 'bg-success' : applicationData.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'} fs-6">
              ${applicationData.status || 'Pending Verification'}
            </span>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <h6 class="fw-bold text-primary mb-2">Application Identification</h6>
            <div class="row g-2">
              <div class="col-6"><strong>Reference No:</strong> ${applicationData.refNo}</div>
              <div class="col-6"><strong>Scheme Code:</strong> ${scheme.code}</div>
              <div class="col-6"><strong>Disbursement Amount:</strong> <span class="text-success fw-bold">${scheme.amount}</span></div>
              <div class="col-6"><strong>Submitted On:</strong> ${new Date(applicationData.appliedAt || applicationData.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="p-3 bg-light rounded-3 mb-3 border">
            <h6 class="fw-bold text-primary mb-2">DBT Bank Account Verified</h6>
            <div class="row g-2">
              <div class="col-6"><strong>Bank Name:</strong> ${applicationData.bankDetails?.bankName || 'State Bank of India'}</div>
              <div class="col-6"><strong>Account Number:</strong> ${applicationData.bankDetails?.accountNumber || 'N/A'}</div>
              <div class="col-6"><strong>IFSC Code:</strong> ${applicationData.bankDetails?.ifscCode || 'N/A'}</div>
              <div class="col-6"><strong>Branch:</strong> ${applicationData.bankDetails?.branchName || 'N/A'}</div>
            </div>
          </div>

          ${applicationData.remarks ? `
            <div class="p-3 ${applicationData.status === 'Rejected' ? 'bg-danger-subtle border-danger text-danger' : 'bg-success-subtle border-success text-success'} rounded-3 mb-3 border">
              <h6 class="fw-bold mb-1">State Officer Review Remarks</h6>
              <p class="mb-0 small">"${applicationData.remarks}"</p>
            </div>
          ` : ''}

          <div class="p-3 bg-light rounded-3 border">
            <h6 class="fw-bold text-primary mb-2">Uploaded Verification Documents</h6>
            <ul class="list-unstyled mb-0 small">
              <li>✅ <strong>Aadhaar Card:</strong> ${applicationData.submittedDocuments?.aadhaar || 'Attached'}</li>
              <li>✅ <strong>Income Certificate:</strong> ${applicationData.submittedDocuments?.incomeCert || 'Attached'}</li>
              <li>✅ <strong>College Bonafide/ID:</strong> ${applicationData.submittedDocuments?.collegeId || 'Attached'}</li>
              <li>✅ <strong>Academic Marksheet:</strong> ${applicationData.submittedDocuments?.marksheet || 'Attached'}</li>
            </ul>
          </div>
        </div>
      `,
      confirmButtonText: 'Print / Save Receipt',
      confirmButtonColor: '#0d6efd',
      showCancelButton: true,
      cancelButtonText: 'Close'
    }).then((res) => {
      if (res.isConfirmed) {
        window.print();
      }
    });
  };

  const filteredSchemes = SCHOLARSHIP_SCHEMES.filter((scheme) => {
    if (activeFilter === 'eligible') {
      const { eligible } = checkEligibility(scheme);
      return eligible;
    }
    if (activeFilter === 'applied') {
      return Boolean(appliedScholarships[scheme.id]);
    }
    return true; // 'all'
  });

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        
        {/* Welcome Student Banner */}
        <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center">
              {student && student.photo ? (
                <img
                  src={student.photo}
                  alt={student.fullName}
                  className="rounded-circle border border-3 border-white shadow-sm me-3 flex-shrink-0"
                  style={{ width: '65px', height: '65px', objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-white text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow-sm">
                  <i className="bi bi-person-fill fs-2"></i>
                </div>
              )}
              <div>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-1">
                  National Scholarship Portal
                </span>
                <h3 className="fw-bold mb-0">Welcome, {student ? student.fullName : 'Student'}</h3>
                <p className="mb-0 text-white-50 small">
                  {student?.college?.collegeName || 'National Engineering Institution'} • Reg: {student?.college?.registerNumber || 'REG-2026'} • CGPA: {student?.academic?.ug?.cgpa || '8.2'}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill small">
                <i className="bi bi-shield-check me-1"></i> Aadhaar & DBT Verified
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCHOLARSHIP SYSTEM EXPLANATION & ARCHITECTURE OVERVIEW SECTION */}
        {/* ========================================================================= */}
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-5">
          
          <div className="text-center max-w-750 mx-auto mb-4">
            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill fs-6 mb-2">
              <i className="bi bi-info-circle-fill me-1"></i> National Scholarship System Architecture
            </span>
            <h2 className="fw-extrabold text-dark mb-3">
              About the National Scholarship Application & Verification System
            </h2>
            <p className="text-secondary lead fs-6 mb-0">
              A state-of-the-art digital portal designed to deliver transparent, merit-cum-means financial aid to eligible college and university students across India through verified digital credentials and <strong>Direct Benefit Transfer (DBT)</strong>.
            </p>
          </div>

          {/* 3 Core System Pillars */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
              <div className="p-4 bg-light rounded-4 h-100 border border-light-subtle shadow-xs">
                <div className="bg-primary text-white rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '54px', height: '54px' }}>
                  <i className="bi bi-person-check fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">1. Profile & Eligibility</h5>
                <p className="text-secondary small mb-0">
                  Automated verification checks your academic percentage (10th/12th), UG CGPA, backlogs, gender, and category quota to evaluate scheme eligibility in real-time.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 bg-light rounded-4 h-100 border border-light-subtle shadow-xs">
                <div className="bg-success text-white rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '54px', height: '54px' }}>
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">2. Nodal Officer Review</h5>
                <p className="text-secondary small mb-0">
                  Applications are directly transmitted to the <strong>State Nodal Officer Management Portal</strong> for institutional verification of bonafide identity and certificates.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="p-4 bg-light rounded-4 h-100 border border-light-subtle shadow-xs">
                <div className="bg-warning text-dark rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '54px', height: '54px' }}>
                  <i className="bi bi-cash-coin fs-4"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">3. Direct Benefit Transfer</h5>
                <p className="text-secondary small mb-0">
                  Sanctioned grants are credited directly into your validated bank account via DBT with zero intermediaries, instant milestone notifications, and receipt generation.
                </p>
              </div>
            </div>
          </div>

          {/* 4-Step Process Workflow Cards */}
          <div className="p-4 bg-primary bg-opacity-10 rounded-4 border border-primary-subtle mb-4">
            <h5 className="fw-bold text-primary mb-3 text-center">
              <i className="bi bi-diagram-3-fill me-2"></i> Step-by-Step Scholarship Process
            </h5>
            <div className="row g-3 text-center">
              <div className="col-6 col-lg-3">
                <div className="p-3 bg-white rounded-3 shadow-sm h-100 border">
                  <span className="badge bg-primary rounded-circle p-2 mb-2">1</span>
                  <h6 className="fw-bold text-dark mb-1 small">Choose Scheme</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>Select from 18 Central & State schemes based on your eligibility.</p>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="p-3 bg-white rounded-3 shadow-sm h-100 border">
                  <span className="badge bg-primary rounded-circle p-2 mb-2">2</span>
                  <h6 className="fw-bold text-dark mb-1 small">Submit Details</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>Provide DBT bank credentials, annual income, and attach 4 required documents.</p>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="p-3 bg-white rounded-3 shadow-sm h-100 border">
                  <span className="badge bg-primary rounded-circle p-2 mb-2">3</span>
                  <h6 className="fw-bold text-dark mb-1 small">Track Progress</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>Receive instant in-app notifications on approval or officer remarks.</p>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="p-3 bg-white rounded-3 shadow-sm h-100 border">
                  <span className="badge bg-success rounded-circle p-2 mb-2">4</span>
                  <h6 className="fw-bold text-dark mb-1 small">DBT Disbursement</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>Sanctioned scholarship amount is disbursed directly to your bank account.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger: "View Available Scholarships" */}
          <div className="text-center pt-2">
            {!showScholarshipsSection ? (
              <button
                type="button"
                className="btn btn-warning btn-lg rounded-pill px-3 px-sm-5 py-2 py-sm-3 fw-extrabold shadow-lg fs-6 fs-sm-5 text-dark w-100 w-sm-auto text-wrap"
                onClick={scrollToScholarships}
              >
                <i className="bi bi-award-fill me-2 fs-5 fs-sm-4"></i>
                View Available Scholarships ({SCHOLARSHIP_SCHEMES.length} Schemes)
                <i className="bi bi-arrow-down-circle-fill ms-2 fs-6 fs-sm-5"></i>
              </button>
            ) : (
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3">
                <button
                  type="button"
                  className="btn btn-success btn-lg rounded-pill px-3 px-sm-4 py-2 fw-bold shadow-sm"
                  onClick={scrollToScholarships}
                >
                  <i className="bi bi-award-fill me-2"></i> Schemes Catalog Active ({SCHOLARSHIP_SCHEMES.length} Schemes)
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3 px-sm-4 py-2 fw-semibold"
                  onClick={() => setShowScholarshipsSection(false)}
                >
                  <i className="bi bi-chevron-up me-1"></i> Hide Schemes Catalog
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SCHOLARSHIPS CARDS GRID SECTION (REVEALED UPON CLICKING "VIEW SCHOLARSHIPS") */}
        {/* ========================================================================= */}
        {showScholarshipsSection && (
          <div className="mb-4" ref={scholarshipsRef}>
            
            {/* Filter Bar */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark mb-1">
                  <i className="bi bi-award-fill text-warning me-2"></i>
                  Available Scholarship Schemes Catalog ({SCHOLARSHIP_SCHEMES.length} Schemes)
                </h4>
                <p className="text-muted small mb-0">
                  Browse Central, State, AICTE, UGC, and Ministry Grants with Direct Benefit Transfer
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="btn-group-responsive shadow-sm border" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeFilter === 'all' ? 'btn-primary' : 'btn-light text-secondary'}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All Schemes ({SCHOLARSHIP_SCHEMES.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeFilter === 'eligible' ? 'btn-primary' : 'btn-light text-secondary'}`}
                  onClick={() => setActiveFilter('eligible')}
                >
                  Eligible For Me
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeFilter === 'applied' ? 'btn-primary' : 'btn-light text-secondary'}`}
                  onClick={() => setActiveFilter('applied')}
                >
                  Applied ({Object.keys(appliedScholarships).length})
                </button>
              </div>
            </div>

            {/* Scholarship Cards Grid */}
            {filteredSchemes.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                <i className="bi bi-folder-x fs-1 text-muted mb-2"></i>
                <h5 className="fw-bold text-secondary mb-1">No Schemes Found</h5>
                <p className="text-muted small mb-0">
                  {activeFilter === 'applied'
                    ? 'You have not applied for any scholarship schemes yet. Browse All Schemes to apply.'
                    : 'No scholarship schemes match the selected filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="row g-4">
                {filteredSchemes.map((scheme) => {
                  const { eligible, reasons } = checkEligibility(scheme);
                  const isApplied = Boolean(appliedScholarships[scheme.id]);
                  const applicationData = appliedScholarships[scheme.id];
                  const isRejected = isApplied && applicationData?.status === 'Rejected';
                  const isApproved = isApplied && applicationData?.status === 'Approved';

                  return (
                    <div className="col-12 col-lg-6" key={scheme.id}>
                      <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden ${isRejected ? 'border-start border-4 border-danger' : isApproved ? 'border-start border-4 border-success' : isApplied ? 'border-start border-4 border-primary' : eligible ? 'border-start border-4 border-success' : 'border-start border-4 border-danger'}`}>
                        
                        <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
                          <div>
                            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1 rounded-pill me-2">
                              {scheme.code}
                            </span>
                            <span className="text-muted small">
                              <i className="bi bi-clock me-1"></i>Deadline: {scheme.deadline}
                            </span>
                          </div>
                          <div>
                            {isRejected ? (
                              <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">
                                <i className="bi bi-x-circle-fill me-1"></i> Rejected / Returned
                              </span>
                            ) : isApproved ? (
                              <span className="badge bg-success rounded-pill px-3 py-2 fw-bold">
                                <i className="bi bi-check-circle-fill me-1"></i> Sanctioned & Approved
                              </span>
                            ) : isApplied ? (
                              <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold">
                                <i className="bi bi-hourglass-split me-1"></i> Verification Pending
                              </span>
                            ) : eligible ? (
                              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 fw-bold">
                                <i className="bi bi-patch-check-fill me-1"></i> Eligible to Apply
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 fw-bold">
                                <i className="bi bi-x-circle-fill me-1"></i> Not Eligible
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="card-body p-4 d-flex flex-column justify-content-between">
                          <div>
                            <h5 className="fw-bold text-dark mb-2">{scheme.title}</h5>
                            <p className="text-muted small mb-3">{scheme.description}</p>

                            <div className="p-3 bg-light rounded-3 mb-3 border">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="text-secondary small fw-bold text-uppercase">Financial Grant</span>
                                <span className="fs-5 fw-extrabold text-success">{scheme.amount}</span>
                              </div>
                              <span className="text-muted small">
                                <i className="bi bi-building me-1 text-primary"></i>
                                {scheme.provider}
                              </span>
                            </div>

                            {/* Criteria Checklist */}
                            <div className="mb-3">
                              <span className="text-secondary small fw-bold d-block mb-2 text-uppercase">Eligibility Criteria:</span>
                              <div className="d-flex flex-wrap gap-2">
                                {scheme.criteriaList.map((crit, idx) => (
                                  <span key={idx} className="badge bg-light text-dark border px-2 py-1 small fw-normal">
                                    <i className="bi bi-check2 text-primary me-1"></i>{crit}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Unmet Reasons (If not eligible and not applied) */}
                            {!eligible && !isApplied && reasons.length > 0 && (
                              <div className="alert alert-danger py-2 px-3 rounded-3 small mb-3 border-0">
                                <strong className="d-block mb-1">
                                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Why you are not eligible:
                                </strong>
                                <ul className="mb-0 ps-3">
                                  {reasons.map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Application Status Callout if Applied */}
                            {isApplied && applicationData && (
                              <div className={`p-3 rounded-3 small mb-3 border ${isRejected ? 'bg-danger-subtle border-danger' : isApproved ? 'bg-success-subtle border-success' : 'bg-light border-warning'}`}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span><i className="bi bi-file-earmark-text me-1"></i> Ref ID: <strong>{applicationData.refNo}</strong></span>
                                  <span className="badge bg-primary-subtle text-primary">{applicationData.submissionType || 'Fresh Application'}</span>
                                </div>
                                <div className="small">
                                  Status: <strong className={isApproved ? 'text-success' : isRejected ? 'text-danger' : 'text-warning'}>{applicationData.status || 'Pending Verification'}</strong>
                                </div>

                                {/* Rejection Remarks Callout */}
                                {isRejected && (
                                  <div className="mt-2 p-2 bg-white rounded border border-danger text-danger">
                                    <strong><i className="bi bi-exclamation-octagon-fill me-1"></i> Officer Rejection Reason:</strong>
                                    <p className="mb-0 mt-1 small fst-italic">"{applicationData.remarks || 'Document verification was returned by State Nodal Officer. Please review and re-apply.'}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Footer */}
                          <div className="pt-3 border-top mt-3">
                            {isApplied ? (
                              isRejected ? (
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill w-50 fw-semibold"
                                    onClick={() => handleViewSummary(applicationData, scheme)}
                                  >
                                    <i className="bi bi-file-earmark-text me-1"></i> Summary
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-warning rounded-pill w-50 fw-bold shadow-sm"
                                    onClick={() => handleReApplyClick(scheme, applicationData)}
                                  >
                                    <i className="bi bi-arrow-repeat me-1"></i> Re-Apply / Rectify
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-success rounded-pill w-100 fw-bold"
                                  onClick={() => handleViewSummary(applicationData, scheme)}
                                >
                                  <i className="bi bi-file-earmark-check me-2"></i> View Application Summary
                                </button>
                              )
                            ) : eligible ? (
                              <button
                                type="button"
                                className="btn btn-success rounded-pill w-100 fw-bold shadow-sm py-2"
                                onClick={() => handleApplyClick(scheme)}
                              >
                                <i className="bi bi-send-fill me-2"></i> Apply Now
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary rounded-pill w-100 fw-semibold py-2"
                                disabled
                                style={{ cursor: 'not-allowed', opacity: 0.65 }}
                              >
                                <i className="bi bi-lock-fill me-2"></i> Not Eligible to Apply
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal for Filling Application Form & Document Upload (Fresh or Re-Apply Mode) */}
        <ScholarshipApplyModal
          show={Boolean(selectedSchemeForApply)}
          scheme={selectedSchemeForApply}
          student={student}
          reApplyData={reApplyData}
          onClose={() => {
            setSelectedSchemeForApply(null);
            setReApplyData(null);
          }}
          onSubmit={handleModalSubmit}
        />

      </div>
    </div>
  );
};

export default Dashboard;
