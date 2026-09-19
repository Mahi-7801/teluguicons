const mysql = require('mysql2/promise');
require('dotenv').config();

const rootPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

module.exports = { pool: rootPool };