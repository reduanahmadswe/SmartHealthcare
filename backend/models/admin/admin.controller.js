// D:\SmartHealthcare\backend\controllers\admin.controller.js
const AdminService = require('./admin.service');
const { validationResult } = require('express-validator');

class AdminController {
    /**
     * Get admin dashboard statistics.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getDashboardStatistics(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        try {
            const dashboardData = await AdminService.getDashboardStatistics(start, end);
            res.json({
                success: true,
                data: {
                    period: { start, end },
                    ...dashboardData
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all users with pagination and filters.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getAllUsers(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { role, status, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        try {
            const { users, pagination } = await AdminService.getAllUsers({
                role, status, search, page, limit, sortBy, sortOrder
            });
            res.json({
                success: true,
                data: {
                    users,
                    pagination
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user details by ID.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getUserById(req, res, next) {
        const userId = req.params.id;
        try {
            const user = await AdminService.getUserById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, data: { user } });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify or reject a user's verification status.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async updateUserVerificationStatus(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { status, reason } = req.body;
        const userId = req.params.id;
        const adminId = req.user._id; // Assuming req.user is set by authenticateToken

        try {
            const user = await AdminService.updateUserVerificationStatus(userId, status, reason, adminId);
            res.json({
                success: true,
                message: `User ${status} successfully`,
                data: { user }
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    /**
     * Update user active status.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async updateUserStatus(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { isActive } = req.body;
        const userId = req.params.id;

        try {
            const user = await AdminService.updateUserStatus(userId, isActive);
            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: { user }
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    /**
     * Get all appointments with filters.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getAllAppointments(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { status, date, doctorId, patientId, page = 1, limit = 10 } = req.query;

        try {
            const { appointments, pagination } = await AdminService.getAllAppointments({
                status, date, doctorId, patientId, page, limit
            });
            res.json({
                success: true,
                data: {
                    appointments,
                    pagination
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed analytics.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getDetailedAnalytics(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { startDate, endDate, groupBy = 'day' } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        try {
            const analyticsData = await AdminService.getDetailedAnalytics(start, end, groupBy);
            res.json({
                success: true,
                data: {
                    period: { start, end },
                    ...analyticsData
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get system health metrics.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getSystemHealthMetrics(req, res, next) {
        try {
            const systemHealthData = await AdminService.getSystemHealthMetrics();
            res.json({
                success: true,
                data: systemHealthData
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send broadcast email to users.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async sendBroadcastEmail(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject, message, recipients } = req.body;

        try {
            const result = await AdminService.sendBroadcastEmail(subject, message, recipients);
            res.json({
                success: true,
                message: 'Broadcast email sent',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unverified doctors.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getUnverifiedDoctors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { page = 1, limit = 10 } = req.query;

        try {
            const { doctors, pagination } = await AdminService.getUnverifiedDoctors({ page, limit });
            res.json({
                success: true,
                data: {
                    doctors,
                    pagination
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify a doctor.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async verifyDoctor(req, res, next) {
        const doctorId = req.params.id;
        const { verificationNotes } = req.body;
        const adminId = req.user._id; // Assuming req.user is set by authenticateToken

        try {
            const doctor = await AdminService.verifyDoctor(doctorId, verificationNotes, adminId);
            res.json({
                success: true,
                message: 'Doctor verified successfully',
                data: { doctor }
            });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('not a doctor') || error.message.includes('already verified')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    /**
     * Reject a doctor verification.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async rejectDoctorVerification(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const doctorId = req.params.id;
        const { rejectionReason } = req.body;

        try {
            const doctor = await AdminService.rejectDoctorVerification(doctorId, rejectionReason);
            res.json({
                success: true,
                message: 'Doctor verification rejected',
                data: { doctor }
            });
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('not a doctor') || error.message.includes('already verified')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    }

    /**
     * Get system logs.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    static async getSystemLogs(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { level, startDate, endDate, page = 1, limit = 100 } = req.query;

        try {
            const { logs, pagination } = await AdminService.getSystemLogs({ level, startDate, endDate, page, limit });
            res.json({
                success: true,
                data: {
                    logs,
                    pagination
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;