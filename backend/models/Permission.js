const sql = require('mssql');
const { connectDB } = require('../config/db');

class Permission {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='permissions' AND xtype='U')
        CREATE TABLE permissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          role NVARCHAR(50) NOT NULL UNIQUE
        )`;
      await pool.request().query(table);
      console.log('Permissions table created or already exists');

      const roles = ['ADMIN', 'USER'];
      for (const role of roles) {
        const exists = await pool.request()
          .input('role', sql.NVarChar, role)
          .query('SELECT 1 FROM permissions WHERE role = @role');
        if (!exists.recordset.length) {
          await pool.request()
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO permissions (role) VALUES (@role)');
          console.log(`Role ${role} created`);
        }
      }
    } catch (err) {
      console.error('Error creating Permissions table:', err);
      throw err;
    }
  }

  static async getRoleId(role) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('role', sql.NVarChar, role)
        .query('SELECT id FROM permissions WHERE role = @role');
      return result.recordset[0]?.id;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Permission;
