import React, { useState } from "react";
import {
  IoMenuOutline,
  IoMoonOutline,
  IoNotificationsOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoSunnyOutline,
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="navbar">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
          >
            <IoMenuOutline className="h-6 w-6" />
          </button>

          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <IoSunnyOutline className="h-5 w-5" />
            ) : (
              <IoMoonOutline className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              aria-label="Notifications"
            >
              <IoNotificationsOutline className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No new notifications
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>

            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <IoPersonOutline className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
