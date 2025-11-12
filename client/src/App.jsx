// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SidebarLayout from "./layouts/SidebarLayout"; // ⬅️ layout that owns the sidebar

import JobForm from "./components/JobForm";
import CareersPage from "./components/CareersPage";
import DashboardOverview from "./components/DashboardOverview";
import JobDetail from "./pages/JobDetails";
import ManageJobs from "./pages/ManageJobs";
import NewCareer from "./pages/NewCareer";

const App = () => {
  return (
    <Routes>
      {/* All HR/Jobs pages that need the sidebar go under this layout */}
      <Route element={<SidebarLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/create-job" element={<JobForm />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/manage" element={<ManageJobs />} />
        <Route path="/newcareer" element={<NewCareer />} />
      </Route>

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
