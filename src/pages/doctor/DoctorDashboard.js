import { UserGroupIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React from 'react';

const DoctorDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center">
        <UserGroupIcon className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
      </div>
      
      <div className="card p-8 text-center">
        <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Doctor Portal
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your patients, appointments, and medical practice.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>Features to be implemented:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Patient management and records</li>
            <li>Appointment scheduling and management</li>
            <li>Prescription creation and management</li>
            <li>Real-time chat with patients</li>
            <li>Medical reports and analytics</li>
            <li>Availability and schedule management</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorDashboard; 