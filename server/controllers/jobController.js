import Job from "../models/Job.js";

// 🟢 Create a new job
export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (error) {
    console.error("❌ Error creating job:", error);

    // Return validation details for the client when possible
    if (error.name === "ValidationError") {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation Error", errors: details });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Get all jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Get a single job by ID (for JobDetail.jsx)
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(job);
  } catch (error) {
    console.error("❌ Error fetching job by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🟢 Delete a job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting job:", error);
    res.status(500).json({ message: "Server Error" });
  }
};