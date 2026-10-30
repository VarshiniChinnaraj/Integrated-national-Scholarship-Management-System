const mongoose = require('mongoose');

async function normalize() {
  await mongoose.connect('mongodb://127.0.0.1:27017/national_scholarship_db');
  const res = await mongoose.connection.db.collection('users').updateMany(
    { status: 'ACTIVE' },
    { $set: { status: 'Active' } }
  );
  console.log('Normalized users:', res.modifiedCount);
  await mongoose.disconnect();
}

normalize().catch(console.error);
