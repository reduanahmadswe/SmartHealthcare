const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../user/user.model'); 
const { sendEmail } = require('../../utils/emailService'); 

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Register a new user
exports.registerUser = async ({
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
}) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const user = new User({
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

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;

    await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - Smart Healthcare Assistant',
        template: 'emailVerification',
        context: {
            name: user.firstName,
            verificationUrl,
            expiryHours: 24
        }
    });

    const token = generateToken(user._id);
    return { user, token };
};

// Login user
exports.loginUser = async (email, password, ip, userAgent) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    await user.updateLastLogin(ip, userAgent);

    const token = generateToken(user._id);
    return { user, token };
};

// Verify email address
exports.verifyUserEmail = async (token) => {
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;

    if (user.role === 'patient') {
        user.isVerified = true;
    }

    await user.save();
    return user;
};

// Send password reset email
exports.sendPasswordResetEmail = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - Smart Healthcare Assistant',
        template: 'passwordReset',
        context: {
            name: user.firstName,
            resetUrl,
            expiryHours: 1
        }
    });
};

// Reset password
exports.resetUserPassword = async (token, newPassword) => {
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return user;
};

// Change password (authenticated)
exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    return user;
};

// Refresh JWT token
exports.refreshAuthToken = async (userId) => {
    const user = await User.findById(userId); // Assuming user is already loaded by auth middleware
    if (!user) {
        throw new Error('User not found'); // Should ideally not happen if authenticateToken works correctly
    }
    const token = generateToken(user._id);
    return { user, token };
};

// Resend email verification
exports.resendVerificationEmail = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    if (user.emailVerified) {
        throw new Error('Email is already verified');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;

    await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - Smart Healthcare Assistant',
        template: 'emailVerification',
        context: {
            name: user.firstName,
            verificationUrl,
            expiryHours: 24
        }
    });
};