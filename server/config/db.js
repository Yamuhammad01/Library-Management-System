const mongoose = require("mongoose");

// Cache the connection promise so it is reused across requests and warm invocations
// (important on serverless platforms such as Vercel).
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        // Reset the cache so a later request can retry instead of crashing the process.
        connectionPromise = null;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;