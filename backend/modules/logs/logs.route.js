
const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 
const { logAdminActivity } = require('../../middleware/activityLogger'); 
const logsValidation = require('./logs.validation');
const logsController = require('./logs.controller'); 

const router = express.Router();

// All log routes require admin authentication
router.use(authenticateToken, requireAdmin);

// @route   GET /api/logs/admin
// @desc    Get system activity logs for admin
// @access  Private (Admin only)
router.get('/admin',
    logsValidation.getSystemLogs,
    logAdminActivity('view_admin_logs', 'View admin logs'),
    logsController.getSystemLogs
);

// @route   GET /api/logs/user/:userId
// @desc    Get user activity history
// @access  Private (Admin only)
router.get('/user/:userId',
    logsValidation.getUserLogs,
    logAdminActivity('view_user_logs', 'View user logs'),
    logsController.getUserLogs
);

// @route   GET /api/logs/summary
// @desc    Get activity summary statistics
// @access  Private (Admin only)
router.get('/summary',
    logsValidation.getSummary,
    logAdminActivity('view_logs_summary', 'View logs summary'),
    logsController.getSummary
);

// @route   GET /api/logs/errors
// @desc    Get error logs
// @access  Private (Admin only)
router.get('/errors',
    logsValidation.getErrorOrSecurityLogs,
    logAdminActivity('view_error_logs', 'View error logs'),
    logsController.getErrorLogs
);

// @route   GET /api/logs/security
// @desc    Get security events
// @access  Private (Admin only)
router.get('/security',
    logsValidation.getErrorOrSecurityLogs,
    logAdminActivity('view_security_logs', 'View security logs'),
    logsController.getSecurityEvents
);

// @route   GET /api/logs/export
// @desc    Export logs to CSV/JSON
// @access  Private (Admin only)
router.get('/export',
    logsValidation.exportLogs,
    logAdminActivity('export_logs', 'Export logs'),
    logsController.exportLogs
);

// @route   DELETE /api/logs/cleanup
// @desc    Clean up old logs
// @access  Private (Admin only)
router.delete('/cleanup',
    logsValidation.cleanupLogs,
    logAdminActivity('cleanup_logs', 'Cleanup old logs'),
    logsController.cleanupLogs
);

module.exports = router;