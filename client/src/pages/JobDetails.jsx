// src/pages/JobDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const strip = (s) => (s || "").toString().trim();

const JobDetail = () => {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Applicant form
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    why: "",
  });
  const [resumeFile, setResumeFile] = useState(null);

  // ----- hooks must always run in the same order -----
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error(err);
        setError("Job not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  // Safe memos (work with job === null on first render)
  const benefitsArray = useMemo(() => {
    const b = job?.benefits;
    if (Array.isArray(b)) return b;
    if (typeof b === "string" && b.trim()) {
      return b.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [job]);

  const requiredSkillsArray = useMemo(() => {
    const rs = job?.requiredSkills;
    return Array.isArray(rs) ? rs : [];
  }, [job]);

  const tagList = useMemo(() => {
    const t = job?.tags;
    const s = job?.skills;
    if (Array.isArray(t) && t.length) return t;
    if (Array.isArray(s) && s.length) return s;
    return [];
  }, [job]);

  const showLevel = job?.type === "Full-time" && job?.duration;
  const createdAt = job?.createdAt ? new Date(job.createdAt).toLocaleString() : "";
  const safeType = job?.type || "Full-time";

  // ----- handlers -----
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) setForm((s) => ({ ...s, phone: digits }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return setResumeFile(null);
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      Swal.fire({
        icon: "warning",
        title: "File too large",
        text: "Please upload a file smaller than 5 MB.",
        confirmButtonColor: "#2563eb",
        background: "#f9fafb",
      });
      e.target.value = "";
      return setResumeFile(null);
    }
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!form.fullName || !form.email || !form.phone || !form.why || !resumeFile) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields and attach your resume.",
        confirmButtonColor: "#2563eb",
        background: "#f9fafb",
      });
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("jobId", job?._id || job?.id || "");
      formData.append("jobTitle", strip(job?.title));
      formData.append("fullName", strip(form.fullName));
      formData.append("email", strip(form.email));
      formData.append("phone", strip(form.phone));
      formData.append("why", strip(form.why));
      formData.append("resume", resumeFile);

      await axios.post(`${API_BASE}/api/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Application Sent!",
        text: "✅ Your application has been sent successfully. We'll get back to you soon!",
        confirmButtonColor: "#2563eb",
        background: "#f9fafb",
      });

      setForm({ fullName: "", email: "", phone: "", why: "" });
      setResumeFile(null);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "❌ Failed to send your application. Please try again later.",
        confirmButtonColor: "#dc2626",
        background: "#fef2f2",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ----- single return; render states inside -----
  return (
    <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* Loading / Error states */}
      {loading || error || !job ? (
        <div className="md:col-span-3 text-center py-10">
          {loading && <div>Loading...</div>}
          {!loading && error && <div className="text-red-500">{error}</div>}
          {!loading && !error && !job && <div>No job found.</div>}
        </div>
      ) : (
        <>
          {/* LEFT: Job Details */}
          <div className="md:col-span-2 bg-white shadow-md rounded-2xl p-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold text-[#004080] mb-2">{job.title}</h2>
                <p className="text-gray-600 mb-1">
                  {job.companyName || "Company"}
                  {job.department ? (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded align-middle">
                      {job.department}
                    </span>
                  ) : null}
                </p>
              </div>
              {createdAt && <div className="text-xs text-gray-400">{createdAt}</div>}
            </div>

            <div className="flex flex-wrap gap-3 text-gray-600 text-sm mb-6 mt-2">
              {job.location && (
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  📍 {job.location}
                </span>
              )}
              {safeType && (
                <span
                  className={`px-2 py-0.5 rounded border ${
                    safeType === "Internship"
                      ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                      : safeType === "Part-time"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  {safeType}
                </span>
              )}
              {showLevel && <span className="bg-gray-100 px-2 py-0.5 rounded">Level: {job.duration}</span>}
              {job.experience && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">🎯 {job.experience}</span>
              )}
              {job.salaryRange && (
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">💰 {job.salaryRange}</span>
              )}
              {job.trainingPeriod && (
                <span className="bg-gray-100 px-2 py-0.5 rounded">Training: {job.trainingPeriod}</span>
              )}
            </div>

            {job.overview && (
              <>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="text-gray-700 mb-6 leading-relaxed whitespace-pre-line">
                  {job.overview}
                </p>
              </>
            )}

            {job.description && (
              <>
                <h3 className="text-xl font-semibold mb-2">Full description</h3>
                <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-gray-700 whitespace-pre-line">
                  {job.description}
                </div>
              </>
            )}

            {job.jobRole && (
              <>
                <h3 className="text-xl font-semibold mb-2">Job role</h3>
                <p className="text-gray-700 mb-6 leading-relaxed whitespace-pre-line">
                  {job.jobRole}
                </p>
              </>
            )}

            {requiredSkillsArray.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-2">Required skills</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6">
                  {requiredSkillsArray.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </>
            )}

            {benefitsArray.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-2">Benefits</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6">
                  {benefitsArray.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </>
            )}

            {job.howToApply && (
              <>
                <h3 className="text-xl font-semibold mb-2">How to apply</h3>
                <p className="leading-relaxed mb-6 whitespace-pre-line">{job.howToApply}</p>
              </>
            )}

            {tagList.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {tagList.map((t, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Link to="/careers" className="text-blue-700 hover:underline">
              ← Back to Careers
            </Link>
          </div>

          {/* RIGHT: Apply Form */}
          <div className="bg-white shadow-md rounded-2xl p-8 h-fit sticky top-24">
            <h3 className="text-xl font-semibold mb-2">Apply for this job</h3>
            <p className="text-gray-500 text-sm mb-6">Fill the form below to apply.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium" htmlFor="fullName">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="email">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="phone">
                  Phone Number * (10 digits)
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter 10-digit number"
                  required
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="resume">
                  Upload Resume *
                </label>
                <input
                  id="resume"
                  type="file"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  required
                  className="w-full mt-1 p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">Max size: 5 MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="why">
                  Any comments *
                </label>
                <textarea
                  id="why"
                  name="why"
                  value={form.why}
                  onChange={handleChange}
                  rows="3"
                  required
                  className="w-full mt-1 p-3 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-all duration-200 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit application"}
              </button>

              <p className="text-xs text-gray-400 mt-2 text-center">
                By submitting, you agree to share your details with the hiring team.
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default JobDetail;
