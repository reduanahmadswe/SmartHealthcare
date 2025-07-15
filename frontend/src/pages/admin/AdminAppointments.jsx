import React, { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import DashboardLayout from "../../layouts/DashboardLayout";
import { adminService } from "../../services/adminService";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    doctor: "",
    patient: "",
    date: "",
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getAppointments(filters);
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
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleView = (appt) => {
    setSelectedAppointment(appt);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            All Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all appointments
          </p>
        </div>
        <Card>
          <Card.Content>
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                name="doctor"
                placeholder="Doctor ID"
                value={filters.doctor}
                onChange={handleFilterChange}
                className="input input-bordered"
              />
              <input
                type="text"
                name="patient"
                placeholder="Patient ID"
                value={filters.patient}
                onChange={handleFilterChange}
                className="input input-bordered"
              />
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input input-bordered"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="input input-bordered"
              />
              <Button onClick={fetchAppointments}>Filter</Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading appointments...</div>
            ) : error ? (
              <div className="text-center text-danger-500 py-8">{error}</div>
            ) : appointments.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No appointments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id}>
                        <td>
                          {appt.patient?.firstName} {appt.patient?.lastName}
                        </td>
                        <td>
                          {appt.doctor?.firstName} {appt.doctor?.lastName}
                        </td>
                        <td>{appt.appointmentDate}</td>
                        <td>{appt.appointmentTime}</td>
                        <td>{appt.status}</td>
                        <td>
                          <Button
                            size="sm"
                            className="mr-2"
                            onClick={() => handleView(appt)}
                          >
                            View
                          </Button>
                          <Button size="sm" className="mr-2">
                            Update
                          </Button>
                          <Button size="sm" variant="danger">
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Appointment Details Modal */}
            <Modal
              isOpen={showModal}
              onClose={closeModal}
              title="Appointment Details"
            >
              {selectedAppointment && (
                <div className="space-y-2">
                  <div>
                    <strong>Patient:</strong>{" "}
                    {selectedAppointment.patient?.firstName}{" "}
                    {selectedAppointment.patient?.lastName}
                  </div>
                  <div>
                    <strong>Doctor:</strong>{" "}
                    {selectedAppointment.doctor?.firstName}{" "}
                    {selectedAppointment.doctor?.lastName}
                  </div>
                  <div>
                    <strong>Date:</strong> {selectedAppointment.appointmentDate}
                  </div>
                  <div>
                    <strong>Time:</strong> {selectedAppointment.appointmentTime}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedAppointment.status}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedAppointment.appointmentType}
                  </div>
                  <div>
                    <strong>Mode:</strong> {selectedAppointment.appointmentMode}
                  </div>
                  <div>
                    <strong>Fee:</strong> {selectedAppointment.consultationFee}
                  </div>
                  {selectedAppointment.symptoms &&
                    selectedAppointment.symptoms.length > 0 && (
                      <div>
                        <strong>Symptoms:</strong>{" "}
                        {selectedAppointment.symptoms.join(", ")}
                      </div>
                    )}
                  {selectedAppointment.patientNotes && (
                    <div>
                      <strong>Patient Notes:</strong>{" "}
                      {selectedAppointment.patientNotes}
                    </div>
                  )}
                  {selectedAppointment.doctorNotes && (
                    <div>
                      <strong>Doctor Notes:</strong>{" "}
                      {selectedAppointment.doctorNotes}
                    </div>
                  )}
                  {selectedAppointment.cancellationReason && (
                    <div>
                      <strong>Cancellation Reason:</strong>{" "}
                      {selectedAppointment.cancellationReason}
                    </div>
                  )}
                </div>
              )}
            </Modal>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAppointments;
