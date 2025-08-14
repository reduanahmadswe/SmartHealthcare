// D:\SmartHealthcare\backend\routes\admin.route.js
const express = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const AdminController = require('./admin.controller');
const {
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
} = require('./admin.validation');
const adminMiddleware = require('../../middleware/adminMiddleware');

const router = express.Router();

// All admin routes should use authenticateToken and requireAdmin
router.use(authenticateToken, requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', validateDashboardQuery, asyncHandler(AdminController.getDashboardStatistics));



// @route   GET /api/admin/pending-doctors
// @desc    Get all pending doctor registrations
// @access  Private (Admin only)
router.get('/pending-doctors', adminMiddleware,asyncHandler(AdminController.getPendingDoctors));

// @route   PATCH /api/admin/approve-doctor/:id
// @desc    Approve a doctor registration
// @access  Private (Admin only)
router.patch('/approve-doctor/:id',adminMiddleware, asyncHandler(AdminController.approveDoctor));

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', validateUserFilters, asyncHandler(AdminController.getAllUsers));

// @route   GET /api/admin/users/:id
// @desc    Get user details by ID
// @access  Private (Admin only)
router.get('/users/:id', asyncHandler(AdminController.getUserById));

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify user (Admin only)
// @access  Private (Admin only)
router.put('/users/:id/verify', validateUserVerificationUpdate, asyncHandler(AdminController.updateUserVerificationStatus));

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin only)
router.put('/users/:id/status', validateUserStatusUpdate, asyncHandler(AdminController.updateUserStatus));

// @route   GET /api/admin/appointments
// @desc    Get all appointments with filters
// @access  Private (Admin only)
router.get('/appointments', validateAppointmentFilters, asyncHandler(AdminController.getAllAppointments));

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin only)
router.get('/analytics', validateAnalyticsQuery, asyncHandler(AdminController.getDetailedAnalytics));

// @route   GET /api/admin/system-health
// @desc    Get system health metrics
// @access  Private (Admin only)
router.get('/system-health', asyncHandler(AdminController.getSystemHealthMetrics));

// @route   POST /api/admin/broadcast-email
// @desc    Send broadcast email to users
// @access  Private (Admin only)
router.post('/broadcast-email', validateBroadcastEmail, asyncHandler(AdminController.sendBroadcastEmail));

// @route   GET /api/admin/doctors/unverified
// @desc    Get unverified doctors
// @access  Private (Admin only)
router.get('/doctors/unverified', validateUnverifiedDoctorsQuery, asyncHandler(AdminController.getUnverifiedDoctors));

// @route   POST /api/admin/doctors/verify/:id
// @desc    Verify a doctor
// @access  Private (Admin only)
router.post('/doctors/verify/:id', asyncHandler(AdminController.verifyDoctor)); // No specific validation for body in original, so keeping it simple

// @route   POST /api/admin/doctors/reject/:id
// @desc    Reject a doctor verification
// @access  Private (Admin only)
router.post('/doctors/reject/:id', validateDoctorRejection, asyncHandler(AdminController.rejectDoctorVerification));

// @route   GET /api/admin/logs
// @desc    Get system logs
// @access  Private (Admin only)
router.get('/logs', validateLogsQuery, asyncHandler(AdminController.getSystemLogs));


module.exports = router;