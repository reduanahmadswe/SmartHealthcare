import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/Card';

const DoctorChat = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Patient Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with your patients
          </p>
        </div>
        
        <Card>
          <Card.Content>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Doctor-patient chat functionality will be implemented here.
            </p>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorChat; 