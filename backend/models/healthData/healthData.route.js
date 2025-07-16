const express = require('express');
const healthDataController = require('./healthData.controller'); 
const healthDataValidation = require('./healthData.validation'); 
const { authenticateToken, requirePatient, requireDoctor, requireAdmin } = require('../../middleware/auth'); 
const { logHealthDataActivity } = require('../../middleware/activityLogger'); 

const router = express.Router();

// @route   POST /api/health/add
// @desc    Add health data for a patient
// @access  Private (Patient, Doctor, Admin)
router.post(
    '/add',
    authenticateToken,
    healthDataValidation.addHealthData,
    logHealthDataActivity('add_health_data', 'Add health data'),
    healthDataController.addHealthData
);

// @route   GET /api/health/:userId
// @desc    Get health data for a specific user
// @access  Private (Patient can access own data, Doctor/Admin can access patient data)
router.get(
    '/:userId',
    authenticateToken,
    logHealthDataActivity('view_health_data', 'View health data'),
    healthDataController.getHealthData
);

// @route   GET /api/health/:userId/latest
// @desc    Get latest health data for a user
// @access  Private (Patient, Doctor, Admin)
router.get(
    '/:userId/latest',
    authenticateToken,
    logHealthDataActivity('view_latest_health_data', 'View latest health data'),
    healthDataController.getLatestHealthData
);

// @route   GET /api/health/:userId/vitals
// @desc    Get vitals history for charts
// @access  Private (Patient, Doctor, Admin)
router.get(
    '/:userId/vitals',
    authenticateToken,
    logHealthDataActivity('view_vitals_history', 'View vitals history'),
    healthDataController.getVitalsHistory
);

// @route   GET /api/health/:userId/abnormal
// @desc    Get abnormal health data records
// @access  Private (Patient, Doctor, Admin)
router.get(
    '/:userId/abnormal',
    authenticateToken,
    logHealthDataActivity('view_abnormal_health_data', 'View abnormal health data'),
    healthDataController.getAbnormalHealthData
);


// @route   PUT /api/health/:id
// @desc    Update health data record
// @access  Private (Patient can update own data, Doctor/Admin can update patient data)
router.put(
    '/:id',
    authenticateToken,
    healthDataValidation.updateHealthData,
    logHealthDataActivity('update_health_data', 'Update health data'),
    healthDataController.updateHealthData
);

// @route   DELETE /api/health/:id
// @desc    Delete health data record
// @access  Private (Patient can delete own data, Admin can delete any data)
router.delete(
    '/:id',
    authenticateToken,
    logHealthDataActivity('delete_health_data', 'Delete health data'),
    healthDataController.deleteHealthData
);

module.exports = router;