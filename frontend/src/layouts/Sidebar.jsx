import React from "react";
import {
  IoAnalyticsOutline,
  IoCalendarOutline,
  IoCardOutline,
  IoChatbubbleOutline,
  IoClipboardOutline,
  IoDocumentTextOutline,
  IoFileTrayOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoLogOutOutline,
  IoMedicalOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { name: "Dashboard", path: "/dashboard/admin", icon: IoHomeOutline },
        { name: "Analytics", path: "/analytics", icon: IoAnalyticsOutline },
        { name: "Doctor KYC", path: "/doctor-kyc", icon: IoPeopleOutline },
        { name: "Inventory", path: "/inventory", icon: IoFileTrayOutline },
        { name: "Activity Logs", path: "/logs", icon: IoClipboardOutline },
        { name: "Settings", path: "/admin/settings", icon: IoSettingsOutline },
      ];
    } else if (user?.role === "doctor") {
      return [
        { name: "Dashboard", path: "/dashboard/doctor", icon: IoHomeOutline },
        {
          name: "Appointments",
          path: "/doctor/appointments",
          icon: IoCalendarOutline,
        },
        { name: "Patients", path: "/patients", icon: IoPeopleOutline },
        {
          name: "Prescriptions",
          path: "/doctor/prescriptions",
          icon: IoDocumentTextOutline,
        },
        { name: "Chat", path: "/doctor/chat", icon: IoChatbubbleOutline },
        { name: "Reports", path: "/doctor/reports", icon: IoFileTrayOutline },
        { name: "Settings", path: "/doctor/settings", icon: IoSettingsOutline },
      ];
    } else {
      return [
        { name: "Dashboard", path: "/dashboard/patient", icon: IoHomeOutline },
        {
          name: "Book Appointment",
          path: "/book-appointment",
          icon: IoCalendarOutline,
        },
        {
          name: "Appointments",
          path: "/appointments",
          icon: IoCalendarOutline,
        },
        { name: "Health Data", path: "/health-data", icon: IoHeartOutline },
        {
          name: "Prescriptions",
          path: "/prescriptions",
          icon: IoDocumentTextOutline,
        },
        { name: "Medical Reports", path: "/reports", icon: IoFileTrayOutline },
        { name: "Chat", path: "/chat", icon: IoChatbubbleOutline },
        { name: "Lab Tests", path: "/lab-tests", icon: IoMedicalOutline },
        { name: "Payments", path: "/payments", icon: IoCardOutline },
        { name: "Profile", path: "/profile", icon: IoPersonOutline },
      ];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center space-x-2">
              <IoMedicalOutline className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Smart Health
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) {
                      onClose();
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <IoPersonOutline className="h-4 w-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 transition-colors"
            >
              <IoLogOutOutline className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
