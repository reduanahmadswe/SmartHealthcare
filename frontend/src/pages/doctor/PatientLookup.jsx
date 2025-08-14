import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { appointmentService } from "../../services/appointmentService";

const PatientLookup = () => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchType, setSearchType] = useState("profile"); // "profile" or "history"
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setPatient(null);
    setAppointments([]);
    
    try {
      const { patientUniqueId } = data;
      
      if (searchType === "profile") {
        // Search for patient profile
        const response = await appointmentService.findPatientByUniqueId(patientUniqueId);
        setPatient(response.data.patient);
        setAppointments([response.data.appointment]);
        toast.success("Patient found successfully!");
      } else {
        // Search for patient appointment history
        const response = await appointmentService.getPatientAppointmentsByUniqueId(patientUniqueId);
        setPatient(response.data.patient);
        setAppointments(response.data.appointments);
        toast.success(`Found ${response.data.appointments.length} appointments for this patient!`);
      }
    } catch (err) {
      console.error("Search error:", err);
      if (err.response?.status === 404) {
        toast.error("No patient found with this unique ID");
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setPatient(null);
    setAppointments([]);
    reset();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-6">
      {/* Search Form */}
      <Card>
        <Card.Header>
          <Card.Title>Patient Lookup</Card.Title>
          <p className="text-sm text-gray-600">
            Search for patient using their unique 6-digit ID
          </p>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="profile"
                    checked={searchType === "profile"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mr-2"
                  />
                  Patient Profile
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="history"
                    checked={searchType === "history"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mr-2"
                  />
                  Appointment History
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Unique ID (6 digits)
              </label>
              <input
                type="text"
                {...register("patientUniqueId", {
                  required: "Patient ID is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "Patient ID must be exactly 6 digits"
                  }
                })}
                className="input w-full"
                placeholder="Enter 6-digit patient ID"
                maxLength={6}
              />
              {errors.patientUniqueId && (
                <span className="text-red-500 text-sm">
                  {errors.patientUniqueId.message}
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Searching..." : `Search ${searchType === "profile" ? "Profile" : "History"}`}
              </Button>
              {(patient || appointments.length > 0) && (
                <Button type="button" variant="outline" onClick={clearResults}>
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Patient Profile */}
      {patient && (
        <Card>
          <Card.Header>
            <Card.Title>Patient Profile</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Name:</span> {patient.firstName} {patient.lastName}</p>
                  <p><span className="font-medium">Email:</span> {patient.email}</p>
                  <p><span className="font-medium">Phone:</span> {patient.phone}</p>
                  {patient.dateOfBirth && (
                    <p><span className="font-medium">Date of Birth:</span> {formatDate(patient.dateOfBirth)}</p>
                  )}
                  {patient.gender && (
                    <p><span className="font-medium">Gender:</span> {patient.gender}</p>
                  )}
                </div>
              </div>
              
              {patient.address && (
                <div>
                  <h3 className="font-semibold text-gray-700">Address</h3>
                  <div className="mt-2">
                    <p>{patient.address.street}</p>
                    <p>{patient.address.city}, {patient.address.state} {patient.address.zipCode}</p>
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Appointments List */}
      {appointments.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>
              {searchType === "history" ? "Appointment History" : "Recent Appointment"}
              <span className="ml-2 text-sm text-gray-500">
                ({appointments.length} appointment{appointments.length !== 1 ? "s" : ""})
              </span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">
                          Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><span className="font-medium">Patient ID:</span> {appointment.patientUniqueId}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(appointment.appointmentDate)}</p>
                        <p><span className="font-medium">Time:</span> {formatTime(appointment.appointmentTime)}</p>
                        <p><span className="font-medium">Type:</span> {appointment.appointmentType}</p>
                        <p><span className="font-medium">Mode:</span> {appointment.appointmentMode}</p>
                        <p><span className="font-medium">Fee:</span> ${appointment.consultationFee}</p>
                      </div>

                      {appointment.symptoms && appointment.symptoms.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Symptoms:</span> {appointment.symptoms.join(", ")}
                          </p>
                        </div>
                      )}

                      {appointment.diagnosis && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span> {appointment.diagnosis}
                          </p>
                        </div>
                      )}

                      {appointment.treatment && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Treatment:</span> {appointment.treatment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default PatientLookup;
