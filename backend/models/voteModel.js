// Vote Model - handles all database queries for votes
// MVC Pattern: Model manages data and database logic

const db = require('../config/db');

// Get a database connection for transactions
exports.getConnection = async () => {
  return await db.getConnection();
};

// Insert a single vote
exports.insertVote = async (student_id, candidate_id, position, connection) => {
  const conn = connection || db;
  const [result] = await conn.query(
    'INSERT INTO votes (student_id, candidate_id, position) VALUES (?, ?, ?)',
    [student_id, candidate_id, position]
  );
  return result;
};

// Delete all votes for a student (used for revoting)
exports.deleteByStudentId = async (student_id, connection) => {
  const conn = connection || db;
  const [result] = await conn.query('DELETE FROM votes WHERE student_id = ?', [student_id]);
  return result;
};

// Get vote counts grouped by candidate
exports.getVoteCounts = async () => {
  const [rows] = await db.query('SELECT candidate_id, COUNT(*) as vote_count FROM votes GROUP BY candidate_id');
  return rows;
};
