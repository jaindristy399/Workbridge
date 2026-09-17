const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, skills, location, hourlyRate, bio } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password,
      role: role || 'customer',
      skills: skills || [],
      hourlyRate: hourlyRate || 0,
      bio: bio || '',
      location: location || { city: '', lat: 0, lng: 0 }
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role,
              skills: user.skills, location: user.location, averageRating: user.averageRating,
              trustScore: user.trustScore, hourlyRate: user.hourlyRate, isTopRated: user.isTopRated }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role,
              skills: user.skills, location: user.location, averageRating: user.averageRating,
              trustScore: user.trustScore, hourlyRate: user.hourlyRate, bio: user.bio,
              isTopRated: user.isTopRated, jobsCompleted: user.jobsCompleted,
              totalEarnings: user.totalEarnings, availability: user.availability }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });}

});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update via this route
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
