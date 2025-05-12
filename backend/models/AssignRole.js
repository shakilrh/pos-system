const sql = require('mssql');
const { connectDB } = require('../config/db');

class AssignRole {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='assign_roles' AND xtype='U')
        CREATE TABLE assign_roles (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          role_id INT NOT NULL,
          CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES app_users(id),
          CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES permissions(id)
        )`;
      await pool.request().query(table);
      console.log('AssignRoles table created or already exists');
    } catch (err) {
      console.error('Error creating AssignRoles table:', err);
      throw err;
    }
  }

  static async assignRole(userId, roleId) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('roleId', sql.Int, roleId)
        .query(`
          INSERT INTO assign_roles (user_id, role_id)
          VALUES (@userId, @roleId)
        `);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AssignRole;
