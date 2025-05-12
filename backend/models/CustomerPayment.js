const sql = require('mssql');
const { connectDB } = require('../config/db');

class CustomerPayment {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customer_payments' AND xtype='U')
        CREATE TABLE customer_payments (
          id INT IDENTITY(1,1) PRIMARY KEY,
          amount DECIMAL(18, 2) NOT NULL CHECK (amount >= 0.0),
          dateCreated DATETIME DEFAULT GETDATE(),
          customer_id INT NOT NULL,
          created_by_id INT NOT NULL,
          CONSTRAINT fk_customer_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
          CONSTRAINT fk_customer_payments_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id)
        )`;
      await pool.request().query(table);
      console.log('customer_payments table created or already exists');
    } catch (err) {
      console.error('Error creating customer_payments table:', err);
      throw err;
    }
  }

  static async create({ amount, customer_id, created_by_id }) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('amount', sql.Decimal(18, 2), amount)
        .input('customer_id', sql.Int, customer_id)
        .input('created_by_id', sql.Int, created_by_id)
        .query(`
          INSERT INTO customer_payments (amount, customer_id, created_by_id)
          OUTPUT INSERTED.*
          VALUES (@amount, @customer_id, @created_by_id)
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByCustomerAndCreatedBy(customerId, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('customerId', sql.Int, customerId)
        .input('createdById', sql.Int, createdById)
        .query(`
          SELECT *
          FROM customer_payments
          WHERE customer_id = @customerId AND created_by_id = @createdById
          ORDER BY dateCreated DESC
        `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = CustomerPayment;
