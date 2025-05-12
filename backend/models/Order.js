const sql = require('mssql');
const { connectDB } = require('../config/db');

class Order {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
        CREATE TABLE orders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          customer_id INT NOT NULL,
          totalAmount DECIMAL(18, 2) NOT NULL CHECK (totalAmount >= 0.0),
          subtotal DECIMAL(18, 2) NOT NULL CHECK (subtotal >= 0.0),
          discountAmount DECIMAL(18, 2) NOT NULL CHECK (discountAmount >= 0.0),
          amountReceived DECIMAL(18, 2) NOT NULL CHECK (amountReceived >= 0.0),
          remainingAmount DECIMAL(18, 2) NOT NULL,
          leaseAmount DECIMAL(18, 2) NOT NULL,
          dateCreated DATETIME DEFAULT GETDATE(),
          created_by_id INT NOT NULL,
          CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
          CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id)
        )`;
      await pool.request().query(table);
      console.log('orders table created or already exists');
    } catch (err) {
      console.error('Error creating orders table:', err);
      throw err;
    }
  }

  static async create({ customer_id, totalAmount, subtotal, discountAmount, amountReceived, remainingAmount, leaseAmount, created_by_id }) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('customer_id', sql.Int, customer_id)
        .input('totalAmount', sql.Decimal(18, 2), totalAmount)
        .input('subtotal', sql.Decimal(18, 2), subtotal)
        .input('discountAmount', sql.Decimal(18, 2), discountAmount)
        .input('amountReceived', sql.Decimal(18, 2), amountReceived)
        .input('remainingAmount', sql.Decimal(18, 2), remainingAmount)
        .input('leaseAmount', sql.Decimal(18, 2), leaseAmount)
        .input('created_by_id', sql.Int, created_by_id)
        .query(`
          INSERT INTO orders (customer_id, totalAmount, subtotal, discountAmount, amountReceived, remainingAmount, leaseAmount, created_by_id)
          OUTPUT INSERTED.*
          VALUES (@customer_id, @totalAmount, @subtotal, @discountAmount, @amountReceived, @remainingAmount, @leaseAmount, @created_by_id)
        `);
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
        .query(`
          SELECT o.*, c.name AS customer_name
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          WHERE o.id = @id
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByCreatedBy(createdById, startDate, endDate) {
    try {
      const pool = await connectDB();
      let query = `
        SELECT o.*, c.name AS customer_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.created_by_id = @createdById
      `;
      if (startDate && endDate) {
        query += `
          AND o.dateCreated >= @startDate
          AND o.dateCreated <= DATEADD(ms, -1, DATEADD(day, 1, CAST(@endDate AS DATE)))
        `;
      }
      query += ' ORDER BY o.dateCreated DESC';

      const result = await pool.request()
        .input('createdById', sql.Int, createdById)
        .input('startDate', sql.Date, startDate ? new Date(startDate) : null)
        .input('endDate', sql.Date, endDate ? new Date(endDate) : null)
        .query(query);
      return result.recordset;
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
          SELECT o.*, c.name AS customer_name
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          WHERE o.customer_id = @customerId AND o.created_by_id = @createdById
          ORDER BY o.dateCreated DESC
        `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Order;
