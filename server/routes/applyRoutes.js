// server/routes/applyRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* --------------------------- Config --------------------------- */

// ENV override possible: UPLOAD_DIR=/abs/path
const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "server", "uploads", "resumes");
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : DEFAULT_UPLOAD_DIR;

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed extensions & basic email/phone checks
const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);
const sanitize = (s) => String(s || "").trim();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone10 = (s) => /^[0-9]{10}$/.test(s);

/* ------------------------ Multer setup ------------------------ */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const base = path.basename(file.originalname).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${ts}_${base}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume"));
    }
    cb(null, true);
  },
});

/* -------------------------- Routes --------------------------- */

// POST /api/apply
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const body = req.body || {};
    const jobId = sanitize(body.jobId);
    const jobTitle = sanitize(body.jobTitle);
    const fullName = sanitize(body.fullName);
    const email = sanitize(body.email);
    const phone = sanitize(body.phone);
    const why = sanitize(body.why);

    // Validate fields (mirror frontend)
    const errors = {};
    if (!fullName) errors.fullName = "Full name is required";
    if (!email || !isEmail(email)) errors.email = "Valid email is required";
    if (!phone || !isPhone10(phone)) errors.phone = "Phone must be 10 digits";
    if (!why) errors.why = "Comments are required";
    if (!req.file) errors.resume = "Resume file is required";

    if (Object.keys(errors).length > 0) {
      // Clean up uploaded file if present but invalid form data
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
      }
      return res.status(400).json({ ok: false, message: "Validation Error", errors });
    }

    // Build absolute URL for convenience
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = `/uploads/resumes/${req.file.filename}`;
    const fileUrl = `${baseUrl}${relativePath}`;

    // TODO: Persist to DB / send email to HR if desired

    return res.json({
      ok: true,
      message: "Application received",
      jobId,
      jobTitle,
      fullName,
      email,
      phone,
      why,
      resume: {
        filename: req.file.originalname,
        storedAs: req.file.filename,
        size: req.file.size,
        url: fileUrl,         // absolute URL
        path: relativePath,   // relative path (served statically)
      },
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Apply error:", err);
    // If Multer threw a size/type error, return nicer messages
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ ok: false, message: "File too large. Max 5 MB." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ ok: false, message: "Only PDF, DOC, or DOCX files are allowed." });
      }
    }
    return res.status(500).json({ ok: false, message: "Failed to submit application" });
  }
});

/* ---------------------- Export the router --------------------- */
export default router;
