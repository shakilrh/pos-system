const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AppUser = require('../models/AppUser');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await AppUser.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await AppUser.verifyPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Example protected route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await AppUser.findById(req.user.id);
    res.status(200).json({ username: user.username, id: user.id });
  } catch (err) {
    console.error('Error in /profile:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
