const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing of JSON bodies

// Database connection pool
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'votex_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Database Connection Route
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    connection.release();
    res.json({ success: true, message: 'Successfully connected to Laragon MySQL Database!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to VoteX API!' });
});

/* ==========================================
   ADMIN AUTHENTICATION & MANAGEMENT API
========================================== */

// 1. Admin Registration
app.post('/api/admins/register', async (req, res) => {
  const { fullName, username, password, authKey } = req.body;
  const SECRET_AUTH_KEY = 'JPC-ADMIN-2026';

  if (authKey !== SECRET_AUTH_KEY) {
    return res.status(403).json({ success: false, message: 'Invalid Authorization Key.' });
  }

  try {
    const [existing] = await dbPool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    await dbPool.query(
      'INSERT INTO admins (fullName, username, password, status) VALUES (?, ?, ?, ?)',
      [fullName, username, password, 'pending']
    );
    res.json({ success: true, message: 'Registration submitted successfully. Pending approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 2. Admin Login
app.post('/api/admins/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [admins] = await dbPool.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
    
    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const admin = admins[0];

    if (admin.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending approval from a Super Admin.' });
    } else if (admin.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account application was rejected.' });
    }

    // Success
    res.json({ 
      success: true, 
      message: 'Login successful', 
      user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 3. Get Pending Admins (For Super Admin)
app.get('/api/admins/pending', async (req, res) => {
  try {
    const [pendingAdmins] = await dbPool.query('SELECT id, fullName, username, created_at as dateApplied FROM admins WHERE status = "pending"');
    res.json({ success: true, pendingAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 4. Approve Admin (For Super Admin)
app.put('/api/admins/approve/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query('UPDATE admins SET status = "approved" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin approved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 5. Reject/Delete Admin (For Super Admin)
app.delete('/api/admins/reject/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin rejected and removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
