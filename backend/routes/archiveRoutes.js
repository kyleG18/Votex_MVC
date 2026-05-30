// Archive Routes - groups and organizes past election archive-related routes
// MVC Pattern: Router groups the API endpoints

const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');

// GET /api/archives - List all past archives
router.get('/', archiveController.getArchives);

// GET /api/archives/:id - Get details of a specific archive
router.get('/:id', archiveController.getArchiveDetail);

// POST /api/archives - Archive the current election
router.post('/', archiveController.archiveCurrent);

// DELETE /api/archives/:id - Delete an archived election from history
router.delete('/:id', archiveController.destroyArchive);

module.exports = router;
