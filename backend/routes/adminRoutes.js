// Admin Routes - groups and organizes admin-related routes
// MVC Pattern: Router separates routes into files (Express Router)
// Reference: routes/productRoutes.js pattern from lecture

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// POST /api/admins/register - Register a new admin
router.post('/register', adminController.register);

// POST /api/admins/login - Admin login
router.post('/login', adminController.login);

// GET /api/admins/pending - Get all pending admins
router.get('/pending', adminController.getPending);

// GET /api/admins/approved - Get all approved admins
router.get('/approved', adminController.getApproved);

// PUT /api/admins/approve/:id - Approve an admin
router.put('/approve/:id', adminController.approve);

// DELETE /api/admins/reject/:id - Reject a pending admin
router.delete('/reject/:id', adminController.reject);

// DELETE /api/admins/:id - Delete an admin
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
