import api from './api';

export const medicalRecordsService = {
  // Get user's medical records
  getMedicalRecords: async () => {
    try {
      const response = await api.get('/medical-records');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get medical record by ID
  getMedicalRecordById: async (id) => {
    try {
      const response = await api.get(`/medical-records/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new medical record
  createMedicalRecord: async (data) => {
    try {
      const response = await api.post('/medical-records', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update medical record
  updateMedicalRecord: async (id, data) => {
    try {
      const response = await api.put(`/medical-records/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete medical record
  deleteMedicalRecord: async (id) => {
    try {
      const response = await api.delete(`/medical-records/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get medical records by patient
  getMedicalRecordsByPatient: async (patientId) => {
    try {
      const response = await api.get(`/medical-records/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload medical record file
  uploadMedicalRecordFile: async (recordId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/medical-records/${recordId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 