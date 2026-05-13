// Vote Routes - groups and organizes vote-related routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const studentController = require('../controllers/studentController');

// POST /api/votes - Cast votes
router.post('/', voteController.castVote);

// POST /api/voters/login-rfid - Voter RFID login
router.post('/login-rfid', studentController.loginRfid);

module.exports = router;
