const { body } = require('express-validator');

exports.healthGoalsValidation = [
    body('goals').isArray().withMessage('Goals must be an array'),
    body('goals.*.type').isIn(['weight', 'blood_pressure', 'steps', 'sleep', 'medication', 'custom']).withMessage('Invalid goal type'),
    body('goals.*.target').notEmpty().withMessage('Target is required'),
    body('goals.*.deadline').isISO8601().withMessage('Valid deadline is required'),
    body('goals.*.description').optional().isString()
];