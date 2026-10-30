const mongoose = require('mongoose');
require('../models/Application');
require('../models/Sanction');
require('../models/Payment');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  const App = mongoose.model('Application');
  const Sanc = mongoose.model('Sanction');
  const Pay = mongoose.model('Payment');

  const apps = await App.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const totalSanctions = await Sanc.countDocuments();
  const payments = await Pay.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

  console.log('--- DB SUMMARY ---');
  console.log('Applications by Status:', apps);
  console.log('Total Sanctions Issued:', totalSanctions);
  console.log('Payments by Status:', payments);

  await mongoose.disconnect();
}

main().catch(console.error);
