import { ChartBarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React from 'react';

const HealthData = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center">
        <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Health Data</h1>
      </div>
      
      <div className="card p-8 text-center">
        <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Health Monitoring
        </h2>
        <p className="text-gray-600 mb-6">
          Track your vital signs and health metrics over time.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>Features to be implemented:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Vital signs tracking (BP, HR, temperature, etc.)</li>
            <li>Health data entry forms</li>
            <li>Interactive charts and graphs</li>
            <li>Trend analysis and insights</li>
            <li>Health goal setting</li>
            <li>Data export and sharing</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthData; 