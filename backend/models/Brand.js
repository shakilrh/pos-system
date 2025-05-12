const sql = require('mssql');
const { connectDB } = require('../config/db');

class Brand {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='brands' AND xtype='U')
        CREATE TABLE brands (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(50) NOT NULL,
          created_by_id INT NOT NULL,
          dateCreated DATETIME DEFAULT GETDATE(),
          lastUpdated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_brand_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id),
          CONSTRAINT uk_brand_name_created_by UNIQUE (name, created_by_id)
        )`;
      await pool.request().query(table);
      console.log('Brands table created or already exists');

      // Ensure default brands for the admin user
      const adminUser = await pool.request()
        .query("SELECT id FROM app_users WHERE username = 'admin'");
      if (adminUser.recordset.length) {
        const adminId = adminUser.recordset[0].id;
        const defaultBrands = ['Apple', 'Samsung', 'Nike', 'Nestlé', 'PepsiCo', 'Unilever', 'Procter & Gamble'];
        for (const name of defaultBrands) {
          const exists = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('created_by_id', sql.Int, adminId)
            .query('SELECT 1 FROM brands WHERE name = @name AND created_by_id = @created_by_id');
          if (!exists.recordset.length) {
            await pool.request()
              .input('name', sql.NVarChar, name)
              .input('created_by_id', sql.Int, adminId)
              .query(`
                INSERT INTO brands (name, created_by_id)
                VALUES (@name, @created_by_id)
              `);
            console.log(`Default brand ${name} created for admin`);
          }
        }
      }
    } catch (err) {
      console.error('Error creating Brands table:', err);
      throw err;
    }
  }

  static async findByNameAndCreatedBy(name, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('created_by_id', sql.Int, createdById)
        .query('SELECT * FROM brands WHERE name = @name AND created_by_id = @created_by_id');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findAllByCreatedBy(createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('created_by_id', sql.Int, createdById)
        .query('SELECT * FROM brands WHERE created_by_id = @created_by_id');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async create(name, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('created_by_id', sql.Int, createdById)
        .query(`
          INSERT INTO brands (name, created_by_id, lastUpdated)
          OUTPUT INSERTED.*
          VALUES (@name, @created_by_id, GETDATE())
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Brand;
