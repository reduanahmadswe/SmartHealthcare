const { query, param } = require('express-validator');

const logsValidation = {
    getSystemLogs: [
        query('action').optional().isString().trim().withMessage('Action filter must be a string'),
        query('userRole').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Invalid user role filter'),
        query('resourceType').optional().isString().trim().withMessage('Resource type filter must be a string'),
        query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity filter'),
        query('status').optional().isIn(['success', 'failure', 'pending', 'cancelled']).withMessage('Invalid status filter'),
        query('startDate').optional().isISO8601().toDate().withMessage('Start date filter must be a valid ISO 8601 date'),
        query('endDate').optional().isISO8601().toDate().withMessage('End date filter must be a valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
        query('sortBy').optional().isString().trim().withMessage('Sort by field must be a string'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"')
    ],
    getUserLogs: [
        param('userId').isMongoId().withMessage('Valid User ID is required'),
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer')
    ],
    getSummary: [
        query('startDate').optional().isISO8601().toDate().withMessage('Start date filter must be a valid ISO 8601 date'),
        query('endDate').optional().isISO8601().toDate().withMessage('End date filter must be a valid ISO 8601 date')
    ],
    getErrorOrSecurityLogs: [ // Reusable for both error and security logs
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer')
    ],
    exportLogs: [
        query('startDate').optional().isISO8601().toDate().withMessage('Start date filter must be a valid ISO 8601 date'),
        query('endDate').optional().isISO8601().toDate().withMessage('End date filter must be a valid ISO 8601 date'),
        query('format').optional().isIn(['json', 'csv']).withMessage('Format must be "json" or "csv"')
    ],
    cleanupLogs: [
        query('daysToKeep').optional().isInt({ min: 0 }).toInt().withMessage('Days to keep must be a non-negative integer')
    ]
};

module.exports = logsValidation;