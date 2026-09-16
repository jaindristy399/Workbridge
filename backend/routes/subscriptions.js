const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

const SUBSCRIPTION_PRICE = 199;
const SUBSCRIPTION_DAYS  = 30;

// POST /api/subscriptions/subscribe — provider subscribes to premium
router.post('/subscribe', protect, authorize('provider'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if already active premium
    if (user.isPremium && user.subscriptionExpiry && user.subscriptionExpiry > new Date()) {
      return res.status(400).json({ message: 'You already have an active premium subscription.' });
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + SUBSCRIPTION_DAYS);

    user.isPremium = true;
    user.subscriptionExpiry = expiry;
    await user.save();

    // Record subscription transaction
    await Transaction.create({
      customer: user._id,   // provider is paying
      provider: null,
      job: null,
      totalAmount: SUBSCRIPTION_PRICE,
      commissionAmount: SUBSCRIPTION_PRICE,  // full amount is platform revenue
      providerEarning: 0,
      type: 'subscription',
      status: 'completed',
    });

    res.json({
      success: true,
      isPremium: true,
      subscriptionExpiry: expiry,
      message: `Premium activated! Valid until ${expiry.toLocaleDateString()}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/subscriptions/status — check current subscription status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isPremium subscriptionExpiry');

    // Auto-expire if past date
    if (user.isPremium && user.subscriptionExpiry && user.subscriptionExpiry < new Date()) {
      user.isPremium = false;
      await user.save();
    }

    res.json({
      isPremium: user.isPremium,
      subscriptionExpiry: user.subscriptionExpiry,
      price: SUBSCRIPTION_PRICE,
      daysLeft: user.isPremium && user.subscriptionExpiry
        ? Math.max(0, Math.ceil((user.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)))
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
