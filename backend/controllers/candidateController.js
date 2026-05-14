// Candidate Controller - handles request-response logic for candidate operations
// MVC Pattern: Controller connects Model and View, handles business logic

const CandidateModel = require('../models/candidateModel');

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
    // Cloudinary stores the full image URL in req.file.path
    const image_url = req.file ? req.file.path : null;
    await CandidateModel.create({ first_name, last_name, position, partylist, course, student_id, bio, image_url });
    res.json({ success: true, message: 'Candidate added successfully.' });
  } catch (error) {
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
      updateQuery += ', image_url=?';
      params.push(req.file.path); // Use Cloudinary URL
    }

    updateQuery += ' WHERE id=?';

    const result = await CandidateModel.update(id, updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, message: 'Candidate updated successfully.' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
};

// DELETE /api/candidates/:id - Delete a candidate
exports.destroy = async (req, res) => {
  const { id } = req.params;
  try {
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
