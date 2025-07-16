// D:\SmartHealthcare\backend\middleware\validation\admin.validation.js
const { body, query } = require('express-validator');

// Validation for /api/admin/dashboard
const validateDashboardQuery = [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date format (YYYY-MM-DD)'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format (YYYY-MM-DD)'),
];

// Validation for /api/admin/users
const validateUserFilters = [
    query('role').optional().isIn(['patient', 'doctor', 'lab', 'admin']).withMessage('Invalid user role'),
    query('status').optional().isIn(['verified', 'unverified', 'active', 'inactive']).withMessage('Invalid user status'),
    query('search').optional().isString().trim().escape().withMessage('Search query must be a string'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
    query('sortBy').optional().isString().withMessage('SortBy must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be "asc" or "desc"'),
];

// Validation for /api/admin/users/:id/verify
const validateUserVerificationUpdate = [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be either "approved" or "rejected"'),
    body('reason').optional().isString().trim().withMessage('Reason must be a string'),
];

// Validation for /api/admin/users/:id/status
const validateUserStatusUpdate = [
    body('isActive').isBoolean().withMessage('Active status must be a boolean (true/false)'),
];

// Validation for /api/admin/appointments
const validateAppointmentFilters = [
    query('status').optional().isString().trim().withMessage('Status must be a string'),
    query('date').optional().isISO8601().toDate().withMessage('Invalid date format (YYYY-MM-DD)'),
    query('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
    query('patientId').optional().isMongoId().withMessage('Invalid patient ID'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
];

// Validation for /api/admin/analytics
const validateAnalyticsQuery = [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date format (YYYY-MM-DD)'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format (YYYY-MM-DD)'),
    query('groupBy').optional().isIn(['day', 'month']).withMessage('Group by must be "day" or "month"'),
];

// Validation for /api/admin/broadcast-email
const validateBroadcastEmail = [
    body('subject').notEmpty().withMessage('Subject is required').isString().trim(),
    body('message').notEmpty().withMessage('Message is required').isString().trim(),
    body('recipients').isIn(['all', 'patients', 'doctors', 'admins']).withMessage('Valid recipients (all, patients, doctors, admins) required'),
    // 'role' is optional and used internally for specific recipient filtering,
    // not directly validated from input in the original code, but if it were user-controlled:
    // body('role').optional().isString().withMessage('Role must be a string'),
];

// Validation for /api/admin/doctors/reject/:id
const validateDoctorRejection = [
    body('rejectionReason').notEmpty().withMessage('Rejection reason is required').isString().trim(),
];

// Validation for /api/admin/doctors/unverified
const validateUnverifiedDoctorsQuery = [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
];

// Validation for /api/admin/logs
const validateLogsQuery = [
    query('level').optional().isString().trim().withMessage('Log level must be a string'),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date format (YYYY-MM-DD)'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format (YYYY-MM-DD)'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
];


module.exports = {
    validateDashboardQuery,
    validateUserFilters,
    validateUserVerificationUpdate,
    validateUserStatusUpdate,
    validateAppointmentFilters,
    validateAnalyticsQuery,
    validateBroadcastEmail,
    validateDoctorRejection,
    validateUnverifiedDoctorsQuery,
    validateLogsQuery
};