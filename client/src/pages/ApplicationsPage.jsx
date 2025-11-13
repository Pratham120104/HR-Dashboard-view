// src/pages/ApplicationsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchApplications, API_BASE } from "../services/api";

const sanitize = (s) => (s || "").toString().trim();

const ApplicationsPage = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchApplications();
      setApps(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = sanitize(search).toLowerCase();

    return apps.filter((a) => {
      const jobTitle = sanitize(a.jobTitle).toLowerCase();
      const fullName = sanitize(a.fullName).toLowerCase();
      const email = sanitize(a.email).toLowerCase();
      const comments = sanitize(a.comments).toLowerCase();

      const matchesSearch =
        !term ||
        jobTitle.includes(term) ||
        fullName.includes(term) ||
        email.includes(term) ||
        comments.includes(term);

      // Optional typeFilter based on inferred type from jobTitle / comments
      if (typeFilter === "All") return matchesSearch;

      // Example: filter internships if jobTitle contains "intern"
      const isIntern = jobTitle.includes("intern");
      if (typeFilter === "Internship") return matchesSearch && isIntern;
      if (typeFilter === "Job") return matchesSearch && !isIntern;

      return matchesSearch;
    });
  }, [apps, search, typeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#004080]">Applications</h1>
            <p className="text-gray-500">
              View and review all applications submitted for your job postings.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/jobs"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              ← Manage Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, job title, or comments"
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="All">All</option>
                <option value="Job">Jobs (non-intern)</option>
                <option value="Internship">Internships</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading applications…</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No applications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Applied On
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Job
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Applicant
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Comments
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Resume
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const createdAt = a.createdAt
                      ? new Date(a.createdAt).toLocaleString()
                      : "";
                    const jobTitle = sanitize(a.jobTitle) || "Untitled role";
                    const fullName = sanitize(a.fullName);
                    const email = sanitize(a.email);
                    const phone = sanitize(a.phone);
                    const comments = sanitize(a.comments);
                    const shortComments =
                      comments.length > 80
                        ? comments.slice(0, 80) + "…"
                        : comments;

                    // if you serve `/uploads` statically:
                    const resumeUrl = a.resumePath
                      ? `${API_BASE}/${a.resumePath.replace(/\\/g, "/")}`
                      : null;

                    return (
                      <tr
                        key={a._id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 align-top text-gray-500 whitespace-nowrap">
                          {createdAt}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-gray-900">
                            {jobTitle}
                          </div>
                          {a.jobId && (
                            <Link
                              to={`/job/${a.jobId}`}
                              className="text-xs text-blue-600 hover:underline"
                              target="_blank"
                            >
                              View job →
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-gray-900">
                            {fullName}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-gray-700 text-xs">
                          <div>{email}</div>
                          {phone && <div>{phone}</div>}
                        </td>
                        <td className="px-4 py-3 align-top text-gray-700 text-xs max-w-xs">
                          {shortComments || (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          {resumeUrl ? (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-400">No file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;
