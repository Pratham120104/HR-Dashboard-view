// src/pages/JobDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Applicant form data
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    why: "",
  });
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const res = await axios.get(`${base}/api/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error(err);
        setError("Job not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Restrict phone field to 10 digits only
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) setForm((s) => ({ ...s, phone: digitsOnly }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
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
      formData.append("jobId", job._id || job.id);
      formData.append("jobTitle", job.title);
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("why", form.why);
      formData.append("resume", resumeFile);

      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      await axios.post(`${base}/api/apply`, formData, {
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

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!job) return null;

  return (
    <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* LEFT: Job Details */}
      <div className="md:col-span-2 bg-white shadow-md rounded-2xl p-10">
        <h2 className="text-3xl font-bold text-[#004080] mb-2">{job.title}</h2>
        <p className="text-gray-600 mb-1">{job.companyName || "Company"}</p>

        <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-6">
          {job.location && <span>{job.location}</span>}
          {job.type && <span>• {job.type}</span>}
          {job.duration && <span>• Level: {job.duration}</span>}
          {job.salaryRange && <span>💰 {job.salaryRange}</span>}
        </div>

        {/* Overview */}
        {job.overview && (
          <>
            <h3 className="text-xl font-semibold mb-2">Overview</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">{job.overview}</p>
          </>
        )}

        {/* Description */}
        {job.description && (
          <>
            <h3 className="text-xl font-semibold mb-2">Full description</h3>
            <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-gray-700 whitespace-pre-line">
              {job.description}
            </div>
          </>
        )}

        {/* Required Skills */}
        {job.requirements && (
          <>
            <h3 className="text-xl font-semibold mb-2">Required skills</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              {job.requirements.split("\n").map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </>
        )}

        {/* Benefits */}
        {job.benefits && (
          <>
            <h3 className="text-xl font-semibold mb-2">Benefits</h3>
            <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-gray-700 whitespace-pre-line">
              {job.benefits}
            </div>
          </>
        )}

        {/* Tags */}
        {(job.tags || job.skills)?.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {(job.tags || job.skills).map((t, i) => (
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
        <p className="text-gray-500 text-sm mb-6">
          Fill the form below to apply.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name *</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email Address *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone Number *</label>
            <input
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
            <label className="block text-sm font-medium">Upload Resume *</label>
            <input
              type="file"
              name="resume"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
              className="w-full mt-1 p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Any comments *</label>
            <textarea
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>

          <p className="text-xs text-gray-400 mt-2 text-center">
            By submitting, you agree to share your details with the hiring team.
          </p>
        </form>
      </div>
    </div>
  );
};

export default JobDetail;
