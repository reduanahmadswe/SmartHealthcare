import React from "react";
import Card from "../../components/Card";
import DashboardLayout from "../../layouts/DashboardLayout";
import PrescriptionForm from "./PrescriptionForm";

const DoctorPrescriptions = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prescriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Write and manage prescriptions for your patients
          </p>
        </div>

        <Card>
          <Card.Content>
            <PrescriptionForm />
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
