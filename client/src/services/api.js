import axios from "axios";

// ✅ Determine base API URL
const _base =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:5000";

// ✅ Ensure no trailing slash and add /api prefix only once
const BASE_URL = `${_base.replace(/\/$/, "")}/api`;
const JOBS_ENDPOINT = `${BASE_URL}/jobs`;

// ✅ Create a new job
export const createJob = async (jobData) => {
  try {
    const res = await axios.post(JOBS_ENDPOINT, jobData);
    return res.data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// ✅ Fetch all jobs
export const fetchJobs = async () => {
  try {
    const res = await axios.get(JOBS_ENDPOINT);
    return res.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
};

// ✅ Fetch single job by ID (for JobDetail.jsx)
export const fetchJobById = async (id) => {
  try {
    const res = await axios.get(`${JOBS_ENDPOINT}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching job by ID:", error);
    throw error;
  }
};

// ✅ Delete a job by ID
export const deleteJob = async (id) => {
  try {
    const res = await axios.delete(`${JOBS_ENDPOINT}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};

// ✅ (Optional) Submit job application (centralize your apply logic)
export const submitApplication = async (formData) => {
  try {
    const res = await axios.post(`${BASE_URL}/apply`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("Error submitting job application:", error);
    throw error;
  }
};