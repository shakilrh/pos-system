const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');
const AppUser = require('../models/AppUser');
const Customer = require('../models/Customer');
const CustomerPayment = require('../models/CustomerPayment');
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

router.get('/getProductByBarcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    if (!currentUser) return res.status(401).json({ success: false, message: 'Unauthorized access!' });

    const createdById = currentUser.created_by_id || currentUser.id;
    const createdByUsers = await AppUser.findAllByCreatedBy(createdById);
    const allowedUserIds = createdByUsers.map(user => user.id).concat(createdById);

    const product = await Product.findByBarcode(req.params.barcode);
    if (!product || !allowedUserIds.includes(product.created_by_id)) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    res.status(200).json({
      productName: product.productName,
      productBarcode: product.productBarcode,
      sellingPrice: product.sellingPrice,
      purchasedPrice: product.purchasedPrice,
      productQuantity: product.productQuantity,
      profitMargin: product.profitMargin || ((product.sellingPrice - product.purchasedPrice) / product.purchasedPrice * 100).toFixed(2)
    });
  } catch (err) {
    console.error('Error in /getProductByBarcode:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/saveOrder', authenticateToken, async (req, res) => {
  try {
    const { customerName, products, amountReceived, amountReturned, discountAmount, subtotal } = req.body;

    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;
    const createdByUser = await AppUser.findById(createdById);

    if (!customerName?.trim()) {
      return res.status(400).json({ status: 'error', field: 'customerName', message: 'Customer name is required.' });
    }

    let customer = await Customer.findByNameAndCreatedBy(customerName, createdById);
    if (!customer) {
      customer = await Customer.create({ name: customerName, created_by_id: createdById });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({ status: 'error', field: 'products', message: 'At least one product must be added.' });
    }

    const invalidProducts = products.filter(p => !p.quantity || p.quantity <= 0);
    if (invalidProducts.length > 0) {
      const error = invalidProducts[0];
      return res.status(400).json({
        status: 'error',
        field: 'products',
        productBarcode: error.productBarcode,
        message: 'Product quantity must be greater than zero.'
      });
    }

    let totalAmount = subtotal - (discountAmount || 0);
    if (totalAmount < 0) totalAmount = 0;

    const leaseAmount = (amountReceived - (amountReturned || 0)) - totalAmount;

    const order = await Order.create({
      customer_id: customer.id,
      totalAmount,
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      amountReceived: amountReceived || 0,
      remainingAmount: amountReturned || 0,
      leaseAmount,
      created_by_id: createdById
    });

    const stockErrors = [];
    for (const productData of products) {
      const product = await Product.findByBarcode(productData.productBarcode);
      if (!product || product.created_by_id !== createdById) {
        stockErrors.push({
          barcode: productData.productBarcode,
          message: `Product '${productData.productBarcode}' not found or unauthorized.`
        });
        continue;
      }

      if (product.productQuantity === null || product.productQuantity === undefined) {
        stockErrors.push({
          barcode: productData.productBarcode,
          message: `Product '${productData.productBarcode}' has invalid stock quantity.`
        });
        continue;
      }

      if (product.productQuantity < productData.quantity) {
        stockErrors.push({
          barcode: productData.productBarcode,
          message: `Not enough stock for '${product.productName}' (Available: ${product.productQuantity}, Requested: ${productData.quantity}).`
        });
        continue;
      }

      await OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        quantity: productData.quantity,
        subtotal: product.sellingPrice * productData.quantity,
        created_by_id: createdById
      });

      const newQuantity = product.productQuantity - productData.quantity;
      console.log(`Updating stock for product ID ${product.id}: Current=${product.productQuantity}, Requested=${productData.quantity}, New=${newQuantity}`);

      await Product.updateStock(product.id, newQuantity);
    }

    if (stockErrors.length > 0) {
      const error = stockErrors[0];
      return res.status(400).json({
        status: 'error',
        field: 'stock',
        productBarcode: error.barcode,
        message: error.message
      });
    }

    if (amountReceived == null || amountReceived <= 0) {
      return res.status(400).json({
        status: 'error',
        field: 'amountReceived',
        message: 'Please enter a valid amount received.'
      });
    }

    await Customer.updateLeaseAmount(customer.id, customer.totalLeaseAmount + leaseAmount);

    res.status(200).json({ status: 'success', message: 'Checkout completed!', orderId: order.id });
  } catch (err) {
    console.error('Error in /saveOrder:', err);
    res.status(500).json({ status: 'error', field: 'general', message: 'Error while saving the order.' });
  }
});

router.get('/orderDetails/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;

    const order = await Order.findById(req.params.id);
    if (!order || order.created_by_id !== createdById) {
      return res.status(404).json({ message: 'Order not found or unauthorized!' });
    }

    const orderItems = await OrderItem.findByOrderId(order.id);
    const formattedItems = orderItems.map(item => ({
      productName: item.product_name,
      price: item.product_price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    res.status(200).json({
      order: {
        id: order.id,
        customerName: order.customer_name,
        dateCreated: order.dateCreated,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        amountReceived: order.amountReceived,
        remainingAmount: order.remainingAmount,
        leaseAmount: order.leaseAmount
      },
      orderItems: formattedItems
    });
  } catch (err) {
    console.error('Error in /orderDetails:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/listOrders', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;

    const { startDate, endDate } = req.query;
    const orders = await Order.findByCreatedBy(createdById, startDate, endDate);
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      orders: orders.map(order => ({
        id: order.id,
        customerName: order.customer_name,
        totalAmount: order.totalAmount,
        dateCreated: order.dateCreated
      })),
      totalSales
    });
  } catch (err) {
    console.error('Error in /listOrders:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/searchCustomerOrders', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;
    const customerName = req.query.customerName?.trim();

    if (!customerName) {
      return res.status(200).json({
        status: 'success',
        orders: [],
        customerName: '',
        totalSales: 0,
        totalLeaseAmount: 0,
        payments: []
      });
    }

    const customer = await Customer.findByNameAndCreatedBy(customerName, createdById);
    if (!customer) {
      return res.status(200).json({
        status: 'success',
        orders: [],
        customerName,
        totalSales: 0,
        totalLeaseAmount: 0,
        payments: []
      });
    }

    const orders = await Order.findByCustomerAndCreatedBy(customer.id, createdById);
    const payments = await CustomerPayment.findByCustomerAndCreatedBy(customer.id, createdById);

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      status: 'success',
      orders: orders.map(order => ({
        id: order.id,
        customerName: order.customer_name,
        totalAmount: order.totalAmount,
        dateCreated: new Date(order.dateCreated).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      })),
      customerName,
      totalSales,
      totalLeaseAmount: customer.totalLeaseAmount,
      payments: payments.map(payment => ({
        amount: payment.amount,
        dateCreated: new Date(payment.dateCreated).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))
    });
  } catch (err) {
    console.error('Error in /searchCustomerOrders:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

router.post('/addPayment', authenticateToken, async (req, res) => {
  try {
    const currentUser = await AppUser.findByUsername(req.user.username);
    const createdById = currentUser.created_by_id || currentUser.id;
    const { customerName, paymentAmount } = req.body;

    if (!customerName?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Customer name is required.' });
    }

    if (!paymentAmount) {
      return res.status(400).json({ status: 'error', message: 'Payment amount is required.' });
    }

    const paymentAmountValue = parseFloat(paymentAmount);
    if (isNaN(paymentAmountValue) || paymentAmountValue <= 0) {
      return res.status(400).json({ status: 'error', message: 'Payment amount must be greater than zero.' });
    }

    const customer = await Customer.findByNameAndCreatedBy(customerName, createdById);
    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Customer not found.' });
    }

    const newLeaseAmount = customer.totalLeaseAmount + paymentAmountValue;
    await Customer.updateLeaseAmount(customer.id, newLeaseAmount);

    await CustomerPayment.create({
      amount: paymentAmountValue,
      customer_id: customer.id,
      created_by_id: createdById
    });

    res.status(200).json({
      status: 'success',
      message: `Payment of ${paymentAmountValue} PKR added successfully.`,
      totalLeaseAmount: newLeaseAmount
    });
  } catch (err) {
    console.error('Error in /addPayment:', err);
    res.status(500).json({ status: 'error', message: 'Error updating lease amount or saving payment.' });
  }
});

router.get('/ordersOverTime', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT
        CAST(dateCreated AS DATE) AS order_date,
        COUNT(id) AS order_count
      FROM orders
      GROUP BY CAST(dateCreated AS DATE)
      ORDER BY order_date ASC
    `);

    const formattedOrders = result.recordset.map(row => ({
      date: row.order_date.toISOString().split('T')[0],
      count: row.order_count
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error('Error in /ordersOverTime:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
