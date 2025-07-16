const express = require('express');
const LabTestController = require('./labTest.controller'); 
const {
  validateLabTestBooking,
  validateLabTestStatusUpdate,
  validateLabTestResultsUpload,
  validateLabTestFilters,
  validateLabId,
  validatePatientLabTestFilters,
  validateLabStatisticsQuery,
  validateLabListingFilters,
  validateLabScheduleQuery
} = require('./labTest.validation'); 
const { authenticateToken, requirePatient, requireDoctor, requireLab, requireAdmin } = require('../../middleware/auth'); //  auth middleware
const upload = require('../../middleware/upload'); 


const router = express.Router();

// @route   POST /api/lab-tests/book
// @desc    Book a new lab test
// @access  Private (Patient only)
router.post('/book', authenticateToken, requirePatient, validateLabTestBooking, LabTestController.bookLabTest);

// @route   GET /api/lab-tests
// @desc    Get lab tests for user (patient, doctor, lab, admin)
// @access  Private
router.get('/', authenticateToken, validateLabTestFilters, LabTestController.getLabTests);

// @route   GET /api/lab-tests/:id
// @desc    Get lab test by ID
// @access  Private (accessible by patient, lab, prescribing doctor, or admin)
router.get('/:id', authenticateToken, validateLabId, LabTestController.getLabTestById);

// @route   PUT /api/lab-tests/:id/status
// @desc    Update lab test status
// @access  Private (Lab only)
router.put('/:id/status', authenticateToken, requireLab, validateLabTestStatusUpdate, LabTestController.updateLabTestStatus);

// @route   POST /api/lab-tests/:id/results
// @desc    Upload lab test results
// @access  Private (Lab only)
// Note: 'reportFile' is the field name for the uploaded file in the form-data
router.post('/:id/results', authenticateToken, requireLab, upload.single('reportFile'), validateLabTestResultsUpload, LabTestController.uploadLabTestResults);

// @route   GET /api/lab-tests/labs
// @desc    Get all verified labs
// @access  Public
router.get('/labs', validateLabListingFilters, LabTestController.getVerifiedLabs);

// @route   GET /api/lab-tests/labs/:id
// @desc    Get lab profile by ID
// @access  Public
router.get('/labs/:id', validateLabId, LabTestController.getLabProfileById);

// @route   GET /api/lab-tests/labs/:id/schedule
// @desc    Get lab's available schedule
// @access  Public
router.get('/labs/:id/schedule', validateLabId, validateLabScheduleQuery, LabTestController.getLabSchedule);

// @route   GET /api/lab-tests/patient/:patientId
// @desc    Get lab tests for a specific patient (Doctor/Lab/Admin only)
// @access  Private (Doctor/Lab/Admin only)
router.get('/patient/:patientId', authenticateToken, validatePatientLabTestFilters, LabTestController.getLabTestsForPatient);

// @route   GET /api/lab-tests/statistics
// @desc    Get lab test statistics (for current user's role)
// @access  Private
router.get('/statistics', authenticateToken, validateLabStatisticsQuery, LabTestController.getLabTestStatistics);


module.exports = router;