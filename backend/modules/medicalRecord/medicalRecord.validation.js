const { body, query, param } = require('express-validator');

const medicalRecordValidation = {
    createRecord: [
        body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
        body('recordType').isIn([
            'lab_report', 'x_ray', 'mri_scan', 'ct_scan', 'ultrasound', 'ecg', 'blood_test', 'urine_test',
            'prescription', 'discharge_summary', 'operation_report', 'vaccination_record',
            'growth_chart', 'dental_record', 'eye_test', 'surgery_record', 'consultation_note', 'other'
        ]).withMessage('Valid record type is required'),
        body('recordDate').isISO8601().toDate().withMessage('Valid record date is required (YYYY-MM-DD)'),
        body('description').optional().isString().trim(),
        body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
        body('tags.*').optional().isString().trim().notEmpty().withMessage('Each tag must be a non-empty string'),
        body('patientId').optional().isMongoId().withMessage('Valid patient ID is required if creating for another patient (doctor only)'),
        // Validation for nested objects (expecting JSON strings if form-data)
        body('vitals').optional().isJSON().withMessage('Vitals must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('testResults').optional().isJSON().withMessage('Test Results must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('diagnosis').optional().isJSON().withMessage('Diagnosis must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('medications').optional().isJSON().withMessage('Medications must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('procedures').optional().isJSON().withMessage('Procedures must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('allergies').optional().isJSON().withMessage('Allergies must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('familyHistory').optional().isJSON().withMessage('Family History must be a valid JSON string').customSanitizer(value => JSON.parse(value)),
        body('doctor').optional().isMongoId().withMessage('Doctor ID must be a valid Mongo ID'),
        body('appointment').optional().isMongoId().withMessage('Appointment ID must be a valid Mongo ID'),
        body('category').optional().isIn([
            'diagnostic', 'treatment', 'preventive', 'emergency', 'routine',
            'specialist', 'surgery', 'therapy'
        ]).withMessage('Valid category is required'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority is required'),
        body('location').optional().isString().trim(),
        body('department').optional().isString().trim(),
    ],

    getRecords: [
        query('recordType').optional().isIn([
            'lab_report', 'x_ray', 'mri_scan', 'ct_scan', 'ultrasound', 'ecg', 'blood_test', 'urine_test',
            'prescription', 'discharge_summary', 'operation_report', 'vaccination_record',
            'growth_chart', 'dental_record', 'eye_test', 'surgery_record', 'consultation_note', 'other'
        ]).withMessage('Invalid record type filter'),
        query('date').optional().isISO8601().toDate().withMessage('Date filter must be a valid ISO 8601 date'),
        query('tags').optional().isString().trim().withMessage('Tags filter must be a comma-separated string'),
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
        query('category').optional().isIn([
            'diagnostic', 'treatment', 'preventive', 'emergency', 'routine',
            'specialist', 'surgery', 'therapy'
        ]).withMessage('Invalid category filter'),
        query('status').optional().isIn(['active', 'archived']).withMessage('Invalid status filter (only active or archived)'),
        query('searchTerm').optional().isString().trim().withMessage('Search term must be a string'),
        query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO 8601 date'),
        query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO 8601 date')
    ],

    updateRecord: [
        body('title').optional().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
        body('description').optional().isString().trim(),
        body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
        body('tags.*').optional().isString().trim().notEmpty().withMessage('Each tag must be a non-empty string'),
        // Validate nested objects as JSON or directly if parsed by body-parser for non-form-data
        body('vitals').optional().isObject().withMessage('Vitals must be an object'),
        body('testResults').optional().isObject().withMessage('Test Results must be an object'),
        body('diagnosis').optional().isObject().withMessage('Diagnosis must be an object'),
        body('medications').optional().isArray().withMessage('Medications must be an array'),
        body('procedures').optional().isArray().withMessage('Procedures must be an array'),
        body('allergies').optional().isArray().withMessage('Allergies must be an array'),
        body('familyHistory').optional().isArray().withMessage('Family History must be an array'),
        body('status').optional().isIn(['active', 'archived', 'deleted']).withMessage('Invalid status'),
        body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
        body('accessLevel').optional().isIn(['patient_only', 'doctor_patient', 'all_doctors']).withMessage('Invalid access level'),
        body('category').optional().isIn([
            'diagnostic', 'treatment', 'preventive', 'emergency', 'routine',
            'specialist', 'surgery', 'therapy'
        ]).withMessage('Valid category is required'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority is required'),
        body('location').optional().isString().trim(),
        body('department').optional().isString().trim(),
        body('insurance.provider').optional().isString().trim(),
        body('insurance.policyNumber').optional().isString().trim(),
        body('insurance.claimNumber').optional().isString().trim(),
        body('insurance.amount').optional().isNumeric().toFloat().withMessage('Insurance amount must be a number'),
        body('insurance.status').optional().isIn(['pending', 'approved', 'rejected', 'paid']).withMessage('Invalid insurance status'),
    ],

    shareRecord: [
        body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
        body('permission').optional().isIn(['view', 'edit', 'full_access', 'read']).withMessage('Invalid permission level') // Corrected from permissions to permission
    ],

    getStatistics: [
        query('startDate').optional().isISO8601().toDate().withMessage('Start date filter must be a valid ISO 8601 date'),
        query('endDate').optional().isISO8601().toDate().withMessage('End date filter must be a valid ISO 8601 date')
    ],

    // Validate ID parameters for routes like /:id
    idParam: [
        param('id').isMongoId().withMessage('Invalid Medical Record ID')
    ],
    // Validate patientId parameter for doctor access
    patientIdParam: [
        param('patientId').isMongoId().withMessage('Invalid Patient ID')
    ],
    // Validate doctorId parameter for unsharing
    doctorIdParam: [
        param('doctorId').isMongoId().withMessage('Invalid Doctor ID')
    ]
};

module.exports = medicalRecordValidation;