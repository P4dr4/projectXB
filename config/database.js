const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    if (!uri) {
      throw new Error('MongoDB URI is not defined');
    }
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;