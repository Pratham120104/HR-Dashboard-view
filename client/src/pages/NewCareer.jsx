// src/pages/CareersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs } from "../services/api";

const sanitize = (s) => (s || "").toString().trim();
const isNew = (iso) => {
  if (!iso) return false;
  const created = new Date(iso).getTime();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return now - created <= sevenDays;
};

const TYPE_ALL = "All";
const TYPE_FULL = "Full-time";
const TYPE_PART = "Part-time";
const TYPE_INTERN = "Internship";

const NewCareer = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Default to All so users see everything on first load
  const [selectedType, setSelectedType] = useState(TYPE_ALL);
  const navigate = useNavigate();

  const loadJobs = async () => {
    const res = await fetchJobs();
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    list.sort((a, b) => {
      const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bt !== at) return bt - at;
      return sanitize(a?.title).localeCompare(sanitize(b?.title));
    });
    setJobs(list);
  };

  useEffect(() => {
    loadJobs();
    const handleJobPosted = () => loadJobs();
    window.addEventListener("jobPosted", handleJobPosted);
    return () => window.removeEventListener("jobPosted", handleJobPosted);
  }, []);

  // Type counts for pills
  const typeCounts = useMemo(() => {
    const counts = { [TYPE_ALL]: 0, [TYPE_FULL]: 0, [TYPE_PART]: 0, [TYPE_INTERN]: 0 };
    jobs.forEach((j) => {
      const t = sanitize(j?.type) || TYPE_FULL; // sensible default if missing
      counts[TYPE_ALL] += 1;
      if (t === TYPE_FULL) counts[TYPE_FULL] += 1;
      else if (t === TYPE_PART) counts[TYPE_PART] += 1;
      else if (t === TYPE_INTERN) counts[TYPE_INTERN] += 1;
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const term = sanitize(searchTerm).toLowerCase();
    return jobs.filter((job) => {
      const title = sanitize(job?.title).toLowerCase();
      const dept = sanitize(job?.department).toLowerCase();
      const overview = sanitize(job?.overview).toLowerCase();
      const location = sanitize(job?.location).toLowerCase();

      const matchesSearch =
        !term || title.includes(term) || dept.includes(term) || overview.includes(term) || location.includes(term);

      const type = sanitize(job?.type) || TYPE_FULL;
      const matchesType = selectedType === TYPE_ALL ? true : type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [jobs, searchTerm, selectedType]);

  const typeBadgeClass = (type) => {
    if (type === TYPE_INTERN) return "bg-yellow-50 border-yellow-200 text-yellow-700";
    if (type === TYPE_PART) return "bg-violet-50 border-violet-200 text-violet-700";
    return "bg-blue-50 border-blue-200 text-blue-700"; // Full-time (default)
  };

  // Segmented pill button (accessible)
  const Pill = ({ value, active, count, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition
        ${active ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"}
      `}
    >
      <span>{value}</span>
      <span className={`ml-2 text-xs ${active ? "text-blue-50" : "text-blue-700/70"}`}>{count}</span>
    </button>
  );

  return (
    <div className="text-gray-800">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-4 text-blue-50">Build for everyone</h1>
          <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-10">
            Join our mission to skill the next generation of E&amp;E talent. Find your
            next role and help us build products that matter.
          </p>

          <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg max-w-xl mx-auto overflow-hidden border border-blue-100/20">
            <input
              type="text"
              placeholder="Search jobs, keywords, or departments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 text-blue-900 outline-none bg-transparent"
              aria-label="Search jobs"
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-3xl font-light text-blue-900">Open Positions</h2>

            {/* Segmented Pills */}
            <div
              role="tablist"
              aria-label="Filter by job type"
              className="flex flex-wrap gap-2 bg-white border border-blue-100 rounded-full p-1 shadow-sm"
            >
              <Pill
                value={TYPE_ALL}
                count={typeCounts[TYPE_ALL]}
                active={selectedType === TYPE_ALL}
                onClick={() => setSelectedType(TYPE_ALL)}
              />
              <Pill
                value={TYPE_FULL}
                count={typeCounts[TYPE_FULL]}
                active={selectedType === TYPE_FULL}
                onClick={() => setSelectedType(TYPE_FULL)}
              />
              <Pill
                value={TYPE_PART}
                count={typeCounts[TYPE_PART]}
                active={selectedType === TYPE_PART}
                onClick={() => setSelectedType(TYPE_PART)}
              />
              <Pill
                value={TYPE_INTERN}
                count={typeCounts[TYPE_INTERN]}
                active={selectedType === TYPE_INTERN}
                onClick={() => setSelectedType(TYPE_INTERN)}
              />
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="text-center text-blue-600/70 py-10">No open positions yet. Post one from the HR Dashboard!</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => {
                const id = job?._id || job?.id;
                const title = sanitize(job?.title) || "Untitled Role";
                const department = sanitize(job?.department) || "General";
                const overview = sanitize(job?.overview);
                const location = sanitize(job?.location) || "Not specified";
                const type = sanitize(job?.type) || TYPE_FULL;
                const duration = sanitize(job?.duration) || ""; // level mapped to duration (for Full-time)
                const experience = sanitize(job?.experience) || "";
                const salary = sanitize(job?.salaryRange) || ""; // includes stipend or salary
                const createdAt = job?.createdAt;

                const tagList =
                  Array.isArray(job?.tags) && job.tags.length
                    ? job.tags
                    : Array.isArray(job?.skills) && job.skills.length
                    ? job.skills
                    : [];
                const topTags = tagList.slice(0, 4);

                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/job/${id}`)}
                    className="group text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={`Open job: ${title}`}
                  >
                    {/* Header row: type pill + NEW badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${typeBadgeClass(type)}`}>
                        {type}
                      </span>
                      {isNew(createdAt) && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

                    {/* Department link-style */}
                    <div className="mt-1">
                      <span className="text-blue-600 text-sm font-medium hover:underline">{department}</span>
                    </div>

                    {/* Overview snippet */}
                    {overview && (
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{overview}</p>
                    )}

                    {/* Meta badges */}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
                      {salary && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">💰 {salary}</span>}
                      {type === TYPE_FULL && duration && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">⏳ {duration}</span>
                      )}
                      {experience && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">🎯 {experience}</span>
                      )}
                      {location && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">📍 {location}</span>
                      )}
                    </div>

                    {/* Tags row */}
                    {topTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topTags.map((t, i) => (
                          <span key={`${t}-${i}`} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {t}
                          </span>
                        ))}
                        {tagList.length > 4 && (
                          <span className="text-xs text-gray-500">+{tagList.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* Footer: createdAt timestamp (muted) */}
                    <div className="mt-3 text-xs text-gray-400">
                      {createdAt ? new Date(createdAt).toLocaleString() : ""}
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
              { icon: "🌟", title: "Impact at scale", desc: "Build products that have a direct impact on users worldwide." },
              { icon: "🚀", title: "Innovation first", desc: "Work with cutting-edge technology and push the boundaries of what's possible." },
              { icon: "🤝", title: "Inclusive culture", desc: "Join a diverse team where everyone's voice is heard." },
              { icon: "📈", title: "Growth opportunities", desc: "Continuous learning and development opportunities with mentorship." },
              { icon: "⚖️", title: "Work-life balance", desc: "Flexible working arrangements and a focus on well-being." },
              { icon: "🌍", title: "Global community", desc: "Collaborate with talented people from around the world." },
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

export default NewCareer;
