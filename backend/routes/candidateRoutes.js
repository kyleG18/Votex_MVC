// Candidate Routes - groups and organizes candidate-related routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const upload = require('../middleware/upload');

// GET /api/candidates - Get all candidates
router.get('/', candidateController.index);

// POST /api/candidates - Add a new candidate (with file upload)
router.post('/', upload.single('image_url'), candidateController.store);

// PUT /api/candidates/:id - Update a candidate (with optional file upload)
router.put('/:id', upload.single('image_url'), candidateController.update);

// DELETE /api/candidates/:id - Delete a candidate
router.delete('/:id', candidateController.destroy);

module.exports = router;
