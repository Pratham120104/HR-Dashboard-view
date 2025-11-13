// server/models/Job.js
import mongoose from "mongoose";

/** -----------------------------
 *  Enumerations (keep in sync with FE)
 *  ----------------------------- */
export const DEPARTMENTS = Object.freeze([
  "Engineering",
  "Product",
  "Research",
  "Training",
  "Marketing",
  "Quality Assurance",
  "Machine Learning",
  "Artificial Intelligence",
  "Education",
]);

export const JOB_TYPES = Object.freeze(["Full-time", "Part-time", "Internship"]);
export const JOB_STATUS = Object.freeze(["Open", "Closed"]);

/** -----------------------------
 *  Helpers
 *  ----------------------------- */
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();
const uniqArr = (arr) =>
  Array.from(new Set((arr || []).map((v) => strip(v)).filter(Boolean)));

const slugify = (s) =>
  strip(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);

/** -----------------------------
 *  Schema
 *  ----------------------------- */
const JobSchema = new mongoose.Schema(
  {
    // Core
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      maxlength: 180,
      unique: true,
      sparse: true, // optional; auto from title
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: JOB_TYPES,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },

    // Admin lifecycle (no publish flag; only Open/Closed)
    status: {
      type: String,
      enum: JOB_STATUS,
      default: "Open",
      index: true,
    },

    // Level / duration (Entry/Mid/High etc. for jobs)
    duration: { type: String, trim: true, maxlength: 40 },

    // Company & pay
    companyName: {
      type: String,
      default: "GyanNidhi Innovations Pvt. Ltd.",
      trim: true,
      maxlength: 160,
    },
    salaryRange: { type: String, trim: true, maxlength: 120 },
    trainingPeriod: { type: String, trim: true, maxlength: 120 },

    // Content
    overview: { type: String, trim: true, maxlength: 400 },
    description: { type: String, trim: true, maxlength: 5000 }, // from fullDescription
    jobRole: { type: String, trim: true, maxlength: 1500 },

    // Bullets
    requiredSkills: { type: [String], default: [], set: uniqArr },
    benefits: { type: [String], default: [], set: uniqArr },

    // Application & tags
    howToApply: { type: String, trim: true, maxlength: 1500 },

    // Authoritative tag cloud; mirror to `skills` for back-compat
    tags: { type: [String], default: [], set: uniqArr },
    skills: { type: [String], default: [] }, // mirrored from tags ∪ requiredSkills

    // Optional
    experience: { type: String, trim: true, maxlength: 80 },

    // Simple analytics counter
    applications: { type: Number, default: 0 },

    // Optional soft-delete
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collation: { locale: "en", strength: 2 }, // case-insensitive sorts where applicable
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true, versionKey: false },
  }
);

/** -----------------------------
 *  Tag/Skill mirroring & slug
 *  ----------------------------- */
function mirrorTagsAndSkills(doc) {
  const tagSet = new Set([...(doc.tags || []), ...(doc.requiredSkills || [])]);
  const merged = Array.from(tagSet);
  doc.tags = merged;
  doc.skills = merged;
}

JobSchema.pre("save", function (next) {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  mirrorTagsAndSkills(this);
  next();
});

// Ensure mirroring on update paths too (preserves other operators)
JobSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate() || {};
  const $set = update.$set || {};
  const hasTags = $set.tags !== undefined;
  const hasReq = $set.requiredSkills !== undefined;

  if (hasTags || hasReq) {
    const mergedTags = uniqArr([
      ...($set.tags || []),
      ...($set.requiredSkills || []),
    ]);
    $set.tags = mergedTags;
    $set.skills = mergedTags;
  }

  // Auto-slug on title change if not explicitly set
  if ($set.title && !$set.slug) {
    $set.slug = slugify($set.title);
  }

  this.setUpdate({ ...update, $set });
  next();
});

/** -----------------------------
 *  Indexes
 *  ----------------------------- */
JobSchema.index({ createdAt: -1 });
JobSchema.index({ type: 1, department: 1, status: 1 });
JobSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Weighted text index for better relevance
JobSchema.index(
  {
    title: "text",
    overview: "text",
    description: "text",
    tags: "text",
    location: "text",
    department: "text",
  },
  {
    weights: {
      title: 8,
      overview: 4,
      description: 2,
      tags: 2,
      location: 1,
      department: 1,
    },
    name: "job_text_index",
    default_language: "english",
  }
);

/** -----------------------------
 *  Statics / helpers
 *  ----------------------------- */
// Increment applications counter atomically
JobSchema.statics.bumpApplications = function (id, n = 1) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { applications: n } },
    { new: true, runValidators: false }
  ).lean();
};

// Soft delete helper – now *only* closes the job; no publish flag
JobSchema.statics.softDelete = function (id) {
  return this.findByIdAndUpdate(
    id,
    {
      $set: {
        deletedAt: new Date(),
        status: "Closed",
      },
    },
    { new: true }
  ).lean();
};

// Filter out soft-deleted by default (optional global query helper)
// Usage: Job.find().active()…
JobSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

/** -----------------------------
 *  Model
 *  ----------------------------- */
const Job = mongoose.models.Job || mongoose.model("Job", JobSchema);
export default Job;
