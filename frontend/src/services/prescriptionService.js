import api from './api';

export const prescriptionService = {
  // Get user's prescriptions
  getPrescriptions: async () => {
    try {
      const response = await api.get('/prescriptions');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get prescription by ID
  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new prescription (doctor only)
  createPrescription: async (data) => {
    try {
      const response = await api.post('/prescriptions', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update prescription
  updatePrescription: async (id, data) => {
    try {
      const response = await api.put(`/prescriptions/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete prescription
  deletePrescription: async (id) => {
    try {
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get prescriptions by patient
  getPrescriptionsByPatient: async (patientId) => {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 