const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  message: { type: String, required: true },
  estimatedDays: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// One bid per provider per job
bidSchema.index({ job: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
