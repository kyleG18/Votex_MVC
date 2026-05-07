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
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        course VARCHAR(100),
        year_level VARCHAR(20),
        has_voted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created.');

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

    // Insert Default Super Admin if not exists
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

    console.log('🎉 Database initialization complete!');
    await connection.end();

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

initializeDatabase();
