const mongoose = require('mongoose');

let isConnectedToMongo = false;

// In-Memory Fallback Storage if MongoDB is unreachable
const memoryDb = {
  users: [],
  images: []
};

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-image-toolkit';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to fallback cleanly if MongoDB is not running
    });
    isConnectedToMongo = true;
    console.log('MongoDB Connected Successfully to:', mongoURI);
  } catch (err) {
    isConnectedToMongo = false;
    console.warn('MongoDB connection failed/unavailable:', err.message);
    console.warn('Using High-Performance In-Memory Data Engine fallback.');
  }
};

const getDbState = () => ({
  isConnectedToMongo,
  memoryDb
});

module.exports = { connectDB, getDbState, memoryDb };
