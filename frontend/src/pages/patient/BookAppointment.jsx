import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import {
  appointmentService,
  checkDoctorAvailability,
  getDoctors,
} from "../../services/appointmentService";

const appointmentTypes = [
  { value: "consultation", label: "Consultation" },
  { value: "emergency", label: "Emergency" },
  { value: "follow_up", label: "Follow Up" },
];

const appointmentModes = [
  { value: "in_person", label: "In Person" },
  { value: "video_call", label: "Video Call" },
];

const BookAppointment = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [fee, setFee] = useState("");
  const [availability, setAvailability] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  // Calculate today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  // Fetch doctors on mount
  useEffect(() => {
    setDoctorsLoading(true);
    getDoctors()
      .then((docs) => setDoctors(docs))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, []);

  // Auto-fill fee when doctor is selected
  useEffect(() => {
    const selectedDoctor = doctors.find((d) => d._id === watch("doctorId"));
    setFee(
      selectedDoctor ? selectedDoctor.doctorInfo?.consultationFee || 0 : ""
    );
    setValue(
      "fee",
      selectedDoctor ? selectedDoctor.doctorInfo?.consultationFee || 0 : ""
    );
  }, [watch("doctorId"), setValue, doctors]);

  // Check availability when doctor/date/time changes
  useEffect(() => {
    const doctorId = watch("doctorId");
    const date = watch("appointmentDate");
    const time = watch("appointmentTime");
    if (doctorId && date && time) {
      checkDoctorAvailability(doctorId, date, time)
        .then((res) => setAvailability(res.available))
        .catch(() => setAvailability(null));
    } else {
      setAvailability(null);
    }
  }, [watch("doctorId"), watch("appointmentDate"), watch("appointmentTime")]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Convert symptoms to array (split by comma or newline)
      const symptoms =
        typeof data.symptoms === "string" && data.symptoms.trim()
          ? data.symptoms
              .split(/,|\n/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const payload = {
        ...data,
        symptoms,
      };
      await appointmentService.bookAppointment(payload);
      toast.success("Appointment booked successfully!");
      // Optionally redirect to /my-appointments
      // navigate('/my-appointments');
    } catch (err) {
      console.error("Booking error:", err);
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = err.response.data.errors
          .map((error) => error.msg)
          .join(", ");
        toast.error(errorMessages);
      } else if (err.response?.data?.message) {
        // Handle other API errors
        toast.error(err.response.data.message);
      } else {
        toast.error("Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <Card.Header>
        <Card.Title>Book Appointment</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Doctor</label>
            {doctorsLoading ? (
              <div className="text-center py-2">Loading doctors...</div>
            ) : (
              <select
                {...register("doctorId", { required: true })}
                className="input w-full"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.firstName} {doc.lastName}{" "}
                    {doc.doctorInfo?.specialization?.length
                      ? `(${doc.doctorInfo.specialization.join(", ")})`
                      : ""}{" "}
                    - Fee: ${doc.doctorInfo?.consultationFee || 0}
                  </option>
                ))}
              </select>
            )}
            {errors.doctorId && (
              <span className="text-danger-500 text-sm">
                Doctor is required
              </span>
            )}
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              {...register("appointmentDate", { required: true })}
              className="input w-full"
              min={today}
            />
            {errors.appointmentDate && (
              <span className="text-danger-500 text-sm">Date is required</span>
            )}
          </div>
          <div>
            <label>Time</label>
            <input
              type="time"
              {...register("appointmentTime", { required: true })}
              className="input w-full"
            />
            {errors.appointmentTime && (
              <span className="text-danger-500 text-sm">Time is required</span>
            )}
          </div>
          <div>
            <label>Type</label>
            <select
              {...register("appointmentType", { required: true })}
              className="input w-full"
            >
              <option value="">Select Type</option>
              {appointmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.appointmentType && (
              <span className="text-danger-500 text-sm">Type is required</span>
            )}
          </div>
          <div>
            <label>Mode</label>
            <select
              {...register("appointmentMode", { required: true })}
              className="input w-full"
            >
              <option value="">Select Mode</option>
              {appointmentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            {errors.appointmentMode && (
              <span className="text-danger-500 text-sm">Mode is required</span>
            )}
          </div>
          <div>
            <label>Symptoms/Notes</label>
            <textarea
              {...register("symptoms")}
              className="input w-full"
              rows={3}
              placeholder="Separate symptoms with commas or new lines"
            />
          </div>
          <div>
            <label>Fee</label>
            <input
              type="number"
              {...register("fee", { required: true })}
              className="input w-full"
              value={fee}
              readOnly
            />
            {errors.fee && (
              <span className="text-danger-500 text-sm">Fee is required</span>
            )}
          </div>
          {availability === false && (
            <div className="text-danger-500 text-sm">
              Doctor is not available at this time.
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
};

export default BookAppointment;
