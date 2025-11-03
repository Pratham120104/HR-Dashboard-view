import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Job from "../models/Job.js";

// Load env
dotenv.config();

const DEFAULT_COMPANY = "GyanNidhi Innovations Pvt. Ltd.";

const backfill = async () => {
  try {
    await connectDB();

    // Update jobs missing companyName
    const res1 = await Job.updateMany(
      { $or: [{ companyName: { $exists: false } }, { companyName: "" }, { companyName: null }] },
      { $set: { companyName: DEFAULT_COMPANY } }
    );

    // Ensure applicationLink field exists (set to empty string if missing)
    const res2 = await Job.updateMany(
      { $or: [{ applicationLink: { $exists: false } }, { applicationLink: null }] },
      { $set: { applicationLink: "" } }
    );

    console.log(`Backfill complete. companyName matched: ${res1.matchedCount}, modified: ${res1.modifiedCount}`);
    console.log(`applicationLink matched: ${res2.matchedCount}, modified: ${res2.modifiedCount}`);
  } catch (err) {
    console.error("Backfill error:", err);
  } finally {
    mongoose.connection.close();
  }
};

backfill();
