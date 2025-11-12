// server/server.js
import dotenv from "dotenv";              // 1) Load .env FIRST
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import jobRoutes from "./routes/jobRoutes.js";
import applyRoutes from "./routes/applyRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";
// Optional: preflight SMTP check (uncomment if wanted)
// import transporter from "./config/nodemailer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

const app = express();

/* ------------------ CORS ------------------ */
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((s) => s.trim())
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: false, // set true if you use cookies/sessions
  })
);

/* ------------------ Parsers ------------------ */
// NOTE: multer handles multipart/form-data; these are fine for JSON/routes.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ------------------ Static (uploads) ------------------ */
// Align this with your applyRoutes upload dir.
// Option A: ensure UPLOAD_DIR points under this folder.
// Option B: change applyRoutes to use __dirname (recommended).
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "30d",
    index: false,
  })
);

/* ------------------ Routes ------------------ */
app.use("/api/jobs", jobRoutes);
app.use("/api/apply", applyRoutes);

/* ------------------ Health ------------------ */
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "GyanNidhi HR API running ✅",
    routes: ["/api/jobs", "/api/apply"],
  });
});

/* ------------------ Error Handling ------------------ */
app.use(notFound);
app.use(errorHandler);

/* ------------------ Start Server ------------------ */
const startServer = async () => {
  try {
    await connectDB();

    // Optional: verify SMTP once at boot for clear logs
    // transporter.verify()
    //   .then(() => console.log("✅ SMTP ready"))
    //   .catch((e) => console.error("❌ SMTP error:", e.message));

    app.listen(PORT, () =>
      console.log(`✅ MongoDB Connected & 🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
