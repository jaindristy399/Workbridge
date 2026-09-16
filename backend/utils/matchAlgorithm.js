const User = require('../models/User');

/**
 * Mock Haversine distance calculation between two lat/lng points (returns km).
 * In production, use real GPS coordinates.
 */
const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Score a provider for a given job.
 * Returns a numeric score (higher = better match).
 *
 * Scoring breakdown (100 points total):
 *  - Skill match:    40 pts  (% of required skills matched)
 *  - Rating:         30 pts  (averageRating / 5 * 30)
 *  - Distance:       20 pts  (closer = more points, max 50 km range)
 *  - Price:          10 pts  (lower hourly rate relative to budget wins)
 */
const scoreProvider = (provider, job) => {
  // 1. Skill match
  const requiredSkills = job.requiredSkills || [];
  let skillScore = 0;
  if (requiredSkills.length > 0) {
    const providerSkillsLower = (provider.skills || []).map(s => s.toLowerCase());
    const matched = requiredSkills.filter(skill =>
      providerSkillsLower.some(ps => ps.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps))
    );
    skillScore = (matched.length / requiredSkills.length) * 40;
  } else {
    skillScore = 20; // no requirements — neutral score
  }

  // 2. Rating score
  const ratingScore = (provider.averageRating / 5) * 30;

  // 3. Distance score
  const jobLat = job.location?.lat || 0;
  const jobLng = job.location?.lng || 0;
  const provLat = provider.location?.lat || 0;
  const provLng = provider.location?.lng || 0;
  const distance = calcDistance(jobLat, jobLng, provLat, provLng);
  const distanceScore = distance <= 50 ? Math.max(0, (1 - distance / 50)) * 20 : 0;

  // 4. Price score (lower hourly rate = higher score, relative to budget)
  const budget = job.budget || 100;
  const rate = provider.hourlyRate || budget;
  const priceScore = rate <= budget ? Math.max(0, (1 - rate / (budget * 2))) * 10 : 0;

  const total = skillScore + ratingScore + distanceScore + priceScore;
  return { score: total, distance: Math.round(distance) };
};

/**
 * Find top N providers for a given job.
 * @param {Object} job - Populated job document
 * @param {number} topN - How many providers to return (default 3)
 * @returns {Array} Sorted array of { provider, score, distance }
 */
const matchProviders = async (job, topN = 3) => {
  // Find all available verified providers only
  const providers = await User.find({ role: 'provider', availability: true, verificationStatus: 'verified' });

  const scored = providers
    .map(provider => ({
      provider,
      ...scoreProvider(provider, job)
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
};

module.exports = { matchProviders, scoreProvider, calcDistance };
