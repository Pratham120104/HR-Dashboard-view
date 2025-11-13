// src/pages/JobForm.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createJob } from "../services/api";
import toast from "react-hot-toast";
import CreatableSelect from "react-select/creatable";

const DEPARTMENT_OPTIONS = [
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

const OVERVIEW_MAX = 400;
const DESCRIPTION_MAX = 5000;
const LOCAL_DRAFT_KEY = "jobform.v4.draft";

const sanitize = (s) =>
  (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const uniqueArray = (arr) =>
  Array.from(new Set((arr || []).map((v) => sanitize(v)))).filter(Boolean);

/* ---------- Bullet List Input (Enter to add) ---------- */
const ListInput = ({ id, label, placeholder, items, onChange, hint }) => {
  const [val, setVal] = useState("");

  const add = useCallback(() => {
    const cleaned = sanitize(val);
    if (!cleaned) return;
    onChange(uniqueArray([...(items || []), cleaned]));
    setVal("");
  }, [val, items, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  const removeAt = (idx) => {
    onChange((items || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="md:col-span-2">
      <label htmlFor={id} className="block text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
      />
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      <ul className="mt-3 list-disc list-inside space-y-1">
        {(items || []).map((li, i) => (
          <li key={`${li}-${i}`} className="text-gray-800 flex items-start gap-2">
            <span className="flex-1">{li}</span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="text-gray-500 hover:text-gray-700 text-sm"
              aria-label={`Remove item ${li}`}
              title="Remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- Salary/Stipend formatting ---------- */
const formatCurrency = (n) => {
  const num = Number(String(n).replace(/[^0-9.]/g, ""));
  if (!isFinite(num)) return "";
  return `₹${num.toLocaleString("en-IN")}`;
};

const JobForm = () => {
  // mode: "Job" or "Internship"
  const [mode, setMode] = useState("Job");

  const [formData, setFormData] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(LOCAL_DRAFT_KEY) || "null");
      if (draft && typeof draft === "object") return draft;
    } catch (_) {}
    return {
      // Core
      title: "",
      companyName: "GyanNidhi Innovations Pvt. Ltd.",
      department: "Engineering",
      type: "", // "Full-time" | "Part-time" | "Internship"
      level: "", // only when type === "Full-time"
      location: "",

      // Admin
      status: "Open", // Open | Closed

      // Training period (mostly internship)
      trainingPeriod: "",

      // Compensation (structured UI -> string)
      salaryMin: "",
      salaryMax: "",
      salaryPeriod: "per year", // for Job
      stipendAmt: "",
      stipendPeriod: "per month", // for Internship

      // Content
      overview: "",
      fullDescription: "",
      jobRole: "",

      // Lists
      requiredSkills: [],
      benefits: [],

      // How to apply
      howToApply: "",

      // Tags / Keywords (custom)
      tags: [],

      // Optional
      experience: "",
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstErrorRef = useRef(null);

  const updateField = (name, value) => {
    setFormData((s) => {
      const next = { ...s, [name]: value };
      if (name === "type") {
        if (value === "Full-time") {
          // keep level; required in validation
        } else {
          next.level = ""; // not required for part-time or internship
        }
      }
      return next;
    });
  };

  // Mode affects type defaults
  useEffect(() => {
    setFormData((s) => {
      const next = { ...s };
      if (mode === "Internship") {
        next.type = "Internship";
        next.level = "";
      } else if (mode === "Job") {
        if (next.type === "Internship" || !next.type) next.type = "Full-time";
      }
      return next;
    });
  }, [mode]);

  // Persist draft
  useEffect(() => {
    const tid = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(formData));
      } catch (_) {}
    }, 250);
    return () => clearTimeout(tid);
  }, [formData]);

  const validate = useCallback(() => {
    const e = {};
    const s = (k) => sanitize(formData[k]);
    if (!s("title")) e.title = "Title is required";
    if (!s("department")) e.department = "Department is required";
    if (!s("location")) e.location = "Location is required";
    if (!formData.type) e.type = "Type is required";
    if (!["Open", "Closed"].includes(formData.status)) e.status = "Status is required";

    if (mode === "Job") {
      if (formData.type === "Full-time" && !formData.level)
        e.level = "Level is required for full-time roles";
      if (!s("salaryMin") && !s("salaryMax")) {
        e.salary = "Provide a salary amount (min and/or max)";
      }
    } else {
      if (!s("stipendAmt")) e.stipend = "Provide a stipend amount";
    }

    if (s("overview").length > OVERVIEW_MAX)
      e.overview = `Overview must be ≤ ${OVERVIEW_MAX} characters`;
    if (s("fullDescription").length > DESCRIPTION_MAX)
      e.fullDescription = `Description must be ≤ ${DESCRIPTION_MAX} characters`;
    return e;
  }, [formData, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Please fix the highlighted errors.");
      firstErrorRef.current?.focus();
      return;
    }

    // Build salaryRange/stipend string from structured inputs
    let salaryRange = "";
    let duration = ""; // mapped from level (for full-time)
    if (mode === "Job") {
      const min = sanitize(formData.salaryMin);
      const max = sanitize(formData.salaryMax);
      const per = sanitize(formData.salaryPeriod || "per year");
      const minFmt = min ? formatCurrency(min) : "";
      const maxFmt = max ? formatCurrency(max) : "";
      if (minFmt && maxFmt) salaryRange = `${minFmt}–${maxFmt} ${per}`;
      else if (minFmt) salaryRange = `${minFmt} ${per}`;
      else if (maxFmt) salaryRange = `${maxFmt} ${per}`;
      if (formData.type === "Full-time") duration = sanitize(formData.level);
    } else {
      const amt = sanitize(formData.stipendAmt);
      const per = sanitize(formData.stipendPeriod || "per month");
      const amtFmt = amt ? formatCurrency(amt) : "";
      salaryRange = amtFmt ? `${amtFmt} ${per}` : "";
      duration = ""; // not used for internships
    }

    // Build payload (no published)
    const payload = {
      title: sanitize(formData.title),
      companyName: "GyanNidhi Innovations Pvt. Ltd.",
      department: sanitize(formData.department) || "Engineering",
      type: formData.type, // "Full-time" | "Part-time" | "Internship"
      location: sanitize(formData.location),

      // Admin
      status: formData.status, // Open | Closed

      salaryRange, // formatted string
      duration, // level for full-time only

      trainingPeriod: sanitize(formData.trainingPeriod),

      overview: sanitize(formData.overview),
      description: sanitize(formData.fullDescription),
      jobRole: sanitize(formData.jobRole),

      requiredSkills: uniqueArray(formData.requiredSkills),
      benefits: uniqueArray(formData.benefits),

      howToApply: sanitize(formData.howToApply),

      // custom tags (creatable). Also mirror to skills for compatibility.
      tags: uniqueArray(formData.tags),
      skills: uniqueArray(formData.tags),

      experience: sanitize(formData.experience),
    };

    try {
      setIsSubmitting(true);
      await createJob(payload);
      toast.success("Job created successfully");

      // Clear form
      const reset = {
        title: "",
        companyName: "GyanNidhi Innovations Pvt. Ltd.",
        department: "Engineering",
        type: mode === "Job" ? "Full-time" : "Internship",
        level: "",
        location: "",
        trainingPeriod: "",
        status: "Open",
        salaryMin: "",
        salaryMax: "",
        salaryPeriod: "per year",
        stipendAmt: "",
        stipendPeriod: "per month",
        overview: "",
        fullDescription: "",
        jobRole: "",
        requiredSkills: [],
        benefits: [],
        howToApply: "",
        tags: [],
        experience: "",
      };
      setFormData(reset);
      try {
        localStorage.removeItem(LOCAL_DRAFT_KEY);
      } catch (_) {}

      // Optional: navigate user to manage page
      // window.location.href = "/admin/jobs";
    } catch (err) {
      console.error(err);
      toast.error("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // focus first invalid input
  const firstInvalidId = useMemo(() => {
    const order = [
      "title",
      "department",
      "location",
      "type",
      "status",
      "level",
      mode === "Job" ? "salaryMin" : "stipendAmt",
      "overview",
      "fullDescription",
    ];
    for (const key of order) {
      if (
        errors[key] ||
        (key === "salaryMin" && errors.salary) ||
        (key === "stipendAmt" && errors.stipend)
      )
        return key;
    }
    return null;
  }, [errors, mode]);

  useEffect(() => {
    if (!firstInvalidId) return;
    const el = document.getElementById(firstInvalidId);
    if (el) {
      firstErrorRef.current = el;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [firstInvalidId]);

  const overviewLen = (formData.overview || "").trim().length;
  const descLen = (formData.fullDescription || "").trim().length;

  /* ---------- Shared tiny input ---------- */
  const LabeledInput = ({ id, label, ...rest }) => (
    <div>
      <label htmlFor={id} className="block text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
          errors[id] || errors.salary || errors.stipend
            ? "border-red-400 focus:ring-red-200"
            : "border-gray-300 focus:ring-[#047B7B]"
        }`}
        aria-invalid={!!errors[id]}
      />
      {errors[id] && <p className="text-sm text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center py-10 px-4">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-[#004080] mb-2">GyanNidhi HR Portal</h1>
        <p className="text-gray-600 text-lg">Create a new role or internship opportunity.</p>

        {/* Quick link to Manage Jobs */}
        <a
          href="/admin/jobs"
          className="inline-block mt-4 text-sm text-blue-700 underline hover:no-underline"
        >
          Go to Manage Jobs →
        </a>
      </header>

      {/* Mode Toggle */}
      <div className="w-full max-w-5xl mb-4">
        <div className="flex w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setMode("Job")}
            className={`flex-1 py-3 text-center font-medium ${
              mode === "Job" ? "bg-[#004080] text-white" : "text-[#004080] hover:bg-blue-50"
            }`}
          >
            Job
          </button>
          <button
            type="button"
            onClick={() => setMode("Internship")}
            className={`flex-1 py-3 text-center font-medium ${
              mode === "Internship" ? "bg-[#004080] text-white" : "text-[#004080] hover:bg-blue-50"
            }`}
          >
            Internship
          </button>
        </div>
      </div>

      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <div
          className="w-full max-w-5xl mb-4 border border-red-200 bg-red-50 text-red-800 rounded-lg p-3"
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside text-sm">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100"
        noValidate
      >
        {/* Job Title */}
        <div>
          <label htmlFor="title" className="block text-gray-700 mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
            aria-invalid={!!errors.title}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.title ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
            }`}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-gray-700 mb-2">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={(e) => updateField("department", e.target.value)}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.department ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
            }`}
            required
          >
            {DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
        </div>

        {/* Location */}
        <LabeledInput
          id="location"
          label={
            <>
              Location <span className="text-red-500">*</span>
            </>
          }
          type="text"
          name="location"
          value={formData.location}
          onChange={(e) => updateField("location", e.target.value)}
        />

        {/* Training Period (optional) */}
        <LabeledInput
          id="trainingPeriod"
          label="Training Period"
          type="text"
          name="trainingPeriod"
          value={formData.trainingPeriod}
          onChange={(e) => updateField("trainingPeriod", e.target.value)}
        />

        {/* Company (locked) */}
        <div>
          <label htmlFor="companyName" className="block text-gray-700 mb-2">
            Company Name
          </label>
          <select
            id="companyName"
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

        {/* Job Type */}
        <div>
          <label htmlFor="type" className="block text-gray-700 mb-2">
            Job Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={(e) => updateField("type", e.target.value)}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.type ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#004080]"
            }`}
            required
          >
            {mode === "Job" ? (
              <>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
              </>
            ) : (
              <option value="Internship">Internship</option>
            )}
          </select>
          {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
        </div>

        {/* Level (only for Full-time) */}
        {mode === "Job" && formData.type === "Full-time" && (
          <div>
            <label htmlFor="level" className="block text-gray-700 mb-2">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={(e) => updateField("level", e.target.value)}
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                errors.level ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
              }`}
              required
            >
              <option value="" disabled>
                Select level
              </option>
              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="High">High</option>
            </select>
            {errors.level && <p className="text-sm text-red-500 mt-1">{errors.level}</p>}
          </div>
        )}

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => updateField("status", e.target.value)}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.status ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
            }`}
            required
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
          {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
        </div>

        {/* ---------- Compensation ---------- */}
        {mode === "Job" ? (
          <>
            <div>
              <label className="block text-gray-700 mb-2">Salary (min)</label>
              <input
                id="salaryMin"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g., 400000"
                value={formData.salaryMin}
                onChange={(e) => updateField("salaryMin", e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.salary ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
                }`}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Salary (max)</label>
              <input
                id="salaryMax"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g., 800000"
                value={formData.salaryMax}
                onChange={(e) => updateField("salaryMax", e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.salary ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
                }`}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Salary period</label>
              <select
                value={formData.salaryPeriod}
                onChange={(e) => updateField("salaryPeriod", e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
              >
                <option value="per year">per year</option>
                <option value="per month">per month</option>
                <option value="per hour">per hour</option>
              </select>
              {errors.salary && <p className="text-sm text-red-500 mt-1">{errors.salary}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-gray-700 mb-2">
                Stipend amount <span className="text-red-500">*</span>
              </label>
              <input
                id="stipendAmt"
                type="number"
                min="0"
                step="500"
                placeholder="e.g., 10000"
                value={formData.stipendAmt}
                onChange={(e) => updateField("stipendAmt", e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.stipend ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
                }`}
                required
              />
              {errors.stipend && <p className="text-sm text-red-500 mt-1">{errors.stipend}</p>}
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Stipend period</label>
              <select
                value={formData.stipendPeriod}
                onChange={(e) => updateField("stipendPeriod", e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
              >
                <option value="per month">per month</option>
                <option value="per week">per week</option>
                <option value="one-time">one-time</option>
              </select>
            </div>
          </>
        )}

        {/* ---------- Overview & Description ---------- */}
        <div className="md:col-span-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="overview" className="block text-gray-700 mb-2">
              Overview
            </label>
            <span className={`text-xs ${overviewLen > OVERVIEW_MAX ? "text-red-600" : "text-gray-500"}`}>
              {overviewLen}/{OVERVIEW_MAX}
            </span>
          </div>
          <textarea
            id="overview"
            name="overview"
            value={formData.overview}
            onChange={(e) => updateField("overview", e.target.value)}
            rows={2}
            placeholder="Short overview summary of the role"
            aria-invalid={!!errors.overview}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.overview ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
            }`}
          />
          {errors.overview && <p className="text-sm text-red-500 mt-1">{errors.overview}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="jobRole" className="block text-gray-700 mb-2">
            Job Role
          </label>
          <textarea
            id="jobRole"
            name="jobRole"
            value={formData.jobRole}
            onChange={(e) => updateField("jobRole", e.target.value)}
            rows={2}
            placeholder="Describe the job role (distinct from overview/description)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="fullDescription" className="block text-gray-700 mb-2">
              Full Description
            </label>
            <span className={`text-xs ${descLen > DESCRIPTION_MAX ? "text-red-600" : "text-gray-500"}`}>
              {descLen}/{DESCRIPTION_MAX}
            </span>
          </div>
          <textarea
            id="fullDescription"
            name="fullDescription"
            value={formData.fullDescription}
            onChange={(e) => updateField("fullDescription", e.target.value)}
            rows={5}
            placeholder="Full job role description, responsibilities, etc."
            aria-invalid={!!errors.fullDescription}
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
              errors.fullDescription ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#047B7B]"
            }`}
          />
          {errors.fullDescription && <p className="text-sm text-red-500 mt-1">{errors.fullDescription}</p>}
        </div>

        {/* ---------- Bullet Lists ---------- */}
        <ListInput
          id="requiredSkills"
          label="Required Skills"
          placeholder="Type a skill and press Enter"
          items={formData.requiredSkills}
          onChange={(next) =>
            updateField(
              "requiredSkills",
              typeof next === "function" ? next(formData.requiredSkills) : next
            )
          }
          hint="Examples: KiCad, Altium, Embedded C, I2C, SPI, CAN"
        />

        <ListInput
          id="benefits"
          label="Benefits"
          placeholder="Type a benefit and press Enter"
          items={formData.benefits}
          onChange={(next) =>
            updateField("benefits", typeof next === "function" ? next(formData.benefits) : next)
          }
          hint="Keep each benefit short (≤ 40 characters)"
        />

        {/* ---------- How to apply ---------- */}
        <div className="md:col-span-2">
          <label htmlFor="howToApply" className="block text-gray-700 mb-2">
            How to apply
          </label>
          <textarea
            id="howToApply"
            name="howToApply"
            value={formData.howToApply}
            onChange={(e) => updateField("howToApply", e.target.value)}
            rows={2}
            placeholder={`e.g., Send your resume to hr@gyannidhi.in with subject "Application – <Role>" or fill the form on the job page.`}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* ---------- Custom Tags (Creatable) ---------- */}
        <div className="md:col-span-2">
          <label htmlFor="tags" className="block text-gray-700 mb-2">
            Tags / Keywords
          </label>
          <CreatableSelect
            inputId="tags"
            isMulti
            name="tags"
            placeholder="Type a tag and press Enter"
            value={(formData.tags || []).map((t) => ({ value: t, label: t }))}
            onChange={(selected) => updateField("tags", selected ? selected.map((i) => i.value) : [])}
          />
          {formData.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((t, i) => (
                <span key={`${t}-${i}`} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit / Reset */}
        <div className="md:col-span-2 flex items-center justify-center gap-3">
          <button
            type="submit"
            className="bg-[#004080] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50"
            disabled={isSubmitting}
            id="submitBtn"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              const reset = {
                title: "",
                companyName: "GyanNidhi Innovations Pvt. Ltd.",
                department: "Engineering",
                type: mode === "Job" ? "Full-time" : "Internship",
                level: "",
                location: "",
                trainingPeriod: "",
                status: "Open",
                salaryMin: "",
                salaryMax: "",
                salaryPeriod: "per year",
                stipendAmt: "",
                stipendPeriod: "per month",
                overview: "",
                fullDescription: "",
                jobRole: "",
                requiredSkills: [],
                benefits: [],
                howToApply: "",
                tags: [],
                experience: "",
              };
              setFormData(reset);
              setErrors({});
              try {
                localStorage.removeItem(LOCAL_DRAFT_KEY);
              } catch (_) {}
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
