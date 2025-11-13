// server/routes/applyRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Job from "../models/Job.js"; // used to increment applications
import {
  submitJobApplication,
  getApplications,
} from "../controllers/applicationController.js";

const router = express.Router();

/* --------------------------- Config --------------------------- */

// You can override with env: UPLOAD_DIR=/abs/path
const DEFAULT_UPLOAD_DIR = path.join(
  process.cwd(),
  "server",
  "uploads",
  "resumes"
);
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : DEFAULT_UPLOAD_DIR;

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed extensions and MIME types
const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Basic validators
const sanitize = (s) => String(s || "").trim();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
// Keep this aligned with your UI rule. If you accept +91… or spaces, relax this.
const isPhone10 = (s) => /^[0-9]{10}$/.test(String(s || ""));
const isObjectId = (s) => /^[a-f0-9]{24}$/i.test(String(s || ""));

// Simple length caps (avoid oversized payloads)
const MAX_LEN = {
  fullName: 120,
  email: 160,
  phone: 20,
  why: 2000,
  jobTitle: 180,
};

// Optional: CSV application audit log
const CSV_LOG_DIR = path.join(process.cwd(), "server", "uploads");
const CSV_LOG_FILE = path.join(CSV_LOG_DIR, "applications.csv");
try {
  fs.mkdirSync(CSV_LOG_DIR, { recursive: true });
} catch {}

/* ------------------------ Multer setup ------------------------ */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || "").toLowerCase();
    const baseNoExt =
      (path
        .basename(file.originalname || "resume", ext)
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, 80)) || "resume";
    cb(null, `${ts}_${baseNoExt}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const okExt = ALLOWED_EXT.has(ext);
    const okMime = ALLOWED_MIME.has(file.mimetype);
    if (!okExt || !okMime) {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume");
      err.message = "Only PDF, DOC, or DOCX files are allowed.";
      return cb(err);
    }
    cb(null, true);
  },
});

/* -------------------------- Routes --------------------------- */

/**
 * Lightweight endpoint that stores the file, does basic validation,
 * increments the job's application counter, and returns JSON.
 *
 * If this router is mounted at /api/apply:
 *   POST /api/apply
 *
 * FormData fields:
 *  - fullName, email, phone, why, jobId, jobTitle, resume (file)
 */
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const body = req.body || {};
    const jobId = sanitize(body.jobId);
    const jobTitle = sanitize(body.jobTitle).slice(0, MAX_LEN.jobTitle);
    const fullName = sanitize(body.fullName).slice(0, MAX_LEN.fullName);
    const email = sanitize(body.email).toLowerCase().slice(0, MAX_LEN.email);
    const phone = sanitize(body.phone).slice(0, MAX_LEN.phone);
    const why = sanitize(body.why).slice(0, MAX_LEN.why);

    // Validate fields (mirror frontend + harden)
    const errors = {};
    if (!fullName) errors.fullName = "Full name is required";
    if (!email || !isEmail(email)) errors.email = "Valid email is required";
    if (!phone || !isPhone10(phone)) errors.phone = "Phone must be 10 digits";
    if (!why) errors.why = "Comments are required";
    if (!req.file) errors.resume = "Resume file is required";

    if (Object.keys(errors).length > 0) {
      // Clean up uploaded file if present but invalid form data
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
      }
      return res
        .status(400)
        .json({ ok: false, message: "Validation Error", errors });
    }

    // Optionally increment application counter if jobId looks valid
    let applicationCountAfter = null;
    let jobFound = false;
    if (isObjectId(jobId)) {
      const updated = await Job.findByIdAndUpdate(
        jobId,
        { $inc: { applications: 1 } },
        { new: true }
      ).lean();
      if (updated) {
        jobFound = true;
        applicationCountAfter = updated.applications;
      }
    }

    // Build absolute URL for convenience (if you serve uploads statically)
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = `/uploads/resumes/${req.file.filename}`;
    const fileUrl = `${baseUrl}${relativePath}`;

    // Optional CSV audit log (append non-fatal)
    try {
      const header =
        "receivedAt,jobId,jobTitle,fullName,email,phone,why,resumeStoredAs,resumeSize\n";
      if (!fs.existsSync(CSV_LOG_FILE))
        fs.writeFileSync(CSV_LOG_FILE, header, "utf8");
      const line =
        [
          new Date().toISOString(),
          JSON.stringify(jobId || ""),
          JSON.stringify(jobTitle || ""),
          JSON.stringify(fullName || ""),
          JSON.stringify(email || ""),
          JSON.stringify(phone || ""),
          JSON.stringify(why || "").replace(/\n/g, " "),
          JSON.stringify(req.file.filename),
          req.file.size,
        ].join(",") + "\n";
      fs.appendFileSync(CSV_LOG_FILE, line, "utf8");
    } catch {
      /* ignore */
    }

    return res.status(201).json({
      ok: true,
      message: "Application received",
      job: {
        id: jobId || null,
        title: jobTitle || null,
        found: jobFound,
        applications: applicationCountAfter,
      },
      applicant: { fullName, email, phone, why },
      resume: {
        filename: req.file.originalname,
        storedAs: req.file.filename,
        size: req.file.size,
        url: fileUrl, // absolute URL (if served)
        path: relativePath, // relative path (served statically)
        mimetype: req.file.mimetype,
      },
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Apply error:", err);

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ ok: false, message: "File too large. Max 5 MB." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          ok: false,
          message: "Only PDF, DOC, or DOCX files are allowed.",
        });
      }
    }

    return res
      .status(500)
      .json({ ok: false, message: "Failed to submit application" });
  }
});

/**
 * Full submit with email to HR + confirmation to applicant.
 * Important: Map FE's `why` to controller's expected `comments`.
 *
 * If this router is mounted at /api/apply:
 *   POST /api/apply/submit
 *
 * FormData fields:
 *  - fullName, email, phone, why, jobId, jobTitle, resume (file)
 */
router.post(
  "/submit",
  upload.single("resume"),
  (req, _res, next) => {
    // 🔁 Map field names so controller validation passes
    if (req.body && req.body.why && !req.body.comments) {
      req.body.comments = req.body.why;
    }
    // (Optional) normalize jobTitle capitalization/length here if needed
    next();
  },
  submitJobApplication
);

/**
 * HR dashboard – list applications
 *
 * If this router is mounted at /api:
 *   GET /api/applications
 * If mounted at /api/apply:
 *   GET /api/apply/applications
 */
router.get("/applications", getApplications);

export default router;
