const express = require('express');
const appointmentController = require('./appointment.controller'); 
const appointmentValidation = require('./appointment.validation'); 
const { authenticateToken, requirePatient, requireDoctor, requireDoctorOrAdmin } = require('../../middleware/auth'); 

const router = express.Router();

// @route   GET /api/appointments/test
// @desc    Test endpoint to check if appointments route is working
// @access  Public
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Appointments route is working'
    });
});

// @route   GET /api/appointments/test-unique-id
// @desc    Test endpoint to check patient unique ID generation
// @access  Public
router.get('/test-unique-id', async (req, res) => {
    try {
        const Appointment = require('./appointment.model');
        const uniqueId = await Appointment.generateUniquePatientId();
        res.json({
            success: true,
            message: 'Unique ID generated successfully',
            data: {
                patientUniqueId: uniqueId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate unique ID',
            error: error.message
        });
    }
});

// @route   POST /api/appointments
// @desc    Book a new appointment
// @access  Private (Patient only)
router.post(
    '/',
    authenticateToken, // Ensure user is authenticated
    requirePatient, // Ensure user is a patient
    appointmentValidation.bookAppointment, // Apply validation rules
    appointmentController.bookAppointment
);
// Support POST /api/appointments/book as well
router.post(
    '/book',
    authenticateToken,
    requirePatient,
    appointmentValidation.bookAppointment,
    appointmentController.bookAppointment
);

// @route   GET /api/appointments
// @desc    Get user's appointments (patient or doctor) with filters
// @access  Private
router.get(
    '/',
    authenticateToken,
    appointmentController.getAppointments
);

// @route   GET /api/appointments/patient
// @desc    Get appointments for the current patient
// @access  Private (Patient only)
router.get(
    '/patient',
    authenticateToken,
    requirePatient,
    appointmentController.getPatientAppointments
);

// @route   GET /api/appointments/doctor
// @desc    Get appointments for the current doctor
// @access  Private (Doctor only)
router.get(
    '/doctor',
    authenticateToken,
    requireDoctor,
    appointmentController.getDoctorAppointments
);

// @route   GET /api/appointments/check
// @desc    Check doctor availability
// @access  Private
router.get(
    '/check',
    authenticateToken,
    appointmentController.checkDoctorAvailability
);

// @route   GET /api/appointments/upcoming
// @desc    Get upcoming appointments for the authenticated user
// @access  Private
router.get(
    '/upcoming',
    authenticateToken,
    appointmentController.getUpcomingAppointments
);

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get(
    '/:id',
    authenticateToken,
    appointmentController.getAppointmentById
);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor/Admin only)
router.put(
    '/:id/status',
    authenticateToken,
    requireDoctorOrAdmin,
    appointmentValidation.updateStatus,
    appointmentController.updateAppointmentStatus
);

// @route   PUT /api/appointments/:id/reschedule
// @desc    Reschedule appointment
// @access  Private
router.put(
    '/:id/reschedule',
    authenticateToken,
    appointmentValidation.rescheduleAppointment,
    appointmentController.rescheduleAppointment
);

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete(
    '/:id',
    authenticateToken,
    appointmentValidation.cancelAppointment, // Apply validation for reason
    appointmentController.cancelAppointment
);

// @route   POST /api/appointments/:id/rating
// @desc    Rate appointment
// @access  Private (Patient only)
router.post(
    '/:id/rating',
    authenticateToken,
    requirePatient,
    appointmentValidation.rateAppointment,
    appointmentController.rateAppointment
);

// @route   PUT /api/appointments/:id/notes
// @desc    Add or update consultation notes for an appointment (doctor/admin only)
// @access  Private (Doctor/Admin only)
router.put(
    '/:id/notes',
    authenticateToken,
    requireDoctorOrAdmin,
    appointmentValidation.updateConsultationNotes,
    appointmentController.updateConsultationNotes
);

// @route   GET /api/appointments/patient-lookup/:patientUniqueId
// @desc    Find patient profile by unique patient ID
// @access  Private (Doctor/Admin only)
router.get(
    '/patient-lookup/:patientUniqueId',
    authenticateToken,
    requireDoctorOrAdmin,
    appointmentController.findPatientByUniqueId
);

// @route   GET /api/appointments/patient-history/:patientUniqueId
// @desc    Get all appointments for a patient using unique patient ID
// @access  Private (Doctor/Admin only)
router.get(
    '/patient-history/:patientUniqueId',
    authenticateToken,
    requireDoctorOrAdmin,
    appointmentController.getPatientAppointmentsByUniqueId
);

module.exports = router;