// server/models/Job.js
import mongoose from "mongoose";

/** -----------------------------
 *  Enumerations
 *  -----------------------------
 *  Keep these in sync with the frontend dropdowns/toggles.
 */
export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Research",
  "Training",
  "Marketing",
  "Quality Assurance",
  "Machine Learning",
  "Artificial Intelligence",
  "Education",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Internship"];
export const JOB_STATUS = ["Open", "Closed"];

/** -----------------------------
 *  Helpers
 *  ----------------------------- */
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();
const uniqArr = (arr) =>
  Array.from(new Set((arr || []).map((v) => strip(v)).filter(Boolean)));

/** -----------------------------
 *  Schema
 *  ----------------------------- */
const JobSchema = new mongoose.Schema(
  {
    // Core
    title: { type: String, required: true, trim: true, maxlength: 160 },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
      trim: true,
    },
    type: { type: String, enum: JOB_TYPES, required: true, index: true },
    location: { type: String, required: true, trim: true, maxlength: 160 },

    // Open/Close control for visibility & applications
    status: {
      type: String,
      enum: JOB_STATUS,
      default: "Open",
      index: true,
    },

    // Frontend maps level->duration (used mainly for Full-time: Entry/Mid/High)
    duration: { type: String, trim: true, maxlength: 40 },

    // Company & pay
    companyName: {
      type: String,
      default: "GyanNidhi Innovations Pvt. Ltd.",
      trim: true,
      maxlength: 160,
    },
    // Free-form human-readable salary (validated on FE). Examples:
    // "₹10k–₹15k / month", "₹6–8 LPA", "Competitive"
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

    // Authoritative “tag cloud”. We also mirror this into `skills` for compatibility.
    tags: { type: [String], default: [], set: uniqArr },

    // Back-compat: Some FE/older cards might still read `skills`.
    // We keep it in sync with `tags ∪ requiredSkills`.
    skills: { type: [String], default: [] },

    // Optional
    experience: { type: String, trim: true, maxlength: 80 },

    // Simple analytics counter (optional; increment on apply)
    applications: { type: Number, default: 0 },
  },
  {
    timestamps: true,
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
 *  Tag/Skill mirroring
 *  -----------------------------
 *  Ensure `tags` contains `requiredSkills`, and mirror to `skills`.
 */
function mirrorTagsAndSkills(doc) {
  const tagSet = new Set([...(doc.tags || []), ...(doc.requiredSkills || [])]);
  doc.tags = Array.from(tagSet);
  doc.skills = Array.from(tagSet);
}

JobSchema.pre("save", function (next) {
  mirrorTagsAndSkills(this);
  next();
});

// Also ensure mirroring on findOneAndUpdate / updateOne (patches)
JobSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate() || {};
  // Normalize $set payloads
  const $set = update.$set || update;

  if ($set) {
    const mergedTags = uniqArr([
      ...($set.tags || []),
      ...($set.requiredSkills || []),
    ]);
    if ($set.tags || $set.requiredSkills) {
      $set.tags = mergedTags;
      $set.skills = mergedTags;
    }
    // push back into the update object
    if (update.$set) {
      update.$set = $set;
    } else {
      Object.assign(update, $set);
    }
    this.setUpdate(update);
  }
  next();
});

/** -----------------------------
 *  Indexes (query performance)
 *  ----------------------------- */
JobSchema.index({ createdAt: -1 });
JobSchema.index({ type: 1, department: 1, status: 1 });
JobSchema.index({
  title: "text",
  overview: "text",
  description: "text",
  location: "text",
  department: "text",
  tags: "text",
});

/** -----------------------------
 *  Model
 *  ----------------------------- */
const Job =
  mongoose.models.Job || mongoose.model("Job", JobSchema);
export default Job;
