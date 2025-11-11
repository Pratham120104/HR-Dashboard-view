import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,      // 👈 add
  setJobStatus,   // 👈 add
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);

// Update job (you can expose either or both)
router.put("/:id", updateJob);
router.patch("/:id", updateJob);

// Toggle Open/Closed
router.patch("/:id/status", setJobStatus);

router.delete("/:id", deleteJob);

export default router;
