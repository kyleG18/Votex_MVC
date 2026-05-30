// Archive Controller - handles request-response logic for election archiving
// MVC Pattern: Controller connects Model and View, handles business logic

const ArchiveModel = require('../models/archiveModel');
const SettingsModel = require('../models/settingsModel');
const LogModel = require('../models/logModel');
const db = require('../config/db');

// GET /api/archives - List all past election archives
exports.getArchives = async (req, res) => {
  try {
    const archives = await ArchiveModel.findAll();
    res.json({ success: true, archives });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// GET /api/archives/:id - Get details of a specific archived election
exports.getArchiveDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await ArchiveModel.findById(id);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Archive record not found' });
    }

    const archive = rows[0];
    
    // Parse the JSON data blocks
    try {
      archive.candidates_data = JSON.parse(archive.candidates_data);
    } catch (e) {
      archive.candidates_data = [];
    }
    
    try {
      archive.votes_data = JSON.parse(archive.votes_data);
    } catch (e) {
      archive.votes_data = {};
    }

    res.json({ success: true, archive });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// POST /api/archives - Archive the current active election and reset the active database
exports.archiveCurrent = async (req, res) => {
  const { election_year, delete_candidates = true } = req.body;
  if (!election_year) {
    return res.status(400).json({ success: false, message: 'Election year is required (e.g. 2026)' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get current settings
    const [settings] = await connection.query('SELECT election_title, start_date, end_date FROM settings WHERE id = 1');
    const title = settings.length > 0 ? settings[0].election_title : 'Student Council Election';
    const sDate = settings.length > 0 ? settings[0].start_date : null;
    const eDate = settings.length > 0 ? settings[0].end_date : null;

    // 2. Get registered and voted student counts
    const [[{ totalVoters }]] = await connection.query('SELECT COUNT(*) as totalVoters FROM students');
    const [[{ totalVotesCast }]] = await connection.query('SELECT COUNT(*) as totalVotesCast FROM students WHERE has_voted = true');

    // 3. Get candidates list and their exact vote counts
    const [candidates] = await connection.query(`
      SELECT 
        c.id, 
        CONCAT(c.first_name, ' ', c.last_name) as name, 
        c.position, 
        c.partylist as party, 
        c.course, 
        c.image_url, 
        COUNT(v.id) as votes 
      FROM candidates c 
      LEFT JOIN votes v ON c.id = v.candidate_id 
      GROUP BY c.id
    `);

    // 4. Gather turnout breakdowns (both voted and total per course/year)
    const [turnoutByCourse] = await connection.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(course), ''), 'Unspecified') AS course,
        COUNT(*) AS total,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voted
      FROM students 
      GROUP BY COALESCE(NULLIF(TRIM(course), ''), 'Unspecified')
    `);

    const [turnoutByYear] = await connection.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(year_level), ''), 'Unspecified') AS year_level,
        COUNT(*) AS total,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voted
      FROM students 
      GROUP BY COALESCE(NULLIF(TRIM(year_level), ''), 'Unspecified')
    `);

    // Format turnout statistics into neat key-value objects
    const courseStats = {};
    turnoutByCourse.forEach(row => {
      const courseName = row.course || 'Unspecified';
      courseStats[courseName] = {
        voted: Number(row.voted || 0),
        total: Number(row.total || 0)
      };
    });

    const yearStats = {};
    turnoutByYear.forEach(row => {
      const yearName = row.year_level || 'Unspecified';
      yearStats[yearName] = {
        voted: Number(row.voted || 0),
        total: Number(row.total || 0)
      };
    });

    const votesDataObj = {
      turnout_by_course: courseStats,
      turnout_by_year: yearStats
    };

    // 5. Create the Archive record
    const archiveData = {
      election_title: title,
      election_year,
      start_date: sDate,
      end_date: eDate,
      total_voters: totalVoters,
      total_votes: totalVotesCast,
      candidates_data: JSON.stringify(candidates),
      votes_data: JSON.stringify(votesDataObj)
    };

    await ArchiveModel.create(archiveData, connection);

    // 6. Reset current active election state
    // Delete all votes
    await connection.query('DELETE FROM votes');
    
    // Reset all students' voted status
    await connection.query('UPDATE students SET has_voted = false');

    // Delete active candidates to allow new registrations (if selected)
    if (delete_candidates) {
      await connection.query('DELETE FROM candidates');
    }

    await connection.commit();

    // Log the archive event
    LogModel.create({ 
      action: `Archived current election ("${title}") as Election Year ${election_year} and reset active state`, 
      performed_by: 'admin', 
      role: 'admin', 
      entity_type: 'archive' 
    }).catch(() => {});

    res.json({ 
      success: true, 
      message: `Successfully archived current election as Year ${election_year}! The current active database has been cleanly reset.` 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Archive error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive current election: ' + error.message });
  } finally {
    connection.release();
  }
};

// DELETE /api/archives/:id - Delete an archived election from history
exports.destroyArchive = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await ArchiveModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Archive record not found' });
    }

    LogModel.create({ 
      action: `Deleted past election archive #${id} from the records`, 
      performed_by: 'admin', 
      role: 'admin', 
      entity_type: 'archive', 
      entity_id: id 
    }).catch(() => {});

    res.json({ success: true, message: 'Archived election deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};
