// Utility Routes - serves dropdown data for positions, partylists, courses
const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

// GET /api/utility/positions
router.get('/positions', utilityController.getPositions);

// GET /api/utility/partylists
router.get('/partylists', utilityController.getPartylists);

// GET /api/utility/courses
router.get('/courses', utilityController.getCourses);

module.exports = router;
