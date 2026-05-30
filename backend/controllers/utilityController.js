// Utility Controller - serves dropdown data (positions, partylists, courses)
// MVC Pattern: Controller connects Model and View

const db = require('../config/db');

// GET /api/utility/positions
exports.getPositions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, title as name FROM positions ORDER BY display_order ASC, title ASC');
    res.json({ success: true, positions: rows.map(r => r.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/utility/partylists
exports.getPartylists = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM partylists ORDER BY name ASC');
    res.json({ success: true, partylists: rows.map(r => r.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/utility/courses
exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM courses ORDER BY name ASC');
    res.json({ success: true, courses: rows.map(r => r.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
