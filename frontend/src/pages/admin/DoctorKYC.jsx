import React, { useEffect, useState } from "react";
import Card from "../../components/Card";
import DashboardLayout from "../../layouts/DashboardLayout";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

const DoctorKYC = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPendingDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingDoctors(); // GET /api/admin/pending-doctors
      setDoctors(res.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch pending doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveDoctor(id); // PATCH /api/admin/approve-doctor/:id
      toast.success("Doctor approved");
      fetchPendingDoctors();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const openModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Doctor KYC Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve doctor verification requests
          </p>
        </div>

        <Card>
          <Card.Content>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : doctors.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No pending doctor verifications.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Speciality</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc._id}>
                        <td>{doc.firstName} {doc.lastName}</td>
                        <td>{doc.email}</td>
                        <td>{doc.phone}</td>
                        <td>{doc.speciality || "N/A"}</td>
                        <td>
                          <Button size="sm" className="mr-2" onClick={() => openModal(doc)}>
                            View
                          </Button>
                          <Button size="sm" variant="success" onClick={() => handleApprove(doc._id)}>
                            Approve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* View Details Modal */}
        <Modal isOpen={showModal} onClose={closeModal} title="Doctor Details">
          {selectedDoctor && (
            <div className="space-y-2">
              <div><strong>Name:</strong> {selectedDoctor.firstName} {selectedDoctor.lastName}</div>
              <div><strong>Email:</strong> {selectedDoctor.email}</div>
              <div><strong>Phone:</strong> {selectedDoctor.phone}</div>
              <div><strong>Gender:</strong> {selectedDoctor.gender}</div>
              <div><strong>DOB:</strong> {selectedDoctor.dateOfBirth}</div>
              <div><strong>Address:</strong> {selectedDoctor.address}</div>
              <div><strong>Speciality:</strong> {selectedDoctor.speciality || "N/A"}</div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DoctorKYC;
