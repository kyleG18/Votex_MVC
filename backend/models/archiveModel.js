// Archive Model - handles all database queries for election archives
// MVC Pattern: Model manages data and database logic

const db = require('../config/db');

// Find all archives (meta information, omitting heavy JSON data for list speed)
exports.findAll = async () => {
  const [rows] = await db.query(`
    SELECT id, election_title, election_year, start_date, end_date, total_voters, total_votes, created_at 
    FROM election_archives 
    ORDER BY election_year DESC, created_at DESC
  `);
  return rows;
};

// Find details of a single archive
exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM election_archives WHERE id = ?', [id]);
  return rows;
};

// Create a new archive
exports.create = async (archiveData, connection) => {
  const conn = connection || db;
  const {
    election_title,
    election_year,
    start_date,
    end_date,
    total_voters,
    total_votes,
    candidates_data,
    votes_data
  } = archiveData;

  const [result] = await conn.query(`
    INSERT INTO election_archives (
      election_title, election_year, start_date, end_date, 
      total_voters, total_votes, candidates_data, votes_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    election_title,
    election_year,
    start_date || null,
    end_date || null,
    total_voters || 0,
    total_votes || 0,
    candidates_data,
    votes_data
  ]);

  return result;
};

// Delete an archive
exports.delete = async (id, connection) => {
  const conn = connection || db;
  const [result] = await conn.query('DELETE FROM election_archives WHERE id = ?', [id]);
  return result;
};
