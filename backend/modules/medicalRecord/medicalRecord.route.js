const express = require('express');
const { validationResult } = require('express-validator'); 
const { authenticateToken, requirePatient, requireDoctor, requireAdmin } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler'); 
const medicalRecordValidation = require('./medicalRecord.validation'); 
const medicalRecordController = require('./medicalRecord.controller'); 


const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Ensure this directory exists or create it dynamically
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });



const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/medical-records
// @desc    Upload a new medical record
// @access  Private (Patient/Doctor)
// Requires multer middleware to handle file upload before validation and controller
router.post('/',
    upload.single('file'), // 'file' is the field name for the uploaded file
    medicalRecordValidation.createRecord,
    medicalRecordController.uploadRecord
);

// @route   GET /api/medical-records
// @desc    Get medical records for user (patient's own, doctor's shared/uploaded)
// @access  Private
router.get('/',
    medicalRecordValidation.getRecords,
    medicalRecordController.getRecords
);

// Add this route before any '/:id' route to avoid 'patient' being interpreted as an ID
// @route   GET /api/medical-records/patient
// @desc    Get medical records for the current patient (explicitly for patient role)
// @access  Private (Patient only)
router.get('/patient',
    requirePatient, // Ensure only patients can access their own explicit list
    medicalRecordValidation.getRecords, // Reusing general getRecords validation
    medicalRecordController.getPatientRecordsForPatient
);

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get medical records for a specific patient (Doctor/Admin only)
// @access  Private (Doctor/Admin only)
router.get('/patient/:patientId',
    medicalRecordValidation.patientIdParam, // Validate patientId in URL
    (req, res, next) => { // Custom middleware to check if user is doctor or admin
        if (req.user.role === 'doctor' || req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ success: false, message: 'Access denied. Only doctors and admins can access this route.' });
        }
    },
    medicalRecordValidation.getRecords, // Reuse general getRecords validation for query params
    medicalRecordController.getPatientRecordsByDoctor
);


// @route   GET /api/medical-records/statistics
// @desc    Get medical records statistics
// @access  Private
router.get('/statistics',
    medicalRecordValidation.getStatistics,
    medicalRecordController.getMedicalRecordStatistics
);

// @route   GET /api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private
router.get('/:id',
    medicalRecordValidation.idParam, // Validate ID format
    medicalRecordController.getRecordById
);

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private
router.put('/:id',
    medicalRecordValidation.idParam, // Validate ID format
    medicalRecordValidation.updateRecord,
    medicalRecordController.updateRecord
);

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private
router.delete('/:id',
    medicalRecordValidation.idParam, // Validate ID format
    medicalRecordController.deleteRecord
);

// @route   POST /api/medical-records/:id/share
// @desc    Share medical record with doctor
// @access  Private (Patient only)
router.post('/:id/share',
    requirePatient, // Only patients can share their records
    medicalRecordValidation.idParam, // Validate record ID
    medicalRecordValidation.shareRecord,
    medicalRecordController.shareRecord
);

// @route   DELETE /api/medical-records/:id/share/:doctorId
// @desc    Remove doctor's access to medical record
// @access  Private (Patient only)
router.delete('/:id/share/:doctorId',
    requirePatient, // Only patients can manage sharing of their records
    medicalRecordValidation.idParam, // Validate record ID
    medicalRecordValidation.doctorIdParam, // Validate doctor ID
    medicalRecordController.unshareRecord
);

// @route   GET /api/medical-records/:id/download
// @desc    Download medical record PDF
// @access  Private
router.get('/:id/download',
    medicalRecordValidation.idParam, // Validate ID format
    medicalRecordController.downloadRecord
);


module.exports = router;