import React, { useEffect, useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { doctorService } from "../../services/doctorService";
import { prescriptionService } from "../../services/prescriptionService";

const emptyMedication = {
  name: "",
  amount: "",
  unit: "mg",
  frequency: "",
  duration: "",
  instructions: "",
};

const PrescriptionForm = ({ appointmentPatient, appointmentId }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [form, setForm] = useState({
    patient: appointmentPatient?._id || "",
    diagnosis: "",
    medications: [{ ...emptyMedication }],
    advice: "",
    followUpDate: "",
    signature: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentPatient) {
      setLoadingPatients(true);
      doctorService
        .getDoctorPatients(user?._id)
        .then((res) => setPatients(res.data?.patients || []))
        .catch(() => setPatients([]))
        .finally(() => setLoadingPatients(false));
    } else {
      setPatients([appointmentPatient]);
    }
  }, [user, appointmentPatient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicationChange = (idx, e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const meds = [...prev.medications];
      meds[idx][name] = value;
      return { ...prev, medications: meds };
    });
  };

  const addMedication = () => {
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...emptyMedication }],
    }));
  };

  const removeMedication = (idx) => {
    setForm((prev) => {
      const meds = prev.medications.filter((_, i) => i !== idx);
      return {
        ...prev,
        medications: meds.length ? meds : [{ ...emptyMedication }],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (!appointmentId) {
        setError("Appointment ID is required to create a prescription.");
        setSubmitting(false);
        return;
      }
      // Prepare payload for backend
      const payload = {
        appointmentId,
        diagnosis: { primary: form.diagnosis },
        medications: form.medications.map((med) => ({
          name: med.name,
          dosage: {
            amount: Number(med.amount),
            unit: med.unit,
            frequency: med.frequency,
            duration: med.duration,
          },
          instructions: med.instructions,
        })),
        followUp: form.followUpDate
          ? { required: true, date: form.followUpDate }
          : undefined,
        digitalSignature: { doctorSignature: "placeholder" },
      };
      await prescriptionService.createPrescription(payload);
      setSuccess(true);
      setForm({
        patient: appointmentPatient?._id || "",
        diagnosis: "",
        medications: [{ ...emptyMedication }],
        advice: "",
        followUpDate: "",
        signature: "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Prescription</h2>
      {!appointmentId && (
        <div className="text-danger-500 text-sm mb-2">
          Appointment ID is required to create a prescription.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Patient</label>
          {appointmentPatient ? (
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {appointmentPatient.firstName} {appointmentPatient.lastName} (
              {appointmentPatient.email})
            </div>
          ) : loadingPatients ? (
            <div>Loading patients...</div>
          ) : (
            <select
              name="patient"
              value={form.patient}
              onChange={handleChange}
              required
              className="input w-full"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} ({p.email})
                </option>
              ))}
            </select>
          )}
        </div>
        <Input
          label="Diagnosis"
          name="diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          required
        />
        {/* Medications array */}
        <div>
          <label className="block text-sm font-medium mb-1">Medications</label>
          {form.medications.map((med, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-end"
            >
              <Input
                label="Name"
                name="name"
                value={med.name}
                onChange={(e) => handleMedicationChange(idx, e)}
                required
              />
              <Input
                label="Amount"
                name="amount"
                type="number"
                value={med.amount}
                onChange={(e) => handleMedicationChange(idx, e)}
                required
              />
              <Input
                label="Unit"
                name="unit"
                value={med.unit}
                onChange={(e) => handleMedicationChange(idx, e)}
                required
              />
              <Input
                label="Frequency"
                name="frequency"
                value={med.frequency}
                onChange={(e) => handleMedicationChange(idx, e)}
                required
              />
              <Input
                label="Duration"
                name="duration"
                value={med.duration}
                onChange={(e) => handleMedicationChange(idx, e)}
                required
              />
              <div className="flex gap-1">
                <Input
                  label="Instructions"
                  name="instructions"
                  value={med.instructions}
                  onChange={(e) => handleMedicationChange(idx, e)}
                />
                {form.medications.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeMedication(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addMedication}
            className="mt-2"
          >
            + Add Medication
          </Button>
        </div>
        <Input
          label="Advice"
          name="advice"
          value={form.advice}
          onChange={handleChange}
        />
        <Input
          label="Follow-up Date"
          name="followUpDate"
          type="date"
          value={form.followUpDate}
          onChange={handleChange}
        />
        {/* Digital signature placeholder */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Doctor's Digital Signature (coming soon)
          </label>
          <input
            type="text"
            name="signature"
            value={form.signature}
            onChange={handleChange}
            className="input w-full"
            disabled
            placeholder="Not implemented"
          />
        </div>
        {error && <div className="text-danger-500 text-sm">{error}</div>}
        <Button
          type="submit"
          loading={submitting}
          disabled={submitting || !appointmentId}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Create Prescription"}
        </Button>
      </form>
      <Modal
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="Prescription Created"
      >
        <div className="text-center">
          <p className="mb-4">
            Prescription successfully created and sent to the patient.
          </p>
          <Button onClick={() => setSuccess(false)} className="w-full">
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PrescriptionForm;
