import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

// Create a new job
router.post("/", createJob);

// Get all jobs
router.get("/", getJobs);

// ✅ Get a single job by ID (for JobDetail.jsx)
router.get("/:id", getJobById);

// Delete a job
router.delete("/:id", deleteJob);

export default router;