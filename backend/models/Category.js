const sql = require('mssql');
const { connectDB } = require('../config/db');

class Category {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
        CREATE TABLE categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(50) NOT NULL,
          created_by_id INT NOT NULL,
          dateCreated DATETIME DEFAULT GETDATE(),
          lastUpdated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_category_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id),
          CONSTRAINT uk_category_name_created_by UNIQUE (name, created_by_id)
        )`;
      await pool.request().query(table);
      console.log('Categories table created or already exists');

      // Ensure default categories for the admin user
      const adminUser = await pool.request()
        .query("SELECT id FROM app_users WHERE username = 'admin'");
      if (adminUser.recordset.length) {
        const adminId = adminUser.recordset[0].id;
        const defaultCategories = [
          'Electronics', 'Clothing', 'Books', 'Groceries', 'Beverages',
          'Household Goods', 'Health & Wellness', 'Stationery & Office Supplies',
          'Toys & Games', 'Beauty Products', 'Home Essentials', 'Pet Supplies',
          'Snacks & Confectionery', 'Baby Products'
        ];
        for (const name of defaultCategories) {
          const exists = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('created_by_id', sql.Int, adminId)
            .query('SELECT 1 FROM categories WHERE name = @name AND created_by_id = @created_by_id');
          if (!exists.recordset.length) {
            await pool.request()
              .input('name', sql.NVarChar, name)
              .input('created_by_id', sql.Int, adminId)
              .query(`
                INSERT INTO categories (name, created_by_id)
                VALUES (@name, @created_by_id)
              `);
            console.log(`Default category ${name} created for admin`);
          }
        }
      }
    } catch (err) {
      console.error('Error creating Categories table:', err);
      throw err;
    }
  }

  static async findByNameAndCreatedBy(name, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('created_by_id', sql.Int, createdById)
        .query('SELECT * FROM categories WHERE name = @name AND created_by_id = @created_by_id');
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
        .query('SELECT * FROM categories WHERE created_by_id = @created_by_id');
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
          INSERT INTO categories (name, created_by_id, lastUpdated)
          OUTPUT INSERTED.*
          VALUES (@name, @created_by_id, GETDATE())
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Category;
