import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // make sure path matches where Sidebar.jsx is stored

const SidebarLayout = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar + Toggle included here */}
      <Sidebar open={open} onToggle={() => setOpen((v) => !v)} />

      {/* Main content area shifts when sidebar toggles */}
      <main
        className={`flex-1 p-8 min-h-screen transition-[margin] duration-200 ${
          open ? "ml-64" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
