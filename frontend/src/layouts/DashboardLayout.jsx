import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      <div className="main-content">
        <Navbar onMenuClick={handleMenuClick} />

        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;