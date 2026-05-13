// Dashboard Controller - handles request-response logic for dashboard & reports
// MVC Pattern: Controller connects Model and View, handles business logic

const db = require('../config/db');
const CandidateModel = require('../models/candidateModel');
const VoteModel = require('../models/voteModel');
const SettingsModel = require('../models/settingsModel');

// GET /api/dashboard/stats - Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const [students] = await db.query('SELECT COUNT(*) as total FROM students');
    const totalRegisteredVoters = students[0].total;

    const [voted] = await db.query('SELECT COUNT(*) as total FROM students WHERE has_voted = 1');
    const totalVotesCast = voted[0].total;

    const settingsRows = await SettingsModel.getSettings();
    const settings = settingsRows.length > 0 ? settingsRows[0] : {};

    res.json({
      success: true,
      stats: { totalRegisteredVoters, totalVotesCast, settings }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/dashboard/tally - Get vote tally for reports
exports.getTally = async (req, res) => {
  try {
    const dbCandidates = await CandidateModel.findAll();

    // Dynamically extract unique positions from candidates
    const rawPositions = [...new Set(dbCandidates.map(c => c.position))];
    const POSITION_ORDER = [
      'President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor',
      'P.R.O.', 'Business Manager', 'Peace Officer'
    ];
    const positions = rawPositions.sort((a, b) => {
      const indexA = POSITION_ORDER.indexOf(a);
      const indexB = POSITION_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // Fetch actual vote counts from DB
    const dbVotes = await VoteModel.getVoteCounts();

    // Create a map of candidate_id -> vote_count
    const voteMap = {};
    dbVotes.forEach(row => {
      voteMap[row.candidate_id] = row.vote_count;
    });

    // Map DB candidates to frontend format
    const updatedCandidates = dbCandidates.map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      position: c.position,
      party: c.partylist,
      course: c.course,
      image_url: c.image_url,
      votes: voteMap[c.id] || 0
    }));

    res.json({ success: true, candidates: updatedCandidates, positions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
