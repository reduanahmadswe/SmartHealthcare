import api from './api';

export const healthDataService = {
  // Get user's health data
  getHealthData: async (userId) => {
    try {
      const response = await api.get(`/health/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add new health data entry
  addHealthData: async (data, userId) => {
    try {
      const response = await api.post('/health/add', { ...data, patientId: userId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update health data
  updateHealthData: async (id, data) => {
    try {
      const response = await api.put(`/health/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete health data
  deleteHealthData: async (id) => {
    try {
      const response = await api.delete(`/health/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get health data by date range
  getHealthDataByDateRange: async (userId, startDate, endDate) => {
    try {
      const response = await api.get(`/health/${userId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 