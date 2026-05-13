// Student Controller - handles request-response logic for student operations
// MVC Pattern: Controller connects Model and View, handles business logic

const StudentModel = require('../models/studentModel');
const SettingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');

// GET /api/students - Get all students
exports.index = async (req, res) => {
  try {
    const students = await StudentModel.findAll();
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/students - Register/Enroll a student with RFID + Profile Picture
exports.store = async (req, res) => {
  const { student_id, first_name, last_name, email, course, year_level, rfid_uid } = req.body;
  const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const existing = await StudentModel.findExisting(student_id, rfid_uid);
    if (existing.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Student ID or RFID Tag is already registered.' });
    }

    await StudentModel.create({ student_id, rfid_uid, first_name, last_name, email, course, year_level, profile_pic });
    res.json({ success: true, message: 'Student successfully enrolled for RFID voting!' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// PUT /api/students/:id - Update a student
exports.update = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, course, year_level, rfid_uid } = req.body;

  try {
    // Check RFID conflict
    if (rfid_uid) {
      const conflict = await StudentModel.findRfidConflict(rfid_uid, id);
      if (conflict.length > 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'This RFID card is already registered to another student.' });
      }
    }

    let updateQuery = 'UPDATE students SET first_name=?, last_name=?, email=?, course=?, year_level=?, rfid_uid=?';
    const params = [first_name, last_name, email, course, year_level, rfid_uid || null];

    if (req.file) {
      // Delete old profile pic
      const rows = await StudentModel.findById(id);
      if (rows.length > 0 && rows[0].profile_pic) {
        const oldPath = path.join(__dirname, '..', rows[0].profile_pic);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateQuery += ', profile_pic=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += ' WHERE id=?';

    const result = await StudentModel.update(id, updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// DELETE /api/students/:id - Delete a student
exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
    // Try to clean up profile pic file
    try {
      const rows = await StudentModel.findById(id);
      if (rows.length > 0 && rows[0].profile_pic) {
        const filePath = path.join(__dirname, '..', rows[0].profile_pic);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.log('Profile pic cleanup skipped:', cleanupErr.message);
    }

    const result = await StudentModel.deleteById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student record removed.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// POST /api/voters/login-rfid - Voter RFID login with voting period validation
exports.loginRfid = async (req, res) => {
  const { rfid_uid } = req.body;
  try {
    const students = await StudentModel.findByRfid(rfid_uid);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Unrecognized ID Card. Please register your card with an administrator.' });
    }

    // Check settings for multiple votes allowance and voting period
    const settingsRows = await SettingsModel.getSettings();
    let allowMultipleVotes = false;

    if (settingsRows.length > 0) {
      const settings = settingsRows[0];
      allowMultipleVotes = settings.allow_multiple_votes;

      // Validate Voting Dates
      const now = new Date();
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (settings.start_date && settings.end_date) {
        const startDate = new Date(settings.start_date);
        const endDate = new Date(settings.end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (currentDate < startDate) {
          return res.status(403).json({ success: false, message: 'The election has not started yet. Please wait for the voting period.' });
        }
        if (currentDate > endDate) {
          return res.status(403).json({ success: false, message: 'The election voting period has already ended.' });
        }
      }

      // Validate Voting Hours
      if (settings.voting_time_start && settings.voting_time_end) {
        const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':00';

        const formatTime = (timeStr) => {
          const [h, m] = timeStr.split(':');
          const date = new Date();
          date.setHours(h, m);
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        };

        if (currentTimeStr < settings.voting_time_start) {
          return res.status(403).json({ success: false, message: `Voting is currently closed. Today's voting hours start at ${formatTime(settings.voting_time_start)}.` });
        }
        if (currentTimeStr > settings.voting_time_end) {
          return res.status(403).json({ success: false, message: `Voting is closed for today. Voting hours ended at ${formatTime(settings.voting_time_end)}.` });
        }
      }
    }

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
};
