// Admin Controller - handles request-response logic for admin operations
// MVC Pattern: Controller is the main logic handler, connects Model and View
// Uses async/await with try/catch as taught in the lecture

const AdminModel = require('../models/adminModel');
const SettingsModel = require('../models/settingsModel');
const LogModel = require('../models/logModel');

// POST /api/admins/register - Register a new admin
exports.register = async (req, res) => {
  const { fullName, username, password, authKey } = req.body;
  try {
    // Fetch the required auth key from settings
    const settings = await SettingsModel.getAuthKey();
    const REQUIRED_KEY = settings.length > 0 ? settings[0].admin_auth_key : 'JPC-ADMIN-2026';

    if (authKey !== REQUIRED_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid Authorization Key.' });
    }

    const existing = await AdminModel.findByUsername(username);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    await AdminModel.create(fullName, username, password, 'pending');
    await LogModel.create({ action: `New admin registration submitted by "${username}" (${fullName}) — awaiting approval`, performed_by: username, role: 'admin', entity_type: 'admin' });
    res.json({ success: true, message: 'Registration submitted successfully. Pending approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/admins/login - Admin login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admins = await AdminModel.findByCredentials(username, password);
    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const admin = admins[0];
    if (admin.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending approval from a Super Admin.' });
    }
    if (admin.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account application was rejected.' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role }
    });
    // Log the login (don't await to avoid delaying response)
    LogModel.create({ action: `Admin "${admin.username}" logged in`, performed_by: admin.username, role: admin.role, entity_type: 'admin', entity_id: admin.id }).catch(() => {});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/admins/pending - Get all pending admins
exports.getPending = async (req, res) => {
  try {
    const pendingAdmins = await AdminModel.findPending();
    res.json({ success: true, pendingAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/admins/approved - Get all approved admins
exports.getApproved = async (req, res) => {
  try {
    const admins = await AdminModel.findApproved();
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// PUT /api/admins/approve/:id - Approve an admin
exports.approve = async (req, res) => {
  const { id } = req.params;
  try {
    await AdminModel.approve(id);
    await LogModel.create({ action: `Admin account #${id} approved`, performed_by: 'superadmin', role: 'superadmin', entity_type: 'admin', entity_id: id });
    res.json({ success: true, message: 'Admin approved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// DELETE /api/admins/reject/:id - Reject/delete a pending admin
exports.reject = async (req, res) => {
  const { id } = req.params;
  try {
    await AdminModel.deleteById(id);
    await LogModel.create({ action: `Admin account #${id} registration was rejected and removed`, performed_by: 'superadmin', role: 'superadmin', entity_type: 'admin', entity_id: id });
    res.json({ success: true, message: 'Admin rejected and removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// DELETE /api/admins/:id - Delete an admin (Super Admin only)
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await AdminModel.findById(id);
    if (admin.length > 0 && admin[0].role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a super admin account.' });
    }
    await AdminModel.deleteById(id);
    await LogModel.create({ action: `Admin account #${id} was permanently deleted`, performed_by: 'superadmin', role: 'superadmin', entity_type: 'admin', entity_id: id });
    res.json({ success: true, message: 'Admin deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
