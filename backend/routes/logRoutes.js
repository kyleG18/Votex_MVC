// Log Routes - audit trail endpoints
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// GET /api/logs - Get paginated audit logs
router.get('/', logController.index);

// DELETE /api/logs - Clear all logs (Super Admin only)
router.delete('/', logController.clearAll);

module.exports = router;
