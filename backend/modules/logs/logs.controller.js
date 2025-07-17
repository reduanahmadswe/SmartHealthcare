
const { validationResult } = require('express-validator');
const logsService = require('./logs.service');
const { asyncHandler } = require('../../middleware/errorHandler');

const logsController = {
    getSystemLogs: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { logs, pagination } = await logsService.getSystemActivityLogs(req.query, req.query.page, req.query.limit);

        res.json({
            success: true,
            data: {
                logs,
                pagination
            }
        });
    }),

    getUserLogs: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { logs, pagination } = await logsService.getUserActivityHistory(userId, req.query.page, req.query.limit);

        res.json({
            success: true,
            data: {
                logs,
                pagination
            }
        });
    }),

    getSummary: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { startDate, endDate } = req.query;
        const summaryData = await logsService.getActivitySummary(startDate, endDate);

        res.json({
            success: true,
            data: summaryData
        });
    }),

    getErrorLogs: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { errorLogs, pagination } = await logsService.getErrorLogs(req.query.page, req.query.limit);

        res.json({
            success: true,
            data: {
                errorLogs,
                pagination
            }
        });
    }),

    getSecurityEvents: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { securityEvents, pagination } = await logsService.getSecurityEvents(req.query.page, req.query.limit);

        res.json({
            success: true,
            data: {
                securityEvents,
                pagination
            }
        });
    }),

    exportLogs: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { startDate, endDate, format = 'json' } = req.query;
        const filters = { startDate, endDate };

        const exportedData = await logsService.exportLogs(filters, format);

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
            return res.send(exportedData);
        }

        res.json({
            success: true,
            data: exportedData
        });
    }),

    cleanupLogs: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { daysToKeep } = req.query;
        const result = await logsService.cleanupOldLogs(daysToKeep);

        res.json({
            success: true,
            message: `Cleaned up logs older than ${result.daysKept} days`,
            data: {
                deletedCount: result.deletedCount,
                daysKept: result.daysKept
            }
        });
    })
};

module.exports = logsController;