// src/pages/ManageJobs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJobs, deleteJob } from "../services/api";
import toast from "react-hot-toast";
import axios from "axios";

let svc = null;
try {
  // optional: if you added these in services/api.js we’ll use them
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  svc = require("../services/api");
} catch (_) {}

const updateJobStatusSvc = svc?.updateJobStatus || null;
const updateJobPublishSvc = svc?.updateJobPublish || null;

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const sanitize = (s) => (s || "").toString().trim();
const isNew = (iso) => {
  if (!iso) return false;
  const created = new Date(iso).getTime();
  const now = Date.now();
  return now - created <= 7 * 24 * 60 * 60 * 1000;
};

// 🔑 Normalize id coming from API (id or _id)
const getId = (j) => j?._id || j?.id || "";

const TYPES = ["All", "Full-time", "Part-time", "Internship"];
const STATUSES = ["All", "Open", "Closed"];

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJobs();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      list.sort((a, b) => {
        const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });
      setJobs(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => sanitize(j.department)).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [jobs]);

  const filtered = useMemo(() => {
    const term = sanitize(searchTerm).toLowerCase();
    return jobs.filter((job) => {
      const title = sanitize(job.title).toLowerCase();
      const dept = sanitize(job.department).toLowerCase();
      const overview = sanitize(job.overview).toLowerCase();
      const location = sanitize(job.location).toLowerCase();
      const type = sanitize(job.type);
      const status = sanitize(job.status || "Open");

      const matchesSearch =
        !term || title.includes(term) || dept.includes(term) || overview.includes(term) || location.includes(term);
      const matchesType = typeFilter === "All" || type === typeFilter;
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesDept = deptFilter === "All" || dept === sanitize(deptFilter).toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesDept;
    });
  }, [jobs, searchTerm, typeFilter, statusFilter, deptFilter]);

  const onToggleStatus = async (job) => {
    const next = job.status === "Closed" ? "Open" : "Closed";
    const id = getId(job);
    if (!id) {
      toast.error("Invalid job id");
      return;
    }
    try {
      if (updateJobStatusSvc) {
        await updateJobStatusSvc(id, next);
      } else {
        await axios.patch(`${API_BASE}/api/jobs/${id}/status`, { status: next });
      }
      toast.success(`Status set to ${next}`);
      load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const onTogglePublished = async (job) => {
    const next = !job.published;
    const id = getId(job);
    if (!id) {
      toast.error("Invalid job id");
      return;
    }
    try {
      if (updateJobPublishSvc) {
        await updateJobPublishSvc(id, next);
      } else {
        await axios.patch(`${API_BASE}/api/jobs/${id}/status`, { status: next });
      }
      toast.success(next ? "Published" : "Unpublished");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update published state");
    }
  };

  const onDelete = async (job) => {
    const id = getId(job);
    if (!id) {
      toast.error("Invalid job id");
      return;
    }
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await deleteJob(id);
      toast.success("Job deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#004080]">Manage Jobs</h1>
            <p className="text-gray-500">Search, filter, publish, open/close, and delete postings.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/create-job"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#004080] text-white hover:bg-blue-700"
            >
              + Create Job
            </Link>
            <Link
              to="/careers"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              View Careers Page
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, department, overview, or location"
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Filter by type"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Filter by status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Filter by department"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 flex flex-col gap-6">
          {loading ? (
            <div className="col-span-full text-center text-gray-500 py-10">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">
              No jobs match your filters.
            </div>
          ) : (
            filtered.map((job) => {
              const id = getId(job);
              const title = sanitize(job.title) || "Untitled Role";
              const department = sanitize(job.department) || "General";
              const overview = sanitize(job.overview);
              const location = sanitize(job.location) || "";
              const type = sanitize(job.type) || "";
              const status = sanitize(job.status || "Open");
              const published = !!job.published;
              const salary = sanitize(job.salaryRange) || "";
              const duration = sanitize(job.duration) || "";
              const createdAt = job?.createdAt;

              return (
                <div
                  key={id}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Top row: type + NEW + status/publish */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {type && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            type === "Internship"
                              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                              : type === "Part-time"
                              ? "bg-violet-50 border-violet-200 text-violet-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                        >
                          {type}
                        </span>
                      )}
                      {isNew(createdAt) && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          status === "Closed"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                        title="Status"
                      >
                        {status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          published
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                        title="Visibility"
                      >
                        {published ? "Published" : "Unpublished"}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

                  {/* Department */}
                  <div className="mt-1 text-blue-700 text-sm font-medium">{department}</div>

                  {/* Snippet */}
                  {overview && (
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{overview}</p>
                  )}

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
                    {salary && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">💰 {salary}</span>}
                    {duration && <span className="bg-gray-100 px-2 py-0.5 rounded">⏳ {duration}</span>}
                    {location && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">📍 {location}</span>}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {createdAt ? new Date(createdAt).toLocaleString() : ""}
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to={`/job/${id}`}
                        target="_blank"
                        className="text-blue-700 hover:underline"
                        title="View public page"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => onTogglePublished(job)}
                        className="text-slate-700 hover:underline"
                        title={published ? "Unpublish" : "Publish"}
                      >
                        {published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => onToggleStatus(job)}
                        className="text-emerald-700 hover:underline"
                        title={status === "Open" ? "Close this job" : "Reopen this job"}
                      >
                        {status === "Open" ? "Close" : "Reopen"}
                      </button>
                      <button
                        onClick={() => onDelete(job)}
                        className="text-red-600 hover:underline"
                        title="Delete job"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageJobs;
