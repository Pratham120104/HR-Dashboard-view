import React, { useState, useEffect } from "react";
import { createJob, fetchJobs, deleteJob } from "../services/api";
import toast from "react-hot-toast";
import Select from "react-select";

const JobForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    stipend: "",
    level: "",
    companyName: "GyanNidhi Innovations Pvt. Ltd.",
    position: "",
    department: "",
    overview: "",
    location: "",
    trainingPeriod: "",
    applicationLink: "",
    description: "",
    requirements: "",
    benefits: "",
    tags: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [jobs, setJobs] = useState([]);

  const SKILLS = [
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
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.type) newErrors.type = "Type is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!Array.isArray(formData.tags) || formData.tags.length === 0)
      newErrors.tags = "Select at least one skill";
    if (formData.type === "Full-time" && !formData.level)
      newErrors.level = "Level is required for full-time roles";
    return newErrors;
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    const payload = {
      title: formData.title,
      department:
        formData.department || formData.position || formData.companyName || "General",
      companyName: formData.companyName,
      position: formData.position,
      applicationLink: formData.applicationLink || "",
      requirements: formData.requirements,
      type: formData.type,
      location: formData.location,
      salaryRange: formData.stipend || "",
      duration: formData.level || "",
      skills: formData.tags,
      description: formData.description || "",
      overview: formData.overview || "",
      trainingPeriod: formData.trainingPeriod || "",
      benefits: formData.benefits || "",
      tags: formData.tags || [],
    };

    try {
      setIsSubmitting(true);
      await createJob(payload);
      toast.success("Job created successfully");
      setFormData({
        title: "",
        type: "",
        stipend: "",
        level: "",
        companyName: "GyanNidhi Innovations Pvt. Ltd.",
        position: "",
        department: "",
        overview: "",
        trainingPeriod: "",
        location: "",
        applicationLink: "",
        description: "",
        requirements: "",
        benefits: "",
        tags: [],
      });
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create job");
    } finally {
      setIsSubmitting(false);
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
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100"
      >
        {/* Basic Inputs */}
        {[
          { label: "Job Title", name: "title", required: true },
          { label: "Company Name", name: "companyName" },
          { label: "Position", name: "position" },
          { label: "Department", name: "department", required: true },
          { label: "Location", name: "location", required: true },
          { label: "Training Period", name: "trainingPeriod" },
          { label: "Stipend", name: "stipend" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-gray-700 mb-2">{f.label}</label>
            {f.name === "companyName" ? (
              <select
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                disabled
                className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
              >
                <option value="GyanNidhi Innovations Pvt. Ltd.">
                  GyanNidhi Innovations Pvt. Ltd.
                </option>
              </select>
            ) : (
              <input
                type="text"
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                required={f.required}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
              />
            )}
          </div>
        ))}

        {/* Application link (optional)
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">How to apply (optional URL)</label>
          <input
            type="url"
            name="applicationLink"
            value={formData.applicationLink}
            onChange={handleChange}
            placeholder="https://example.com/apply"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div> */}

        {/* Type */}
        <div>
          <label className="block text-gray-700 mb-2">Job Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#004080]"
            required
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Level */}
        <div>
          <label className="block text-gray-700 mb-2">Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          >
            <option value="" disabled>
              Select level
            </option>
            <option value="Entry">Entry</option>
            <option value="Mid">Mid</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Overview */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Overview</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows="2"
            placeholder="Short overview summary of the role"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">
            Job role description (full)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Full job role description, responsibilities, etc."
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Requirements */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
            placeholder="Describe minimum requirements / responsibilities"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Tags / Skills */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Tags / Skills</label>
          <Select
            isMulti
            name="tags"
            options={SKILLS.map((s) => ({ value: s, label: s }))}
            value={formData.tags.map((t) => ({ value: t, label: t }))}
            onChange={(selected) =>
              setFormData({
                ...formData,
                tags: selected ? selected.map((item) => item.value) : [],
              })
            }
            placeholder="Search and select skills..."
          />
          {errors.tags && (
            <p className="text-sm text-red-500 mt-2">{errors.tags}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((t) => (
              <div
                key={t}
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full"
              >
                <span className="mr-2 text-sm">{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Benefits</label>
          <textarea
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            rows="3"
            placeholder="Describe benefits or perks"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
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
      <section className="w-full max-w-4xl mt-8">
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
                <div>
                  <h3 className="text-lg font-semibold">
                    {job.roleName || job.title}{" "}
                    <span className="text-sm text-gray-500">
                      ({job.typeOfRole || job.type})
                    </span>
                  </h3>
                  <p className="text-gray-600">
                    {job.companyName || job.department}{" "}
                    {job.position ? `• ${job.position}` : ""}{" "}
                    {job.location ? `• ${job.location}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {job.overview || job.description}
                  </p>
                  {(job.tags || job.skills)?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(job.tags || job.skills).map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(job.createdAt).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
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
