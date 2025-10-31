import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    type: { type: String, enum: ["Full-time", "Internship"], required: true },
    location: { type: String, required: true },
  duration: { type: String },
  salaryRange: { type: String },
    companyName: { type: String },
    position: { type: String },
    overview: { type: String },
    trainingPeriod: { type: String },
  benefits: { type: String },
    skills: { type: [String], required: true },
    tags: { type: [String], default: [] },
    description: { type: String },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
