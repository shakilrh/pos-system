const sql = require('mssql');
const { connectDB } = require('../config/db');

class Product {
  static async createTable() {
    try {
      const pool = await connectDB();
      const table = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
        CREATE TABLE products (
          id INT IDENTITY(1,1) PRIMARY KEY,
          productName NVARCHAR(100) NOT NULL,
          productDescription NVARCHAR(500) NOT NULL,
          productSKU NVARCHAR(50) NOT NULL,
          productBarcode NVARCHAR(50) NOT NULL,
          purchasedPrice DECIMAL(18,2) NOT NULL,
          sellingPrice DECIMAL(18,2),
          productQuantity INT NOT NULL,
          categoryName NVARCHAR(100),
          brandName NVARCHAR(100),
          status NVARCHAR(50),
          tags NVARCHAR(200),
          lowStockThreshold INT,
          profitMargin DECIMAL(18,2),
          created_by_id INT NOT NULL,
          admin_id INT,
          dateCreated DATETIME DEFAULT GETDATE(),
          lastUpdated DATETIME DEFAULT GETDATE(),
          CONSTRAINT fk_product_created_by FOREIGN KEY (created_by_id) REFERENCES app_users(id),
          CONSTRAINT fk_product_admin FOREIGN KEY (admin_id) REFERENCES app_users(id),
          CONSTRAINT uk_product_name_created_by UNIQUE (productName, created_by_id),
          CONSTRAINT uk_product_sku_created_by UNIQUE (productSKU, created_by_id),
          CONSTRAINT uk_product_barcode_created_by UNIQUE (productBarcode, created_by_id),
          CONSTRAINT chk_purchased_price CHECK (purchasedPrice >= 0.01),
          CONSTRAINT chk_selling_price CHECK (sellingPrice IS NULL OR sellingPrice >= 0.01),
          CONSTRAINT chk_product_quantity CHECK (productQuantity >= 0),
          CONSTRAINT chk_low_stock_threshold CHECK (lowStockThreshold IS NULL OR lowStockThreshold >= 0),
          CONSTRAINT chk_profit_margin CHECK (profitMargin IS NULL OR profitMargin >= 0)
        )`;
      await pool.request().query(table);
      console.log('Products table created or already exists');
    } catch (err) {
      console.error('Error creating Products table:', err);
      throw err;
    }
  }

  static async findAll() {
    try {
      const pool = await connectDB();
      const result = await pool.request().query('SELECT * FROM products');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async findById(id) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM products WHERE id = @id');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByBarcode(barcode) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('barcode', sql.NVarChar, barcode)
        .query('SELECT * FROM products WHERE productBarcode = @barcode');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async findByBarcodeAndCreatedBy(barcode, createdById) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('barcode', sql.NVarChar, barcode)
        .input('createdById', sql.Int, createdById)
        .query('SELECT * FROM products WHERE productBarcode = @barcode AND created_by_id = @createdById');
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
        .query('SELECT * FROM products WHERE created_by_id = @created_by_id');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  }

  static async create(productData) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('productName', sql.NVarChar, productData.productName)
        .input('productDescription', sql.NVarChar, productData.productDescription)
        .input('productSKU', sql.NVarChar, productData.productSKU)
        .input('productBarcode', sql.NVarChar, productData.productBarcode)
        .input('purchasedPrice', sql.Decimal(18, 2), productData.purchasedPrice)
        .input('sellingPrice', sql.Decimal(18, 2), productData.sellingPrice || null)
        .input('productQuantity', sql.Int, productData.productQuantity)
        .input('categoryName', sql.NVarChar, productData.categoryName || null)
        .input('brandName', sql.NVarChar, productData.brandName || null)
        .input('status', sql.NVarChar, productData.status || 'ACTIVE')
        .input('tags', sql.NVarChar, productData.tags || null)
        .input('lowStockThreshold', sql.Int, productData.lowStockThreshold || null)
        .input('profitMargin', sql.Decimal(18, 2), productData.profitMargin || null)
        .input('created_by_id', sql.Int, productData.createdById)
        .input('admin_id', sql.Int, productData.adminId || null)
        .query(`
          INSERT INTO products (
            productName, productDescription, productSKU, productBarcode, purchasedPrice, sellingPrice,
            productQuantity, categoryName, brandName, status, tags, lowStockThreshold, profitMargin,
            created_by_id, admin_id, lastUpdated
          )
          OUTPUT INSERTED.*
          VALUES (
            @productName, @productDescription, @productSKU, @productBarcode, @purchasedPrice, @sellingPrice,
            @productQuantity, @categoryName, @brandName, @status, @tags, @lowStockThreshold, @profitMargin,
            @created_by_id, @admin_id, GETDATE()
          )
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async update(id, productData) {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('productName', sql.NVarChar, productData.productName)
        .input('productDescription', sql.NVarChar, productData.productDescription)
        .input('productSKU', sql.NVarChar, productData.productSKU)
        .input('productBarcode', sql.NVarChar, productData.productBarcode)
        .input('purchasedPrice', sql.Decimal(18, 2), productData.purchasedPrice)
        .input('sellingPrice', sql.Decimal(18, 2), productData.sellingPrice || null)
        .input('productQuantity', sql.Int, productData.productQuantity)
        .input('categoryName', sql.NVarChar, productData.categoryName || null)
        .input('brandName', sql.NVarChar, productData.brandName || null)
        .input('status', sql.NVarChar, productData.status || 'ACTIVE')
        .input('tags', sql.NVarChar, productData.tags || null)
        .input('lowStockThreshold', sql.Int, productData.lowStockThreshold || null)
        .input('profitMargin', sql.Decimal(18, 2), productData.profitMargin || null)
        .query(`
          UPDATE products
          SET
            productName = @productName,
            productDescription = @productDescription,
            productSKU = @productSKU,
            productBarcode = @productBarcode,
            purchasedPrice = @purchasedPrice,
            sellingPrice = @sellingPrice,
            productQuantity = @productQuantity,
            categoryName = @categoryName,
            brandName = @brandName,
            status = @status,
            tags = @tags,
            lowStockThreshold = @lowStockThreshold,
            profitMargin = @profitMargin,
            lastUpdated = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  static async updateStock(id, newQuantity) {
    try {
      if (newQuantity === null || newQuantity === undefined || isNaN(newQuantity)) {
        throw new Error('Invalid quantity: Quantity must be a valid number');
      }
      if (newQuantity < 0) {
        throw new Error('Invalid quantity: Quantity cannot be negative');
      }

      const pool = await connectDB();
      await pool.request()
        .input('id', sql.Int, id)
        .input('quantity', sql.Int, newQuantity)
        .query('UPDATE products SET productQuantity = @quantity WHERE id = @id');
    } catch (err) {
      console.error(`Error updating stock for product ID ${id}:`, err);
      throw err;
    }
  }

  static async delete(id) {
    try {
      const pool = await connectDB();
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM products WHERE id = @id');
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Product;
