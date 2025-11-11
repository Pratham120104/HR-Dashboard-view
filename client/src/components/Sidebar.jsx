import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const links = [
    { name: "Overview", path: "/" },
    { name: "Create Job", path: "/create-job" },
    { name: "Careers", path: "/careers" },
    { name: "Manage Jobs", path: "/admin/jobs" },
  ];

  return (
    <div className="w-64 bg-[#004080] text-white flex flex-col p-6 space-y-4">
      <h1 className="text-3xl font-semibold mb-8">HR Dashboard</h1>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`p-2 rounded-md text-lg transition ${
            location.pathname === link.path
              ? "bg-white text-[#004080] font-semibold"
              : "hover:bg-gray-200 hover:text-[#004080]"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;