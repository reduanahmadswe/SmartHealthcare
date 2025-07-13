import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React from 'react';

const AdminDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center">
        <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="card p-8 text-center">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Administration Portal
        </h2>
        <p className="text-gray-600 mb-6">
          Manage the platform, users, and system operations.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>Features to be implemented:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>User management and verification</li>
            <li>Doctor KYC verification</li>
            <li>System analytics and reports</li>
            <li>Appointment and revenue analytics</li>
            <li>Platform settings and configuration</li>
            <li>Content and notification management</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard; 