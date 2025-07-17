const express = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { authenticateToken } = require('../../middleware/auth');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register',
    authValidation.registerValidation,
    asyncHandler(authController.register)
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
    authValidation.loginValidation,
    asyncHandler(authController.login)
);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email',
    authValidation.verifyEmailValidation,
    asyncHandler(authController.verifyEmail)
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password',
    authValidation.forgotPasswordValidation,
    asyncHandler(authController.forgotPassword)
);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password',
    authValidation.resetPasswordValidation,
    asyncHandler(authController.resetPassword)
);

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated)
// @access  Private
router.post('/change-password',
    authenticateToken,
    authValidation.changePasswordValidation,
    asyncHandler(authController.changePassword)
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token',
    authenticateToken,
    asyncHandler(authController.refreshToken)
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout',
    authenticateToken,
    asyncHandler(authController.logout)
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me',
    authenticateToken,
    asyncHandler(authController.getMe)
);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification',
    authValidation.resendVerificationValidation,
    asyncHandler(authController.resendVerification)
);

module.exports = router;