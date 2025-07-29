import api from "./api";

export const adminService = {
  // Get system statistics
  getSystemStats: async () => {
    try {
      const response = await api.get("/admin/stats");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user management data
  getUserManagementData: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor KYC requests
  getDoctorKYCRequests: async () => {
    try {
      const response = await api.get("/admin/doctor-kyc");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Approve doctor KYC
  approveDoctorKYC: async (doctorId) => {
    try {
      const response = await api.put(`/admin/doctor-kyc/${doctorId}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject doctor KYC
  rejectDoctorKYC: async (doctorId, reason) => {
    try {
      const response = await api.put(`/admin/doctor-kyc/${doctorId}/reject`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ Simpler API (used in Dashboard view or another context)
  getPendingDoctors: async () => {
    try {
      const response = await api.get("/admin/pending-doctors");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approveDoctor: async (doctorId) => {
    try {
      const response = await api.patch(`/admin/approve-doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get analytics data
  getAnalyticsData: async (timeRange) => {
    try {
      const response = await api.get("/admin/analytics", {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get inventory data
  getInventoryData: async () => {
    try {
      const response = await api.get("/admin/inventory");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update inventory
  updateInventory: async (inventoryId, data) => {
    try {
      const response = await api.put(`/admin/inventory/${inventoryId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get activity logs
  getActivityLogs: async (filters) => {
    try {
      const response = await api.get("/admin/logs", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Export data
  exportData: async (dataType, format) => {
    try {
      const response = await api.get("/admin/export", {
        params: { dataType, format },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.doctor) params.append("doctorId", filters.doctor);
    if (filters.patient) params.append("patientId", filters.patient);
    if (filters.date) params.append("date", filters.date);
    return await api.get(`/admin/appointments?${params.toString()}`);
  },
};
