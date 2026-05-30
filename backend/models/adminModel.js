// Admin Model - handles all database queries for admins
// MVC Pattern: Model is responsible for database connection, queries, and data validation

const db = require('../config/db');

// Find admin by username
exports.findByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
  return rows;
};

// Find admin by RFID UID
exports.findByRfid = async (rfid_uid) => {
  const [rows] = await db.query('SELECT * FROM admins WHERE rfid_uid = ?', [rfid_uid]);
  return rows;
};

// Find admin by username and password
exports.findByCredentials = async (username, password) => {
  const [rows] = await db.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
  return rows;
};

// Create a new admin
exports.create = async (fullName, username, password, rfid_uid, status = 'pending') => {
  const [result] = await db.query(
    'INSERT INTO admins (fullName, username, password, rfid_uid, status) VALUES (?, ?, ?, ?, ?)',
    [fullName, username, password, rfid_uid || null, status]
  );
  return result;
};

// Get all pending admins
exports.findPending = async () => {
  const [rows] = await db.query(
    'SELECT id, fullName, username, rfid_uid, created_at as dateApplied FROM admins WHERE status = "pending"'
  );
  return rows;
};

// Get all approved admins
exports.findApproved = async () => {
  const [rows] = await db.query(
    'SELECT id, fullName, username, role, rfid_uid, created_at FROM admins WHERE status = "approved"'
  );
  return rows;
};

// Approve an admin by ID
exports.approve = async (id) => {
  const [result] = await db.query('UPDATE admins SET status = "approved" WHERE id = ?', [id]);
  return result;
};

// Find admin by ID
exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
  return rows;
};

// Delete admin by ID
exports.deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM admins WHERE id = ?', [id]);
  return result;
};

// Update admin by ID
exports.update = async (id, fullName, username, role, rfid_uid, password) => {
  let query = 'UPDATE admins SET fullName = ?, username = ?, role = ?, rfid_uid = ?';
  const params = [fullName, username, role, rfid_uid || null];
  
  if (password) {
    query += ', password = ?';
    params.push(password);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  const [result] = await db.query(query, params);
  return result;
};
