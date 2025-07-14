import api from './api';

export const healthDataService = {
  // Get user's health data
  getHealthData: async () => {
    try {
      const response = await api.get('/health-data');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add new health data entry
  addHealthData: async (data) => {
    try {
      const response = await api.post('/health-data', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update health data
  updateHealthData: async (id, data) => {
    try {
      const response = await api.put(`/health-data/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete health data
  deleteHealthData: async (id) => {
    try {
      const response = await api.delete(`/health-data/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get health data by date range
  getHealthDataByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/health-data/range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 