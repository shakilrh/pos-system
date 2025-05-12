const sql = require('mssql');
const { connectDB } = require('../config/db');

class OrderItem {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
        CREATE TABLE order_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL CHECK (quantity >= 1),
          subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.0),
          created_by_id INT NOT NULL,
          dateCreated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
          CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
          CONSTRAINT fk_order_items_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id)
        )`;
      await pool.request().query(table);
      console.log('order_items table created or already exists');
    } catch (err) {
      console.error('Error creating order_items table:', err);
      throw err;
    }
  }

  static async create({ order_id, product_id, quantity, subtotal, created_by_id }) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('order_id', sql.Int, order_id)
        .input('product_id', sql.Int, product_id)
        .input('quantity', sql.Int, quantity)
        .input('subtotal', sql.Decimal(10, 2), subtotal)
        .input('created_by_id', sql.Int, created_by_id)
        .query(`
          INSERT INTO order_items (order_id, product_id, quantity, subtotal, created_by_id)
          VALUES (@order_id, @product_id, @quantity, @subtotal, @created_by_id)
        `);
    } catch (err) {
      console.error('Error creating order item:', err);
      throw err;
    }
  }

  static async findByOrderId(orderId) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT
            oi.*,
            p.productName AS product_name,
            p.sellingPrice AS product_price
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = @orderId
        `);
      return result.recordset;
    } catch (err) {
      console.error('Error fetching order items:', err);
      throw err;
    }
  }
}

module.exports = OrderItem;
