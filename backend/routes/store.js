const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const AppUser = require('../models/AppUser');
const OrderItem = require('../models/OrderItem');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

    const createdById = currentUser.created_by_id || currentUser.id;
    const products = await Product.findAllByCreatedBy(createdById);
    const categories = await Category.findAllByCreatedBy(createdById);
    const brands = await Brand.findAllByCreatedBy(createdById);

    res.status(200).json({ products, categories, brands });
  } catch (err) {
    console.error('Error in /inventory:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/showProduct/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized access!' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const createdById = currentUser.created_by_id || currentUser.id;
    const createdByUsers = await AppUser.findAllByCreatedBy(createdById);
    const createdByUserIds = createdByUsers.map(user => user.id).concat(createdById);

    if (!createdByUserIds.includes(product.created_by_id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to product' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error in /showProduct:', err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
});

router.post('/saveProduct', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const productData = {
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      productSKU: req.body.productSKU,
      productBarcode: req.body.productBarcode,
      purchasedPrice: parseFloat(req.body.purchasedPrice),
      sellingPrice: req.body.sellingPrice ? parseFloat(req.body.sellingPrice) : null,
      productQuantity: parseInt(req.body.productQuantity, 10),
      categoryName: req.body.category || null,
      brandName: req.body.brand || null,
      status: req.body.status || 'ACTIVE',
      tags: req.body.tags || null,
      lowStockThreshold: req.body.lowStockThreshold ? parseInt(req.body.lowStockThreshold, 10) : null,
      profitMargin: req.body.profitMargin ? parseFloat(req.body.profitMargin) : null,
      createdById: currentUser.id,
      adminId: currentUser.isAdmin ? currentUser.id : null,
    };

    if (!productData.productName || !productData.productDescription || !productData.productSKU ||
        !productData.productBarcode || !productData.purchasedPrice || !productData.productQuantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!/^[0-9]+$/.test(productData.productBarcode)) {
      return res.status(400).json({ success: false, message: 'Product barcode must contain only numbers' });
    }

    if (productData.productName.length < 2) {
      return res.status(400).json({ success: false, message: 'Product name must be at least 2 characters long' });
    }

    let product;
    if (req.body.id) {
      product = await Product.findById(req.body.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const createdById = currentUser.created_by_id || currentUser.id;
      const createdByUsers = await AppUser.findAllByCreatedBy(createdById);
      const createdByUserIds = createdByUsers.map(user => user.id).concat(createdById);

      if (!createdByUserIds.includes(product.created_by_id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this product!' });
      }

      product = await Product.update(req.body.id, productData);
    } else {
      product = await Product.create(productData);
    }

    res.status(200).json({ success: true, message: `Product ${req.body.id ? 'updated' : 'created'} successfully` });
  } catch (err) {
    console.error('Error in /saveProduct:', err);
    res.status(500).json({ success: false, message: `Failed to save product: ${err.message}` });
  }
});

router.post('/addCategory', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    let category = await Category.findByNameAndCreatedBy(name, currentUser.id);
    if (category) return res.status(400).json({ success: false, message: 'Category already exists' });

    category = await Category.create(name, currentUser.id);
    res.status(200).json({ success: true, category: { id: category.id, name: category.name } });
  } catch (err) {
    console.error('Error in /addCategory:', err);
    res.status(400).json({ success: false, message: `Failed to save category: ${err.message}` });
  }
});

router.post('/addBrand', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Brand name is required' });

    let brand = await Brand.findByNameAndCreatedBy(name, currentUser.id);
    if (brand) return res.status(400).json({ success: false, message: 'Brand already exists' });

    brand = await Brand.create(name, currentUser.id);
    res.status(200).json({ success: true, brand: { id: brand.id, name: brand.name } });
  } catch (err) {
    console.error('Error in /addBrand:', err);
    res.status(400).json({ success: false, message: `Failed to save brand: ${err.message}` });
  }
});

router.get('/getBrandsByCategory', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const categoryName = req.query.categoryName?.trim();
    let brands = [];
    if (categoryName) {
      const products = await Product.findAllByCreatedBy(currentUser.id);
      brands = await Brand.findAllByCreatedBy(currentUser.id);
      brands = brands.filter(brand =>
        products.some(product => product.categoryName === categoryName && product.brandName === brand.name)
      );
    } else {
      brands = await Brand.findAllByCreatedBy(currentUser.id);
    }

    const result = brands.map(brand => ({
      id: brand.id || '',
      name: brand.name || 'Unknown Brand'
    }));
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in /getBrandsByCategory:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/searchCategories', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const query = req.query.q?.toLowerCase() || '';
    const categories = await Category.findAllByCreatedBy(currentUser.id);
    const filteredCategories = categories
      .filter(cat => cat.name.toLowerCase().includes(query))
      .map(cat => ({ id: cat.id, name: cat.name }));

    res.status(200).json(filteredCategories);
  } catch (err) {
    console.error('Error in /searchCategories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/searchBrands', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const query = req.query.q?.toLowerCase() || '';
    const brands = await Brand.findAllByCreatedBy(currentUser.id);
    const filteredBrands = brands
      .filter(brand => brand.name.toLowerCase().includes(query))
      .map(brand => ({ id: brand.id, name: brand.name }));

    res.status(200).json(filteredBrands);
  } catch (err) {
    console.error('Error in /searchBrands:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/deleteProduct/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized access!' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const createdById = currentUser.created_by_id || currentUser.id;
    const createdByUsers = await AppUser.findAllByCreatedBy(createdById);
    const createdByUserIds = createdByUsers.map(user => user.id).concat(createdById);

    if (!createdByUserIds.includes(product.created_by_id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access!' });
    }

    const pool = await connectDB();
    await pool.request()
      .input('productId', sql.Int, req.params.id)
      .query('DELETE FROM order_items WHERE product_id = @productId');

    await Product.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error in /deleteProduct:', err);
    res.status(500).json({ success: false, message: `An unexpected error occurred: ${err.message}` });
  }
});

router.get('/productByBarcode', authenticateToken, async (req, res) => {
  try {
    const barcode = req.query.productBarcode?.trim();
    if (!barcode) {
      return res.status(400).json({ message: 'Please enter a barcode.' });
    }

    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;

    const product = await Product.findByBarcodeAndCreatedBy(barcode, createdById);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      productName: product.productName,
      productBarcode: product.productBarcode,
      sellingPrice: product.sellingPrice,
      purchasedPrice: product.purchasedPrice,
      profitMargin: product.profitMargin || ((product.sellingPrice - product.purchasedPrice) / product.purchasedPrice * 100).toFixed(2),
      quantity: 1,
      subtotal: product.sellingPrice,
      profit: (product.sellingPrice - product.purchasedPrice).toFixed(2)
    });
  } catch (err) {
    console.error('Error in /productByBarcode:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
