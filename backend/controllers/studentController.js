// Student Controller - handles request-response logic for student operations
// MVC Pattern: Controller connects Model and View, handles business logic

const StudentModel = require('../models/studentModel');
const SettingsModel = require('../models/settingsModel');
const LogModel = require('../models/logModel');

// GET /api/students - Get all students
exports.index = async (req, res) => {
  try {
    const students = await StudentModel.findAll();
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/students - Register/Enroll a student with Profile Picture
exports.store = async (req, res) => {
  const { student_id, first_name, middle_name, last_name, email, course, section, year_level, rfid_uid, password } = req.body;
  const profile_pic = req.file ? req.file.path : null;

  try {
    const existing = await StudentModel.findExisting(student_id, rfid_uid);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Student ID or RFID Tag is already registered.' });
    }

    if (password && !/^\d{4}$/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be exactly 4 numeric digits (e.g. 1234).' });
    }

    await StudentModel.create({ student_id, rfid_uid, first_name, middle_name, last_name, email, course, section, year_level, profile_pic, password });
    await LogModel.create({ action: `Student "${first_name} ${last_name}" (ID: ${student_id}) enrolled as a voter`, performed_by: 'admin', role: 'admin', entity_type: 'student' });
    res.json({ success: true, message: 'Student successfully enrolled!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// PUT /api/students/:id - Update a student
exports.update = async (req, res) => {
  const { id } = req.params;
  const { first_name, middle_name, last_name, email, course, section, year_level, rfid_uid, password } = req.body;

  try {
    // Check RFID conflict
    if (rfid_uid) {
      const conflict = await StudentModel.findRfidConflict(rfid_uid, id);
      if (conflict.length > 0) {
        return res.status(400).json({ success: false, message: 'This RFID card is already registered to another student.' });
      }
    }

    if (password && !/^\d{4}$/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be exactly 4 numeric digits (e.g. 1234).' });
    }

    let updateQuery = 'UPDATE students SET first_name=?, middle_name=?, last_name=?, email=?, course=?, section=?, year_level=?, rfid_uid=?';
    const params = [first_name, middle_name || null, last_name, email, course, section || null, year_level, rfid_uid || null];

    if (password) {
      updateQuery += ', password=?';
      params.push(password);
    }

    if (req.file) {
      updateQuery += ', profile_pic=?';
      params.push(req.file.path);
    }

    updateQuery += ' WHERE id=?';

    const result = await StudentModel.update(id, updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student updated successfully.' });
    LogModel.create({ action: `Student record #${id} was updated`, performed_by: 'admin', role: 'admin', entity_type: 'student', entity_id: id }).catch(() => {});
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// DELETE /api/students/:id - Delete a student
exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await StudentModel.deleteById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, message: 'Student record removed.' });
    LogModel.create({ action: `Student record #${id} was deleted`, performed_by: 'admin', role: 'admin', entity_type: 'student', entity_id: id }).catch(() => {});
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// POST /api/voters/login - Voter login with Student ID + Password
exports.loginPassword = async (req, res) => {
  const { student_id, password } = req.body;
  try {
    const students = await StudentModel.findByStudentIdAndPassword(student_id, password);
    if (students.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid Student ID or Password. Please try again.' });
    }

    // Check settings for multiple votes allowance and voting period
    const settingsRows = await SettingsModel.getSettings();
    let allowMultipleVotes = false;

    if (settingsRows.length > 0) {
      const settings = settingsRows[0];
      allowMultipleVotes = settings.allow_multiple_votes;

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
      return res.status(403).json({ success: false, message: 'You have already cast your vote.' });
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
    LogModel.create({ action: `Voter "${student.first_name} ${student.last_name}" (ID: ${student.student_id}) logged in`, performed_by: `${student.first_name} ${student.last_name}`, role: 'student', entity_type: 'student', entity_id: student.id }).catch(() => {});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
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
    LogModel.create({ action: `Voter "${student.first_name} ${student.last_name}" (ID: ${student.student_id}) logged in via RFID`, performed_by: `${student.first_name} ${student.last_name}`, role: 'student', entity_type: 'student', entity_id: student.id }).catch(() => {});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/students/bulk - Import multiple students
exports.bulkStore = async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid or empty students list.' });
  }

  const results = {
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const { student_id, first_name, middle_name, last_name, email, course, section, year_level } = s;

    if (!student_id || !first_name || !last_name) {
      results.failedCount++;
      results.errors.push(`Row ${i + 1}: Missing required fields (Student ID, First Name, Last Name).`);
      continue;
    }

    try {
      const existing = await StudentModel.findExisting(student_id, null);
      if (existing.length > 0) {
        results.failedCount++;
        results.errors.push(`Row ${i + 1} (ID: ${student_id}): Student ID is already registered.`);
        continue;
      }

      // Generate a default email if none provided: e.g. student_id@jpc.edu.ph
      const studentEmail = email || `${student_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@jpc.edu.ph`;

      await StudentModel.create({
        student_id,
        rfid_uid: null,
        first_name,
        middle_name: middle_name || null,
        last_name,
        email: studentEmail,
        course: course || null,
        section: section || null,
        year_level: year_level || '1st Year',
        profile_pic: null,
        password: student_id // default password = student_id
      });

      results.successCount++;
    } catch (err) {
      results.failedCount++;
      results.errors.push(`Row ${i + 1} (ID: ${student_id}): Error - ${err.message}`);
    }
  }

  if (results.successCount > 0) {
    try {
      await LogModel.create({
        action: `Imported ${results.successCount} students via Excel import`,
        performed_by: 'admin',
        role: 'admin',
        entity_type: 'student'
      });
    } catch (e) {}
  }

  res.json({
    success: true,
    message: `Import completed. Successfully registered ${results.successCount} students. Failed: ${results.failedCount}.`,
    results
  });
};
