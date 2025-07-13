import api from './api';

export const appointmentService = {
  // Book new appointment
  bookAppointment: async (appointmentData) => {
    const response = await api.post('/appointments/book', appointmentData);
    return response.data;
  },

  // Get user's appointments
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/appointments?${params.toString()}`);
    return response.data;
  },

  // Get appointment by ID
  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id, updateData) => {
    const response = await api.put(`/appointments/${id}`, updateData);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (id, reason) => {
    const response = await api.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (id, newDate, newTime) => {
    const response = await api.put(`/appointments/${id}/reschedule`, {
      appointmentDate: newDate,
      appointmentTime: newTime
    });
    return response.data;
  },

  // Get available time slots for a doctor
  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/appointments/available-slots`, {
      params: { doctorId, date }
    });
    return response.data;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async () => {
    const response = await api.get('/appointments/upcoming');
    return response.data;
  },

  // Get appointment history
  getAppointmentHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/appointments/history?${params.toString()}`);
    return response.data;
  },

  // Get emergency appointments
  getEmergencyAppointments: async () => {
    const response = await api.get('/appointments/emergency');
    return response.data;
  },

  // Add appointment notes (for doctors)
  addAppointmentNotes: async (id, notes) => {
    const response = await api.put(`/appointments/${id}/notes`, { notes });
    return response.data;
  },

  // Mark appointment as completed
  completeAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}/complete`);
    return response.data;
  },

  // Get appointment statistics
  getAppointmentStats: async (period = 'month') => {
    const response = await api.get(`/appointments/stats?period=${period}`);
    return response.data;
  },
}; 