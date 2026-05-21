// Log Model - handles all database queries for audit logs
const db = require('../config/db');

// Create a new log entry
exports.create = async ({ action, performed_by, role, entity_type, entity_id }) => {
  await db.query(
    'INSERT INTO logs (action, performed_by, role, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
    [action, performed_by, role, entity_type || null, entity_id || null]
  );
};

// Get all logs (most recent first)
exports.findAll = async ({ limit = 100, offset = 0, filter = '' } = {}) => {
  let query = 'SELECT * FROM logs';
  const params = [];

  if (filter) {
    query += ' WHERE action LIKE ? OR performed_by LIKE ? OR entity_type LIKE ?';
    params.push(`%${filter}%`, `%${filter}%`, `%${filter}%`);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await db.query(query, params);
  return rows;
};

// Get total count for pagination
exports.count = async ({ filter = '' } = {}) => {
  let query = 'SELECT COUNT(*) as total FROM logs';
  const params = [];

  if (filter) {
    query += ' WHERE action LIKE ? OR performed_by LIKE ? OR entity_type LIKE ?';
    params.push(`%${filter}%`, `%${filter}%`, `%${filter}%`);
  }

  const [rows] = await db.query(query, params);
  return rows[0].total;
};

// Clear all logs (super admin only)
exports.clearAll = async () => {
  await db.query('DELETE FROM logs');
};
