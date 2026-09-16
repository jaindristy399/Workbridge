const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Financial breakdown
  totalAmount:      { type: Number, required: true },
  commissionRate:   { type: Number, default: 0.10 },      // 10%
  commissionAmount: { type: Number, default: 0 },
  providerEarning:  { type: Number, default: 0 },

  // Type: job commission OR subscription payment
  type: { type: String, enum: ['job', 'subscription'], default: 'job' },

  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },

  paymentRef: {
    type: String,
    default: () => `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  },
  method: { type: String, enum: ['card', 'wallet', 'upi'], default: 'card' }
}, { timestamps: true });

// Virtual: backward-compat alias
transactionSchema.virtual('amount').get(function () { return this.totalAmount; });

module.exports = mongoose.model('Transaction', transactionSchema);
