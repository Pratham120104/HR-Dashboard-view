// db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set in environment variables.");

    // Optional: recommended options for modern drivers
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // fails fast if cluster unreachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }

  // Optional safety hook: close connection gracefully on SIGINT
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("🧹 MongoDB connection closed due to app termination");
    process.exit(0);
  });
};

export default connectDB;
