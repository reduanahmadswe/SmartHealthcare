import React, { useEffect, useState } from "react";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { prescriptionService } from "../../services/prescriptionService";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await prescriptionService.getPrescriptions();
      setPrescriptions(data.data?.prescriptions || []);
    } catch (error) {
      setError("Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "success", text: "Active" },
      completed: { color: "secondary", text: "Completed" },
      expired: { color: "danger", text: "Expired" },
      pending: { color: "warning", text: "Pending" },
    };

    const config = statusConfig[status] || { color: "outline", text: status };
    return <Badge color={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const viewPrescriptionDetails = async (prescriptionId) => {
    try {
      setError("");
      const data = await prescriptionService.getPrescriptionById(
        prescriptionId
      );
      setSelectedPrescription(data.data);
      setShowModal(true);
    } catch (error) {
      setError("Error loading prescription details");
    }
  };

  const downloadPrescription = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Prescriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your prescriptions
          </p>
        </div>
        {error && <div className="text-danger-500 text-sm mb-2">{error}</div>}
        {prescriptions.length === 0 && !loading ? (
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No prescriptions
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You don't have any prescriptions yet.
                </p>
              </div>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map((prescription) => (
              <Card
                key={prescription._id}
                className="hover:shadow-lg transition-shadow"
              >
                <Card.Header>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {prescription.diagnosis?.primary || "Prescription"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dr. {prescription.doctor?.firstName}{" "}
                        {prescription.doctor?.lastName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {prescription.prescriptionDate
                          ? new Date(
                              prescription.prescriptionDate
                            ).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                </Card.Header>
                <Card.Content className="space-y-3">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <b>Medications:</b> {prescription.medications?.length || 0}
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => viewPrescriptionDetails(prescription._id)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => downloadPrescription(prescription.pdfUrl)}
                      size="sm"
                      variant="outline"
                      disabled={!prescription.pdfUrl}
                    >
                      Download
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
        {/* Prescription Details Modal */}
        {showModal && selectedPrescription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">Prescription Details</h2>
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <b>Doctor:</b> Dr. {selectedPrescription.doctor?.firstName}{" "}
                  {selectedPrescription.doctor?.lastName}
                </div>
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <b>Date:</b>{" "}
                  {selectedPrescription.prescriptionDate
                    ? new Date(
                        selectedPrescription.prescriptionDate
                      ).toLocaleDateString()
                    : ""}
                </div>
                <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <b>Diagnosis:</b> {selectedPrescription.diagnosis?.primary}
                </div>
                {selectedPrescription.medications &&
                  selectedPrescription.medications.length > 0 && (
                    <div className="mb-2">
                      <b>Medications:</b>
                      <ul className="list-disc ml-6">
                        {selectedPrescription.medications.map((med, idx) => (
                          <li key={idx} className="mb-1">
                            <span className="font-medium">{med.name}</span> -{" "}
                            {med.dosage?.amount} {med.dosage?.unit},{" "}
                            {med.dosage?.frequency}, {med.dosage?.duration}
                            {med.instructions && (
                              <span>
                                {" "}
                                | <i>{med.instructions}</i>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {selectedPrescription.followUp?.date && (
                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    <b>Follow-up:</b>{" "}
                    {new Date(
                      selectedPrescription.followUp.date
                    ).toLocaleDateString()}
                  </div>
                )}
                {selectedPrescription.patientInstructions?.general && (
                  <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    <b>Advice:</b>{" "}
                    {selectedPrescription.patientInstructions.general}
                  </div>
                )}
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </Button>
                  {selectedPrescription.pdfUrl && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        downloadPrescription(selectedPrescription.pdfUrl)
                      }
                    >
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Prescriptions;
