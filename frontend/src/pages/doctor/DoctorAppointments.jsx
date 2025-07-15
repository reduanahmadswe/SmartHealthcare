import React, { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import { appointmentService } from "../../services/appointmentService";
import { medicalRecordsService } from "../../services/medicalRecordsService";
import { prescriptionService } from "../../services/prescriptionService";
import PrescriptionForm from "./PrescriptionForm";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const sortOptions = [
  { value: "asc", label: "Earliest First" },
  { value: "desc", label: "Latest First" },
];

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [notesForm, setNotesForm] = useState({
    diagnosis: "",
    treatment: "",
    followUp: "",
    signature: "",
  });
  const [notesSubmitting, setNotesSubmitting] = useState(false);
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [todayReminders, setTodayReminders] = useState([]);

  // Only allow doctors
  useEffect(() => {
    if (user && user.role !== "doctor") {
      window.location.href = "/";
    }
  }, [user]);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        doctor: user?._id,
        status: statusFilter,
        sort: sortOrder,
      };
      const res = await appointmentService.getAppointments(filters);
      setAppointments(res.data.appointments || []);
      // Today's reminders
      const today = new Date().toISOString().split("T")[0];
      setTodayReminders(
        (res.data.appointments || []).filter(
          (appt) =>
            appt.appointmentDate &&
            appt.appointmentDate.split("T")[0] === today &&
            ["pending", "confirmed", "in_progress"].includes(appt.status)
        )
      );
    } catch (err) {
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "doctor") fetchAppointments();
    // eslint-disable-next-line
  }, [user, statusFilter, sortOrder]);

  // Status change handler
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

  // Open notes modal
  const openNotesModal = (appt) => {
    setSelectedAppointment(appt);
    setNotesForm({
      diagnosis: appt.diagnosis || "",
      treatment: appt.treatment || "",
      followUp: appt.followUpNotes || "",
      signature: "",
    });
    setShowNotesModal(true);
  };

  // Submit notes
  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    setNotesSubmitting(true);
    try {
      await appointmentService.addAppointmentNotes(
        selectedAppointment._id,
        notesForm
      );
      setShowNotesModal(false);
      fetchAppointments();
    } catch (err) {
      alert("Failed to save notes");
    } finally {
      setNotesSubmitting(false);
    }
  };

  // Open prescription modal
  const openPrescriptionModal = (appt) => {
    setSelectedAppointment(appt);
    setShowPrescriptionModal(true);
  };

  // Submit prescription (placeholder)
  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setPrescriptionSubmitting(true);
    // TODO: Implement prescription form fields
    alert("Prescription form not yet implemented.");
    setPrescriptionSubmitting(false);
    setShowPrescriptionModal(false);
  };

  // Open patient history modal
  const openPatientHistoryModal = async (patient) => {
    setHistoryLoading(true);
    setShowPatientHistoryModal(true);
    try {
      const [appts, prescriptions, records] = await Promise.all([
        appointmentService.getAppointments({ patient: patient._id }),
        prescriptionService.getPrescriptionsByPatient(patient._id),
        medicalRecordsService.getMedicalRecordsByPatient(patient._id),
      ]);
      setPatientHistory({
        appointments: appts.data.appointments || [],
        prescriptions: prescriptions.data.prescriptions || [],
        records: records.data.medicalRecords || [],
        patient,
      });
    } catch (err) {
      setPatientHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format date/time
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatTime = (time) => time;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Reminders for today */}
        {todayReminders.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
            <Card.Header>
              <Card.Title>Today's Appointments</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-wrap gap-2">
                {todayReminders.map((appt) => (
                  <Badge
                    key={appt._id}
                    variant="primary"
                    className="capitalize"
                  >
                    {appt.patient?.firstName} {appt.patient?.lastName} -{" "}
                    {formatTime(appt.appointmentTime)} ({appt.status})
                  </Badge>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label>Status: </label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Sort: </label>
            <select
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appointments Table */}
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Patient</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Remarks</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 dark:text-blue-300 underline hover:font-semibold"
                        onClick={() => openPatientHistoryModal(appt.patient)}
                      >
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(appt.appointmentDate)}
                    </td>
                    <td className="px-4 py-2">
                      {formatTime(appt.appointmentTime)}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {appt.appointmentType}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="capitalize">
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 max-w-xs whitespace-pre-line">
                      {appt.diagnosis ||
                      appt.treatment ||
                      appt.followUpNotes ||
                      appt.doctorNotes ? (
                        <>
                          {appt.diagnosis && (
                            <div>
                              <b>Dx:</b> {appt.diagnosis}
                            </div>
                          )}
                          {appt.treatment && (
                            <div>
                              <b>Rx:</b> {appt.treatment}
                            </div>
                          )}
                          {appt.followUpNotes && (
                            <div>
                              <b>Follow-up:</b> {appt.followUpNotes}
                            </div>
                          )}
                          {appt.doctorNotes && (
                            <div>
                              <b>Signature:</b> {appt.doctorNotes}
                            </div>
                          )}
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {appt.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(appt._id, "confirmed")
                          }
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
                          onClick={() =>
                            handleStatusChange(appt._id, "completed")
                          }
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
                          >
                            Cancel
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openNotesModal(appt)}
                      >
                        Add Notes
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openPrescriptionModal(appt)}
                      >
                        Write Rx
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Consultation Notes Modal */}
        <Modal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          title="Add Consultation Notes"
          size="lg"
        >
          <form onSubmit={handleNotesSubmit} className="space-y-4">
            <div>
              <label>Diagnosis</label>
              <input
                className="input w-full"
                value={notesForm.diagnosis}
                onChange={(e) =>
                  setNotesForm({ ...notesForm, diagnosis: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label>Treatment</label>
              <textarea
                className="input w-full"
                value={notesForm.treatment}
                onChange={(e) =>
                  setNotesForm({ ...notesForm, treatment: e.target.value })
                }
                rows={2}
                required
              />
            </div>
            <div>
              <label>Follow-up Advice</label>
              <textarea
                className="input w-full"
                value={notesForm.followUp}
                onChange={(e) =>
                  setNotesForm({ ...notesForm, followUp: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <label>Digital Signature</label>
              <input
                className="input w-full"
                value={notesForm.signature}
                onChange={(e) =>
                  setNotesForm({ ...notesForm, signature: e.target.value })
                }
                required
                placeholder="Type your name as signature"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowNotesModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={notesSubmitting}>
                Save Notes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Prescription Modal */}
        <Modal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          title="Write Prescription"
          size="xl"
        >
          {selectedAppointment ? (
            <PrescriptionForm
              appointmentId={selectedAppointment._id}
              appointmentPatient={selectedAppointment.patient}
            />
          ) : (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              No appointment selected.
            </div>
          )}
        </Modal>

        {/* Patient History Modal */}
        <Modal
          isOpen={showPatientHistoryModal}
          onClose={() => setShowPatientHistoryModal(false)}
          title="Patient History"
          size="xl"
        >
          {historyLoading ? (
            <div className="py-8 text-center">Loading history...</div>
          ) : patientHistory ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Appointments</h3>
                <ul className="list-disc ml-6">
                  {patientHistory.appointments.map((appt) => (
                    <li key={appt._id}>
                      {formatDate(appt.appointmentDate)} -{" "}
                      {appt.appointmentType} - {appt.status}
                    </li>
                  ))}
                  {patientHistory.appointments.length === 0 && (
                    <li>No previous appointments.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Prescriptions</h3>
                <ul className="list-disc ml-6">
                  {patientHistory.prescriptions.map((rx) => (
                    <li key={rx._id}>
                      {formatDate(rx.prescriptionDate)} -{" "}
                      {rx.diagnosis?.primary || "-"} - {rx.status}
                    </li>
                  ))}
                  {patientHistory.prescriptions.length === 0 && (
                    <li>No prescriptions.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Medical Records</h3>
                <ul className="list-disc ml-6">
                  {patientHistory.records.map((rec) => (
                    <li key={rec._id}>
                      {formatDate(rec.recordDate)} - {rec.title} (
                      {rec.recordType})
                    </li>
                  ))}
                  {patientHistory.records.length === 0 && (
                    <li>No medical records.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-danger-500">
              Failed to load patient history.
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
