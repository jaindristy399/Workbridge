const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// GET /api/transactions — get user's transactions
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'customer'
      ? { customer: req.user._id }
      : { provider: req.user._id };

    const transactions = await Transaction.find(filter)
      .populate('job', 'title category')
      .populate('customer', 'name')
      .populate('provider', 'name')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions/pay — mock payment simulation
router.post('/pay', protect, async (req, res) => {
  try {
    const { transactionId, method } = req.body;
    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    // Simulate payment processing
    tx.status = 'completed';
    tx.method = method || 'card';
    await tx.save();

    res.json({ success: true, transaction: tx, message: 'Payment processed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
