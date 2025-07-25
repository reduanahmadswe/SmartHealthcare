// D:\SmartHealthcare\backend\validations\prescription.validation.js
const {
    body
} = require('express-validator');

class PrescriptionValidation {
    static createPrescription = [
        body('appointmentId')
            .isMongoId()
            .withMessage('Valid appointment ID is required'),
        body('diagnosis.primary')
            .notEmpty()
            .withMessage('Primary diagnosis is required'),
        body('medications')
            .isArray({
                min: 1
            })
            .withMessage('At least one medication is required'),
        body('medications.*.name')
            .notEmpty()
            .withMessage('Medication name is required'),
        body('medications.*.dosage.amount')
            .isNumeric()
            .withMessage('Dosage amount must be a number'),
        body('medications.*.dosage.unit')
            .notEmpty()
            .withMessage('Dosage unit is required'),
        body('medications.*.dosage.frequency')
            .notEmpty()
            .withMessage('Dosage frequency is required'),
        body('medications.*.dosage.duration')
            .notEmpty()
            .withMessage('Dosage duration is required'),
        body('digitalSignature.doctorSignature')
            .notEmpty()
            .withMessage('Digital signature is required'),
        body('digitalSignature.signatureHash') // This is generated by service, but if client sends it, validate it
            .optional()
            .isString()
            .withMessage('Signature hash must be a string'),
        body('diagnosis.secondary').optional().isArray().withMessage('Secondary diagnoses must be an array'),
        body('diagnosis.icd10Codes').optional().isArray().withMessage('ICD-10 codes must be an array'),
        body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
        body('clinicalNotes').optional().isString().withMessage('Clinical notes must be a string'),
        body('labTests').optional().isArray().withMessage('Lab tests must be an array'),
        body('lifestyleRecommendations.diet').optional().isArray().withMessage('Diet recommendations must be an array'),
        body('lifestyleRecommendations.exercise').optional().isArray().withMessage('Exercise recommendations must be an array'),
        body('lifestyleRecommendations.lifestyle').optional().isArray().withMessage('Lifestyle recommendations must be an array'),
        body('lifestyleRecommendations.restrictions').optional().isArray().withMessage('Restrictions must be an array'),
        body('followUp.required').optional().isBoolean().withMessage('Follow-up required must be a boolean'),
        body('followUp.date').optional().isISO8601().toDate().withMessage('Follow-up date must be a valid date'),
        body('followUp.type').optional().isIn(['in_person', 'video_call', 'phone_call']).withMessage('Invalid follow-up type'),
        body('patientInstructions.general').optional().isString().withMessage('General patient instructions must be a string'),
        body('patientInstructions.medicationInstructions').optional().isString().withMessage('Medication instructions must be a string'),
        body('patientInstructions.sideEffects').optional().isArray().withMessage('Side effects must be an array'),
        body('patientInstructions.emergencyContact').optional().isString().withMessage('Emergency contact must be a string'),
        body('patientInstructions.whenToSeekHelp').optional().isArray().withMessage('When to seek help must be an array'),
        body('digitalSignature')
            .exists()
            .withMessage('Digital signature object is required'),

        body('digitalSignature.doctorSignature')
            .notEmpty()
            .withMessage('Digital signature is required'),

    ];

    static updatePrescription = [
        body('diagnosis.primary').optional().notEmpty().withMessage('Primary diagnosis cannot be empty'),
        body('diagnosis.secondary').optional().isArray().withMessage('Secondary diagnoses must be an array'),
        body('diagnosis.icd10Codes').optional().isArray().withMessage('ICD-10 codes must be an array'),
        body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
        body('clinicalNotes').optional().isString().withMessage('Clinical notes must be a string'),
        body('medications').optional().isArray().withMessage('Medications must be an array'),
        body('medications.*.name').optional().notEmpty().withMessage('Medication name is required'),
        body('medications.*.dosage.amount').optional().isNumeric().withMessage('Dosage amount must be a number'),
        body('medications.*.dosage.unit').optional().notEmpty().withMessage('Dosage unit is required'),
        body('medications.*.dosage.frequency').optional().notEmpty().withMessage('Dosage frequency is required'),
        body('medications.*.dosage.duration').optional().notEmpty().withMessage('Dosage duration is required'),
        body('medications.*.route').optional().isIn(['oral', 'topical', 'inhalation', 'injection', 'other']).withMessage('Invalid medication route'),
        body('medications.*.quantity.amount').optional().isNumeric().withMessage('Quantity amount must be a number'),
        body('medications.*.quantity.unit').optional().isString().withMessage('Quantity unit must be a string'),
        body('medications.*.isGeneric').optional().isBoolean().withMessage('isGeneric must be a boolean'),
        body('medications.*.isControlled').optional().isBoolean().withMessage('isControlled must be a boolean'),
        body('medications.*.refills').optional().isInt({ min: 0, max: 12 }).withMessage('Refills must be an integer between 0 and 12'),
        body('labTests').optional().isArray().withMessage('Lab tests must be an array'),
        body('lifestyleRecommendations').optional().isObject().withMessage('Lifestyle recommendations must be an object'),
        body('followUp').optional().isObject().withMessage('Follow-up must be an object'),
        body('patientInstructions').optional().isObject().withMessage('Patient instructions must be an object'),
        body('pharmacy').optional().isObject().withMessage('Pharmacy information must be an object'),
        body('insurance').optional().isObject().withMessage('Insurance information must be an object'),
        body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
        body('status').optional().isIn(['draft', 'active', 'expired', 'cancelled']).withMessage('Invalid prescription status'),
    ];
}

module.exports = PrescriptionValidation;