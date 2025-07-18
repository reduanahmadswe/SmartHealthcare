const express = require('express');
const doctorController = require('./doctor.controller'); 
const doctorValidation = require('./doctor.validation'); 
const { authenticateToken, requireDoctor, requireAdmin } = require('../../middleware/auth'); 


const router = express.Router();


// @route   POST /api/doctors/register
// @desc    Register a new doctor
// @access  Public
router.post(
    '/register',
    doctorValidation.registerDoctor,
    doctorController.registerDoctor
);

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put(
    '/profile',
    authenticateToken,
    requireDoctor,
    doctorValidation.updateDoctorProfile,
    doctorController.updateDoctorProfile
);

// @route   POST /api/doctors/certificates
// @desc    Upload doctor certificates
// @access  Private (Doctor only)
// NOTE: This route requires a file upload middleware (e.g., multer) to be configured
// before it in your main app.js or router setup.
router.post(
    '/certificates',
    authenticateToken,
    requireDoctor,
    doctorValidation.uploadCertificate,
    doctorController.uploadDoctorCertificate
);

// @route   GET /api/doctors/pending-verification
// @desc    Get doctors pending verification (Admin only)
// @access  Private (Admin only)
router.get(
    '/pending-verification',
    authenticateToken,
    requireAdmin,
    doctorValidation.getPendingVerification,
    doctorController.getDoctorsPendingVerification
);

// @route   PUT /api/doctors/:id/verify
// @desc    Verify doctor (Admin only)
// @access  Private (Admin only)
router.put(
    '/:id/verify',
    authenticateToken,
    requireAdmin,
    doctorValidation.verifyDoctor,
    doctorController.verifyDoctor
);

// @route   GET /api/doctors/:id/appointments
// @desc    Get doctor's appointments
// @access  Private (Doctor only)
router.get(
    '/:id/appointments',
    authenticateToken,
    requireDoctor, // Or requireDoctorOrAdmin if admin can also view any doctor's appointments
    doctorValidation.getDoctorAppointments,
    doctorController.getDoctorAppointments
);

// @route   GET /api/doctors/:id/schedule
// @desc    Get doctor's schedule
// @access  Private (Doctor only)
router.get(
    '/:id/schedule',
    authenticateToken,
    requireDoctor, // Or requireDoctorOrAdmin
    doctorController.getDoctorSchedule
);

// @route   PUT /api/doctors/:id/schedule
// @desc    Update doctor's schedule
// @access  Private (Doctor only)
router.put(
    '/:id/schedule',
    authenticateToken,
    requireDoctor, // Or requireDoctorOrAdmin
    doctorValidation.updateDoctorSchedule,
    doctorController.updateDoctorSchedule
);

// @route   GET /api/doctors/:id/statistics
// @desc    Get doctor's statistics
// @access  Private (Doctor only)
router.get(
    '/:id/statistics',
    authenticateToken,
    requireDoctor, // Or requireDoctorOrAdmin
    doctorValidation.getDoctorStatistics,
    doctorController.getDoctorStatistics
);

// @route   GET /api/doctors/specializations
// @desc    Get all specializations
// @access  Public
router.get(
    '/specializations',
    doctorController.getAllSpecializations
);

// @route   GET /api/doctors
// @desc    Get all verified and active doctors (for patient appointment booking)
// @access  Public
router.get(
    '/',
    doctorController.getAllVerifiedDoctors
);

// @route   GET /api/doctors/:id/patients
// @desc    Get all unique patients for a doctor (current and previous)
// @access  Private (Doctor or Admin)
router.get(
    '/:id/patients',
    authenticateToken,
    requireDoctor, // Or requireDoctorOrAdmin
    doctorController.getDoctorPatients
);

module.exports = router;