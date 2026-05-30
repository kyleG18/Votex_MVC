// Admin Controller - handles request-response logic for admin operations
// MVC Pattern: Controller is the main logic handler, connects Model and View
// Uses async/await with try/catch as taught in the lecture

const AdminModel = require('../models/adminModel');
const SettingsModel = require('../models/settingsModel');
const LogModel = require('../models/logModel');
const db = require('../config/db');

// POST /api/admins/register - Register a new admin
exports.register = async (req, res) => {
  const { fullName, username, password, authKey, rfid_uid } = req.body;
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

    if (rfid_uid) {
      const existingRfid = await AdminModel.findByRfid(rfid_uid);
      if (existingRfid.length > 0) {
        return res.status(400).json({ success: false, message: 'This RFID card is already registered to another admin.' });
      }
    }

    await AdminModel.create(fullName, username, password, rfid_uid, 'pending');
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

    let profilePic = admin.profile_pic;
    if (!profilePic) {
      const conditions = [];
      const params = [];
      if (admin.rfid_uid) {
        conditions.push('rfid_uid = ?');
        params.push(admin.rfid_uid);
      }
      if (admin.fullName) {
        conditions.push('CONCAT(first_name, " ", last_name) = ?');
        params.push(admin.fullName);
      }
      if (conditions.length > 0) {
        const [studentRows] = await db.query(
          `SELECT profile_pic FROM students WHERE ${conditions.join(' OR ')} LIMIT 1`,
          params
        );
        if (studentRows.length > 0 && studentRows[0].profile_pic) {
          profilePic = studentRows[0].profile_pic;
        }
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role, profile_pic: profilePic }
    });
    LogModel.create({ action: `Admin "${admin.username}" logged in`, performed_by: admin.username, role: admin.role, entity_type: 'admin', entity_id: admin.id }).catch(() => {});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/admins/login-rfid - Admin RFID login
exports.loginRfid = async (req, res) => {
  const { rfid_uid } = req.body;
  try {
    const admins = await AdminModel.findByRfid(rfid_uid);
    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: 'Unrecognized RFID card. Please contact the Super Admin.' });
    }

    const admin = admins[0];
    if (admin.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending approval from a Super Admin.' });
    }
    if (admin.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your account application was rejected.' });
    }

    let profilePic = admin.profile_pic;
    if (!profilePic) {
      const conditions = [];
      const params = [];
      if (admin.rfid_uid) {
        conditions.push('rfid_uid = ?');
        params.push(admin.rfid_uid);
      }
      if (admin.fullName) {
        conditions.push('CONCAT(first_name, " ", last_name) = ?');
        params.push(admin.fullName);
      }
      if (conditions.length > 0) {
        const [studentRows] = await db.query(
          `SELECT profile_pic FROM students WHERE ${conditions.join(' OR ')} LIMIT 1`,
          params
        );
        if (studentRows.length > 0 && studentRows[0].profile_pic) {
          profilePic = studentRows[0].profile_pic;
        }
      }
    }

    res.json({
      success: true,
      message: 'RFID login successful',
      user: { id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role, profile_pic: profilePic }
    });
    LogModel.create({ action: `Admin "${admin.username}" logged in via RFID`, performed_by: admin.username, role: admin.role, entity_type: 'admin', entity_id: admin.id }).catch(() => {});
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

// PUT /api/admins/:id - Update admin details (Super Admin only)
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { fullName, username, password, role, rfid_uid } = req.body;
  try {
    const adminList = await AdminModel.findById(id);
    if (adminList.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    // Check username conflict
    const existingUsername = await AdminModel.findByUsername(username);
    if (existingUsername.length > 0 && existingUsername[0].id !== parseInt(id)) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    // Check RFID conflict
    if (rfid_uid) {
      const existingRfid = await AdminModel.findByRfid(rfid_uid);
      if (existingRfid.length > 0 && existingRfid[0].id !== parseInt(id)) {
        return res.status(400).json({ success: false, message: 'This RFID card is already registered to another admin.' });
      }
    }

    await AdminModel.update(id, fullName, username, role, rfid_uid, password);
    
    await LogModel.create({
      action: `Admin account #${id} details updated (Username: "${username}", Name: "${fullName}")`,
      performed_by: 'superadmin',
      role: 'superadmin',
      entity_type: 'admin',
      entity_id: id
    });

    res.json({ success: true, message: 'Admin details updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
