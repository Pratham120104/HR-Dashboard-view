// src/pages/JobForm.jsx
import React, { useState, useEffect } from "react";
import { createJob, fetchJobs, deleteJob } from "../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

/**
 * This JobForm covers all fields used by:
 * - Static Job Detail (jobRole, fullDescription, requiredSkills[], benefits[], howToApply, experience)
 * - Dynamic Job Detail (overview, description, requirements, tags, salaryRange, duration, etc.)
 *
 * Payload mapping summary (backend-friendly):
 * - title                  -> title
 * - companyName            -> companyName
 * - position               -> position
 * - department             -> department
 * - type                   -> type ("Full-time" | "Internship")
 * - location               -> location
 * - stipend                -> salaryRange
 * - level                  -> duration
 * - trainingPeriod         -> trainingPeriod
 * - overview               -> overview
 * - fullDescription        -> description (app keeps one long description field)
 * - jobRole                -> jobRole
 * - requirements (text)    -> requirements (string; optional; we also generate from requiredSkills[])
 * - requiredSkills[]       -> requiredSkills (array) + appended into requirements string for compatibility
 * - benefits[]             -> benefits (string joined by newline)
 * - howToApply             -> howToApply
 * - tags[] (keywords)      -> tags + skills
 */

const SKILLS_LIBRARY = [
  "JavaScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "TypeScript",
  "HTML",
  "CSS",
  "Python",
  "Django",
  "SQL",
  "AWS",
  "Docker",
  "KiCad",
  "Altium",
  "Embedded C",
  "CAN",
  "SPI",
  "I2C",
];

const EXPERIENCE_OPTIONS = [
  { value: "Entry Level", label: "Entry Level" },
  { value: "Mid Level", label: "Mid Level" },
  { value: "Senior Level", label: "Senior Level" },
  { value: "Lead / Manager", label: "Lead / Manager" },
];

const JobForm = () => {
  const [formData, setFormData] = useState({
    // Core
    title: "",
    companyName: "GyanNidhi Innovations Pvt. Ltd.",
    position: "",
    department: "",
    type: "", // "Full-time" | "Internship"
    level: "", // maps to duration
    location: "",
    stipend: "", // maps to salaryRange
    trainingPeriod: "",

    // Content
    overview: "",
    fullDescription: "", // maps to description
    jobRole: "",
    requirements: "", // free text
    requiredSkills: [], // array chips
    benefits: [], // array chips
    howToApply: "",

    // Tags / Keywords
    tags: [], // react-select multi
    experience: "", // text value matching experienceNames map in static version
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [jobs, setJobs] = useState([]);

  // ---------- helpers ----------
  const updateField = (name, value) => {
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!formData.title) e.title = "Title is required";
    if (!formData.department) e.department = "Department is required";
    if (!formData.location) e.location = "Location is required";
    if (!formData.type) e.type = "Type is required";
    if (formData.type === "Full-time" && !formData.level)
      e.level = "Level is required for full-time roles";
    // Add any strict requirements here if needed
    return e;
  };

  const removeFromArrayField = (field, index) => {
    setFormData((s) => ({
      ...s,
      [field]: s[field].filter((_, i) => i !== index),
    }));
  };

  const handleChipAdd = (e, field) => {
    if (!e.target.value) return;
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      const value = e.target.value.trim().replace(/,$/, "");
      if (!value) return;
      setFormData((s) => ({
        ...s,
        [field]: [...(s[field] || []), value],
      }));
      e.target.value = "";
    }
  };

  const loadJobs = async () => {
    const res = await fetchJobs();
    if (Array.isArray(res)) setJobs(res);
    else if (res && res.data) setJobs(res.data);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    // Compose description & requirements for compatibility
    const description = formData.fullDescription || "";
    const reqFromSkills =
      formData.requiredSkills && formData.requiredSkills.length
        ? `\n\nRequired Skills:\n- ${formData.requiredSkills.join("\n- ")}`
        : "";
    const finalRequirements =
      (formData.requirements || "").trim() + reqFromSkills;

    // Benefits string (for your JobDetail v2, it reads benefits as text block)
    const benefitsText =
      formData.benefits && formData.benefits.length
        ? formData.benefits.join("\n")
        : formData.benefits || "";

    const payload = {
      // Basic
      title: formData.title,
      companyName: formData.companyName,
      position: formData.position,
      department:
        formData.department ||
        formData.position ||
        formData.companyName ||
        "General",
      type: formData.type,
      location: formData.location,

      // Financial / seniority mapping
      salaryRange: formData.stipend || "",
      duration: formData.level || "",

      trainingPeriod: formData.trainingPeriod || "",

      // Content
      overview: formData.overview || "",
      description, // fullDescription stored as `description`
      jobRole: formData.jobRole || "",
      requirements: finalRequirements, // string, includes skills list
      requiredSkills: formData.requiredSkills || [], // array preserved too
      benefits: benefitsText, // ensure JobDetail can render
      howToApply: formData.howToApply || "",

      // Tags / Keywords
      tags: formData.tags || [],
      skills: formData.tags || [],

      // Experience (optional, used by static JobDetail mapping)
      experience: formData.experience || "",
    };

    try {
      setIsSubmitting(true);
      await createJob(payload);
      toast.success("Job created successfully");

      // Notify other views (e.g., CareersPage) to refresh
      window.dispatchEvent(new Event("jobPosted"));

      // Reset form
      setFormData({
        title: "",
        companyName: "GyanNidhi Innovations Pvt. Ltd.",
        position: "",
        department: "",
        type: "",
        level: "",
        location: "",
        stipend: "",
        trainingPeriod: "",
        overview: "",
        fullDescription: "",
        jobRole: "",
        requirements: "",
        requiredSkills: [],
        benefits: [],
        howToApply: "",
        tags: [],
        experience: "",
      });

      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteJob(deleteTarget);
      toast.success("Job deleted");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center py-10 px-4">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#004080] mb-2">
          GyanNidhi HR Portal
        </h1>
        <p className="text-gray-600 text-lg">
          Create a new role or internship opportunity.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100"
      >
        {/* --- Basic fields --- */}
        {[
          { label: "Job Title", name: "title", required: true },
          { label: "Position", name: "position" },
          { label: "Department", name: "department", required: true },
          { label: "Location", name: "location", required: true },
          { label: "Training Period", name: "trainingPeriod" },
          { label: "Stipend / Salary Range", name: "stipend" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-gray-700 mb-2">{f.label}</label>
            <input
              type="text"
              name={f.name}
              value={formData[f.name]}
              onChange={(e) => updateField(f.name, e.target.value)}
              required={!!f.required}
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                errors[f.name]
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-[#047B7B]"
              }`}
            />
            {errors[f.name] && (
              <p className="text-sm text-red-500 mt-1">{errors[f.name]}</p>
            )}
          </div>
        ))}

        {/* Company (locked to GN) */}
        <div>
          <label className="block text-gray-700 mb-2">Company Name</label>
          <select
            name="companyName"
            value={formData.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            disabled
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none"
          >
            <option value="GyanNidhi Innovations Pvt. Ltd.">
              GyanNidhi Innovations Pvt. Ltd.
            </option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-gray-700 mb-2">Job Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={(e) => updateField("type", e.target.value)}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.type
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#004080]"
            }`}
            required
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
          </select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type}</p>
          )}
        </div>

        {/* Level (maps to duration) */}
        <div>
          <label className="block text-gray-700 mb-2">Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={(e) => updateField("level", e.target.value)}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.level
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#047B7B]"
            }`}
          >
            <option value="" disabled>
              Select level
            </option>
            <option value="Entry">Entry</option>
            <option value="Mid">Mid</option>
            <option value="High">High</option>
          </select>
          {errors.level && (
            <p className="text-sm text-red-500 mt-1">{errors.level}</p>
          )}
        </div>

        {/* Experience (for static mapping clarity) */}
        <div>
          <label className="block text-gray-700 mb-2">Experience</label>
          <Select
            isClearable
            name="experience"
            options={EXPERIENCE_OPTIONS}
            value={
              formData.experience
                ? { value: formData.experience, label: formData.experience }
                : null
            }
            onChange={(opt) => updateField("experience", opt?.value || "")}
            placeholder="Select experience level (optional)"
          />
        </div>

        {/* Overview */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Overview</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={(e) => updateField("overview", e.target.value)}
            rows={2}
            placeholder="Short overview summary of the role"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Job Role (separate from title) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Job Role</label>
          <textarea
            name="jobRole"
            value={formData.jobRole}
            onChange={(e) => updateField("jobRole", e.target.value)}
            rows={2}
            placeholder="Describe the job role (distinct from overview/description)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Full Description (maps to description) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">
            Full Description (will be saved as description)
          </label>
          <textarea
            name="fullDescription"
            value={formData.fullDescription}
            onChange={(e) => updateField("fullDescription", e.target.value)}
            rows={5}
            placeholder="Full job role description, responsibilities, etc."
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Requirements (free text) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Requirements (text)</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={(e) => updateField("requirements", e.target.value)}
            rows={3}
            placeholder="Describe minimum requirements / responsibilities (free text)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Required Skills (chips) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">
            Required Skills (add with Enter or comma)
          </label>
          <input
            type="text"
            onKeyDown={(e) => handleChipAdd(e, "requiredSkills")}
            placeholder="Type a skill and press Enter"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.requiredSkills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeFromArrayField("requiredSkills", i)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Benefits (chips) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">
            Benefits (add with Enter or comma)
          </label>
          <input
            type="text"
            onKeyDown={(e) => handleChipAdd(e, "benefits")}
            placeholder="Type a benefit and press Enter"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.benefits.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
              >
                {b}
                <button
                  type="button"
                  onClick={() => removeFromArrayField("benefits", i)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* How to apply */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">How to apply</label>
          <textarea
            name="howToApply"
            value={formData.howToApply}
            onChange={(e) => updateField("howToApply", e.target.value)}
            rows={2}
            placeholder={`e.g., Send your resume to hr@gyannidhi.in with subject "Application – <Role>" or fill the form on the job page.`}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Tags / Keywords */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Tags / Keywords</label>
          <Select
            isMulti
            name="tags"
            options={SKILLS_LIBRARY.map((s) => ({ value: s, label: s }))}
            value={formData.tags.map((t) => ({ value: t, label: t }))}
            onChange={(selected) =>
              updateField(
                "tags",
                selected ? selected.map((i) => i.value) : []
              )
            }
            placeholder="Search and select tags/keywords..."
          />
          {errors.tags && (
            <p className="text-sm text-red-500 mt-2">{errors.tags}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center">
          <button
            type="submit"
            className="bg-[#004080] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Job"}
          </button>
        </div>
      </form>

      {/* Jobs List */}
      <section className="w-full max-w-5xl mt-8">
        <h2 className="text-2xl font-semibold mb-4">Existing Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-gray-600">No jobs yet.</p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li
                key={job._id}
                className="bg-white p-4 rounded-lg shadow-md flex justify-between items-start"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold break-words">
                    {job.title}{" "}
                    <span className="text-sm text-gray-500">
                      ({job.type})
                    </span>
                  </h3>
                  <p className="text-gray-600 break-words">
                    {job.companyName || job.department}{" "}
                    {job.position ? `• ${job.position}` : ""}{" "}
                    {job.location ? `• ${job.location}` : ""}
                  </p>

                  {/* Quick badges */}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-700 mt-2">
                    {job.salaryRange && (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        💰 {job.salaryRange}
                      </span>
                    )}
                    {job.duration && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        ⏳ {job.duration}
                      </span>
                    )}
                    {job.experience && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        🎯 {job.experience}
                      </span>
                    )}
                  </div>

                  {/* Preview text */}
                  <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                    {job.overview || job.description}
                  </p>

                  {/* Tags */}
                  {(job.tags || job.skills)?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(job.tags || job.skills).map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                  <div className="text-xs text-gray-400 mt-2">
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm delete</h3>
            <p>
              Are you sure you want to delete this job? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobForm;
