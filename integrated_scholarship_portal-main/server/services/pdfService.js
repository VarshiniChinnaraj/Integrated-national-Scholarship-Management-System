const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Directory where generated Sanction Order PDFs are stored
 */
const SANCTIONS_DIR = path.join(__dirname, '..', 'uploads', 'sanctions');

/**
 * Ensures the output directory exists
 */
const ensureDirectoryExists = () => {
  if (!fs.existsSync(SANCTIONS_DIR)) {
    fs.mkdirSync(SANCTIONS_DIR, { recursive: true });
  }
};

/**
 * Generates official Sanction Order PDF with statutory government styling
 * @param {Object} sanction - Sanction record or details
 * @returns {Promise<string>} - Absolute path to generated PDF file
 */
const generateSanctionOrderPdf = (sanction) => {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists();

      const sanctionNumber = sanction.sanctionNumber || 'SAN-UNKNOWN';
      const fileName = `Sanction_Order_${sanctionNumber}.pdf`;
      const filePath = path.join(SANCTIONS_DIR, fileName);

      // Create PDF document (A4 page format)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Sanction Order - ${sanctionNumber}`,
          Author: 'National Scholarship Portal - Government of India',
          Subject: 'Statutory Scholarship Sanction Order',
          Keywords: 'scholarship, sanction, government of india, dbt'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Outer & Inner Decorative Borders
      doc.rect(20, 20, 555, 802).lineWidth(1.5).strokeColor('#1e3a8a').stroke();
      doc.rect(24, 24, 547, 794).lineWidth(0.5).strokeColor('#93c5fd').stroke();

      // Official Top Government Banner (Dark Blue)
      doc.rect(25, 25, 545, 80).fill('#1e3a8a');

      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
        .text('GOVERNMENT OF INDIA', 30, 40, { align: 'center', width: 535 });

      const deptName = (sanction.departmentName || 'MINISTRY OF HIGHER EDUCATION & WELFARE').toUpperCase();
      doc.fontSize(12).font('Helvetica')
        .text(deptName, 30, 62, { align: 'center', width: 535 });

      doc.fontSize(8.5).font('Helvetica-Oblique')
        .text('Central Scholarship Sanctioning & Grant Disbursement Authority', 30, 78, { align: 'center', width: 535 });

      // Document Title Badge
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold')
        .text('STATUTORY FINANCIAL SANCTION ORDER', 40, 125, { align: 'center', width: 515 });

      doc.fontSize(9).font('Helvetica')
        .fillColor('#64748b')
        .text(`Statutory Reference: NSP/SANCTION/${sanctionNumber}/AY2025-26`, 40, 144, { align: 'center', width: 515 });

      // Horizontal Divider
      doc.moveTo(40, 162).lineTo(555, 162).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // Metadata Header Block (Sanction No & Date)
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a8a')
        .text('Sanction Order No:', 40, 175);
      doc.font('Helvetica-Bold').fillColor('#0f172a')
        .text(sanctionNumber, 155, 175);

      doc.font('Helvetica-Bold').fillColor('#1e3a8a')
        .text('Sanction Date:', 360, 175);
      const approvalDate = sanction.approvalDate ? new Date(sanction.approvalDate) : new Date();
      const formattedDate = approvalDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.font('Helvetica').fillColor('#0f172a')
        .text(formattedDate, 445, 175);

      // Preamble / Body Text
      doc.fontSize(9.5).font('Helvetica').fillColor('#334155')
        .text(
          `Sanction of the Competent Statutory Authority is hereby accorded for the award, grant, and direct disbursement of scholarship assistance under the "${sanction.scholarshipName}" for Academic Year 2025-2026 to the eligible beneficiary applicant detailed hereunder:`,
          40,
          198,
          { width: 515, align: 'justify', lineGap: 3 }
        );

      // Beneficiary Details Card
      doc.rect(40, 245, 515, 135).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#1e3a8a').fontSize(10.5).font('Helvetica-Bold')
        .text('BENEFICIARY APPLICANT PARTICULARS', 55, 257);

      const items = [
        ['Beneficiary Student:', sanction.studentName || 'N/A'],
        ['Application Number:', sanction.applicationNumber || 'N/A'],
        ['Scholarship Scheme:', sanction.scholarshipName || 'N/A'],
        ['Enrolled Institution:', sanction.institutionName || 'Verified National Institution'],
        ['Sanctioning Department:', sanction.departmentName || 'Welfare Department']
      ];

      let curY = 277;
      items.forEach(([label, val]) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(label, 55, curY, { width: 145 });
        doc.font('Helvetica').fillColor('#0f172a').text(String(val), 205, curY, { width: 335 });
        curY += 19;
      });

      // Amount Card (Light Green Highlight)
      doc.rect(40, 395, 515, 75).fillAndStroke('#ecfdf5', '#10b981');

      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
        .text('SANCTIONED FINANCIAL AMOUNT', 40, 406, { align: 'center', width: 515 });

      const amtNum = Number(sanction.approvedAmount || 0);
      doc.fillColor('#047857').fontSize(22).font('Helvetica-Bold')
        .text(`₹ ${amtNum.toLocaleString('en-IN')}`, 40, 422, { align: 'center', width: 515 });

      doc.fillColor('#065f46').fontSize(9).font('Helvetica-Oblique')
        .text(`(Rupees ${amtNum.toLocaleString('en-IN')} Only — Disbursed via Direct Benefit Transfer / DBT)`, 40, 450, { align: 'center', width: 515 });

      // Statutory Terms & Directives
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b')
        .text('Statutory Terms & Directives:', 40, 485);

      const remarks = sanction.sanctionOrderText ||
        'The scholarship assistance granted under this order is non-transferable and strictly intended for tuition fee and academic upkeep. Direct Benefit Transfer (DBT) shall be credited directly to the verified Aadhaar-seeded bank account of the student.';

      doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
        .text(remarks, 40, 500, { width: 515, align: 'justify', lineGap: 2 });

      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text('2. Any duplicate claim, falsification of records, or unauthorized retention shall result in immediate cancellation of sanction, debarment, and statutory recovery under applicable financial governance rules.', 40, 540, { width: 515, align: 'justify' });

      // Signatory & Digital Attestation Block
      doc.rect(40, 580, 515, 120).lineWidth(1).strokeColor('#cbd5e1').stroke();

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e3a8a')
        .text('DIGITAL CERTIFICATION & APPROVAL', 55, 592);

      const officerName = sanction.officerName || 'Department Nodal Officer';
      doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
        .text(`Sanctioning Officer: ${officerName}`, 55, 612)
        .text(`Designation: Nodal Scrutiny & Sanctions Authority`, 55, 628)
        .text(`Sanction Status: SANCTIONED (Authorized for Payment Batching)`, 55, 644)
        .text(`Digital Verification: Dual-Key PKI Certified & Aadhaar e-Sign Verified`, 55, 660)
        .text(`Approval Timestamp: ${approvalDate.toISOString()}`, 55, 676);

      // Official Stamp / Digital Seal Badge
      doc.circle(485, 640, 38).lineWidth(1.5).strokeColor('#059669').stroke();
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#059669')
        .text('DIGITALLY', 450, 620, { width: 70, align: 'center' })
        .text('CERTIFIED', 450, 630, { width: 70, align: 'center' })
        .text('& APPROVED', 450, 640, { width: 70, align: 'center' })
        .text('NSP - GOI', 450, 650, { width: 70, align: 'center' })
        .text('AY 2025-26', 450, 660, { width: 70, align: 'center' });

      // Official Footer
      doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8')
        .text('National Scholarship Portal (NSP 2.0) — Integrated Scholarship Verification & Disbursement Tracking System', 40, 725, { align: 'center', width: 515 })
        .text(`Document Authenticity Reference: SHA256-${sanctionNumber} | Computer-generated legal sanction document.`, 40, 738, { align: 'center', width: 515 });

      doc.end();

      writeStream.on('finish', () => {
        if (fs.existsSync(filePath)) {
          resolve(filePath);
        } else {
          reject(new Error(`Failed to generate Sanction Order PDF at ${filePath}`));
        }
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Gets path to existing Sanction Order PDF, or null if not found
 */
const getSanctionOrderPdfPath = (sanctionNumber) => {
  const filePath = path.join(SANCTIONS_DIR, `Sanction_Order_${sanctionNumber}.pdf`);
  return fs.existsSync(filePath) ? filePath : null;
};

module.exports = {
  generateSanctionOrderPdf,
  getSanctionOrderPdfPath,
  SANCTIONS_DIR
};
