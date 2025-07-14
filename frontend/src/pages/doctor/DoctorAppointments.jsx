import React from "react";
import Card from "../../components/Card";
import DashboardLayout from "../../layouts/DashboardLayout";

const DoctorAppointments = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your patient appointments
          </p>
        </div>

        <Card>
          <Card.Content>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Doctor appointments management will be implemented here.
            </p>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
