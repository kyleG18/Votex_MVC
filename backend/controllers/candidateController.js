// Candidate Controller - handles request-response logic for candidate operations
// MVC Pattern: Controller connects Model and View, handles business logic

const CandidateModel = require('../models/candidateModel');
const path = require('path');
const fs = require('fs');

// GET /api/candidates - Get all candidates
exports.index = async (req, res) => {
  try {
    const candidates = await CandidateModel.findAll();
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/candidates - Add a new candidate
exports.store = async (req, res) => {
  const { first_name, last_name, position, partylist, course, student_id, bio } = req.body;
  try {
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    await CandidateModel.create({ first_name, last_name, position, partylist, course, student_id, bio, image_url });
    res.json({ success: true, message: 'Candidate added successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Insert error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// PUT /api/candidates/:id - Update a candidate
exports.update = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, position, partylist, course, student_id, bio } = req.body;

  try {
    let updateQuery = 'UPDATE candidates SET first_name=?, last_name=?, position=?, partylist=?, course=?, student_id=?, bio=?';
    const params = [first_name, last_name, position, partylist, course, student_id, bio];

    if (req.file) {
      // Delete old image
      const rows = await CandidateModel.findById(id);
      if (rows.length > 0 && rows[0].image_url) {
        const oldPath = path.join(__dirname, '..', rows[0].image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateQuery += ', image_url=?';
      params.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += ' WHERE id=?';

    const result = await CandidateModel.update(id, updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, message: 'Candidate updated successfully.' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// DELETE /api/candidates/:id - Delete a candidate
exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
    // Clean up image file
    try {
      const rows = await CandidateModel.findById(id);
      if (rows.length > 0 && rows[0].image_url) {
        const filePath = path.join(__dirname, '..', rows[0].image_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.log('Image cleanup skipped:', cleanupErr.message);
    }

    const result = await CandidateModel.deleteById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, message: 'Candidate deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};
