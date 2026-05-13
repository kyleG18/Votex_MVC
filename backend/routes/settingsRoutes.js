// Settings Routes - groups and organizes settings-related routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// GET /api/settings - Get election settings
router.get('/', settingsController.getSettings);

// PUT /api/settings - Update election settings
router.put('/', settingsController.updateSettings);

module.exports = router;
