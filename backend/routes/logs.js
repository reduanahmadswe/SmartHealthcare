const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAdminActivity } = require('../middleware/activityLogger');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// @route   GET /api/logs/admin
// @desc    Get system activity logs for admin
// @access  Private (Admin only)
router.get('/admin', logAdminActivity('view_admin_logs', 'View admin logs'), asyncHandler(async (req, res) => {
  const {
    action,
    userRole,
    resourceType,
    severity,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filters = {};
  
  if (action) filters.action = action;
  if (userRole) filters.userRole = userRole;
  if (resourceType) filters.resourceType = resourceType;
  if (severity) filters.severity = severity;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const logs = await ActivityLog.getSystemActivity(filters, limit, (page - 1) * limit);

  const total = await ActivityLog.countDocuments(filters);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/logs/user/:userId
// @desc    Get user activity history
// @access  Private (Admin only)
router.get('/user/:userId', logAdminActivity('view_user_logs', 'View user logs'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const logs = await ActivityLog.getUserActivity(userId, limit, (page - 1) * limit);
  const total = await ActivityLog.countDocuments({ user: userId });

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/logs/summary
// @desc    Get activity summary statistics
// @access  Private (Admin only)
router.get('/summary', logAdminActivity('view_logs_summary', 'View logs summary'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const summary = await ActivityLog.getActivitySummary(startDate, endDate);
  
  // Get recent activity counts
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayCount = await ActivityLog.countDocuments({
    createdAt: { $gte: today }
  });
  
  const yesterdayCount = await ActivityLog.countDocuments({
    createdAt: { $gte: yesterday, $lt: today }
  });

  // Get error logs count
  const errorCount = await ActivityLog.countDocuments({
    $or: [
      { status: 'failure' },
      { severity: 'critical' }
    ]
  });

  // Get security events count
  const securityCount = await ActivityLog.countDocuments({
    $or: [
      { action: { $regex: /login|logout|auth|password|security/i } },
      { severity: { $in: ['high', 'critical'] } }
    ]
  });

  res.json({
    success: true,
    data: {
      summary,
      todayCount,
      yesterdayCount,
      errorCount,
      securityCount,
      period: { startDate, endDate }
    }
  });
}));

// @route   GET /api/logs/errors
// @desc    Get error logs
// @access  Private (Admin only)
router.get('/errors', logAdminActivity('view_error_logs', 'View error logs'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const errorLogs = await ActivityLog.getErrorLogs(limit);
  const total = await ActivityLog.countDocuments({
    $or: [
      { status: 'failure' },
      { severity: 'critical' },
      { 'errorDetails.message': { $exists: true } }
    ]
  });

  res.json({
    success: true,
    data: {
      errorLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalErrors: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/logs/security
// @desc    Get security events
// @access  Private (Admin only)
router.get('/security', logAdminActivity('view_security_logs', 'View security logs'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const securityEvents = await ActivityLog.getSecurityEvents(limit);
  const total = await ActivityLog.countDocuments({
    $or: [
      { action: { $regex: /login|logout|auth|password|security/i } },
      { severity: { $in: ['high', 'critical'] } },
      { 'metadata.securityEvent': true }
    ]
  });

  res.json({
    success: true,
    data: {
      securityEvents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/logs/export
// @desc    Export logs to CSV
// @access  Private (Admin only)
router.get('/export', logAdminActivity('export_logs', 'Export logs'), asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  const filters = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const logs = await ActivityLog.getSystemActivity(filters, 10000, 0);

  if (format === 'csv') {
    const csv = convertToCSV(logs);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: logs
  });
}));

// @route   DELETE /api/logs/cleanup
// @desc    Clean up old logs
// @access  Private (Admin only)
router.delete('/cleanup', logAdminActivity('cleanup_logs', 'Cleanup old logs'), asyncHandler(async (req, res) => {
  const { daysToKeep = 90 } = req.query;

  const result = await ActivityLog.cleanOldLogs(daysToKeep);

  res.json({
    success: true,
    message: `Cleaned up logs older than ${daysToKeep} days`,
    data: {
      deletedCount: result.deletedCount,
      daysKept: daysToKeep
    }
  });
}));

// Helper function to convert logs to CSV
const convertToCSV = (logs) => {
  const headers = [
    'Timestamp',
    'Action',
    'Description',
    'User',
    'User Role',
    'User Email',
    'Resource Type',
    'Resource ID',
    'Severity',
    'Status',
    'IP Address',
    'User Agent',
    'Duration (ms)'
  ];

  const csvRows = [headers.join(',')];

  logs.forEach(log => {
    const row = [
      log.createdAt,
      log.action,
      `"${log.description}"`,
      log.user?.firstName + ' ' + log.user?.lastName || 'N/A',
      log.userRole,
      log.userEmail,
      log.resourceType || 'N/A',
      log.resourceId || 'N/A',
      log.severity,
      log.status,
      log.userIP || 'N/A',
      `"${log.userAgent || 'N/A'}"`,
      log.duration || 'N/A'
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

module.exports = router; 