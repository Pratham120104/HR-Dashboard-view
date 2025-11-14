// src/services/api.js
import axios from "axios";

/* ---------------------------------------------
   Base URL
--------------------------------------------- */
const _base =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:5000";

// Root API base like "http://localhost:5000"
export const API_BASE = _base.replace(/\/$/, "");

// API base like "http://localhost:5000/api"
const BASE_URL = `${API_BASE}/api`;
const JOBS_ENDPOINT = `${BASE_URL}/jobs`;

/* ---------------------------------------------
   Small helpers
--------------------------------------------- */
const enc = (v) => encodeURIComponent(String(v ?? "").trim());
const requireId = (id) => {
  if (!id) throw new Error("Job id is required");
  return id;
};

/* ---------------------------------------------
   Jobs
--------------------------------------------- */

// Create a job
export const createJob = async (jobData) => {
  const { data } = await axios.post(JOBS_ENDPOINT, jobData);
  return data;
};

// Fetch jobs with optional filters: { status, type, department, q }
export const fetchJobs = async (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.department) params.department = filters.department;
  if (filters.q) params.q = filters.q;

  const { data } = await axios.get(JOBS_ENDPOINT, { params });
  // Server returns either an array (legacy) or an object { data, page, total }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// Get a single job
export const fetchJobById = async (id) => {
  const { data } = await axios.get(`${JOBS_ENDPOINT}/${enc(requireId(id))}`);
  return data;
};

// Update a job (partial). Pass a patch object.
export const updateJob = async (id, patch) => {
  const { data } = await axios.patch(
    `${JOBS_ENDPOINT}/${enc(requireId(id))}`,
    patch,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data;
};

// Set job status (Open/Closed)
export const updateJobStatus = async (id, status) => {
  const { data } = await axios.patch(
    `${JOBS_ENDPOINT}/${enc(requireId(id))}/status`,
    { status },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
};

// Delete a job
export const deleteJob = async (id) => {
  const { data } = await axios.delete(
    `${JOBS_ENDPOINT}/${enc(requireId(id))}`
  );
  return data;
};

/* ---------------------------------------------
   Applications
--------------------------------------------- */

// Apply to a job (multipart/form-data).
// formData must include: fullName, email, phone, comments/why, jobId, jobTitle, resume
export const submitApplication = async (formData) => {
  const { data } = await axios.post(
    `${BASE_URL}/apply/submit`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// Fetch applications for HR dashboard (optional query params like { jobId })
export const fetchApplications = async (params = {}) => {
  const { data } = await axios.get(`${BASE_URL}/applications`, { params });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};
