// user/user.validation.js
const { body } = require('express-validator');

exports.updateProfileValidator = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('address').optional().isObject(),
  body('emergencyContact').optional().isObject()
];

exports.updateHealthValidator = [
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('height').optional().isNumeric(),
  body('weight').optional().isNumeric(),
  body('allergies').optional().isArray(),
  body('chronicDiseases').optional().isArray(),
  body('currentMedications').optional().isArray(),
  body('familyHistory').optional().isArray()
];

exports.updatePreferencesValidator = [
  body('language').optional().isIn(['en', 'bn', 'hi']),
  body('theme').optional().isIn(['light', 'dark']),
  body('notifications.email').optional().isBoolean(),
  body('notifications.sms').optional().isBoolean(),
  body('notifications.push').optional().isBoolean()
];

exports.verifyPhoneValidator = [
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number')
];

exports.confirmPhoneValidator = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Please provide a 6-digit code')
];
