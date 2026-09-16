const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  jobId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  default: null },
  totalAmount:       { type: Number, required: true },
  commissionAmount:  { type: Number, default: 0 },
  providerEarning:   { type: Number, default: 0 },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  paymentStatus:     { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
}, { timestamps: true });

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ jobId: 1 });
paymentTransactionSchema.index({ providerId: 1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
