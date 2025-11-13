// server/routes/jobRoutes.js
import express from "express";
import rateLimit from "express-rate-limit";
import validateObjectId from "../middleware/validateObjectId.js";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  setJobStatus,
  deleteJob,
} from "../controllers/jobController.js";

// (optional) async wrapper – remove if you already try/catch in controllers
const asyncHandler =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const router = express.Router();

/* ------------------- Optional limits ------------------- */
// Gentle guard for admin writes; tune as needed
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 write ops / minute / IP
});

/* ------------------- Routes ------------------- */

/**
 * Public-facing route: only "Open" jobs.
 * Useful for Careers page: call GET /api/jobs/public
 * instead of filtering in the frontend.
 */
router.get(
  "/public",
  asyncHandler((req, res, next) => {
    // force status=Open, but allow other query params (type, department, q, etc.)
    req.query = {
      ...req.query,
      status: "Open",
    };
    return getJobs(req, res, next);
  })
);

// List & Create (admin / HR dashboard)
router.get("/", asyncHandler(getJobs));
router.post("/", writeLimiter, asyncHandler(createJob));

// Status toggle BEFORE generic :id routes
router.patch(
  "/:id/status",
  validateObjectId(),
  writeLimiter,
  asyncHandler(setJobStatus)
);

// Read / Update / Delete
router.get("/:id", validateObjectId(), asyncHandler(getJobById));
router.put(
  "/:id",
  validateObjectId(),
  writeLimiter,
  asyncHandler(updateJob)
);
router.patch(
  "/:id",
  validateObjectId(),
  writeLimiter,
  asyncHandler(updateJob)
);
router.delete(
  "/:id",
  validateObjectId(),
  writeLimiter,
  asyncHandler(deleteJob)
);

export default router;
