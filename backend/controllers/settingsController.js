// Settings Controller - handles request-response logic for election settings
// MVC Pattern: Controller connects Model and View, handles business logic

const SettingsModel = require('../models/settingsModel');
const LogModel = require('../models/logModel');

// GET /api/settings - Get election settings
exports.getSettings = async (req, res) => {
  try {
    const rows = await SettingsModel.getSettings();
    res.json({ success: true, settings: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// PUT /api/settings - Update election settings
exports.updateSettings = async (req, res) => {
  try {
    await SettingsModel.updateSettings(req.body);
    await LogModel.create({ action: 'System settings were updated', performed_by: 'superadmin', role: 'superadmin', entity_type: 'admin' });
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
