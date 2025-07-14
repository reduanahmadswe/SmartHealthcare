import api from './api';

export const labTestsService = {
  // Get user's lab tests
  getLabTests: async () => {
    try {
      const response = await api.get('/lab-tests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get lab test by ID
  getLabTestById: async (id) => {
    try {
      const response = await api.get(`/lab-tests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new lab test
  createLabTest: async (data) => {
    try {
      const response = await api.post('/lab-tests', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update lab test
  updateLabTest: async (id, data) => {
    try {
      const response = await api.put(`/lab-tests/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete lab test
  deleteLabTest: async (id) => {
    try {
      const response = await api.delete(`/lab-tests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get lab tests by patient
  getLabTestsByPatient: async (patientId) => {
    try {
      const response = await api.get(`/lab-tests/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload lab test results
  uploadLabTestResults: async (testId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/lab-tests/${testId}/upload`, formData, {
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