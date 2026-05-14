const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('Running database migration to add missing columns...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votex_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Check if admin_auth_key exists
    const [rows] = await connection.query('DESCRIBE settings');
    const hasAuthKey = rows.some(row => row.Field === 'admin_auth_key');

    if (!hasAuthKey) {
      console.log('Adding admin_auth_key column to settings table...');
      await connection.query('ALTER TABLE settings ADD COLUMN admin_auth_key VARCHAR(255) DEFAULT "JPC-ADMIN-2026"');
      console.log('✅ Column added successfully.');
    } else {
      console.log('Column admin_auth_key already exists.');
    }

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
