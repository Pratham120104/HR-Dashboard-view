import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

// 🟢 Routes
router.post("/", createJob);         // Create a new job
router.get("/", getJobs);            // Get all jobs
router.get("/:id", getJobById);      // Get job by ID
router.delete("/:id", deleteJob);    // Delete job by ID

export default router;