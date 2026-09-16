/**
 * AI Helpers - Rule-based NLP logic for category detection and price suggestion.
 * In production, this could be replaced with an actual LLM call (e.g., Claude API).
 */

// Category keyword map
const CATEGORY_KEYWORDS = {
  'Plumbing':     ['pipe', 'leak', 'drain', 'faucet', 'toilet', 'plumb', 'water heater', 'tap'],
  'Electrical':   ['wiring', 'electric', 'socket', 'switch', 'fuse', 'circuit', 'power', 'light'],
  'Tutoring':     ['tutor', 'teach', 'lesson', 'math', 'science', 'english', 'homework', 'study', 'exam', 'coach'],
  'Cleaning':     ['clean', 'mop', 'sweep', 'vacuum', 'laundry', 'wash', 'tidy', 'sanitize', 'housekeeping'],
  'Carpentry':    ['wood', 'furniture', 'cabinet', 'shelf', 'carpenter', 'door', 'floor', 'install'],
  'Painting':     ['paint', 'wall', 'brush', 'color', 'coat', 'primer', 'stain', 'repaint'],
  'Moving':       ['move', 'shifting', 'relocate', 'pack', 'transport', 'carry', 'unpack', 'loading'],
  'Gardening':    ['garden', 'lawn', 'mow', 'plant', 'trim', 'tree', 'weed', 'flower', 'grass'],
  'IT Support':   ['computer', 'laptop', 'software', 'virus', 'wifi', 'network', 'printer', 'tech', 'coding', 'website'],
  'Photography':  ['photo', 'shoot', 'camera', 'portrait', 'wedding', 'event', 'picture', 'video'],
  'Cooking':      ['cook', 'meal', 'chef', 'food', 'catering', 'recipe', 'bake', 'kitchen'],
  'Delivery':     ['deliver', 'courier', 'pickup', 'drop', 'parcel', 'package', 'errand'],
};

// Suggested price ranges by category (min, max in USD)
const PRICE_RANGES = {
  'Plumbing':     { min: 50, max: 200 },
  'Electrical':   { min: 60, max: 250 },
  'Tutoring':     { min: 20, max: 80 },
  'Cleaning':     { min: 30, max: 120 },
  'Carpentry':    { min: 80, max: 300 },
  'Painting':     { min: 50, max: 200 },
  'Moving':       { min: 100, max: 500 },
  'Gardening':    { min: 30, max: 150 },
  'IT Support':   { min: 40, max: 200 },
  'Photography':  { min: 100, max: 600 },
  'Cooking':      { min: 50, max: 250 },
  'Delivery':     { min: 10, max: 60 },
  'Other':        { min: 20, max: 150 },
};

// Skills mapped to categories (for matching)
const CATEGORY_SKILLS = {
  'Plumbing':     ['Plumbing', 'Pipe Fitting'],
  'Electrical':   ['Electrical', 'Wiring', 'Electrician'],
  'Tutoring':     ['Tutoring', 'Teaching', 'Math', 'Science', 'English'],
  'Cleaning':     ['Cleaning', 'Housekeeping'],
  'Carpentry':    ['Carpentry', 'Woodwork', 'Furniture'],
  'Painting':     ['Painting', 'Interior Design'],
  'Moving':       ['Moving', 'Packing', 'Transport'],
  'Gardening':    ['Gardening', 'Landscaping'],
  'IT Support':   ['IT Support', 'Coding', 'Networking', 'Web Development'],
  'Photography':  ['Photography', 'Videography'],
  'Cooking':      ['Cooking', 'Catering', 'Baking'],
  'Delivery':     ['Delivery', 'Courier', 'Driving'],
};

/**
 * Detect job category from title + description using keyword matching.
 * Returns { category, requiredSkills }
 */
const detectCategory = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter(kw => text.includes(kw)).length;
  }

  const bestCategory = Object.entries(scores).reduce(
    (best, [cat, score]) => (score > best.score ? { cat, score } : best),
    { cat: 'Other', score: 0 }
  ).cat;

  return {
    category: bestCategory,
    requiredSkills: CATEGORY_SKILLS[bestCategory] || []
  };
};

/**
 * Suggest a price range for a given category.
 */
const suggestPriceRange = (category) => {
  return PRICE_RANGES[category] || PRICE_RANGES['Other'];
};

/**
 * Get all categories list for frontend dropdowns.
 */
const getAllCategories = () => Object.keys(CATEGORY_KEYWORDS).concat(['Other']);

module.exports = { detectCategory, suggestPriceRange, getAllCategories, CATEGORY_SKILLS };
