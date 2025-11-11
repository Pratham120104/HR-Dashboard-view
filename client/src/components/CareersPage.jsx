// src/pages/CareersPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs } from "../services/api";

const CareersPage = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Full-time"); // "Full-time" | "Internship"
  const navigate = useNavigate();

  useEffect(() => {
    const loadJobs = async () => {
      const res = await fetchJobs();
      setJobs(res);
    };

    loadJobs();
    const handleJobPosted = () => loadJobs();
    window.addEventListener("jobPosted", handleJobPosted);
    return () => window.removeEventListener("jobPosted", handleJobPosted);
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (job.title || "").toLowerCase().includes(term) ||
      (job.department || "").toLowerCase().includes(term) ||
      (job.overview || "").toLowerCase().includes(term) ||
      (job.location || "").toLowerCase().includes(term);

    const matchesType =
      (job.type && job.type === selectedType) ||
      (!job.type && selectedType === "Full-time"); // sensible default

    return matchesSearch && matchesType;
  });

  return (
    <div className="text-gray-800">
      {/* Hero: edge-to-edge */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="text-center">
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
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200"
              type="button"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-light mb-8 text-blue-900">Open Positions</h2>

          {/* Type filter */}
          <div className="flex justify-center mb-8">
            <label className="flex items-center mr-6 cursor-pointer">
              <input
                type="radio"
                value="Full-time"
                checked={selectedType === "Full-time"}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mr-2 accent-blue-700"
              />
              <span className="text-blue-900 font-medium">Full-time</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="Internship"
                checked={selectedType === "Internship"}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mr-2 accent-blue-700"
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
              {filteredJobs.map((job) => {
                const title = job.title || "Untitled Role";
                const department = job.department || "Engineering";
                const overview = job.overview || "";
                const location = job.location || "Not specified";
                const level = job.duration || job.level || "Not specified"; // your form maps level -> duration
                const salary = job.salaryRange || job.stipend || "N/A";
                const duration = job.trainingPeriod || "Not specified";

                return (
                  <button
                    key={job._id}
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h3>

                    {/* Department link-style */}
                    <div className="mt-1">
                      <span className="text-blue-600 text-sm font-medium hover:underline">
                        {department}
                      </span>
                    </div>

                    {/* Overview snippet */}
                    {overview && (
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {overview}
                      </p>
                    )}

                    {/* Meta rows */}
                    <div className="mt-4 space-y-1.5 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="text-gray-600"> {location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⭐</span>
                        <span className="text-gray-600"> {level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span className="text-gray-600"> {salary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⏳</span>
                        <span className="text-gray-600"> {duration}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {/* Spotlight Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-14">Why join us?</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🌟",
                title: "Impact at scale",
                desc: "Build products that have a direct impact on users worldwide.",
              },
              {
                icon: "🚀",
                title: "Innovation first",
                desc: "Work with cutting-edge technology and push the boundaries of what's possible.",
              },
              {
                icon: "🤝",
                title: "Inclusive culture",
                desc: "Join a diverse team where everyone's voice is heard.",
              },
              {
                icon: "📈",
                title: "Growth opportunities",
                desc: "Continuous learning and development opportunities with mentorship.",
              },
              {
                icon: "⚖️",
                title: "Work-life balance",
                desc: "Flexible working arrangements and a focus on well-being.",
              },
              {
                icon: "🌍",
                title: "Global community",
                desc: "Collaborate with talented people from around the world.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 border border-gray-200 rounded-2xl text-center hover:shadow-2xl hover:-translate-y-1 transition"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;