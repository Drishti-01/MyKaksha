// MongoDB connection configuration
// Uses Mongoose ODM to connect to MongoDB Atlas
// MONGODB_URI must be set in .env — never hardcode credentials

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "mykaksha";

let connectionPromise = null;

export async function ensureDatabaseConnection() {
  // Already connected — reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Set it in .env");
  }

  // Reuse in-flight connection promise to avoid duplicate connections
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB,
        serverSelectionTimeoutMS: 5000,
      })
      .then((conn) => {
        console.log("[MongoDB] Connected successfully to:", MONGODB_DB);
        return conn;
      })
      .catch((error) => {
        console.error("[MongoDB] Connection FAILED:", error.message);
        connectionPromise = null; // allow retry on next call
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
}
