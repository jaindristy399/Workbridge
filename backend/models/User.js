const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },

  // Provider-specific fields
  skills: [{ type: String }],
  hourlyRate: { type: Number, default: 0 },
  availability: { type: Boolean, default: true },
  bio: { type: String, default: '' },

  // Location (mock coordinates for distance matching)
  location: {
    city: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  // Ratings & Trust
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  trustScore: { type: Number, default: 50 }, // 0-100

  // Stats
  jobsCompleted: { type: Number, default: 0 },
  jobsPosted: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },

  // Response speed mock (hours)
  avgResponseTime: { type: Number, default: 2 },

  profileImage: { type: String, default: '' },
  isTopRated: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  // ID Verification system
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },
  verificationDocuments: {
    idProof:   { type: String, default: '' }, // file path
    workProof: { type: String, default: '' }, // file path (providers only)
  },
  verificationNote:    { type: String, default: '' }, // admin rejection reason
  verificationSubmittedAt: { type: Date, default: null },

  // Extra fields collected during verification
  phone:      { type: String, default: '' },
  experience: { type: String, default: '' }, // e.g. "5 years"

  // Premium subscription
  isPremium: { type: Boolean, default: false },
  subscriptionExpiry: { type: Date, default: null }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Recalculate trust score based on stats
userSchema.methods.calculateTrustScore = function () {
  const completionRate = this.jobsCompleted > 0 ? Math.min(this.jobsCompleted / 10, 1) * 40 : 0;
  const ratingScore = (this.averageRating / 5) * 40;
  const responseScore = Math.max(0, (5 - this.avgResponseTime) / 5) * 20;
  this.trustScore = Math.round(completionRate + ratingScore + responseScore);
  this.isTopRated = this.trustScore >= 80 && this.averageRating >= 4.5;
};

module.exports = mongoose.model('User', userSchema);
