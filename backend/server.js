// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Add path module for serving static files
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const orderRoutes = require('./routes/order');
const AppUser = require('./models/AppUser');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const CustomerPayment = require('./models/CustomerPayment');
const Permission = require('./models/Permission');
const AssignRole = require('./models/AssignRole');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
require('dotenv').config();

const app = express();

// Configure CORS to allow requests from frontend (localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from the frontend build directory (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Define a root route for the API
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Welcome to the POS System API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/order', orderRoutes);

// Catch-all route to serve frontend's index.html for client-side routing (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Initialize database tables
const initDB = async () => {
  try {
    console.log('Starting database initialization...');
    await AppUser.createTable();
    await Permission.createTable();
    await AssignRole.createTable();
    await Product.createTable();
    await Category.createTable();
    await Brand.createTable();
    console.log('Creating customers table...');
    await Customer.createTable();
    console.log('Creating orders table...');
    await Order.createTable();
    console.log('Creating order_items table...');
    await OrderItem.createTable();
    console.log('Creating customer_payments table...');
    await CustomerPayment.createTable();
    console.log('All database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database tables:', err);
    throw err;
  }
};

// Start the server after database initialization
const PORT = process.env.PORT || 3001; // Set to 3001
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server due to database initialization error:', err);
    process.exit(1);
  });
