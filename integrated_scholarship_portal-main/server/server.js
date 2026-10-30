const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { initSocketIO } = require('./utils/socketManager');
const { startSlpEngine } = require('./services/slpService');
const { startReminderScheduler } = require('./services/reminderScheduler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const adminPortalRoutes = require('./routes/adminPortalRoutes');
const seedRoutes = require('./routes/seedRoutes');
const slpRoutes = require('./routes/slpRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'National Scholarship System API is running smoothly',
    timestamp: new Date()
  });
});

// Mount Routes for All 4 Portals + Auth, Seeding & SLP Engine
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/admin', adminPortalRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/slp', slpRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/emails', emailRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocketIO(server);

// Start SLP Background Engine
startSlpEngine();

// Start Scholarship Deadline Reminder Scheduler
startReminderScheduler();

if (require.main === module) {
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [Server Error] Port ${PORT} is already in use by another process.`);
      console.error(`   To free port ${PORT} on Windows:`);
      console.error(`   Run: netstat -ano | findstr :${PORT}`);
      console.error(`   Then: taskkill /F /PID <PID>\n`);
    } else {
      console.error('\n❌ [Server Error]', err);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` National Scholarship API Server running on port ${PORT}`);
    console.log(` API Endpoints mounted:`);
    console.log(`   - Auth & Profile:       /api/auth`);
    console.log(`   - Student Portal:       /api/student`);
    console.log(`   - Institute Portal:     /api/institute`);
    console.log(`   - Department Portal:    /api/department`);
    console.log(`   - Admin Portal:         /api/admin`);
    console.log(`   - Seed Demo Data:       /api/seed`);
    console.log(`   - SLP Service Engine:   /api/slp`);
    console.log(`   - Automated Emails:     /api/emails`);
    console.log(`====================================================`);
  });
}

module.exports = app;
