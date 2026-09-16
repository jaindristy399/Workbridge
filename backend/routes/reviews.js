const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

// POST /api/reviews — submit a review after job completion
router.post('/', protect, async (req, res) => {
  try {
    const { jobId, revieweeId, rating, comment } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'completed') return res.status(400).json({ message: 'Job must be completed to review' });

    const existing = await Review.findOne({ job: jobId, reviewer: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this job' });

    const review = await Review.create({
      job: jobId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment
    });

    // Update reviewee's average rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const reviewee = await User.findById(revieweeId);
    reviewee.averageRating = Math.round(avg * 10) / 10;
    reviewee.totalReviews = allReviews.length;

    // Auto-verify after 3+ reviews/completed jobs
    if (reviewee.jobsCompleted >= 3 && !reviewee.isVerified) {
      reviewee.isVerified = true;
    }

    reviewee.calculateTrustScore();
    await reviewee.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/:userId — optional pagination via ?page=&limit=
router.get('/:userId', protect, async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (page !== undefined) {
      const p     = Math.max(1, parseInt(page)  || 1);
      const lim   = Math.min(50, parseInt(limit) || 10);
      const total = await Review.countDocuments({ reviewee: req.params.userId });
      const reviews = await Review.find({ reviewee: req.params.userId })
        .populate('reviewer', 'name role')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim);
      return res.json({ reviews, total, page: p, pages: Math.ceil(total / lim) });
    }

    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name role')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
