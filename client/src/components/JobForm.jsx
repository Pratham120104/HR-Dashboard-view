import React, { useState, useEffect } from "react";
import { createJob, fetchJobs, deleteJob } from "../services/api";
import toast from "react-hot-toast";

const JobForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    stipend: "",
    level: "",
    companyName: "",
    position: "",
    department: "",
    overview: "",
    location: "",
    trainingPeriod: "",
    description: "",
    requirements: "",
    benefits: "",
    tags: [],
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Example skill list — you can expand this or load from server
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

  // Validation
  const validate = () => {
    const errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.type) errors.type = "Type is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.location) errors.location = "Location is required";
    // ensure at least one skill tag is selected (server expects skills array)
    if (!Array.isArray(formData.tags) || formData.tags.length === 0) errors.tags = "Select at least one skill";
    // if role is Full-time require level
    if (formData.type === "Full-time" && !formData.level) errors.level = "Level is required for full-time roles";
    return errors;
  };

  const errors = validate();
  const isFormValid = Object.keys(errors).length === 0;

  // requirements is now a description string (handled in form below)

  // Benefits is a description string now (handled in the form as a textarea)

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  // handle select-multiple change for tags (skills)
  const handleTagsChange = (e) => {
    const options = Array.from(e.target.selectedOptions || []).map((o) => o.value);
    setFormData({ ...formData, tags: options });
  };

  // removeSkill removed — requirements is now a description string

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map frontend fields to backend schema expected by server/models/Job.js
    const payload = {
      title: formData.title,
      department: formData.department || formData.position || formData.companyName || "General",
      type: formData.type, // should be "Full-time" or "Internship"
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
  setFormData({ title: "", type: "", stipend: "", level: "", companyName: "", position: "", department: "", overview: "", trainingPeriod: "", location: "", description: "", requirements: "", benefits: "", tags: [] });
      // refresh jobs list after creating
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // jobs list
  const [jobs, setJobs] = useState([]);

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
        <h1 className="text-4xl font-bold text-[#004080] mb-2">GyanNidhi HR Portal</h1>
        <p className="text-gray-600 text-lg">
          Create a new role or internship opportunity.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100"
      >
        <div>
          <label className="block text-gray-700 mb-2">Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#004080] transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Job Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#004080] transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
            required
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Stipend</label>
          <input
            type="text"
            name="stipend"
            value={formData.stipend}
            onChange={handleChange}
            placeholder="e.g. 20000 / month or Negotiable"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Training Period</label>
          <input
            type="text"
            name="trainingPeriod"
            value={formData.trainingPeriod}
            onChange={handleChange}
            placeholder="e.g. 3 months, 6 weeks"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

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

        <div>
          <label className="block text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Company name (optional)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Position</label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="Position / title (optional)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department (e.g. Engineering, Marketing)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Overview of the role</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows="2"
            placeholder="Short overview summary of the role"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Job role description (full)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Full job role description, responsibilities, etc."
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Requirements (description)</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
            placeholder="Describe minimum requirements / responsibilities (bullet points OK)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* Tags (select skills) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Tags</label>
          <select
            name="tags"
            multiple
            value={formData.tags}
            onChange={handleTagsChange}
            className="w-full border border-gray-300 rounded-lg p-3 h-40"
          >
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.tags && <p className="text-sm text-red-500 mt-2">{errors.tags}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((t) => (
              <div key={t} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                <span className="mr-2 text-sm">{t}</span>
                <button type="button" onClick={() => removeTag(t)} className="text-gray-500 hover:text-gray-700">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">Benefits</label>
          <textarea
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            rows="3"
            placeholder="Describe benefits or perks (e.g. Health insurance, remote-first, flexible hours)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#047B7B]"
          />
        </div>

        {/* NOTE: freeform tag input removed. Use the multi-select above to choose skills/tags. */}

        {/* How to Apply (static) */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2">How to Apply</label>
          <p className="text-sm text-gray-700">Send your updated resume to <span className="font-medium">Sravani@gyannidhi.in</span> with the subject or fill the beside form.</p>
        </div>

        <div className="md:col-span-2 flex justify-center">
          <button
            type="submit"
            className="bg-[#004080] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Job"}
          </button>
        </div>
      </form>

      {/* HR view: list of existing jobs with delete */}
      <section className="w-full max-w-4xl mt-8">
        <h2 className="text-2xl font-semibold mb-4">Existing Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-gray-600">No jobs yet.</p>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job._id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{job.roleName || job.title} <span className="text-sm text-gray-500">({job.typeOfRole || job.type})</span></h3>
                  <p className="text-gray-600">{job.companyName || job.department} {job.position ? `• ${job.position}` : ''} {job.location ? `• ${job.location}` : ''}</p>
                  <p className="mt-2 text-sm text-gray-700">{job.overview || job.description}</p>
                  {(job.tags || job.skills) && (job.tags || job.skills).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(job.tags || job.skills).map((t) => (
                        <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <button onClick={() => handleDelete(job._id)} className="text-red-600 hover:underline">Delete</button>
                  <div className="text-xs text-gray-400 mt-2">{new Date(job.createdAt).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm delete</h3>
            <p>Are you sure you want to delete this job? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobForm;