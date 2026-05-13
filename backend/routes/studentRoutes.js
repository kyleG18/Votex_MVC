// Student Routes - groups and organizes student-related routes
// MVC Pattern: Router separates routes into files (Express Router)

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const upload = require('../middleware/upload');

// GET /api/students - Get all students
router.get('/', studentController.index);

// POST /api/students - Register a new student (with file upload)
router.post('/', upload.single('profile_pic'), studentController.store);

// PUT /api/students/:id - Update a student (with optional file upload)
router.put('/:id', upload.single('profile_pic'), studentController.update);

// DELETE /api/students/:id - Delete a student
router.delete('/:id', studentController.destroy);

module.exports = router;
