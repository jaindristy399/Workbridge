const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  suggestedBudgetMin: { type: Number },
  suggestedBudgetMax: { type: Number },

  location: {
    city: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },

  // Provider assigned to job
  assignedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // AI-suggested top matching providers
  matchedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Skills required for this job
  requiredSkills: [{ type: String }],

  // Hiring mode
  hiringMode: { type: String, enum: ['direct', 'bidding'], default: 'bidding' },

  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

jobSchema.index({ customer: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
