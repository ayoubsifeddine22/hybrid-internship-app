require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { testConnection } = require('./config/database');
const { startDeadlineChecker } = require('./jobs/deadlineChecker');

const app = express();

// ====== MIDDLEWARE ======
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====== ROUTES ======
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Enterprise routes (to be implemented)
app.use('/api/enterprise', require('./routes/enterprise'));

// Student routes (to be implemented)
app.use('/api/student', require('./routes/student'));

// Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// Admin routes (to be implemented)
app.use('/api/admin', require('./routes/admin'));

// Auth routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ====== PORT CONFIGURATION ======
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  testConnection();

  // Start background jobs
  startDeadlineChecker();
});

module.exports = app;

