const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');
const { detectCategory, suggestPriceRange, getAllCategories } = require('../utils/aiHelpers');
const { matchProviders, calcDistance } = require('../utils/matchAlgorithm');

// GET /api/jobs/categories — list all categories
router.get('/categories', (req, res) => {
  res.json(getAllCategories());
});

// POST /api/jobs/analyze — AI: detect category & suggest price from title+description
router.post('/analyze', protect, async (req, res) => {
  const { title, description } = req.body;
  const { category, requiredSkills } = detectCategory(title, description);
  const priceRange = suggestPriceRange(category);
  res.json({ category, requiredSkills, priceRange });
});

// GET /api/jobs — list jobs (with filters, optional pagination via ?page=&limit=)
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, search, myJobs, page, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    // Providers see open jobs; customers see their own jobs
    if (req.user.role === 'provider') {
      filter.status = 'open';
    } else if (req.user.role === 'customer' || myJobs) {
      filter.customer = req.user._id;
    }

    // Paginated response when ?page= is supplied
    if (page !== undefined) {
      const p     = Math.max(1, parseInt(page)  || 1);
      const lim   = Math.min(100, parseInt(limit) || 20);
      const total = await Job.countDocuments(filter);
      const jobs  = await Job.find(filter)
        .populate('customer', 'name location averageRating')
        .populate('assignedProvider', 'name averageRating')
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim);
      return res.json({ jobs, total, page: p, pages: Math.ceil(total / lim) });
    }

    const jobs = await Job.find(filter)
      .populate('customer', 'name location averageRating')
      .populate('assignedProvider', 'name averageRating')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/feed — provider job feed filtered by skills
router.get('/feed', protect, authorize('provider'), async (req, res) => {
  try {
    const provider = await User.findById(req.user._id);
    const { category } = req.query;

    const filter = { status: 'open' };
    if (category) filter.category = category;

    // Prefer jobs matching provider's skills
    const allOpenJobs = await Job.find(filter)
      .populate('customer', 'name location averageRating')
      .sort({ createdAt: -1 });

    // Sort: jobs whose requiredSkills overlap provider's skills come first
    const providerSkills = provider.skills.map(s => s.toLowerCase());
    const sorted = allOpenJobs.sort((a, b) => {
      const aMatch = (a.requiredSkills || []).filter(s => providerSkills.includes(s.toLowerCase())).length;
      const bMatch = (b.requiredSkills || []).filter(s => providerSkills.includes(s.toLowerCase())).length;
      return bMatch - aMatch;
    });

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs — create job (customer only)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { title, description, budget, location, hiringMode, urgency } = req.body;

    // AI: auto-detect category & required skills
    const { category, requiredSkills } = detectCategory(title, description);
    const priceRange = suggestPriceRange(category);

    const job = await Job.create({
      title, description, budget,
      category,
      requiredSkills,
      suggestedBudgetMin: priceRange.min,
      suggestedBudgetMax: priceRange.max,
      location: location || { city: '', lat: 0, lng: 0 },
      customer: req.user._id,
      hiringMode: hiringMode || 'bidding',
      urgency: urgency || 'medium'
    });

    // AI matching: find top 3 providers
    const matches = await matchProviders(job, 3);
    job.matchedProviders = matches.map(m => m.provider._id);
    await job.save();

    // Real-time: notify all connected providers
    const io = req.app.get('io');
    io.emit('new_job', { job, message: 'A new job has been posted!' });

    const populated = await Job.findById(job._id)
      .populate('customer', 'name location')
      .populate('matchedProviders', 'name skills averageRating hourlyRate trustScore');

    res.status(201).json({ job: populated, matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/nearby?lat=&lng=&radius=&category=
// Returns open jobs within radius km (default 50 km), sorted by distance
router.get('/nearby', protect, async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 50;   // km
    const { category } = req.query;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const filter = { status: 'open', 'location.lat': { $ne: 0 } };
    if (category) filter.category = category;

    const jobs = await Job.find(filter)
      .populate('customer', 'name location averageRating')
      .sort({ createdAt: -1 });

    const nearby = jobs
      .map(j => {
        const dist = calcDistance(lat, lng, j.location.lat, j.location.lng);
        return { ...j.toObject(), distance: Math.round(dist * 10) / 10 };
      })
      .filter(j => j.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name email location averageRating')
      .populate('assignedProvider', 'name skills averageRating hourlyRate trustScore isTopRated isVerified')
      .populate('matchedProviders', 'name skills averageRating hourlyRate trustScore isTopRated isVerified location');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id/status — update job status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Only customer or assigned provider can update status
    const isOwner = job.customer.toString() === req.user._id.toString();
    const isProvider = job.assignedProvider?.toString() === req.user._id.toString();

    if (!isOwner && !isProvider) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.status = status;
    await job.save();

    // Auto-create commission transaction when job is completed
    if (status === 'completed' && job.assignedProvider) {
      const COMMISSION_RATE = 0.10;
      const totalAmount      = job.budget;
      const commissionAmount = Math.round(totalAmount * COMMISSION_RATE * 100) / 100;
      const providerEarning  = totalAmount - commissionAmount;

      // Create (or update existing) transaction
      const existing = await Transaction.findOne({ job: job._id, type: 'job' });
      if (!existing) {
        await Transaction.create({
          job: job._id,
          customer: job.customer,
          provider: job.assignedProvider,
          totalAmount,
          commissionRate: COMMISSION_RATE,
          commissionAmount,
          providerEarning,
          type: 'job',
          status: 'completed',
        });
      } else if (existing.status !== 'completed') {
        existing.commissionAmount = commissionAmount;
        existing.providerEarning  = providerEarning;
        existing.totalAmount      = totalAmount;
        existing.status           = 'completed';
        await existing.save();
      }

      // Update provider earnings (use providerEarning, not full budget)
      const updatedProvider = await User.findByIdAndUpdate(
        job.assignedProvider,
        { $inc: { jobsCompleted: 1, totalEarnings: providerEarning } },
        { new: true }
      );

      // Auto-verify provider after 3 completed jobs
      if (updatedProvider && updatedProvider.jobsCompleted >= 3 && !updatedProvider.isVerified) {
        await User.findByIdAndUpdate(job.assignedProvider, {
          isVerified: true,
          verificationStatus: 'verified',
        });
      }
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id/assign — direct hire a provider
router.put('/:id/assign', protect, authorize('customer'), async (req, res) => {
  try {
    const { providerId } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    job.assignedProvider = providerId;
    job.status = 'in_progress';
    await job.save();

    // Notify assigned provider
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const socketId = connectedUsers[providerId];
    if (socketId) io.to(socketId).emit('job_assigned', { jobId: job._id });

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
