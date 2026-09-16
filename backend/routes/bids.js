const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Job = require('../models/Job');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

// GET /api/bids/job/:jobId — get all bids for a job
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const bids = await Bid.find({ job: req.params.jobId })
      .populate('provider', 'name skills averageRating trustScore hourlyRate isTopRated location verificationStatus');
    // Only surface bids from verified providers
    const visibleBids = bids.filter(b => b.provider?.verificationStatus === 'verified');
    res.json(visibleBids);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bids/my — get provider's own bids
router.get('/my', protect, authorize('provider'), async (req, res) => {
  try {
    const bids = await Bid.find({ provider: req.user._id })
      .populate('job', 'title status budget category location customer')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bids — submit a bid (provider only)
router.post('/', protect, authorize('provider'), async (req, res) => {
  try {
    const { jobId, amount, message, estimatedDays } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ message: 'Job is not open for bids' });
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Your account must be verified by admin before you can place bids' });
    }

    const existing = await Bid.findOne({ job: jobId, provider: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already placed a bid on this job' });

    const bid = await Bid.create({
      job: jobId,
      provider: req.user._id,
      amount, message,
      estimatedDays: estimatedDays || 1
    });

    // Real-time: notify customer
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const socketId = connectedUsers[job.customer.toString()];
    if (socketId) {
      io.to(socketId).emit('new_bid', { jobId, bidId: bid._id, message: 'A provider placed a bid on your job!' });
    }

    const populated = await Bid.findById(bid._id)
      .populate('provider', 'name skills averageRating trustScore hourlyRate isTopRated');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bids/:id/accept — customer accepts a bid
router.put('/:id/accept', protect, authorize('customer'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('job');
    if (!bid) return res.status(404).json({ message: 'Bid not found' });

    const job = bid.job;
    if (job.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Accept this bid, reject others
    await Bid.updateMany({ job: job._id, _id: { $ne: bid._id } }, { status: 'rejected' });
    bid.status = 'accepted';
    await bid.save();

    // Update job status and assign provider
    await Job.findByIdAndUpdate(job._id, {
      status: 'in_progress',
      assignedProvider: bid.provider
    });

    // Create pending transaction (commission calculated on completion)
    await Transaction.create({
      job: job._id,
      customer: req.user._id,
      provider: bid.provider,
      totalAmount: bid.amount,
      commissionAmount: 0,
      providerEarning: bid.amount,
      type: 'job',
      status: 'pending'
    });

    // Notify provider
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const socketId = connectedUsers[bid.provider.toString()];
    if (socketId) {
      io.to(socketId).emit('bid_accepted', { jobId: job._id, message: 'Your bid was accepted!' });
    }

    res.json({ bid, message: 'Bid accepted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bids/:id/reject
router.put('/:id/reject', protect, authorize('customer'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('job');
    if (!bid) return res.status(404).json({ message: 'Bid not found' });
    if (bid.job.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    bid.status = 'rejected';
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
