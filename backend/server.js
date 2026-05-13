// ============================================================
// VoteX Backend Server (MVC Architecture)
// Following Node-Express-API-MVC-CRUD Lecture
// by Paulo Jay Christian P. De Guzman, LPT
//
// MVC Structure:
//   config/      → Database connection (db.js)
//   models/      → Data & database logic (queries)
//   controllers/ → Request-response handlers (business logic)
//   routes/      → Express Router (route grouping)
//   middleware/  → Reusable middleware (e.g., file upload)
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Express Router modules
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voteRoutes = require('./routes/voteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Import database config for test route
const db = require('./config/db');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

/* ==========================================
   MIDDLEWARE
   ========================================== */

// CORS - allows frontend (React on port 5173) to communicate with backend
// Reference: Lecture - CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ==========================================
   API ROUTES (Express Router)
   ========================================== */

// Welcome route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to VoteX API!' });
});

// Test Database Connection
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await db.getConnection();
    connection.release();
    res.json({ success: true, message: 'Successfully connected to Laragon MySQL Database!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Mount route modules using app.use()
// Pattern from lecture: app.use('/products', productRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/voters', voteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

/* ==========================================
   START SERVER
   ========================================== */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
