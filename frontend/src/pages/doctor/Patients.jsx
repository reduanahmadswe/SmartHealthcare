import React, { useEffect, useState } from "react";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import { doctorService } from "../../services/doctorService";

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await doctorService.getDoctorPatients(user._id);
        setPatients(res.data.patients || []);
      } catch (err) {
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchPatients();
  }, [user]);

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
        {loading ? (
          <div className="text-center py-8">Loading patients...</div>
        ) : error ? (
          <div className="text-center text-danger-500 py-8">{error}</div>
        ) : patients.length === 0 ? (
          <Card>
            <Card.Content>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No patients found.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <Card key={patient._id}>
                <Card.Header>
                  <Card.Title>
                    {patient.firstName} {patient.lastName}
                  </Card.Title>
                  <Card.Description>{patient.email}</Card.Description>
                </Card.Header>
                <Card.Content>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div>Phone: {patient.phone}</div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Patients;
