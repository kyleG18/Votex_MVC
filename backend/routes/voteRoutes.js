// Vote Routes - groups and organizes vote-related routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const studentController = require('../controllers/studentController');

// POST /api/votes - Cast votes
router.post('/', voteController.castVote);

// POST /api/voters/login - Voter login with Student ID + Password
router.post('/login', studentController.loginPassword);

// POST /api/voters/login-rfid - Voter RFID login (kept for backwards compatibility)
router.post('/login-rfid', studentController.loginRfid);

module.exports = router;
