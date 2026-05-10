const mysql = require('mysql2/promise');
require('dotenv').config();

async function normalize() {
  console.log('Normalizing "Vice-President" and "Vice" to "Vice President"...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votex_db',
  });

  try {
    const [res] = await connection.query('UPDATE candidates SET position = "Vice President" WHERE position = "Vice-President" OR position = "Vice"');
    console.log(`✅ Normalized ${res.affectedRows} candidates.`);
    
    const [rows] = await connection.query('SELECT DISTINCT position FROM candidates');
    console.log('Current positions in DB:', rows.map(r => r.position));
  } catch (err) {
    console.error('❌ Normalization failed:', err.message);
  } finally {
    await connection.end();
  }
}

normalize();
