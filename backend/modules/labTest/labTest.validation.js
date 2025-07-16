const { body, query, param } = require('express-validator');

const validateLabTestBooking = [
  body('testName').notEmpty().withMessage('Test name is required'),
  body('testCategory').isIn([
    'blood_test', 'urine_test', 'stool_test', 'x_ray', 'mri_scan', 'ct_scan',
    'ultrasound', 'ecg', 'echocardiogram', 'endoscopy', 'biopsy', 'culture_test',
    'genetic_test', 'allergy_test', 'hormone_test', 'other'
  ]).withMessage('Invalid test category'),
  body('lab').isMongoId().withMessage('Valid lab ID is required'),
  body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('cost.amount').isFloat({ gt: 0 }).withMessage('Test cost must be a positive number'),
  body('doctor').optional().isMongoId().withMessage('Valid doctor ID is required if provided'),
  body('appointment').optional().isMongoId().withMessage('Valid appointment ID is required if provided'),
  body('description').optional().isString(),
  body('instructions.preparation').optional().isArray().withMessage('Preparation instructions must be an array of strings'),
  body('instructions.fasting.required').optional().isBoolean(),
  body('instructions.fasting.duration').optional().isString(),
  body('instructions.specialInstructions').optional().isArray().withMessage('Special instructions must be an array of strings'),
  body('instructions.medications').optional().isArray().withMessage('Medications must be an array of strings'),
  body('instructions.restrictions').optional().isArray().withMessage('Restrictions must be an array of strings'),
  body('cost.discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'mobile_banking', 'insurance']).withMessage('Invalid payment method'),
  body('priority').optional().isIn(['routine', 'urgent', 'emergency']).withMessage('Invalid priority'),
  body('isEmergency').optional().isBoolean()
];


const validateLabTestStatusUpdate = [
  body('status').isIn(['booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
  body('notes').optional().isString()
];

const validateLabTestResultsUpload = [
  body('results').isArray().notEmpty().withMessage('Test results are required and must be an array'),
  body('results.*.parameter').notEmpty().withMessage('Result parameter name is required'),
  body('results.*.value').notEmpty().withMessage('Result value is required'),
  body('results.*.unit').optional().isString(),
  body('results.*.normalRange').optional().isString(),
  body('results.*.isAbnormal').optional().isBoolean(),
  body('results.*.isCritical').optional().isBoolean(),
  body('results.*.notes').optional().isString(),
  // Add validation for file upload in the route, as express-validator doesn't directly handle `req.file`
];

const validateLabTestFilters = [
  query('status').optional().isIn(['booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status filter'),
  query('testCategory').optional().isIn([
    'blood_test', 'urine_test', 'stool_test', 'x_ray', 'mri_scan', 'ct_scan',
    'ultrasound', 'ecg', 'echocardiogram', 'endoscopy', 'biopsy', 'culture_test',
    'genetic_test', 'allergy_test', 'hormone_test', 'other'
  ]).withMessage('Invalid test category filter'),
  query('date').optional().isISO8601().withMessage('Invalid date filter (YYYY-MM-DD)'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const validateLabId = [
  param('id').isMongoId().withMessage('Invalid Lab Test ID')
];

const validatePatientLabTestFilters = [
  param('patientId').isMongoId().withMessage('Invalid Patient ID'),
  query('status').optional().isIn(['booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const validateLabStatisticsQuery = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date (YYYY-MM-DD)'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date (YYYY-MM-DD)')
];

const validateLabListingFilters = [
  query('city').optional().isString().trim().notEmpty().withMessage('City must be a non-empty string'),
  query('testCategory').optional().isIn([
    'blood_test', 'urine_test', 'stool_test', 'x_ray', 'mri_scan', 'ct_scan',
    'ultrasound', 'ecg', 'echocardiogram', 'endoscopy', 'biopsy', 'culture_test',
    'genetic_test', 'allergy_test', 'hormone_test', 'other'
  ]).withMessage('Invalid test category filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['rating', 'name', 'city']).withMessage('Invalid sortBy parameter'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sortOrder parameter')
];

const validateLabScheduleQuery = [
  query('date').isISO8601().withMessage('Valid date (YYYY-MM-DD) is required for schedule')
];


module.exports = {
  validateLabTestBooking,
  validateLabTestStatusUpdate,
  validateLabTestResultsUpload,
  validateLabTestFilters,
  validateLabId,
  validatePatientLabTestFilters,
  validateLabStatisticsQuery,
  validateLabListingFilters,
  validateLabScheduleQuery
};