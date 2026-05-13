// Dashboard Routes - groups and organizes dashboard & reports routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/tally - Get vote tally for reports
router.get('/tally', dashboardController.getTally);

module.exports = router;
