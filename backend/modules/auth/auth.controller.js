const { validationResult } = require('express-validator');
const authService = require('./auth.service');
const User = require('../user/user.model'); 

// Register a new user
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        gender,
        role,
        address,
        emergencyContact
    } = req.body;

    try {
        const { user, token } = await authService.registerUser({
            firstName,
            lastName,
            email,
            password,
            phone,
            dateOfBirth,
            gender,
            role,
            address,
            emergencyContact
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification.',
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
    } catch (error) {
        if (error.message === 'User with this email already exists') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// Login user
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
        const { user, token } = await authService.loginUser(email, password, ip, userAgent);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
    } catch (error) {
        if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated. Please contact support.') {
            return res.status(401).json({ success: false, message: error.message });
        }
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// Verify email address
exports.verifyEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { token } = req.body;

    try {
        const user = await authService.verifyUserEmail(token);
        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        if (error.message === 'Invalid or expired verification token') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Email verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during email verification' });
    }
};

// Send password reset email
exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email } = req.body;

    try {
        await authService.sendPasswordResetEmail(email);
        res.json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error during forgot password' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { token, password } = req.body;

    try {
        await authService.resetUserPassword(token, password);
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        if (error.message === 'Invalid or expired reset token') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error during password reset' });
    }
};

// Change password (authenticated)
exports.changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id; // User ID from authenticated token

    try {
        await authService.changeUserPassword(userId, currentPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error during password change' });
    }
};

// Refresh JWT token
exports.refreshToken = async (req, res) => {
    try {
        const { user, token } = await authService.refreshAuthToken(req.user._id); // req.user comes from authenticateToken middleware
        res.json({
            success: true,
            data: {
                token,
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ success: false, message: 'Server error during token refresh' });
    }
};

// Logout user
exports.logout = async (req, res) => {
    // No specific server-side action needed for JWT logout other than invalidating on client-side
    // For a more robust solution, implement token blacklisting in authService if needed.
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Get current user
exports.getMe = async (req, res) => {
    // req.user is populated by authenticateToken middleware
    res.json({
        success: true,
        data: {
            user: req.user.getPublicProfile()
        }
    });
};

// Resend email verification
exports.resendVerification = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email } = req.body;

    try {
        await authService.resendVerificationEmail(email);
        res.json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        if (error.message === 'User not found' || error.message === 'Email is already verified') {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Resend verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during resending verification email' });
    }
};