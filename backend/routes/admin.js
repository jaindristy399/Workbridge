const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// GET /api/admin/stats — overview analytics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProviders, totalCustomers, totalJobs,
      openJobs, completedJobs, totalTransactions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'provider' }),
      User.countDocuments({ role: 'customer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Job.countDocuments({ status: 'completed' }),
      Transaction.countDocuments({ status: 'completed' })
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      totalUsers, totalProviders, totalCustomers,
      totalJobs, openJobs, completedJobs,
      totalTransactions, totalRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — all users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/jobs — all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('customer', 'name email')
      .populate('assignedProvider', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/verify — directly verify a user (no document upload needed)
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'verified', isVerified: true, verificationNote: '' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/revenue — full revenue breakdown
router.get('/revenue', async (req, res) => {
  try {
    const [jobAgg, subAgg, premiumCount, completedJobs] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'job', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'subscription', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      User.countDocuments({ role: 'provider', isPremium: true }),
      Job.countDocuments({ status: 'completed' }),
    ]);

    const totalCommission         = jobAgg[0]?.total || 0;
    const totalSubscriptionRevenue = subAgg[0]?.total || 0;
    const totalRevenue            = totalCommission + totalSubscriptionRevenue;

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAgg = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$commissionAmount' },
          count:   { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalRevenue,
      totalCommission,
      totalSubscriptionRevenue,
      totalJobsCompleted: completedJobs,
      totalPremiumUsers: premiumCount,
      totalSubscriptions: subAgg[0]?.count || 0,
      monthlyBreakdown: monthlyAgg.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        revenue: m.revenue,
        transactions: m.count
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/transactions — paginated transaction list
router.get('/transactions', async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type  = req.query.type; // 'job' | 'subscription' | undefined

    const filter = { status: 'completed' };
    if (type) filter.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('job',      'title category budget')
        .populate('customer', 'name email')
        .populate('provider', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter)
    ]);

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/subscriptions — all premium providers
router.get('/subscriptions', async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider', isPremium: true })
      .select('name email isPremium subscriptionExpiry trustScore averageRating')
      .sort({ subscriptionExpiry: -1 });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
