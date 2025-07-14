import api from './api';

export const doctorService = {
  // Get all doctors
  getAllDoctors: async () => {
    try {
      const response = await api.get('/doctors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor by ID
  getDoctorById: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor profile
  getDoctorProfile: async () => {
    try {
      const response = await api.get('/doctors/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update doctor profile
  updateDoctorProfile: async (data) => {
    try {
      const response = await api.put('/doctors/profile', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new doctor (admin only)
  createDoctor: async (data) => {
    try {
      const response = await api.post('/doctors', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update doctor
  updateDoctor: async (id, data) => {
    try {
      const response = await api.put(`/doctors/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete doctor
  deleteDoctor: async (id) => {
    try {
      const response = await api.delete(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor's patients
  getDoctorPatients: async (doctorId) => {
    try {
      // If no doctorId is provided, get from localStorage user
      if (!doctorId) {
        const user = JSON.parse(localStorage.getItem('user'));
        doctorId = user?._id;
      }
      const response = await api.get(`/doctors/${doctorId}/patients`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get doctor's schedule
  getDoctorSchedule: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/schedule`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update doctor's schedule
  updateDoctorSchedule: async (doctorId, schedule) => {
    try {
      const response = await api.put(`/doctors/${doctorId}/schedule`, schedule);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload doctor documents
  uploadDoctorDocuments: async (doctorId, documents) => {
    try {
      const formData = new FormData();
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc);
      });
      const response = await api.post(`/doctors/${doctorId}/documents`, formData, {
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