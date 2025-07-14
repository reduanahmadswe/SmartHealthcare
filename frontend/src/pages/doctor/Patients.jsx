import React from "react";
import Card from "../../components/Card";
import DashboardLayout from "../../layouts/DashboardLayout";

const Patients = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Patients
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your patients
          </p>
        </div>

        <Card>
          <Card.Content>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Patient management functionality will be implemented here.
            </p>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Patients;
