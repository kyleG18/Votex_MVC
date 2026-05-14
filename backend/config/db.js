// Database Connection Configuration
// Following MVC pattern: config handles database setup
// Reference: Node-Express-API-MVC-CRUD Lecture by Paulo Jay Christian P. De Guzman, LPT

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for efficient database management
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'votex_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
