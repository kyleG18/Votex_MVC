// Candidate Model - handles all database queries for candidates
// MVC Pattern: Model manages data and database logic

const db = require('../config/db');

// Get all candidates ordered by position and name
exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM candidates ORDER BY position, first_name');
  return rows;
};

// Find candidate by ID
exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM candidates WHERE id = ?', [id]);
  return rows;
};

// Create a new candidate
exports.create = async (candidateData) => {
  const { first_name, last_name, position, partylist, course, student_id, bio, image_url } = candidateData;
  const [result] = await db.query(
    'INSERT INTO candidates (first_name, last_name, position, partylist, course, student_id, bio, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [first_name, last_name, position, partylist, course, student_id, bio, image_url]
  );
  return result;
};

// Update a candidate
exports.update = async (id, updateQuery, params) => {
  const [result] = await db.query(updateQuery, [...params, id]);
  return result;
};

// Delete a candidate by ID
exports.deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM candidates WHERE id = ?', [id]);
  return result;
};
