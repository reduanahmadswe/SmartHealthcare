const express = require('express');
const PrescriptionController = require('./prescription.controller');
const PrescriptionValidation = require('./prescription.validation'); 
const {
    authenticateToken,
    requireDoctor,
    requirePatient
} = require('../../middleware/auth'); 
const {
    asyncHandler
} = require('../../middleware/errorHandler'); 

const router = express.Router();

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor only)
router.post(
    '/',
    authenticateToken, // Changed to authenticateToken first
    requireDoctor,
    PrescriptionValidation.createPrescription,
    PrescriptionController.createPrescription
);

// @route   GET /api/prescriptions
// @desc    Get prescriptions for user
// @access  Private
router.get(
    '/',
    authenticateToken,
    PrescriptionController.getPrescriptions
);

// @route   GET /api/prescriptions/patient
// @desc    Get prescriptions for the current patient
// @access  Private (Patient only)
router.get(
    '/patient',
    authenticateToken,
    requirePatient,
    PrescriptionController.getPrescriptions
); // Re-using getPrescriptions as it handles patient role implicitly

// @route   GET /api/prescriptions/doctor
// @desc    Get prescriptions for the current doctor
// @access  Private (Doctor only)
router.get(
    '/doctor',
    authenticateToken,
    requireDoctor,
    PrescriptionController.getPrescriptions
); // Re-using getPrescriptions as it handles doctor role implicitly


// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Private
router.get(
    '/:id',
    authenticateToken,
    PrescriptionController.getPrescriptionById
);

// @route   GET /api/prescriptions/:id/download
// @desc    Download prescription PDF
// @access  Private
router.get(
    '/:id/download',
    authenticateToken,
    PrescriptionController.downloadPrescriptionPdf
);

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (Doctor only)
router.put(
    '/:id',
    authenticateToken,
    requireDoctor,
    PrescriptionValidation.updatePrescription,
    PrescriptionController.updatePrescription
);

// @route   POST /api/prescriptions/:id/verify
// @desc    Verify prescription signature
// @access  Private
router.post(
    '/:id/verify',
    authenticateToken,
    PrescriptionController.verifyPrescriptionSignature
);

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get prescriptions for a specific patient (Doctor/Admin only)
// @access  Private (Doctor/Admin only)
router.get(
    '/patient/:patientId',
    authenticateToken,
    requireDoctor, // Or requireAdmin if only admin can see any patient's
    PrescriptionController.getPrescriptionsForPatient
);


// @route   GET /api/prescriptions/statistics
// @desc    Get prescription statistics
// @access  Private (Doctor only)
router.get(
    '/statistics',
    authenticateToken,
    requireDoctor,
    PrescriptionController.getPrescriptionStatistics
);

module.exports = router;