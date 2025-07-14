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

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getPrescriptions();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
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
      const data = await prescriptionService.getPrescriptionById(
        prescriptionId
      );
      setSelectedPrescription(data);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading prescription details:", error);
    }
  };

  const downloadPrescription = (prescriptionId) => {
    // This would typically generate and download a PDF
    console.log("Downloading prescription:", prescriptionId);
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

        {prescriptions.length === 0 ? (
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
                        {prescription.medicationName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dr. {prescription.doctor?.name || "Unknown Doctor"}
                      </p>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                </Card.Header>
                <Card.Content className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Dosage:
                      </span>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Frequency:
                      </span>
                      <p className="font-medium">{prescription.frequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Duration:
                      </span>
                      <p className="font-medium">{prescription.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Prescribed:
                      </span>
                      <p className="font-medium">
                        {formatDate(prescription.prescribedDate)}
                      </p>
                    </div>
                  </div>

                  {prescription.instructions && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Instructions:
                      </span>
                      <p className="text-sm mt-1">
                        {prescription.instructions}
                      </p>
                    </div>
                  )}

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
                      onClick={() => downloadPrescription(prescription._id)}
                      size="sm"
                      variant="outline"
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
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Prescription Details
                  </h2>
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Medication:
                      </span>
                      <p className="font-medium">
                        {selectedPrescription.medicationName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Status:
                      </span>
                      <div className="mt-1">
                        {getStatusBadge(selectedPrescription.status)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Dosage:
                      </span>
                      <p className="font-medium">
                        {selectedPrescription.dosage}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Frequency:
                      </span>
                      <p className="font-medium">
                        {selectedPrescription.frequency}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Duration:
                      </span>
                      <p className="font-medium">
                        {selectedPrescription.duration}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Prescribed Date:
                      </span>
                      <p className="font-medium">
                        {formatDate(selectedPrescription.prescribedDate)}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.instructions && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Instructions:
                      </span>
                      <p className="mt-1 text-sm">
                        {selectedPrescription.instructions}
                      </p>
                    </div>
                  )}

                  {selectedPrescription.sideEffects && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Side Effects:
                      </span>
                      <p className="mt-1 text-sm">
                        {selectedPrescription.sideEffects}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Prescribing Doctor</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedPrescription.doctor?.name?.charAt(0) || "D"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {selectedPrescription.doctor?.name ||
                            "Unknown Doctor"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedPrescription.doctor?.specialization ||
                            "General Medicine"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() =>
                        downloadPrescription(selectedPrescription._id)
                      }
                      className="flex-1"
                    >
                      Download Prescription
                    </Button>
                    <Button
                      onClick={() => setShowModal(false)}
                      variant="outline"
                    >
                      Close
                    </Button>
                  </div>
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
