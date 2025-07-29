import React, { useEffect, useState } from "react";
import {
  IoAddOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    isAvailable: true,
    maxAppointments: 1,
    notes: "",
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${user._id}/availability`);
      setAvailability(response.data.availability || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSlot) {
        // Update existing slot
        await api.put(`/doctors/availability/${selectedSlot._id}`, formData);
      } else {
        // Create new slot
        await api.post("/doctors/availability", {
          ...formData,
          doctorId: user._id,
        });
      }
      setShowModal(false);
      setSelectedSlot(null);
      resetForm();
      fetchAvailability();
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    }
  };

  const handleEdit = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      date: slot.date.split("T")[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      maxAppointments: slot.maxAppointments,
      notes: slot.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (slotId) => {
    if (window.confirm("Are you sure you want to delete this availability slot?")) {
      try {
        await api.delete(`/doctors/availability/${slotId}`);
        fetchAvailability();
      } catch (error) {
        console.error("Error deleting availability:", error);
        alert("Failed to delete availability");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      startTime: "",
      endTime: "",
      isAvailable: true,
      maxAppointments: 1,
      notes: "",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (isAvailable, currentBookings, maxAppointments) => {
    if (!isAvailable) return "text-red-600 bg-red-100";
    if (currentBookings >= maxAppointments) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getStatusText = (isAvailable, currentBookings, maxAppointments) => {
    if (!isAvailable) return "Unavailable";
    if (currentBookings >= maxAppointments) return "Fully Booked";
    return `Available (${currentBookings}/${maxAppointments})`;
  };

  // Get today's date for minimum date input
  const today = new Date().toISOString().split("T")[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Availability Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your availability schedule for appointments
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedSlot(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center space-x-2"
          >
            <IoAddOutline className="h-4 w-4" />
            <span>Add Availability</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availability.length === 0 ? (
              <Card className="col-span-full">
                <Card.Content>
                  <div className="text-center py-8">
                    <IoCalendarOutline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No availability slots found. Add your first availability slot to get started.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedSlot(null);
                        resetForm();
                        setShowModal(true);
                      }}
                      className="mt-4"
                    >
                      Add Availability
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ) : (
              availability.map((slot) => (
                <Card key={slot._id}>
                  <Card.Header>
                    <div className="flex justify-between items-start">
                      <div>
                        <Card.Title className="flex items-center space-x-2">
                          <IoCalendarOutline className="h-5 w-5" />
                          <span>{formatDate(slot.date)}</span>
                        </Card.Title>
                        <Card.Description className="flex items-center space-x-2">
                          <IoTimeOutline className="h-4 w-4" />
                          <span>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </Card.Description>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          slot.isAvailable,
                          slot.currentBookings || 0,
                          slot.maxAppointments
                        )}`}
                      >
                        {getStatusText(
                          slot.isAvailable,
                          slot.currentBookings || 0,
                          slot.maxAppointments
                        )}
                      </span>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Max Appointments:</span> {slot.maxAppointments}
                      </div>
                      <div>
                        <span className="font-medium">Current Bookings:</span>{" "}
                        {slot.currentBookings || 0}
                      </div>
                      {slot.notes && (
                        <div>
                          <span className="font-medium">Notes:</span> {slot.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(slot)}
                        className="flex items-center space-x-1"
                      >
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(slot._id)}
                        className="flex items-center space-x-1"
                      >
                        <span>Delete</span>
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSlot(null);
            resetForm();
          }}
          title={selectedSlot ? "Edit Availability" : "Add Availability"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={today}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Appointments
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.maxAppointments}
                onChange={(e) =>
                  setFormData({ ...formData, maxAppointments: parseInt(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available for appointments
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Any special notes for this time slot..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setSelectedSlot(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex items-center space-x-2">
                {selectedSlot ? (
                  <>
                    <IoCheckmarkCircleOutline className="h-4 w-4" />
                    <span>Update</span>
                  </>
                ) : (
                  <>
                    <IoAddOutline className="h-4 w-4" />
                    <span>Add</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
