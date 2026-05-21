// Log Controller - handles request-response logic for audit trail
const LogModel = require('../models/logModel');

// GET /api/logs - Get paginated audit logs
exports.index = async (req, res) => {
  const { limit = 50, offset = 0, filter = '' } = req.query;
  try {
    const [logs, total] = await Promise.all([
      LogModel.findAll({ limit, offset, filter }),
      LogModel.count({ filter })
    ]);
    res.json({ success: true, logs, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// DELETE /api/logs - Clear all logs (Super Admin only)
exports.clearAll = async (req, res) => {
  try {
    await LogModel.clearAll();
    res.json({ success: true, message: 'Audit trail cleared successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
