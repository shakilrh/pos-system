const AppUser = require('../models/AppUser');
const AssignRole = require('../models/AssignRole');
const Permission = require('../models/Permission');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

exports.registerStep1 = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await AppUser.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const tempToken = jwt.sign({ username, email, password }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.status(200).json({ success: true, tempToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerStep2 = async (req, res) => {
  const { tempToken, businessName, phone, address } = req.body;
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { username, email, password } = decoded;

    const userId = await AppUser.createUser({ username, email, password, businessName, phone, address });
    const userRoleId = await Permission.getRoleId('USER');
    await AssignRole.assignRole(userId, userRoleId);

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid token or server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await AppUser.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
