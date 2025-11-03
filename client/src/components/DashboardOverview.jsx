// src/components/DashboardOverview.jsx
import React, { useEffect, useState } from "react";
import { fetchJobs } from "../services/api";
import { Briefcase, Building2, Users, FileText } from "lucide-react";

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    openPositions: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const jobs = await fetchJobs();

  const companies = new Set(jobs.map((job) => job.companyName || job.department));
      const openPositions = jobs.filter((job) => job.status !== "Closed").length;
      const totalApplications = jobs.reduce(
        (acc, job) => acc + (job.applications || 0),
        0
      );

      setStats({
        totalCompanies: companies.size,
        totalJobs: jobs.length,
        totalApplications,
        openPositions,
      });
    };

    loadStats();
  }, []);

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
      title: "Applications Received",
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
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <div className="text-left mb-12">
        <h1 className="text-5xl font-bold text-[#004080] mb-4">
          Welcome to HR Dashboard,
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-2xl font-semibold text-black">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
