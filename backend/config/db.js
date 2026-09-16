const mongoose = require('mongoose');

const connectDB = async () => {
  const base = process.env.MONGO_URL || process.env.MONGO_URI;
  const uri = process.env.MONGO_URL
    ? `${process.env.MONGO_URL}/workbridge?authSource=admin`
    : process.env.MONGO_URI;
  console.log('Using host:', uri.split('@')[1]?.split('/')[0] || 'unknown');
  console.log('Connecting to MongoDB...');
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      retries--;
      console.error(`MongoDB Connection Error (${retries} retries left): ${error.message}`);
      if (retries === 0) { console.error('All retries exhausted. Running without DB.'); return; }
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};

module.exports = connectDB;
