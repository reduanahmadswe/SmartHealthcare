const { body, query } = require('express-validator');

const doctorValidation = {
    registerDoctor: [
        body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
        body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Valid phone number is required'),
        body('dateOfBirth').isISO8601().toDate().withMessage('Valid date of birth (YYYY-MM-DD) is required'),
        body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
        body('specialization').isArray({ min: 1 }).withMessage('At least one specialization is required'),
        body('specialization.*').isString().trim().notEmpty().withMessage('Specialization must be a non-empty string'),
        body('experience').isNumeric().withMessage('Experience must be a number'),
        body('licenseNumber').notEmpty().withMessage('License number is required'),
        body('consultationFee').isNumeric().withMessage('Consultation fee must be a number'),
        body('address').isObject().withMessage('Address must be an object'),
        body('address.street').optional().isString().trim(),
        body('address.city').optional().isString().trim(),
        body('address.state').optional().isString().trim(),
        body('address.zipCode').optional().isString().trim(),
        body('education').optional().isArray().withMessage('Education must be an array'),
        body('certifications').optional().isArray().withMessage('Certifications must be an array')
    ],
    updateDoctorProfile: [
        body('specialization').optional().isArray().withMessage('Specialization must be an array'),
        body('specialization.*').optional().isString().trim().notEmpty().withMessage('Specialization must be a non-empty string'),
        body('experience').optional().isNumeric().withMessage('Experience must be a number'),
        body('consultationFee').optional().isNumeric().withMessage('Consultation fee must be a number'),
        body('education').optional().isArray().withMessage('Education must be an array'),
        body('certifications').optional().isArray().withMessage('Certifications must be an array'),
        body('availableSlots').optional().isArray().withMessage('Available slots must be an array')
    ],
    uploadCertificate: [
        body('certificateName').optional().isString().trim().withMessage('Certificate name must be a string'),
        body('issuingAuthority').optional().isString().trim().withMessage('Issuing authority must be a string'),
        body('issueDate').optional().isISO8601().toDate().withMessage('Issue date must be a valid date (YYYY-MM-DD)')
    ],
    getPendingVerification: [
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer')
    ],
    verifyDoctor: [
        body('status').isIn(['approved', 'rejected']).withMessage('Status must be either "approved" or "rejected"'),
        body('reason').optional().isString().trim().withMessage('Reason must be a string')
    ],
    getDoctorAppointments: [
        query('status').optional().isString().trim().withMessage('Status must be a string'),
        query('date').optional().isISO8601().toDate().withMessage('Invalid date format (YYYY-MM-DD)'),
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer')
    ],
    updateDoctorSchedule: [
        body('availableSlots').isArray().withMessage('Available slots must be an array')
    ],
    getDoctorStatistics: [
        query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date format (YYYY-MM-DD)'),
        query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format (YYYY-MM-DD)')
    ]
};

module.exports = doctorValidation;