const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { calcDistance } = require('../utils/matchAlgorithm');

// GET /api/providers — browse providers with filters
router.get('/', protect, async (req, res) => {
  try {
    const { skill, minRating, city, available } = req.query;
    const filter = { role: 'provider', verificationStatus: 'verified' };

    if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
    if (minRating) filter.averageRating = { $gte: parseFloat(minRating) };
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (available === 'true') filter.availability = true;

    // Premium providers first, then by trust score + rating
    const providers = await User.find(filter)
      .select('-password')
      .sort({ isPremium: -1, isTopRated: -1, trustScore: -1, averageRating: -1 });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/providers/nearby?lat=&lng=&radius=&skill=&available=
// Returns available providers within radius km, sorted by distance
router.get('/nearby', protect, async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 50;
    const { skill, available } = req.query;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const filter = { role: 'provider', verificationStatus: 'verified', 'location.lat': { $ne: 0 } };
    if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
    if (available === 'true') filter.availability = true;

    const providers = await User.find(filter).select('-password');

    const nearby = providers
      .map(p => {
        const dist = calcDistance(lat, lng, p.location.lat, p.location.lng);
        return { ...p.toObject(), distance: Math.round(dist * 10) / 10 };
      })
      .filter(p => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/providers/:id — get provider profile
router.get('/:id', protect, async (req, res) => {
  try {
    const provider = await User.findById(req.params.id).select('-password');
    if (!provider || provider.role !== 'provider' || provider.verificationStatus !== 'verified') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ provider, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/providers/:id/stats — provider dashboard stats
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const provider = await User.findById(req.params.id).select('-password');
    const completedJobs = await Job.countDocuments({ assignedProvider: req.params.id, status: 'completed' });
    const activeJobs = await Job.countDocuments({ assignedProvider: req.params.id, status: 'in_progress' });

    res.json({
      totalEarnings: provider.totalEarnings,
      jobsCompleted: completedJobs,
      activeJobs,
      averageRating: provider.averageRating,
      trustScore: provider.trustScore,
      isTopRated: provider.isTopRated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/providers/availability — toggle availability
router.put('/availability', protect, async (req, res) => {
  try {
    const { availability } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
