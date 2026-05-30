// Student Model - handles all database queries for students
// MVC Pattern: Model manages data and database logic

const db = require('../config/db');

// Get all students
exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM students ORDER BY created_at DESC');
  return rows;
};

// Find student by ID
exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
  return rows;
};

// Find student by RFID UID
exports.findByRfid = async (rfid_uid) => {
  const [rows] = await db.query('SELECT * FROM students WHERE rfid_uid = ?', [rfid_uid]);
  return rows;
};

// Check for existing student by student_id or rfid_uid
exports.findExisting = async (student_id, rfid_uid) => {
  const [rows] = await db.query(
    'SELECT * FROM students WHERE student_id = ? OR rfid_uid = ?',
    [student_id, rfid_uid]
  );
  return rows;
};

// Check if RFID is used by another student
exports.findRfidConflict = async (rfid_uid, excludeId) => {
  const [rows] = await db.query(
    'SELECT id FROM students WHERE rfid_uid = ? AND id != ?',
    [rfid_uid, excludeId]
  );
  return rows;
};

// Find student by student_id and password (for ID+password login)
exports.findByStudentIdAndPassword = async (student_id, password) => {
  const [rows] = await db.query(
    'SELECT * FROM students WHERE student_id = ? AND password = ?',
    [student_id, password]
  );
  return rows;
};

// Create a new student
exports.create = async (studentData) => {
  const { student_id, rfid_uid, first_name, middle_name, last_name, email, course, section, year_level, profile_pic, password } = studentData;
  const defaultPassword = password || student_id; // default password = student_id
  const [result] = await db.query(
    'INSERT INTO students (student_id, rfid_uid, first_name, middle_name, last_name, email, course, section, year_level, profile_pic, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [student_id, rfid_uid || null, first_name, middle_name || null, last_name, email, course, section || null, year_level, profile_pic || null, defaultPassword]
  );
  return result;
};

// Update a student
exports.update = async (id, updateQuery, params) => {
  const [result] = await db.query(updateQuery, [...params, id]);
  return result;
};

// Delete a student by ID
exports.deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
  return result;
};

// Mark student as voted
exports.markAsVoted = async (id, connection) => {
  const conn = connection || db;
  const [result] = await conn.query('UPDATE students SET has_voted = true WHERE id = ?', [id]);
  return result;
};

// Get student voting status
exports.getVotingStatus = async (id, connection) => {
  const conn = connection || db;
  const [rows] = await conn.query('SELECT has_voted FROM students WHERE id = ?', [id]);
  return rows;
};
