const mongoose = require('mongoose');
const App = require('../models/Application');
const Sanction = require('../models/Sanction');
const Payment = require('../models/Payment');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  console.log('Connected to DB');

  const apps = await App.find({
    $or: [
      { status: 'SANCTIONED' },
      { sanctionId: { $ne: null } }
    ]
  });

  console.log('Found', apps.length, 'sanctioned applications to check');

  for (const app of apps) {
    let sanction = await Sanction.findOne({ applicationId: app._id });
    if (!sanction && app.sanctionId) {
      sanction = await Sanction.findById(app.sanctionId);
    }
    if (sanction) {
      app.status = 'SANCTIONED';
      app.sanctionId = sanction._id;
      app.sanctionNumber = sanction.sanctionNumber;

      let payment = await Payment.findOne({ applicationId: app._id });
      if (!payment) {
        const payCode = Math.floor(100000 + Math.random() * 900000);
        const paymentReference = `PAY-2026-${payCode}`;
        payment = await Payment.create({
          paymentId: paymentReference,
          paymentReference,
          applicationId: app._id,
          applicationNumber: app.applicationNumber,
          sanctionId: sanction._id,
          sanctionNumber: sanction.sanctionNumber,
          studentId: app.studentId || sanction.studentId || null,
          studentName: app.studentName || sanction.studentName || 'Beneficiary Student',
          scholarshipId: app.scholarshipId || sanction.scholarshipId || null,
          scholarshipName: app.scholarshipName || sanction.scholarshipName || 'Scholarship Scheme',
          departmentId: app.departmentId || null,
          departmentName: app.departmentName || '',
          amount: app.approvedAmount || app.requestedAmount || 50000,
          status: 'PAYMENT_PENDING',
          bankDetails: {
            bankName: app.bankDetails?.bankName || 'State Bank of India',
            accountNumber: app.bankDetails?.accountNumber || '38947291048',
            ifscCode: app.bankDetails?.ifscCode || 'SBIN0001234'
          }
        });
        console.log(`Created missing Payment for ${app.applicationNumber} -> ${payment.paymentReference}`);
      } else if (!payment.sanctionId) {
        payment.sanctionId = sanction._id;
        payment.sanctionNumber = sanction.sanctionNumber;
        await payment.save();
      }

      await App.updateOne(
        { _id: app._id },
        {
          $set: {
            status: 'SANCTIONED',
            sanctionId: sanction._id,
            sanctionNumber: sanction.sanctionNumber,
            paymentId: payment._id,
            paymentReference: payment.paymentReference
          }
        }
      );
    }
  }

  const pendingCount = await Payment.countDocuments({ status: 'PAYMENT_PENDING' });
  console.log('Total PAYMENT_PENDING records in DB:', pendingCount);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
