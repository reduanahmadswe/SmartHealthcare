// user/user.route.js
const express = require('express');

const controller = require('./user.controller');
const { authenticateToken, requirePatient } = require('../../middleware/auth');
const {
  updateProfileValidator,
  updateHealthValidator,
  updatePreferencesValidator,
  verifyPhoneValidator,
  confirmPhoneValidator
} = require('./user.validation');
const { asyncHandler } = require('../../middleware/errorHandler');



const router = express.Router(); 

// Profile routes
router.get('/profile', authenticateToken, asyncHandler(controller.getProfile));
router.put('/profile', authenticateToken, updateProfileValidator, asyncHandler(controller.updateProfile));
router.post('/profile-picture', authenticateToken, asyncHandler(controller.uploadProfilePicture));

// Health data
router.get('/health-data', authenticateToken, requirePatient, asyncHandler(controller.getHealthData));
router.put('/health-data', authenticateToken, requirePatient, updateHealthValidator, asyncHandler(controller.updateHealthData));

// Doctor listings
router.get('/doctors', asyncHandler(controller.getAllDoctors));
router.get('/doctors/:id', asyncHandler(controller.getDoctorById));
router.get('/doctors/:id/schedule', asyncHandler(controller.getDoctorSchedule));

// Preferences
router.put('/preferences', authenticateToken, updatePreferencesValidator, asyncHandler(controller.updatePreferences));

// Account management
router.delete('/account', authenticateToken, asyncHandler(controller.deactivateAccount));

// Phone verification
router.post('/verify-phone', authenticateToken, verifyPhoneValidator, asyncHandler(controller.verifyPhone));
router.post('/confirm-phone', authenticateToken, confirmPhoneValidator, asyncHandler(controller.confirmPhone));

module.exports = router;
