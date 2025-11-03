// src/pages/JobDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Applicant form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
    comments: "",
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const res = await axios.get(`${base}/api/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        setError("Job not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("✅ Application submitted successfully!");
    setFormData({ name: "", email: "", phone: "", resume: null, comments: "" });
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!job) return null;

  return (
    <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* LEFT: Job Details */}
  <div className="md:col-span-2 bg-white shadow-md rounded-xl p-10">
        <h2 className="text-3xl font-bold text-[#004080] mb-2">{job.title}</h2>
        <p className="text-gray-600 mb-1">{job.companyName || "GyanNidhi Innovations Pvt. Ltd."}</p>
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

        {/* Job Role / Position */}
        {job.position && (
          <>
            <h3 className="text-xl font-semibold mb-2">Job role</h3>
            <p className="text-gray-700 mb-6">{job.position}</p>
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
            <p className="text-gray-700 mb-6">{job.benefits}</p>
          </>
        )}

        {/* How to Apply */}
        {job.applicationLink && (
          <>
            <h3 className="text-xl font-semibold mb-2">How to apply</h3>
            <p className="text-gray-700 mb-6">
              Apply using the following link:{" "}
              <a
                href={job.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {job.applicationLink}
              </a>
            </p>
          </>
        )}

        <Link to="/careers" className="text-blue-700 hover:underline">
          ← Back to Careers
        </Link>
      </div>

      {/* RIGHT: Apply Form */}
  <div className="bg-white shadow-md rounded-xl p-10 h-fit">
        <h3 className="text-xl font-semibold mb-4">Apply for this job</h3>
        <p className="text-gray-600 text-sm mb-6">Fill the form below to apply.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              placeholder="Enter 10-digit number"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Upload Resume *</label>
            <input
              type="file"
              name="resume"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Any comments *</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md"
          >
            Submit application
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            By submitting, you agree to share your details with the hiring team.
          </p>
        </form>
      </div>
    </div>
  );
};

export default JobDetail;
