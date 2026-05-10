const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanup() {
  console.log('Cleaning up duplicate votes from re-voting...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votex_db',
  });

  try {
    // This query keeps only the LATEST vote (highest ID) for each student/position pair
    // and deletes all older entries.
    const [result] = await connection.query(`
      DELETE v1 FROM votes v1
      INNER JOIN votes v2 
      WHERE v1.id < v2.id 
      AND v1.student_id = v2.student_id 
      AND v1.position = v2.position
    `);
    
    console.log(`✅ Cleanup complete. Removed ${result.affectedRows} duplicate vote entries.`);
    console.log('🎉 Your reports and PDF exports will now be accurate.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
  } finally {
    await connection.end();
  }
}

cleanup();
