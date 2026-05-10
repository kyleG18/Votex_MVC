const mysql = require('mysql2/promise');
require('dotenv').config();

const mockCandidates = [
  { first_name: 'Sophia', last_name: 'Vergara', position: 'President', partylist: 'Independent', course: 'BSIT' },
  { first_name: 'Marcus', last_name: 'Aurelius', position: 'President', partylist: 'Forward', course: 'BSBA' },
  { first_name: 'Elena', last_name: 'Gilbert', position: 'Vice President', partylist: 'Alliance', course: 'BSCS' },
  { first_name: 'Stefan', last_name: 'Salvatore', position: 'Vice President', partylist: 'Forward', course: 'BSHM' },
  { first_name: 'Damon', last_name: 'Salvatore', position: 'Secretary', partylist: 'Independent', course: 'BSIT' },
  { first_name: 'Bonnie', last_name: 'Bennett', position: 'Secretary', partylist: 'Alliance', course: 'BSPsych' },
  { first_name: 'Caroline', last_name: 'Forbes', position: 'Treasurer', partylist: 'Forward', course: 'BSA' },
  { first_name: 'Niklaus', last_name: 'Mikaelson', position: 'Treasurer', partylist: 'Alliance', course: 'BSIT' },
  { first_name: 'Elijah', last_name: 'Mikaelson', position: 'Auditor', partylist: 'Forward', course: 'BSCS' },
  { first_name: 'Rebekah', last_name: 'Mikaelson', position: 'Auditor', partylist: 'Independent', course: 'BSBA' },
  { first_name: 'Lydia', last_name: 'Martin', position: 'P.R.O.', partylist: 'Alliance', course: 'BSHM' },
  { first_name: 'Stiles', last_name: 'Stilinski', position: 'P.R.O.', partylist: 'Forward', course: 'BSCS' }
];

async function seed() {
  console.log('Seeding random mock candidates...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'votex_db',
  });

  try {
    for (const c of mockCandidates) {
      await connection.query(
        'INSERT INTO candidates (first_name, last_name, position, partylist, course) VALUES (?, ?, ?, ?, ?)',
        [c.first_name, c.last_name, c.position, c.partylist, c.course]
      );
    }
    console.log(`🎉 Successfully added ${mockCandidates.length} mock candidates to the system.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await connection.end();
  }
}

seed();
