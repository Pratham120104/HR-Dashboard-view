import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { name: "Overview", path: "/" },
  { name: "Create Job", path: "/create-job" },
  { name: "Careers", path: "/careers" },
  { name: "Manage Jobs", path: "/manage" },
];

const Sidebar = ({ open, onToggle }) => {
  return (
    <>
      {/* Toggle button (lives with the sidebar; not in App.jsx) */}
      <button
        onClick={onToggle}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
        className={`fixed top-4 z-50 bg-white text-[#004080] p-2 rounded-md shadow-md hover:opacity-90 ${
          open ? "left-72" : "left-4"
        }`}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-[#004080] text-white p-6 flex flex-col fixed h-full shadow-lg transform transition-transform duration-200 z-40 ${
          open ? "translate-x-0 w-64" : "-translate-x-full w-64"
        }`}
      >
        <h1 className="text-2xl font-bold mb-8">HR Dashboard</h1>
        <nav className="space-y-4">
          {links.map((l) => (
            <NavLink
              key={l.path}
              to={l.path}
              end={l.path === "/"}
              className={({ isActive }) =>
                `block py-2 px-4 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white text-[#004080] font-semibold"
                    : "hover:bg-blue-700 hover:text-white"
                }`
              }
            >
              {l.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
