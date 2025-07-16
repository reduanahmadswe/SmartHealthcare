// D:\SmartHealthcare\backend\validations\appointment.validation.js
const { body } = require('express-validator');

const appointmentValidation = {
    bookAppointment: [
        body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
        body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
        body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
        body('appointmentType').isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination']).withMessage('Invalid appointment type'),
        body('appointmentMode').isIn(['in_person', 'video_call', 'chat']).withMessage('Invalid appointment mode'),
        body('symptoms').optional().isArray().withMessage('Symptoms must be an array of strings'),
        body('patientNotes').optional().isString().withMessage('Patient notes must be a string'),
        body('isEmergency').optional().isBoolean().withMessage('Is emergency must be a boolean')
    ],
    updateStatus: [
        body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid appointment status'),
        body('notes').optional().isString().withMessage('Notes must be a string')
    ],
    rescheduleAppointment: [
        body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
        body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    cancelAppointment: [
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    rateAppointment: [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('review').optional().isString().withMessage('Review must be a string')
    ],
    updateConsultationNotes: [
        body('diagnosis').optional().isString().withMessage('Diagnosis must be a string'),
        body('treatment').optional().isString().withMessage('Treatment must be a string'),
        body('followUp').optional().isString().withMessage('Follow-up notes must be a string'),
        body('signature').optional().isString().withMessage('Signature must be a string'),
    ]
};

module.exports = appointmentValidation;