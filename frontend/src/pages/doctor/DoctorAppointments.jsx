import React, { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import { appointmentService } from "../../services/appointmentService";

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await appointmentService.getAppointments();
      setAppointments(res.data.appointments || []);
    } catch (err) {
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  const handleStatusChange = async (id, status) => {
    setActionLoading(id + status);
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert("Failed to update appointment status");
    } finally {
      setActionLoading("");
    }
  };

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
        {loading ? (
          <div className="text-center py-8">Loading appointments...</div>
        ) : error ? (
          <div className="text-center text-danger-500 py-8">{error}</div>
        ) : appointments.length === 0 ? (
          <Card>
            <Card.Content>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No appointments found.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => (
              <Card key={appt._id}>
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <div>
                      <Card.Title>
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </Card.Title>
                      <Card.Description>
                        {appt.appointmentDate} at {appt.appointmentTime}
                      </Card.Description>
                    </div>
                    <span className="badge badge-outline capitalize">
                      {appt.status}
                    </span>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div>Type: {appt.appointmentType}</div>
                    <div>Mode: {appt.appointmentMode}</div>
                    <div>Fee: {appt.consultationFee}</div>
                    {appt.symptoms && appt.symptoms.length > 0 && (
                      <div>Symptoms: {appt.symptoms.join(", ")}</div>
                    )}
                  </div>
                </Card.Content>
                <Card.Footer>
                  {appt.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(appt._id, "confirmed")}
                      loading={actionLoading === appt._id + "confirmed"}
                    >
                      Confirm
                    </Button>
                  )}
                  {appt.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleStatusChange(appt._id, "in_progress")
                      }
                      loading={actionLoading === appt._id + "in_progress"}
                    >
                      Start
                    </Button>
                  )}
                  {appt.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(appt._id, "completed")}
                      loading={actionLoading === appt._id + "completed"}
                    >
                      Complete
                    </Button>
                  )}
                  {appt.status !== "completed" &&
                    appt.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleStatusChange(appt._id, "cancelled")
                        }
                        loading={actionLoading === appt._id + "cancelled"}
                        className="ml-2"
                      >
                        Cancel
                      </Button>
                    )}
                </Card.Footer>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
