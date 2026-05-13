// Settings Model - handles all database queries for election settings
// MVC Pattern: Model manages data and database logic

const db = require('../config/db');

// Get settings (always id = 1)
exports.getSettings = async () => {
  const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
  return rows;
};

// Get specific setting fields
exports.getAuthKey = async () => {
  const [rows] = await db.query('SELECT admin_auth_key FROM settings WHERE id = 1');
  return rows;
};

// Get multiple votes allowance
exports.getAllowMultipleVotes = async (connection) => {
  const conn = connection || db;
  const [rows] = await conn.query('SELECT allow_multiple_votes FROM settings WHERE id = 1');
  return rows;
};

// Update all settings
exports.updateSettings = async (settingsData) => {
  const {
    electionTitle, startDate, endDate,
    votingTimeStart, votingTimeEnd, allowMultipleVotes,
    showLiveResults, enableNotifications, maxCandidatesPerPosition, adminAuthKey
  } = settingsData;

  const [result] = await db.query(`
    UPDATE settings SET 
      election_title = ?, start_date = ?, end_date = ?, 
      voting_time_start = ?, voting_time_end = ?, allow_multiple_votes = ?, 
      show_live_results = ?, enable_notifications = ?, max_candidates_per_position = ?,
      admin_auth_key = ?
    WHERE id = 1
  `, [electionTitle, startDate, endDate, votingTimeStart, votingTimeEnd,
      allowMultipleVotes, showLiveResults, enableNotifications, maxCandidatesPerPosition, adminAuthKey]);

  return result;
};
