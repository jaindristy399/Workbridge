const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const PaymentTransaction = require('../models/PaymentTransaction');

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Creates a real Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: 'Valid amount is required' });

    const order = await razorpay.orders.create({
      amount:   Math.round(Number(amount) * 100), // paise
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ message: err.error?.description || err.message || 'Failed to create order' });
  }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Verifies Razorpay signature then stores transaction
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, jobId, providerId, amount } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
      return res.status(400).json({ message: 'Payment details missing' });

    // Verify HMAC-SHA256 signature
    const body      = razorpayOrderId + '|' + razorpayPaymentId;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });

    const total      = Number(amount);
    const commission = Math.round(total * 0.10 * 100) / 100;
    const provEarn   = Math.round((total - commission) * 100) / 100;

    const tx = await PaymentTransaction.create({
      userId:            req.user._id,
      providerId:        providerId || null,
      jobId:             jobId      || null,
      totalAmount:       total,
      commissionAmount:  commission,
      providerEarning:   provEarn,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus:     'success',
    });

    res.json({ paymentStatus: 'success', transaction: tx });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ message: err.message, detail: err.toString() });
  }
});

// ── GET /api/payments/history ─────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const txs = await PaymentTransaction.find({ userId: req.user._id })
      .populate('jobId',      'title budget category')
      .populate('providerId', 'name')
      .sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
