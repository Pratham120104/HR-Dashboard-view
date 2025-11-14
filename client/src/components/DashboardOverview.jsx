// src/components/DashboardOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs, fetchApplications } from "../services/api"; // ⬅️ UPDATED
import { Briefcase, Building2, Users, FileText, Plus, Eye, Settings2 } from "lucide-react";

const sanitize = (s) => (s || "").toString().trim();
const asArray = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / (60 * 1000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
};

const ProgressBar = ({ value, label }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-500">{value}%</span>
    </div>
    <div className="h-2 rounded bg-gray-100 overflow-hidden">
      <div
        className="h-2 bg-[#004080]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const Pill = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
};

const DashboardOverview = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    openPositions: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // ⬅️ UPDATED: fetch jobs + applications together
      const [jobsRes, appsRes] = await Promise.all([
        fetchJobs(),
        fetchApplications(),
      ]);

      const list = asArray(jobsRes);
      const applications = asArray(appsRes); // should already be an array

      // total companies (companyName fallback to department)
      const companies = new Set(
        list.map(
          (j) => sanitize(j.companyName) || sanitize(j.department)
        )
      );

      // open positions (default to open if status missing)
      const openPositions = list.filter(
        (j) => sanitize(j.status).toLowerCase() !== "closed"
      ).length;

      // ⬅️ UPDATED: total applications = number of application documents
      const totalApplications = applications.length;

      setJobs(
        [...list].sort((a, b) => {
          const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bt - at;
        })
      );

      setStats({
        totalCompanies: companies.size,
        totalJobs: list.length,
        totalApplications,
        openPositions,
      });
    };

    load();
  }, []);

  const byType = useMemo(() => {
    const out = { "Full-time": 0, "Part-time": 0, Internship: 0, Other: 0 };
    jobs.forEach((j) => {
      const t = sanitize(j.type);
      if (t === "Full-time") out["Full-time"]++;
      else if (t === "Part-time") out["Part-time"]++;
      else if (t === "Internship") out["Internship"]++;
      else out["Other"]++;
    });
    return out;
  }, [jobs]);

  const deptDist = useMemo(() => {
    const buckets = {};
    jobs.forEach((j) => {
      const d = sanitize(j.department) || "General";
      buckets[d] = (buckets[d] || 0) + 1;
    });
    const total = jobs.length || 1;
    const rows = Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, count]) => ({
        dept,
        count,
        pct: Math.round((count / total) * 100),
      }));
    return { rows, total };
  }, [jobs]);

  const openClosedPct = useMemo(() => {
    if (!jobs.length) return { open: 0, closed: 0 };
    const open = jobs.filter(
      (j) => sanitize(j.status).toLowerCase() !== "closed"
    ).length;
    const closed = jobs.length - open;
    const openPct = Math.round((open / jobs.length) * 100);
    const closedPct = 100 - openPct;
    return { open: openPct, closed: closedPct };
  }, [jobs]);

  const recent = useMemo(() => jobs.slice(0, 6), [jobs]);

  const cards = [
    {
      title: "Total Active Companies",
      value: stats.totalCompanies,
      icon: <Building2 size={28} />,
    },
    {
      title: "Total Jobs Posted",
      value: stats.totalJobs,
      icon: <Briefcase size={28} />,
    },
    {
      title: "Applications Received", // ⬅️ uses applications collection
      value: stats.totalApplications,
      icon: <FileText size={28} />,
    },
    {
      title: "Open Positions",
      value: stats.openPositions,
      icon: <Users size={28} />,
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800 flex justify-center">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#004080]">
              Welcome to HR Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Snapshot of hiring activity across companies, departments, and job
              types.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/create-job")}
              className="inline-flex items-center gap-2 bg-[#004080] text-white px-4 py-2 rounded-lg shadow hover:bg-blue-800"
            >
              <Plus size={18} /> Post a Job
            </button>
            <button
              onClick={() => navigate("/careers")}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <Eye size={18} /> View Careers
            </button>
            <button
              onClick={() => navigate("/admin/jobs")}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <Settings2 size={18} /> Manage Jobs
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 flex items-center gap-4 hover:shadow-lg transition"
            >
              <div className="bg-[#004080] text-white p-3 rounded-xl">
                {card.icon}
              </div>
              <div>
                <h3 className="text-sm text-gray-600">{card.title}</h3>
                <p className="text-2xl font-semibold text-black">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row: Jobs by Type + Open vs Closed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Jobs by Type</h3>
            <div className="flex flex-wrap gap-3">
              <Pill tone="blue">Full-time: {byType["Full-time"]}</Pill>
              <Pill tone="amber">Part-time: {byType["Part-time"]}</Pill>
              <Pill tone="green">Internship: {byType["Internship"]}</Pill>
              {byType["Other"] > 0 && (
                <Pill tone="purple">Other: {byType["Other"]}</Pill>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Total: <span className="font-medium">{stats.totalJobs}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Open vs Closed</h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Open</span>
                <span className="text-gray-500">
                  {openClosedPct.open}%
                </span>
              </div>
              <div className="h-2 rounded bg-gray-100 overflow-hidden">
                <div
                  className="h-2 bg-green-600"
                  style={{ width: `${openClosedPct.open}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-700">Closed</span>
              <span className="text-gray-500">
                {openClosedPct.closed}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Department Distribution + Recent Postings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">
              Departments Distribution
            </h3>
            {deptDist.rows.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet.</p>
            ) : (
              <>
                {deptDist.rows.slice(0, 8).map((row) => (
                  <ProgressBar
                    key={row.dept}
                    value={row.pct}
                    label={`${row.dept} • ${row.count}`}
                  />
                ))}
                {deptDist.rows.length > 8 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{deptDist.rows.length - 8} more departments
                  </p>
                )}
              </>
            )}
          </div>

          {/* Recent Postings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Postings</h3>
            {recent.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent jobs.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((j) => {
                  const id = j?._id || j?.id;
                  const title = sanitize(j?.title) || "Untitled";
                  const dept = sanitize(j?.department) || "General";
                  const type = sanitize(j?.type) || "Full-time";
                  const created = j?.createdAt;

                  return (
                    <li
                      key={id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/job/${id}`)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dept} • {timeAgo(created)}
                        </div>
                      </div>
                      <Pill
                        tone={
                          type === "Internship"
                            ? "green"
                            : type === "Part-time"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {type}
                      </Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
