const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only image files are allowed.'));
  }
});

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
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to VoteX API!' });
});

/* ==========================================
   ADMIN AUTHENTICATION & MANAGEMENT API
   ========================================== */

// 1. Admin Registration
app.post('/api/admins/register', async (req, res) => {
  const { fullName, username, password, authKey } = req.body;
  
  try {
    // Fetch the required auth key from settings
    const [settings] = await dbPool.query('SELECT admin_auth_key FROM settings WHERE id = 1');
    const REQUIRED_KEY = settings.length > 0 ? settings[0].admin_auth_key : 'JPC-ADMIN-2026';

    if (authKey !== REQUIRED_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid Authorization Key.' });
    }

    const [existing] = await dbPool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username already exists.' });

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
    if (admins.length === 0) return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    const admin = admins[0];
    if (admin.status === 'pending') return res.status(403).json({ success: false, message: 'Your account is pending approval from a Super Admin.' });
    if (admin.status === 'rejected') return res.status(403).json({ success: false, message: 'Your account application was rejected.' });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 3. Get Pending Admins
app.get('/api/admins/pending', async (req, res) => {
  try {
    const [pendingAdmins] = await dbPool.query('SELECT id, fullName, username, created_at as dateApplied FROM admins WHERE status = "pending"');
    res.json({ success: true, pendingAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 4. Approve Admin
app.put('/api/admins/approve/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query('UPDATE admins SET status = "approved" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin approved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 5. Reject/Delete Admin
app.delete('/api/admins/reject/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin rejected and removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

/* ==========================================
   VOTER (STUDENT) MANAGEMENT API
   ========================================== */

// 1. Get All Students
app.get('/api/students', async (req, res) => {
  try {
    const [students] = await dbPool.query('SELECT * FROM students ORDER BY created_at DESC');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 2. Register/Enroll Student with RFID + Profile Picture
app.post('/api/students', upload.single('profile_pic'), async (req, res) => {
  const { student_id, first_name, last_name, email, course, year_level, rfid_uid } = req.body;
  const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [existing] = await dbPool.query(
      'SELECT * FROM students WHERE student_id = ? OR rfid_uid = ?',
      [student_id, rfid_uid]
    );
    if (existing.length > 0) {
      // Clean up uploaded file if enrollment fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Student ID or RFID Tag is already registered.' });
    }

    await dbPool.query(
      'INSERT INTO students (student_id, rfid_uid, first_name, last_name, email, course, year_level, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, rfid_uid, first_name, last_name, email, course, year_level, profile_pic]
    );

    res.json({ success: true, message: 'Student successfully enrolled for RFID voting!' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 3. Delete Student
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Try to clean up profile pic file (don't fail if column doesn't exist)
    try {
      const [rows] = await dbPool.query('SELECT profile_pic FROM students WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].profile_pic) {
        const filePath = path.join(__dirname, rows[0].profile_pic);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.log('Profile pic cleanup skipped:', cleanupErr.message);
    }

    const [result] = await dbPool.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student record removed.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// 4. Update Student
app.put('/api/students/:id', upload.single('profile_pic'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, course, year_level, rfid_uid } = req.body;

  try {
    // Check if rfid_uid is already used by ANOTHER student (not this one)
    if (rfid_uid) {
      const [conflict] = await dbPool.query(
        'SELECT id FROM students WHERE rfid_uid = ? AND id != ?',
        [rfid_uid, id]
      );
      if (conflict.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'This RFID card is already registered to another student.' });
      }
    }

    let updateQuery = 'UPDATE students SET first_name=?, last_name=?, email=?, course=?, year_level=?, rfid_uid=?';
    const params = [first_name, last_name, email, course, year_level, rfid_uid || null];

    if (req.file) {
      // Delete old profile pic
      const [rows] = await dbPool.query('SELECT profile_pic FROM students WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].profile_pic) {
        const oldPath = path.join(__dirname, rows[0].profile_pic);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateQuery += ', profile_pic=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += ' WHERE id=?';
    params.push(id);

    const [result] = await dbPool.query(updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

/* ==========================================
   CANDIDATE MANAGEMENT API
   ========================================== */

// 1. Get All Candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const [candidates] = await dbPool.query('SELECT * FROM candidates ORDER BY position, first_name');
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 2. Add Candidate
app.post('/api/candidates', upload.single('image_url'), async (req, res) => {
  const { first_name, last_name, position, partylist, course, student_id, bio } = req.body;
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    await dbPool.query(
      'INSERT INTO candidates (first_name, last_name, position, partylist, course, student_id, bio, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, position, partylist, course, student_id, bio, imageUrl]
    );
    res.json({ success: true, message: 'Candidate added successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Insert error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// 3. Update Candidate
app.put('/api/candidates/:id', upload.single('image_url'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, position, partylist, course, student_id, bio } = req.body;

  try {
    let updateQuery = 'UPDATE candidates SET first_name=?, last_name=?, position=?, partylist=?, course=?, student_id=?, bio=?';
    const params = [first_name, last_name, position, partylist, course, student_id, bio];

    if (req.file) {
      // Delete old image
      const [rows] = await dbPool.query('SELECT image_url FROM candidates WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].image_url) {
        const oldPath = path.join(__dirname, rows[0].image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateQuery += ', image_url=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += ' WHERE id=?';
    params.push(id);

    const [result] = await dbPool.query(updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, message: 'Candidate updated successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// 4. Delete Candidate
app.delete('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Try to clean up image file
    try {
      const [rows] = await dbPool.query('SELECT image_url FROM candidates WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].image_url) {
        const filePath = path.join(__dirname, rows[0].image_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.log('Image cleanup skipped:', cleanupErr.message);
    }

    const [result] = await dbPool.query('DELETE FROM candidates WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, message: 'Candidate deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});
app.post('/api/voters/login-rfid', async (req, res) => {
  const { rfid_uid } = req.body;
  try {
    const [students] = await dbPool.query('SELECT * FROM students WHERE rfid_uid = ?', [rfid_uid]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Unrecognized ID Card. Please register your card with an administrator.' });
    }

    // Check settings for multiple votes allowance
    const [settingsRows] = await dbPool.query('SELECT allow_multiple_votes FROM settings WHERE id = 1');
    const allowMultipleVotes = settingsRows.length > 0 ? settingsRows[0].allow_multiple_votes : false;

    const student = students[0];
    if (student.has_voted && !allowMultipleVotes) {
      return res.status(403).json({ success: false, message: 'This student has already cast their vote.' });
    }

    res.json({
      success: true,
      message: `Welcome, ${student.first_name}! Access granted.`,
      student: {
        id: student.id,
        student_id: student.student_id,
        fullName: `${student.first_name} ${student.last_name}`,
        course: student.course,
        year_level: student.year_level,
        profile_pic: student.profile_pic
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.post('/api/votes', async (req, res) => {
  const { student_id, selections } = req.body;
  if (!student_id || !selections) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if already voted
    const [settings] = await connection.query('SELECT allow_multiple_votes FROM settings WHERE id = 1');
    const allowMultipleVotes = settings.length > 0 ? settings[0].allow_multiple_votes : false;

    const [students] = await connection.query('SELECT has_voted FROM students WHERE id = ?', [student_id]);
    if (students.length === 0 || (students[0].has_voted && !allowMultipleVotes)) {
      throw new Error('Student has already voted or does not exist');
    }

    // If revoting is allowed and they HAVE voted before, clear previous votes
    if (students[0].has_voted && allowMultipleVotes) {
      await connection.query('DELETE FROM votes WHERE student_id = ?', [student_id]);
    }

    // Insert votes
    for (const [position, candidateId] of Object.entries(selections)) {
      if (candidateId) {
        await connection.query(
          'INSERT INTO votes (student_id, candidate_id, position) VALUES (?, ?, ?)',
          [student_id, candidateId, position]
        );
      }
    }

    // Update student status
    await connection.query('UPDATE students SET has_voted = true WHERE id = ?', [student_id]);

    await connection.commit();
    res.json({ success: true, message: 'Votes cast successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});
// 5. Get Approved Admins
app.get('/api/admins/approved', async (req, res) => {
  try {
    const [admins] = await dbPool.query('SELECT id, fullName, username, role, created_at FROM admins WHERE status = "approved"');
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// 6. Delete Admin (Super Admin only)
app.delete('/api/admins/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [admin] = await dbPool.query('SELECT role FROM admins WHERE id = ?', [id]);
    if (admin.length > 0 && admin[0].role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a super admin account.' });
    }
    await dbPool.query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

/* ==========================================
   DASHBOARD & REPORTS API
   ========================================== */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Total voters
    const [students] = await dbPool.query('SELECT COUNT(*) as total FROM students');
    const totalRegisteredVoters = students[0].total;

    // Votes cast
    const [voted] = await dbPool.query('SELECT COUNT(*) as total FROM students WHERE has_voted = 1');
    const totalVotesCast = voted[0].total;

    // Election settings
    const [settingsRows] = await dbPool.query('SELECT * FROM settings WHERE id = 1');
    const settings = settingsRows.length > 0 ? settingsRows[0] : {};

    res.json({
      success: true,
      stats: {
        totalRegisteredVoters,
        totalVotesCast,
        settings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.get('/api/dashboard/tally', async (req, res) => {
  try {
    // Read positions from data.json (or could hardcode them if preferred)
    const dataPath = path.join(__dirname, '../data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    const positions = jsonData.positions;

    // Fetch actual candidates from DB
    const [dbCandidates] = await dbPool.query('SELECT * FROM candidates');

    // Fetch actual vote counts from DB
    const [dbVotes] = await dbPool.query('SELECT candidate_id, COUNT(*) as vote_count FROM votes GROUP BY candidate_id');
    
    // Create a map of candidate_id -> vote_count
    const voteMap = {};
    dbVotes.forEach(row => {
      voteMap[row.candidate_id] = row.vote_count;
    });

    // Map DB candidates to frontend format
    const updatedCandidates = dbCandidates.map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      position: c.position,
      party: c.partylist,
      course: c.course,
      image_url: c.image_url,
      votes: voteMap[c.id] || 0
    }));

    res.json({ success: true, candidates: updatedCandidates, positions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/* ==========================================
   SETTINGS API
   ========================================== */
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM settings WHERE id = 1');
    res.json({ success: true, settings: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const { electionTitle, startDate, endDate, votingTimeStart, votingTimeEnd, allowMultipleVotes, showLiveResults, enableNotifications, maxCandidatesPerPosition, adminAuthKey } = req.body;
  try {
    await dbPool.query(`
      UPDATE settings SET 
        election_title = ?, start_date = ?, end_date = ?, 
        voting_time_start = ?, voting_time_end = ?, allow_multiple_votes = ?, 
        show_live_results = ?, enable_notifications = ?, max_candidates_per_position = ?,
        admin_auth_key = ?
      WHERE id = 1
    `, [electionTitle, startDate, endDate, votingTimeStart, votingTimeEnd, allowMultipleVotes, showLiveResults, enableNotifications, maxCandidatesPerPosition, adminAuthKey]);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});
// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
