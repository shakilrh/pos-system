const sql = require('mssql');
const { connectDB } = require('../config/db');

class Customer {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' AND xtype='U')
        CREATE TABLE customers (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL,
          totalLeaseAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.0,
          created_by_id INT NOT NULL,
          dateCreated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id),
          CONSTRAINT uk_customers_name_created_by UNIQUE (name, created_by_id)
        )`;
      await pool.request().query(table);
      console.log('customers table created or already exists');
    } catch (err) {
      console.error('Error creating customers table:', err);
      throw err;
    }
  }

  static async create({ name, created_by_id }) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('created_by_id', sql.Int, created_by_id)
        .query(`
          INSERT INTO customers (name, created_by_id)
          OUTPUT INSERTED.*
          VALUES (@name, @created_by_id)
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByNameAndCreatedBy(name, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('createdById', sql.Int, createdById)
        .query('SELECT * FROM customers WHERE name = @name AND created_by_id = @createdById');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async updateLeaseAmount(id, totalLeaseAmount) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('id', sql.Int, id)
        .input('totalLeaseAmount', sql.Decimal(18, 2), totalLeaseAmount)
        .query('UPDATE customers SET totalLeaseAmount = @totalLeaseAmount WHERE id = @id');
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Customer;
