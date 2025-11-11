// controllers/jobController.js
import Job from "../models/Job.js";

/* ------------------------ Helpers ------------------------ */
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();

const toArray = (v) => {
  if (Array.isArray(v)) return v.map(strip).filter(Boolean);
  if (typeof v === "string")
    return v
      .split("\n")
      .map(strip)
      .filter(Boolean);
  return [];
};

// Merge tags + requiredSkills; de-dup and strip
const mergeTagCloud = (tags, requiredSkills) => {
  const set = new Set([
    ...(toArray(tags) || []),
    ...(toArray(requiredSkills) || []),
  ]);
  return Array.from(set);
};

// Build payload from body for create
const buildCreatePayload = (b = {}) => {
  const requiredSkills = toArray(b.requiredSkills);
  const mergedTags = mergeTagCloud(b.tags, requiredSkills);

  return {
    // Core
    title: strip(b.title),
    department: strip(b.department),
    type: strip(b.type), // "Full-time" | "Part-time" | "Internship"
    location: strip(b.location),

    // Status (optional; default 'Open' in schema)
    status: b.status ? strip(b.status) : undefined,

    // Level (Entry/Mid/High for Full-time) -> stored as duration
    duration: strip(b.duration),

    // Company/pay
    companyName: strip(b.companyName) || "GyanNidhi Innovations Pvt. Ltd.",
    salaryRange: strip(b.salaryRange),
    trainingPeriod: strip(b.trainingPeriod),

    // Content
    overview: strip(b.overview),
    description: strip(b.description), // from fullDescription on FE
    jobRole: strip(b.jobRole),

    // Bullets
    requiredSkills,
    benefits: toArray(b.benefits),

    // Apply & tags
    howToApply: strip(b.howToApply),
    tags: mergedTags,
    // Back-compat mirror
    skills: mergedTags,

    // Optional
    experience: strip(b.experience),

    // Optional analytics counter (if client sends; else schema default)
    applications: typeof b.applications === "number" ? b.applications : undefined,
  };
};

// Build partial $set for update (does not blank fields unless explicitly sent)
const buildUpdateSet = (b = {}) => {
  const $set = {};
  const assign = (key, val) => {
    if (val !== undefined) $set[key] = val;
  };

  // Arrays first (so we can merge tags+requiredSkills)
  const requiredSkills = b.requiredSkills !== undefined ? toArray(b.requiredSkills) : undefined;
  const benefits = b.benefits !== undefined ? toArray(b.benefits) : undefined;

  // If either tags or requiredSkills present, recompute merged tag cloud
  let tags;
  if (b.tags !== undefined || requiredSkills !== undefined) {
    const currentTags = b.tags !== undefined ? toArray(b.tags) : [];
    const rs = requiredSkills !== undefined ? requiredSkills : [];
    tags = mergeTagCloud(currentTags, rs);
  }

  // Core text-ish fields
  assign("title", b.title !== undefined ? strip(b.title) : undefined);
  assign("department", b.department !== undefined ? strip(b.department) : undefined);
  assign("type", b.type !== undefined ? strip(b.type) : undefined);
  assign("location", b.location !== undefined ? strip(b.location) : undefined);

  // Status
  assign("status", b.status !== undefined ? strip(b.status) : undefined);

  // Duration (level)
  assign("duration", b.duration !== undefined ? strip(b.duration) : undefined);

  // Company & pay
  assign("companyName", b.companyName !== undefined ? strip(b.companyName) : undefined);
  assign("salaryRange", b.salaryRange !== undefined ? strip(b.salaryRange) : undefined);
  assign("trainingPeriod", b.trainingPeriod !== undefined ? strip(b.trainingPeriod) : undefined);

  // Content
  assign("overview", b.overview !== undefined ? strip(b.overview) : undefined);
  assign("description", b.description !== undefined ? strip(b.description) : undefined);
  assign("jobRole", b.jobRole !== undefined ? strip(b.jobRole) : undefined);

  // Bullets
  if (requiredSkills !== undefined) assign("requiredSkills", requiredSkills);
  if (benefits !== undefined) assign("benefits", benefits);

  // Apply & tags
  assign("howToApply", b.howToApply !== undefined ? strip(b.howToApply) : undefined);
  if (tags !== undefined) {
    assign("tags", tags);
    assign("skills", tags); // mirror
  }

  // Optional
  assign("experience", b.experience !== undefined ? strip(b.experience) : undefined);

  // Analytics
  if (typeof b.applications === "number") assign("applications", b.applications);

  return $set;
};

/* ------------------------ Controllers ------------------------ */

// 🟢 Create a new job
export const createJob = async (req, res) => {
  try {
    const payload = buildCreatePayload(req.body);
    const job = await Job.create(payload);
    return res.status(201).json(job);
  } catch (error) {
    console.error("❌ Error creating job:", error);

    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation Error", errors: details });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Get all jobs (with light filters)
export const getJobs = async (req, res) => {
  try {
    const { status, type, department, q } = req.query || {};
    const query = {};

    if (status) query.status = strip(status);
    if (type) query.type = strip(type);
    if (department) query.department = strip(department);

    // Simple "q" text search — uses text index if present, else OR fallback
    let jobs;
    if (q && String(q).trim()) {
      const term = strip(q);
      // Prefer text index if defined in schema
      jobs = await Job.find(
        { $text: { $search: term }, ...(Object.keys(query).length ? query : {}) },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .exec();
    } else {
      jobs = await Job.find(query).sort({ createdAt: -1 }).exec();
    }

    return res.status(200).json(jobs);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Get a single job by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(job);
  } catch (error) {
    console.error("❌ Error fetching job by ID:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Update a job (partial update; accepts either PUT or PATCH)
export const updateJob = async (req, res) => {
  try {
    const $set = buildUpdateSet(req.body);
    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating job:", error);

    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation Error", errors: details });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Set job status (Open/Closed) — PATCH /:id/status
export const setJobStatus = async (req, res) => {
  try {
    const nextStatus = strip(req.body?.status);
    if (!nextStatus) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating job status:", error);

    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation Error", errors: details });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Delete a job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting job:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
