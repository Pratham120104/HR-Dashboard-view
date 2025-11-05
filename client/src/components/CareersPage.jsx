import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs } from "../services/api";

const CareersPage = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Full-time"); // New state for job type filter
  const navigate = useNavigate();

  useEffect(() => {
  const loadJobs = async () => {
    const res = await fetchJobs();
    setJobs(res);
  };

  loadJobs();

  // 👇 Auto-refresh when a new job is posted
  const handleJobPosted = () => loadJobs();
  window.addEventListener("jobPosted", handleJobPosted);

  return () => window.removeEventListener("jobPosted", handleJobPosted);
}, []);


  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (job.title || "").toLowerCase().includes(term) ||
      (job.department || "").toLowerCase().includes(term) ||
      (job.role || "").toLowerCase().includes(term);
    const matchesType = job.type === selectedType; // New: Filter by selected type
    return matchesSearch && matchesType;
  });

  return (
    <div className="text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-4 text-blue-50">
            Build for everyone
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-10">
            Join us in our mission to create technology that helps billions of
            people. Find your next role and help us build products that matter.
          </p>

          <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg max-w-xl mx-auto overflow-hidden border border-blue-100/20">
            <input
              type="text"
              placeholder="Search jobs, keywords, or departments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 text-blue-900 outline-none bg-transparent"
            />
            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-light mb-8 text-blue-900">
            Open Positions
          </h2>

          {/* New: Radio buttons for job type filter */}
          <div className="flex justify-center mb-6">
            <label className="flex items-center mr-6">
              <input
                type="radio"
                value="Full-time"
                checked={selectedType === "Full-time"}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mr-2"
              />
              <span className="text-blue-900 font-medium">Full-time</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Internship"
                checked={selectedType === "Internship"}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mr-2"
              />
              <span className="text-blue-900 font-medium">Internship</span>
            </label>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="text-center text-blue-600/70 py-10">
              No open positions yet. Post one from the HR Dashboard!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate(`/job/${job._id}`)}
                  className="bg-white border border-blue-100 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
                >
                  {/* Job Title */}
                  <h3 className="text-lg font-medium mb-2 text-blue-900">
                    {job.title || "Untitled Role"}
                  </h3>

                  {/* Department */}
                  <p className="text-blue-700 text-sm mb-2">
                    {" "}
                    <span className="font-medium">
                      {job.department || "N/A"}
                    </span>
                  </p>

                  {/* Role Type */}
                  <p className="text-blue-700 text-sm mb-2">
                    {" "}
                    <span className="font-medium">
                      {job.type || job.role || "N/A"}
                    </span>
                  </p>

                  {/* Location */}
                  <p className="text-blue-700 text-sm mb-2">
                    📍 Location:{" "}
                    <span className="font-medium">
                      {job.location || "Not specified"}
                    </span>
                  </p>

                  {/* Level */}
                  <p className="text-blue-700 text-sm mb-2">
                    🧭 Level:{" "}
                    <span className="font-medium">
                      {job.level || "Not specified"}
                    </span>
                  </p>

                  {/* Stipend / Salary */}
                  <p className="text-blue-700 text-sm">
                    💰 Stipend:{" "}
                    <span className="font-medium">
                      {job.stipend || job.salaryRange || "N/A"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
