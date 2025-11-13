// server/models/Application.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      index: true,
      required: false,
    },
    jobTitle: {
      type: String,
      required: false,       // controller already enforces fallback
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    comments: {
      type: String,
      trim: true,
    },
    resumePath: {
      type: String,
      default: null,          // prevents undefined
    },
  },
  { timestamps: true }
);

// Optional: improve search performance later
// applicationSchema.index({ fullName: "text", email: "text", jobTitle: "text", comments: "text" });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
