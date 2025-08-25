import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../src/utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_CONNECTION;

// Connection configuration
const connectionOptions = {
  maxPoolSize: 10, // Maximum number of sockets in the connection pool
  socketTimeoutMS: 30000, // Close sockets after 30 seconds of inactivity
  connectTimeoutMS: 5000, // Give up initial connection after 5 seconds
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  retryWrites: true, // Retry write operations on transient errors
  retryReads: true, // Retry read operations on transient errors
  heartbeatFrequencyMS: 10000, // How often to check connection status
};

// Singleton pattern for connection
let cachedConnection = null;

async function connectMongo() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Enable debug mode in development
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }

    // Connection events
    mongoose.connection.on("connected", () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on("error", (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.info('MongoDB disconnected');
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    // Actual connection
    const connection = await mongoose.connect(MONGO_URI, connectionOptions);
    cachedConnection = connection;
    return connection;
  } catch (err) {
    logger.error('MongoDB connection failed:', err);
    throw err; 
  }
}

export default connectMongo;
