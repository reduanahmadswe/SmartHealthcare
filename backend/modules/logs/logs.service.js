
const ActivityLog = require('./logs.model'); 

const logsService = {
    /**
     * Retrieves system activity logs based on filters and pagination.
     * @param {object} filters - Filters for logs (action, userRole, resourceType, severity, status, startDate, endDate).
     * @param {number} page - Current page number.
     * @param {number} limit - Number of logs per page.
     * @returns {Promise<object>} Object containing logs and pagination info.
     */
    getSystemActivityLogs: async (filters, page = 1, limit = 50) => {
        const queryFilters = {};

        if (filters.action) queryFilters.action = filters.action;
        if (filters.userRole) queryFilters.userRole = filters.userRole;
        if (filters.resourceType) queryFilters.resourceType = filters.resourceType;
        if (filters.severity) queryFilters.severity = filters.severity;
        if (filters.status) queryFilters.status = filters.status;
        if (filters.startDate) queryFilters.createdAt = {
            $gte: new Date(filters.startDate)
        };
        if (filters.endDate) {
            if (queryFilters.createdAt) {
                queryFilters.createdAt.$lte = new Date(filters.endDate);
            } else {
                queryFilters.createdAt = {
                    $lte: new Date(filters.endDate)
                };
            }
        }

        const logs = await ActivityLog.getSystemActivity(queryFilters, limit, (page - 1) * limit);
        const total = await ActivityLog.countDocuments(queryFilters);

        return {
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Retrieves activity history for a specific user.
     * @param {string} userId - The ID of the user.
     * @param {number} page - Current page number.
     * @param {number} limit - Number of logs per page.
     * @returns {Promise<object>} Object containing user logs and pagination info.
     */
    getUserActivityHistory: async (userId, page = 1, limit = 50) => {
        const logs = await ActivityLog.getUserActivity(userId, limit, (page - 1) * limit);
        const total = await ActivityLog.countDocuments({
            user: userId
        });

        return {
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Gets activity summary statistics for a given date range.
     * @param {string} startDate - Start date for the summary (ISO 8601 string).
     * @param {string} endDate - End date for the summary (ISO 8601 string).
     * @returns {Promise<object>} Object containing summary data.
     */
    getActivitySummary: async (startDate, endDate) => {
        const summary = await ActivityLog.getActivitySummary(startDate, endDate);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayCount = await ActivityLog.countDocuments({
            createdAt: {
                $gte: today
            }
        });

        const yesterdayCount = await ActivityLog.countDocuments({
            createdAt: {
                $gte: yesterday,
                $lt: today
            }
        });

        const errorCount = await ActivityLog.countDocuments({
            $or: [{
                status: 'failure'
            }, {
                severity: 'critical'
            }]
        });

        const securityCount = await ActivityLog.countDocuments({
            $or: [{
                action: {
                    $regex: /login|logout|auth|password|security/i
                }
            }, {
                severity: {
                    $in: ['high', 'critical']
                }
            }]
        });

        return {
            summary,
            todayCount,
            yesterdayCount,
            errorCount,
            securityCount,
            period: {
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            }
        };
    },

    /**
     * Retrieves error logs.
     * @param {number} page - Current page number.
     * @param {number} limit - Number of logs per page.
     * @returns {Promise<object>} Object containing error logs and pagination info.
     */
    getErrorLogs: async (page = 1, limit = 50) => {
        const errorLogs = await ActivityLog.getErrorLogs(limit); // Assuming getErrorLogs already handles sorting and limit
        const total = await ActivityLog.countDocuments({
            $or: [{
                status: 'failure'
            }, {
                severity: 'critical'
            }, {
                'errorDetails.message': {
                    $exists: true,
                    $ne: null
                }
            }]
        });

        return {
            errorLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalErrors: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Retrieves security events.
     * @param {number} page - Current page number.
     * @param {number} limit - Number of logs per page.
     * @returns {Promise<object>} Object containing security events and pagination info.
     */
    getSecurityEvents: async (page = 1, limit = 50) => {
        const securityEvents = await ActivityLog.getSecurityEvents(limit); // Assuming getSecurityEvents already handles sorting and limit
        const total = await ActivityLog.countDocuments({
            $or: [{
                action: {
                    $regex: /login|logout|auth|password|security/i
                }
            }, {
                severity: {
                    $in: ['high', 'critical']
                }
            }, {
                'metadata.securityEvent': true
            }]
        });

        return {
            securityEvents,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalEvents: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Exports logs to CSV or JSON format.
     * @param {object} filters - Filters for logs.
     * @param {string} format - 'json' or 'csv'.
     * @returns {Promise<string|object[]>} CSV string or array of log objects.
     */
    exportLogs: async (filters, format = 'json') => {
        // Fetch all logs matching filters (up to a large limit for export)
        const logs = await ActivityLog.getSystemActivity(filters, 100000, 0); // Increased limit for export

        if (format === 'csv') {
            return logsService.convertToCSV(logs); // Use the internal helper
        }

        return logs;
    },

    /**
     * Cleans up old activity logs.
     * @param {number} daysToKeep - Number of days to keep logs.
     * @returns {Promise<object>} Result of the deletion operation.
     */
    cleanupOldLogs: async (daysToKeep = 90) => {
        const result = await ActivityLog.cleanOldLogs(daysToKeep);
        return {
            deletedCount: result.deletedCount,
            daysKept: daysToKeep
        };
    },

    /**
     * Helper function to convert logs to CSV format.
     * @param {Array<object>} logs - Array of activity log documents.
     * @returns {string} CSV formatted string.
     */
    convertToCSV: (logs) => {
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
                log.createdAt ? log.createdAt.toISOString() : '', // Ensure date is formatted
                log.action || '',
                `"${(log.description || '').replace(/"/g, '""')}"`, // Escape double quotes
                (log.user && log.user.firstName && log.user.lastName) ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
                log.userRole || '',
                log.userEmail || '',
                log.resourceType || 'N/A',
                log.resourceId ? log.resourceId.toString() : 'N/A',
                log.severity || '',
                log.status || '',
                log.userIP || 'N/A',
                `"${(log.userAgent || 'N/A').replace(/"/g, '""')}"`, // Escape double quotes
                log.duration !== undefined && log.duration !== null ? log.duration : 'N/A'
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }
};

module.exports = logsService;