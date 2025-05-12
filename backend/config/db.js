const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('Database connected successfully');
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

module.exports = { connectDB, sql };
