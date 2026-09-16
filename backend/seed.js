require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Bid = require('./models/Bid');
const Review = require('./models/Review');
const Transaction = require('./models/Transaction');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Bid.deleteMany({}),
    Review.deleteMany({}),
    Transaction.deleteMany({})
  ]);
  console.log('Cleared existing data...');

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@workbridge.com',
    password: 'admin123',
    role: 'admin'
  });

  // Create Customers
  const customers = await User.insertMany([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      role: 'customer',
      location: { city: 'New York', lat: 40.7128, lng: -74.006 },
      averageRating: 4.5
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      role: 'customer',
      location: { city: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
      averageRating: 4.2
    },
    {
      name: 'Carol White',
      email: 'carol@example.com',
      password: 'password123',
      role: 'customer',
      location: { city: 'Chicago', lat: 41.8781, lng: -87.6298 },
      averageRating: 4.8
    }
  ]);

  // Need to hash passwords for insertMany — use create instead
  // Re-create customers with hashed passwords
  await User.deleteMany({ role: 'customer' });
  const c1 = await User.create({ name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', role: 'customer', location: { city: 'New York', lat: 40.7128, lng: -74.006 }, averageRating: 4.5 });
  const c2 = await User.create({ name: 'Bob Smith', email: 'bob@example.com', password: 'password123', role: 'customer', location: { city: 'Los Angeles', lat: 34.0522, lng: -118.2437 }, averageRating: 4.2 });
  const c3 = await User.create({ name: 'Carol White', email: 'carol@example.com', password: 'password123', role: 'customer', location: { city: 'Chicago', lat: 41.8781, lng: -87.6298 }, averageRating: 4.8 });

  // Create Providers
  const p1 = await User.create({
    name: 'David Lee', email: 'david@example.com', password: 'password123', role: 'provider',
    skills: ['Plumbing', 'Pipe Fitting'], hourlyRate: 60,
    location: { city: 'New York', lat: 40.73, lng: -73.99 },
    averageRating: 4.8, totalReviews: 24, trustScore: 88, jobsCompleted: 24,
    totalEarnings: 3200, bio: 'Licensed plumber with 8 years of experience.', isTopRated: true
  });
  const p2 = await User.create({
    name: 'Emma Davis', email: 'emma@example.com', password: 'password123', role: 'provider',
    skills: ['Tutoring', 'Math', 'Science'], hourlyRate: 35,
    location: { city: 'New York', lat: 40.70, lng: -74.01 },
    averageRating: 4.9, totalReviews: 45, trustScore: 95, jobsCompleted: 45,
    totalEarnings: 4500, bio: 'PhD student offering maths and science tutoring.', isTopRated: true
  });
  const p3 = await User.create({
    name: 'Frank Brown', email: 'frank@example.com', password: 'password123', role: 'provider',
    skills: ['Electrical', 'Wiring', 'Electrician'], hourlyRate: 75,
    location: { city: 'Chicago', lat: 41.88, lng: -87.63 },
    averageRating: 4.6, totalReviews: 18, trustScore: 82, jobsCompleted: 18,
    totalEarnings: 5400, bio: 'Certified electrician — residential and commercial.', isTopRated: true
  });
  const p4 = await User.create({
    name: 'Grace Kim', email: 'grace@example.com', password: 'password123', role: 'provider',
    skills: ['Cleaning', 'Housekeeping'], hourlyRate: 25,
    location: { city: 'Los Angeles', lat: 34.06, lng: -118.25 },
    averageRating: 4.7, totalReviews: 60, trustScore: 90, jobsCompleted: 60,
    totalEarnings: 2800, bio: 'Professional home cleaner. Eco-friendly products used.', isTopRated: true
  });
  const p5 = await User.create({
    name: 'Henry Park', email: 'henry@example.com', password: 'password123', role: 'provider',
    skills: ['IT Support', 'Coding', 'Networking'], hourlyRate: 50,
    location: { city: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    averageRating: 4.5, totalReviews: 30, trustScore: 85, jobsCompleted: 30,
    totalEarnings: 6000, bio: 'Full-stack developer & IT support specialist.', isTopRated: true
  });
  const p6 = await User.create({
    name: 'Iris Chen', email: 'iris@example.com', password: 'password123', role: 'provider',
    skills: ['Carpentry', 'Woodwork', 'Furniture'], hourlyRate: 55,
    location: { city: 'New York', lat: 40.75, lng: -73.98 },
    averageRating: 4.3, totalReviews: 12, trustScore: 76, jobsCompleted: 12,
    totalEarnings: 3300, bio: 'Custom furniture maker and carpenter.', isTopRated: false
  });

  // Create Jobs
  const j1 = await Job.create({
    title: 'Fix leaking kitchen pipe', description: 'Kitchen pipe under sink leaking badly, need urgent fix.',
    category: 'Plumbing', budget: 120, requiredSkills: ['Plumbing', 'Pipe Fitting'],
    location: { city: 'New York', lat: 40.71, lng: -74.0 },
    customer: c1._id, status: 'open', suggestedBudgetMin: 50, suggestedBudgetMax: 200,
    matchedProviders: [p1._id, p6._id]
  });
  const j2 = await Job.create({
    title: 'Math tutoring for grade 10', description: 'My daughter needs help with algebra and calculus for board exams.',
    category: 'Tutoring', budget: 50, requiredSkills: ['Tutoring', 'Math'],
    location: { city: 'New York', lat: 40.72, lng: -73.99 },
    customer: c1._id, status: 'open', suggestedBudgetMin: 20, suggestedBudgetMax: 80,
    matchedProviders: [p2._id]
  });
  const j3 = await Job.create({
    title: 'Fix faulty wiring in bedroom', description: 'Bedroom circuit breaker keeps tripping. Lights flicker.',
    category: 'Electrical', budget: 200, requiredSkills: ['Electrical', 'Wiring'],
    location: { city: 'Chicago', lat: 41.88, lng: -87.63 },
    customer: c3._id, status: 'in_progress', assignedProvider: p3._id,
    suggestedBudgetMin: 60, suggestedBudgetMax: 250, matchedProviders: [p3._id]
  });
  const j4 = await Job.create({
    title: 'Deep clean apartment before move-out', description: 'Need full apartment deep cleaning including kitchen, bathrooms, all rooms.',
    category: 'Cleaning', budget: 80, requiredSkills: ['Cleaning'],
    location: { city: 'Los Angeles', lat: 34.06, lng: -118.25 },
    customer: c2._id, status: 'completed', assignedProvider: p4._id,
    suggestedBudgetMin: 30, suggestedBudgetMax: 120, matchedProviders: [p4._id]
  });
  const j5 = await Job.create({
    title: 'Set up home WiFi network', description: 'Need to set up a mesh WiFi system across 3-floor house.',
    category: 'IT Support', budget: 150, requiredSkills: ['IT Support', 'Networking'],
    location: { city: 'New York', lat: 40.73, lng: -74.0 },
    customer: c1._id, status: 'open', suggestedBudgetMin: 40, suggestedBudgetMax: 200
  });

  // Create Bids
  await Bid.create({ job: j1._id, provider: p1._id, amount: 110, message: 'I can fix this today. 8 years experience.', estimatedDays: 1, status: 'pending' });
  await Bid.create({ job: j2._id, provider: p2._id, amount: 45, message: 'PhD in Mathematics. Can help your daughter excel!', estimatedDays: 7, status: 'pending' });
  await Bid.create({ job: j5._id, provider: p5._id, amount: 130, message: 'Networking expert. Can complete within a day.', estimatedDays: 1, status: 'pending' });

  // Create Reviews for completed job
  await Review.create({
    job: j4._id, reviewer: c2._id, reviewee: p4._id,
    rating: 5, comment: 'Excellent work! The apartment looks brand new. Highly recommend.'
  });

  // Update provider stats for completed job
  p4.averageRating = 4.7;
  p4.totalReviews = 61;
  p4.jobsCompleted = 61;
  p4.calculateTrustScore();
  await p4.save();

  // Create Transaction for completed job
  await Transaction.create({
    job: j4._id, customer: c2._id, provider: p4._id,
    amount: 80, status: 'completed'
  });

  console.log('✅ Seed data created successfully!');
  console.log('\n--- LOGIN CREDENTIALS ---');
  console.log('Admin:    admin@workbridge.com / admin123');
  console.log('Customer: alice@example.com / password123');
  console.log('Customer: bob@example.com / password123');
  console.log('Provider: david@example.com / password123  (Plumber)');
  console.log('Provider: emma@example.com / password123   (Tutor)');
  console.log('Provider: frank@example.com / password123  (Electrician)');
  console.log('Provider: grace@example.com / password123  (Cleaning)');
  console.log('Provider: henry@example.com / password123  (IT Support)');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
