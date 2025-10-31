// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import JobForm from "./components/JobForm";
import CareersPage from "./components/CareersPage";
import DashboardOverview from "./components/DashboardOverview";
import JobDetail from "./pages/JobDetails"; // ✅ Correct path

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
          className={`bg-[#004080] text-white p-6 flex flex-col fixed h-full shadow-lg transform transition-transform duration-200 z-40 ${
            sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
          }`}
        >
          <h1 className="text-2xl font-bold mb-8">HR Dashboard</h1>
          <nav className="space-y-4">
            <Link 
              to="/" 
              className="block py-2 px-4 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:text-white"
            >
              Overview
            </Link>
            <Link 
              to="/create-job" 
              className="block py-2 px-4 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:text-white"
            >
              Create a Job
            </Link>
            <Link 
              to="/careers" 
              className="block py-2 px-4 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:text-white"
            >
              Careers
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-8 min-h-screen transition-margin duration-200 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className={`fixed top-4 z-50 bg-white text-[#004080] p-2 rounded-md shadow-md hover:opacity-90 ${
              sidebarOpen ? "left-72" : "left-4"
            }`}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/create-job" element={<JobForm />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/job/:id" element={<JobDetail />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
