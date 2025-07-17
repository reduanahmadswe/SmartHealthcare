const express = require('express');
const { authenticateToken, requirePatient, requireDoctor } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const analyticsController = require('./analytics.controller');
const analyticsValidation = require('./analytics.validation');
const { body } = require('express-validator');

const router = express.Router();

// @route   GET /api/analytics/health-dashboard
// @desc    Get patient health analytics dashboard
// @access  Private (Patient only)
router.get('/health-dashboard', requirePatient, asyncHandler(analyticsController.getPatientHealthDashboard));

// @route   GET /api/analytics/doctor-dashboard
// @desc    Get doctor analytics dashboard
// @access  Private (Doctor only)
router.get('/doctor-dashboard', requireDoctor, asyncHandler(analyticsController.getDoctorDashboard));

// @route   GET /api/analytics/health-trends
// @desc    Get health trends over time
// @access  Private (Patient only)
router.get('/health-trends', requirePatient, asyncHandler(analyticsController.getHealthTrends));

// @route   GET /api/analytics/medication-adherence
// @desc    Get medication adherence analytics
// @access  Private (Patient only)
router.get('/medication-adherence', requirePatient, asyncHandler(analyticsController.getMedicationAdherence));

// @route   GET /api/analytics/vital-signs
// @desc    Get vital signs trends
// @access  Private (Patient only)
router.get('/vital-signs', requirePatient, asyncHandler(analyticsController.getVitalSignsTrends));

// @route   GET /api/analytics/vitals/:userId
// @desc    Get vitals analytics for a patient
// @access  Private (Patient, Doctor, Admin)
router.get('/vitals/:userId', asyncHandler(analyticsController.getVitalsAnalytics));

// @route   POST /api/analytics/health-goals
// @desc    Set health goals
// @access  Private (Patient only)
router.post('/health-goals', requirePatient, analyticsValidation.healthGoalsValidation, asyncHandler(analyticsController.setHealthGoals));

// @route   GET /api/analytics/health-goals
// @desc    Get health goals
// @access  Private (Patient only)
router.get('/health-goals', requirePatient, asyncHandler(analyticsController.getHealthGoals));

module.exports = router;