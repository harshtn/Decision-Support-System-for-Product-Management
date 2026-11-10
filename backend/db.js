const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartphone-analyzer');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed: ${error.message}`);
    try {
      const mem = await MongoMemoryServer.create();
      const uri = mem.getUri('smartphone-analyzer');
      const memConn = await mongoose.connect(uri);
      console.log(`MongoDB Memory Server Connected: ${memConn.connection.host}`);
    } catch (memError) {
      console.error(`Fallback MongoDB memory server failed: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
