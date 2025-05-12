const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');

class AppUser {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_users' AND xtype='U')
        CREATE TABLE app_users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(50) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          email NVARCHAR(100) NOT NULL UNIQUE,
          business_name NVARCHAR(100),
          phone NVARCHAR(20),
          address NVARCHAR(255),
          isAdmin BIT DEFAULT 0,
          isSystemAdmin BIT DEFAULT 0,
          active_subscription_id INT,
          created_by_id INT,
          dateCreated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_user_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id)
        )`;
      await pool.request().query(table);
      console.log('AppUsers table created or already exists');

      const adminExists = await pool.request()
        .query("SELECT 1 FROM app_users WHERE username = 'admin'");
      if (!adminExists.recordset.length) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await pool.request()
          .input('username', sql.NVarChar, 'admin')
          .input('password', sql.NVarChar, hashedPassword)
          .input('email', sql.NVarChar, 'admin@pos.com')
          .input('isAdmin', sql.Bit, 1)
          .input('isSystemAdmin', sql.Bit, 1)
          .query(`
            INSERT INTO app_users (username, password, email, isAdmin, isSystemAdmin)
            VALUES (@username, @password, @email, @isAdmin, @isSystemAdmin)
          `);
        console.log('Default admin user created');
      }
    } catch (err) {
      console.error('Error creating AppUsers table:', err);
      throw err;
    }
  }

  static async createUser({ username, email, password, businessName, phone, address }) {
    try {
      const pool = await connectDB();
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('password', sql.NVarChar, hashedPassword)
        .input('email', sql.NVarChar, email)
        .input('businessName', sql.NVarChar, businessName || null)
        .input('phone', sql.NVarChar, phone || null)
        .input('address', sql.NVarChar, address || null)
        .input('isAdmin', sql.Bit, 1)
        .input('isSystemAdmin', sql.Bit, 0)
        .query(`
          INSERT INTO app_users (username, password, email, business_name, phone, address, isAdmin, isSystemAdmin)
          OUTPUT INSERTED.id
          VALUES (@username, @password, @email, @businessName, @phone, @address, @isAdmin, @isSystemAdmin)
        `);
      return result.recordset[0].id;
    } catch (err) {
      throw err;
    }
  }

  // Verify password method
    static async verifyPassword(user, password) {
      return bcrypt.compare(password, user.password);
    }

  static async findByUsername(username) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query('SELECT * FROM app_users WHERE username = @username');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findById(id) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM app_users WHERE id = @id');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findAllByCreatedBy(createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('createdById', sql.Int, createdById)
        .query('SELECT * FROM app_users WHERE created_by_id = @createdById');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AppUser;
