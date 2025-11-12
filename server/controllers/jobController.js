// controllers/jobController.js
import mongoose from "mongoose";
import Job from "../models/Job.js";

/* ------------------------ Helpers ------------------------ */

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();

const toArray = (v) => {
  if (Array.isArray(v)) return v.map(strip).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/\r?\n/) // CRLF-safe
      .map(strip)
      .filter(Boolean);
  }
  return [];
};

const TYPES = new Set(["Full-time", "Part-time", "Internship"]);
const STATUSES = new Set(["Open", "Closed"]);

const validStatus = (s) => (STATUSES.has(s) ? s : undefined);
const validType = (s) => (TYPES.has(s) ? s : undefined);

const boolOrUndef = (v) =>
  typeof v === "boolean" ? v : (v === "true" ? true : v === "false" ? false : undefined);

const isValidId = (id) => mongoose.isValidObjectId(id);

// Merge tags + requiredSkills; de-dup and strip
const mergeTagCloud = (tags, requiredSkills) => {
  const set = new Set([...(toArray(tags) || []), ...(toArray(requiredSkills) || [])]);
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
    type: validType(strip(b.type)), // "Full-time" | "Part-time" | "Internship"
    location: strip(b.location),

    // Admin
    status: validStatus(strip(b.status)) || undefined, // schema default "Open" if undefined
    published: boolOrUndef(b.published), // leave undefined -> schema default

    // Level (Entry/Mid/High for Full-time) or duration for internships
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
  const requiredSkills =
    b.requiredSkills !== undefined ? toArray(b.requiredSkills) : undefined;
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
  assign("type", b.type !== undefined ? validType(strip(b.type)) : undefined);
  assign("location", b.location !== undefined ? strip(b.location) : undefined);

  // Admin
  assign("status", b.status !== undefined ? validStatus(strip(b.status)) : undefined);
  assign("published", boolOrUndef(b.published));

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

    // If a non-empty invalid type/status was provided, fail fast
    if (req.body?.type && payload.type === undefined) {
      return res.status(400).json({ message: "Invalid job type. Use Full-time, Part-time, or Internship." });
    }
    if (req.body?.status && payload.status === undefined) {
      return res.status(400).json({ message: "Invalid status. Use Open or Closed." });
    }

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

// 🟢 Get all jobs (filters, search, pagination)
export const getJobs = async (req, res) => {
  try {
    const { status, type, department, q, published, page = 1, limit = 20 } = req.query || {};
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = {};

    if (status && STATUSES.has(strip(status))) query.status = strip(status);
    if (type && validType(strip(type))) query.type = strip(type);
    if (department) query.department = strip(department);

    // support ?published=true|false
    if (typeof published !== "undefined") {
      const pv = String(published).toLowerCase();
      if (pv === "true") query.published = true;
      else if (pv === "false") query.published = false;
    }

    // Fields needed by card/list views
    const projection =
      "title department type location status published salaryRange duration overview createdAt";

    let baseQuery;
    let sortSpec;
    let total;

    if (q && String(q).trim()) {
      const term = strip(q);
      const useText = term.length >= 3;

      if (useText) {
        // Requires a text index on title/overview/description/tags
        baseQuery = { ...query, $text: { $search: term } };
        sortSpec = { score: { $meta: "textScore" }, createdAt: -1 };
      } else {
        // Fallback regex search for short/partial terms
        baseQuery = {
          ...query,
          $or: [
            { title: { $regex: term, $options: "i" } },
            { overview: { $regex: term, $options: "i" } },
            { description: { $regex: term, $options: "i" } },
            { tags: { $regex: term, $options: "i" } },
            { location: { $regex: term, $options: "i" } },
            { department: { $regex: term, $options: "i" } },
          ],
        };
        sortSpec = { createdAt: -1 };
      }

      const cursor = Job.find(
        baseQuery,
        useText ? { score: { $meta: "textScore" }, ...projToObj(projection) } : projection
      )
        .sort(sortSpec)
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean();

      total = await Job.countDocuments(baseQuery);
      const jobs = await cursor;

      const hasMore = pg * lim < total;
      return res.status(200).json({ data: jobs, page: pg, limit: lim, total, hasMore });
    } else {
      baseQuery = query;
      sortSpec = { createdAt: -1 };

      const [jobs, count] = await Promise.all([
        Job.find(baseQuery, projection)
          .sort(sortSpec)
          .skip((pg - 1) * lim)
          .limit(lim)
          .lean(),
        Job.countDocuments(baseQuery),
      ]);

      const hasMore = pg * lim < count;
      return res.status(200).json({ data: jobs, page: pg, limit: lim, total: count, hasMore });
    }
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// helper: convert space-delimited projection to object (for meta score mix)
function projToObj(projStr) {
  return projStr.split(/\s+/).reduce((acc, key) => {
    if (key) acc[key] = 1;
    return acc;
  }, {});
}

// 🟢 Get a single job by ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await Job.findById(id).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(job);
  } catch (error) {
    console.error("❌ Error fetching job by ID:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Update a job (partial update; accepts PUT/PATCH)
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid job id" });

    const $set = buildUpdateSet(req.body);
    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    // If client explicitly sent invalid enums, fail fast
    if ("type" in $set && $set.type === undefined && req.body?.type?.trim()) {
      return res.status(400).json({ message: "Invalid job type. Use Full-time, Part-time, or Internship." });
    }
    if ("status" in $set && $set.status === undefined && req.body?.status?.trim()) {
      return res.status(400).json({ message: "Invalid status. Use Open or Closed." });
    }

    const updated = await Job.findByIdAndUpdate(
      id,
      { $set },
      { new: true, runValidators: true }
    ).lean();

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
    const { id } = req.params || {};
    const nextStatus = strip(req.body?.status);

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    if (!STATUSES.has(nextStatus)) {
      return res.status(400).json({ message: "Status must be 'Open' or 'Closed'" });
    }

    // Optional: auto-unpublish when closing
    const patch = { status: nextStatus };
    if (nextStatus === "Closed") patch.published = false;

    const updated = await Job.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating job status:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Keep a friendly alias for services/routes that expect this name
export const updateJobStatus = setJobStatus;

// 🟢 Delete a job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    const job = await Job.findByIdAndDelete(id).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting job:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
