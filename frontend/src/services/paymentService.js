import api from './api';

export const paymentService = {
  // Get user's payments
  getPayments: async () => {
    try {
      const response = await api.get('/payments');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new payment
  createPayment: async (data) => {
    try {
      const response = await api.post('/payments', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update payment
  updatePayment: async (id, data) => {
    try {
      const response = await api.put(`/payments/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete payment
  deletePayment: async (id) => {
    try {
      const response = await api.delete(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Process payment
  processPayment: async (paymentId, paymentMethod) => {
    try {
      const response = await api.post(`/payments/${paymentId}/process`, {
        paymentMethod
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (userId) => {
    try {
      const response = await api.get(`/payments/history/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get payment statistics
  getPaymentStats: async () => {
    try {
      const response = await api.get('/payments/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 