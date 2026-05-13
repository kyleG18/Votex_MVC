// Vote Controller - handles request-response logic for vote casting
// MVC Pattern: Controller connects Model and View, handles business logic

const VoteModel = require('../models/voteModel');
const SettingsModel = require('../models/settingsModel');

// POST /api/votes - Cast votes
exports.castVote = async (req, res) => {
  const { student_id, selections } = req.body;
  if (!student_id || !selections) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  const connection = await VoteModel.getConnection();
  try {
    await connection.beginTransaction();

    // Check if already voted
    const [settings] = await connection.query('SELECT allow_multiple_votes FROM settings WHERE id = 1');
    const allowMultipleVotes = settings.length > 0 ? settings[0].allow_multiple_votes : false;

    const [students] = await connection.query('SELECT has_voted FROM students WHERE id = ?', [student_id]);
    if (students.length === 0 || (students[0].has_voted && !allowMultipleVotes)) {
      throw new Error('Student has already voted or does not exist');
    }

    // If revoting is allowed and they HAVE voted before, clear previous votes
    if (students[0].has_voted && allowMultipleVotes) {
      await VoteModel.deleteByStudentId(student_id, connection);
    }

    // Insert votes
    for (const [position, candidateId] of Object.entries(selections)) {
      if (candidateId) {
        if (Array.isArray(candidateId)) {
          for (const cid of candidateId) {
            await VoteModel.insertVote(student_id, cid, position, connection);
          }
        } else {
          await VoteModel.insertVote(student_id, candidateId, position, connection);
        }
      }
    }

    // Update student status
    await connection.query('UPDATE students SET has_voted = true WHERE id = ?', [student_id]);

    await connection.commit();
    res.json({ success: true, message: 'Votes cast successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
