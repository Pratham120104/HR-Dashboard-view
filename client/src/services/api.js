import axios from "axios";

// Use Vite environment variable when available, otherwise fall back to localhost:5000
const _base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : "http://localhost:5000";
const API_BASE_URL = `${_base.replace(/\/$/, "")}/api/jobs`; // final jobs endpoint

// Create a new job
export const createJob = async (jobData) => {
  try {
    const res = await axios.post(API_BASE_URL, jobData);
    return res.data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// Fetch all jobs
export const fetchJobs = async () => {
  try {
    const res = await axios.get(API_BASE_URL);
    return res.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
};

// Delete a job by ID
export const deleteJob = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};