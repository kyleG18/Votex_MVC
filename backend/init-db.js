const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  console.log('Connecting to MySQL to initialize database tables...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'votex_db',
      port: process.env.DB_PORT || 3306,
    });

    console.log('Connected successfully. Creating tables...');

    // 1. Create Admins Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('superadmin', 'admin') DEFAULT 'admin',
        profile_pic VARCHAR(255) DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table created.');

    // 2. Create Students Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(10) UNIQUE NOT NULL,
        rfid_uid VARCHAR(50) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        course VARCHAR(100),
        section VARCHAR(50) DEFAULT NULL,
        year_level VARCHAR(20),
        profile_pic VARCHAR(255),
        password VARCHAR(255) DEFAULT NULL,
        has_voted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created.');

    // Add columns dynamically to existing students table in case it was already created
    try {
      await connection.query(`ALTER TABLE students ADD COLUMN middle_name VARCHAR(100) DEFAULT NULL`);
      console.log('Added middle_name to students table');
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE students ADD COLUMN section VARCHAR(50) DEFAULT NULL`);
      console.log('Added section to students table');
    } catch (e) {}
    try {
      await connection.query(`ALTER TABLE students ADD COLUMN password VARCHAR(255) DEFAULT NULL`);
      console.log('Added password to students table');
    } catch (e) {}

    // 3. Create Candidates Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        partylist VARCHAR(100),
        course VARCHAR(100),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Candidates table created.');

    // 4. Create Votes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        candidate_id INT NOT NULL,
        position VARCHAR(100) NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )
    `);
    console.log('✅ Votes table created.');

    // 5. Create Logs (Audit Trail) Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action TEXT NOT NULL,
        performed_by VARCHAR(255) DEFAULT 'system',
        role VARCHAR(50) DEFAULT 'admin',
        entity_type VARCHAR(50),
        entity_id INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Logs (Audit Trail) table created.');


    const [rows] = await connection.query(`SELECT * FROM admins WHERE username = 'admin'`);
    if (rows.length === 0) {
      // In a real app, you would hash this password with bcrypt!
      // But for this mockup, we keep it simple as requested.
      await connection.query(`
        INSERT INTO admins (fullName, username, password, role, status) 
        VALUES ('System Administrator', 'admin', 'admin123', 'superadmin', 'approved')
      `);
      console.log('✅ Default Super Admin account inserted.');
    }

    // 5. Create Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        election_title VARCHAR(255) DEFAULT 'Student Council Election 2026',
        start_date DATE,
        end_date DATE,
        voting_time_start TIME DEFAULT '08:00:00',
        voting_time_end TIME DEFAULT '17:00:00',
        allow_multiple_votes BOOLEAN DEFAULT FALSE,
        show_live_results BOOLEAN DEFAULT TRUE,
        enable_notifications BOOLEAN DEFAULT TRUE,
        max_candidates_per_position INT DEFAULT 5,
        admin_auth_key VARCHAR(255) DEFAULT 'JPC-ADMIN-2026'
      )
    `);
    console.log('✅ Settings table created.');

    // 5.1 Create Election Archives Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS election_archives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_title VARCHAR(255) NOT NULL,
        election_year VARCHAR(4) NOT NULL,
        start_date DATE,
        end_date DATE,
        total_voters INT DEFAULT 0,
        total_votes INT DEFAULT 0,
        candidates_data LONGTEXT NOT NULL,
        votes_data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Election Archives table created.');

    // 6. Create Positions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL UNIQUE,
        display_order INT DEFAULT 0
      )
    `);
    console.log('✅ Positions table created.');

    // 7. Create Partylists Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS partylists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slogan TEXT
      )
    `);
    console.log('✅ Partylists table created.');

    // 8. Create Courses Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('✅ Courses table created.');

    // 8. Create Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_type ENUM('Admin', 'Student') NOT NULL,
        action TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Logs table created.');

    // Insert Default Super Admin if not exists
    const [adminRows] = await connection.query(`SELECT * FROM admins WHERE username = 'admin'`);
    if (adminRows.length === 0) {
      await connection.query(`
        INSERT INTO admins (fullName, username, password, role, status) 
        VALUES ('System Administrator', 'admin', 'admin123', 'superadmin', 'approved')
      `);
      console.log('✅ Default Super Admin account inserted.');
    }

    // Insert Default Positions
    const [posRows] = await connection.query('SELECT * FROM positions');
    if (posRows.length === 0) {
      await connection.query(`
        INSERT INTO positions (title, display_order) VALUES 
        ('President', 1), ('Vice President', 2), ('Secretary', 3), 
        ('Treasurer', 4), ('Auditor', 5), ('PIO', 6)
      `);
      console.log('✅ Default positions inserted.');
    }

    // Insert Default Partylists
    const [partyRows] = await connection.query('SELECT * FROM partylists');
    if (partyRows.length === 0) {
      await connection.query(`
        INSERT INTO partylists (name, slogan) VALUES 
        ('Student Progressive Party', 'Progress through action'),
        ('Unity Alliance', 'Together we achieve more'),
        ('Future Leaders Party', 'Leading the next generation'),
        ('Independent', 'Serving students directly')
      `);
      console.log('✅ Default partylists inserted.');
    }

    // Insert Default Courses
    const [courseRows] = await connection.query('SELECT * FROM courses');
    if (courseRows.length === 0) {
      await connection.query(`
        INSERT INTO courses (name) VALUES 
        ('BSIT'), ('BSCS'), ('BSBA'), ('BSEd'), ('BSHM'), 
        ('BSCRIM'), ('BSA'), ('BSME'), ('BSEE'), ('BSCE')
      `);
      console.log('✅ Default courses inserted.');
    }

    // Insert default settings if not exists
    const [settingsRows] = await connection.query('SELECT * FROM settings WHERE id = 1');
    if (settingsRows.length === 0) {
      await connection.query(`
        INSERT INTO settings (id, start_date, end_date) 
        VALUES (1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      `);
      console.log('✅ Default settings inserted.');
    }

    // Seed election archives for 2024 if empty
    const [archiveRows] = await connection.query('SELECT * FROM election_archives WHERE election_year = "2024"');
    if (archiveRows.length === 0) {
      const candidates2024 = [
        { id: 101, name: "Christopher Oliva", position: "President", party: "Student Progressive Party", votes: 482, course: "BSIT", image_url: null },
        { id: 102, name: "Jane Doe", position: "President", party: "Unity Alliance", votes: 315, course: "BSCS", image_url: null },
        { id: 103, name: "John Smith", position: "Vice President", party: "Unity Alliance", votes: 425, course: "BSBA", image_url: null },
        { id: 104, name: "Maria Santos", position: "Vice President", party: "Student Progressive Party", votes: 370, course: "BSEd", image_url: null },
        { id: 105, name: "Lebron James", position: "Secretary", party: "Future Leaders Party", votes: 520, course: "BSHM", image_url: null },
        { id: 106, name: "Stephen Curry", position: "Secretary", party: "Independent", votes: 275, course: "BSCRIM", image_url: null }
      ];
      const votes2024 = {
        turnout_by_course: {
          "BSIT": { voted: 210, total: 280 },
          "BSCS": { voted: 150, total: 190 },
          "BSBA": { voted: 120, total: 160 },
          "BSEd": { voted: 110, total: 140 },
          "BSHM": { voted: 90, total: 110 },
          "BSCRIM": { voted: 70, total: 80 },
          "BSA": { voted: 47, total: 40 }
        },
        turnout_by_year: {
          "1st Year": { voted: 250, total: 320 },
          "2nd Year": { voted: 210, total: 270 },
          "3rd Year": { voted: 180, total: 220 },
          "4th Year": { voted: 157, total: 190 }
        }
      };

      await connection.query(`
        INSERT INTO election_archives (election_title, election_year, start_date, end_date, total_voters, total_votes, candidates_data, votes_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Student Council Election 2024',
        '2024',
        '2024-05-15',
        '2024-05-22',
        1000,
        797,
        JSON.stringify(candidates2024),
        JSON.stringify(votes2024)
      ]);
      console.log('✅ Default 2024 election archive seeded.');
    }

    console.log('🎉 Database initialization complete!');
    await connection.end();

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

initializeDatabase();
