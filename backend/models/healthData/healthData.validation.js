// D:\SmartHealthcare\backend\validations\healthData.validation.js
const { body } = require('express-validator');

const healthDataValidation = {
    addHealthData: [
        body('vitals.bloodPressure.systolic').optional().isNumeric().withMessage('Systolic must be a number'),
        body('vitals.bloodPressure.diastolic').optional().isNumeric().withMessage('Diastolic must be a number'),
        body('vitals.heartRate.value').optional().isNumeric().withMessage('Heart rate must be a number'),
        body('vitals.temperature.value').optional().isNumeric().withMessage('Temperature must be a number'),
        body('vitals.oxygenSaturation.value').optional().isNumeric().withMessage('Oxygen saturation must be a number'),
        body('vitals.respiratoryRate.value').optional().isNumeric().withMessage('Respiratory rate must be a number'),

        body('measurements.height.value').optional().isNumeric().withMessage('Height must be a number'),
        body('measurements.weight.value').optional().isNumeric().withMessage('Weight must be a number'),
        body('measurements.waistCircumference.value').optional().isNumeric().withMessage('Waist circumference must be a number'),
        body('measurements.hipCircumference.value').optional().isNumeric().withMessage('Hip circumference must be a number'),

        body('labResults.bloodSugar.fasting').optional().isNumeric().withMessage('Fasting blood sugar must be a number'),
        body('labResults.bloodSugar.postprandial').optional().isNumeric().withMessage('Postprandial blood sugar must be a number'),
        body('labResults.cholesterol.total').optional().isNumeric().withMessage('Total cholesterol must be a number'),
        body('labResults.cholesterol.hdl').optional().isNumeric().withMessage('HDL must be a number'),
        body('labResults.cholesterol.ldl').optional().isNumeric().withMessage('LDL must be a number'),
        body('labResults.cholesterol.triglycerides').optional().isNumeric().withMessage('Triglycerides must be a number'),
        body('labResults.hemoglobin.value').optional().isNumeric().withMessage('Hemoglobin must be a number'),
        body('labResults.creatinine.value').optional().isNumeric().withMessage('Creatinine must be a number'),

        body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
        body('symptoms.*.name').optional().isString().withMessage('Symptom name must be a string'),
        body('symptoms.*.severity').optional().isIn(['mild', 'moderate', 'severe']).withMessage('Invalid symptom severity'),
        body('symptoms.*.duration').optional().isString().withMessage('Symptom duration must be a string'),
        body('symptoms.*.notes').optional().isString().withMessage('Symptom notes must be a string'),

        body('medications').optional().isArray().withMessage('Medications must be an array'),
        body('medications.*.name').optional().isString().withMessage('Medication name must be a string'),
        body('medications.*.dosage').optional().isString().withMessage('Medication dosage must be a string'),
        body('medications.*.frequency').optional().isString().withMessage('Medication frequency must be a string'),
        body('medications.*.startDate').optional().isISO8601().toDate().withMessage('Medication start date must be a valid date'),
        body('medications.*.endDate').optional().isISO8601().toDate().withMessage('Medication end date must be a valid date'),
        body('medications.*.isActive').optional().isBoolean().withMessage('Medication isActive must be a boolean'),


        body('lifestyle.sleepHours').optional().isNumeric().withMessage('Sleep hours must be a number'),
        body('lifestyle.exerciseMinutes').optional().isNumeric().withMessage('Exercise minutes must be a number'),
        body('lifestyle.waterIntake.value').optional().isNumeric().withMessage('Water intake must be a number'),
        body('lifestyle.smokingStatus').optional().isIn(['never', 'former', 'current']).withMessage('Invalid smoking status'),
        body('lifestyle.alcoholConsumption').optional().isIn(['none', 'occasional', 'moderate', 'heavy']).withMessage('Invalid alcohol consumption'),

        body('notes').optional().isString().withMessage('Notes must be a string'),
        body('source').optional().isIn(['manual', 'device', 'lab', 'doctor']).withMessage('Invalid source'),
        body('patientId').optional().isMongoId().withMessage('Valid patient ID is required for doctors/admins') // Only required for doctors/admins
    ],
    updateHealthData: [
        // All fields are optional for update, but type validation is important
        body('vitals.bloodPressure.systolic').optional().isNumeric().withMessage('Systolic must be a number'),
        body('vitals.bloodPressure.diastolic').optional().isNumeric().withMessage('Diastolic must be a number'),
        body('vitals.heartRate.value').optional().isNumeric().withMessage('Heart rate must be a number'),
        body('vitals.temperature.value').optional().isNumeric().withMessage('Temperature must be a number'),
        body('vitals.oxygenSaturation.value').optional().isNumeric().withMessage('Oxygen saturation must be a number'),
        body('vitals.respiratoryRate.value').optional().isNumeric().withMessage('Respiratory rate must be a number'),

        body('measurements.height.value').optional().isNumeric().withMessage('Height must be a number'),
        body('measurements.weight.value').optional().isNumeric().withMessage('Weight must be a number'),
        body('measurements.waistCircumference.value').optional().isNumeric().withMessage('Waist circumference must be a number'),
        body('measurements.hipCircumference.value').optional().isNumeric().withMessage('Hip circumference must be a number'),

        body('labResults.bloodSugar.fasting').optional().isNumeric().withMessage('Fasting blood sugar must be a number'),
        body('labResults.bloodSugar.postprandial').optional().isNumeric().withMessage('Postprandial blood sugar must be a number'),
        body('labResults.cholesterol.total').optional().isNumeric().withMessage('Total cholesterol must be a number'),
        body('labResults.cholesterol.hdl').optional().isNumeric().withMessage('HDL must be a number'),
        body('labResults.cholesterol.ldl').optional().isNumeric().withMessage('LDL must be a number'),
        body('labResults.cholesterol.triglycerides').optional().isNumeric().withMessage('Triglycerides must be a number'),
        body('labResults.hemoglobin.value').optional().isNumeric().withMessage('Hemoglobin must be a number'),
        body('labResults.creatinine.value').optional().isNumeric().withMessage('Creatinine must be a number'),

        body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
        body('symptoms.*.name').optional().isString().withMessage('Symptom name must be a string'),
        body('symptoms.*.severity').optional().isIn(['mild', 'moderate', 'severe']).withMessage('Invalid symptom severity'),
        body('symptoms.*.duration').optional().isString().withMessage('Symptom duration must be a string'),
        body('symptoms.*.notes').optional().isString().withMessage('Symptom notes must be a string'),

        body('medications').optional().isArray().withMessage('Medications must be an array'),
        body('medications.*.name').optional().isString().withMessage('Medication name must be a string'),
        body('medications.*.dosage').optional().isString().withMessage('Medication dosage must be a string'),
        body('medications.*.frequency').optional().isString().withMessage('Medication frequency must be a string'),
        body('medications.*.startDate').optional().isISO8601().toDate().withMessage('Medication start date must be a valid date'),
        body('medications.*.endDate').optional().isISO8601().toDate().withMessage('Medication end date must be a valid date'),
        body('medications.*.isActive').optional().isBoolean().withMessage('Medication isActive must be a boolean'),

        body('lifestyle.sleepHours').optional().isNumeric().withMessage('Sleep hours must be a number'),
        body('lifestyle.exerciseMinutes').optional().isNumeric().withMessage('Exercise minutes must be a number'),
        body('lifestyle.waterIntake.value').optional().isNumeric().withMessage('Water intake must be a number'),
        body('lifestyle.smokingStatus').optional().isIn(['never', 'former', 'current']).withMessage('Invalid smoking status'),
        body('lifestyle.alcoholConsumption').optional().isIn(['none', 'occasional', 'moderate', 'heavy']).withMessage('Invalid alcohol consumption'),

        body('notes').optional().isString().withMessage('Notes must be a string'),
        body('source').optional().isIn(['manual', 'device', 'lab', 'doctor']).withMessage('Invalid source'),
        body('isAbnormal').optional().isBoolean().withMessage('isAbnormal must be a boolean')
    ],
    getHealthData: [
        // No specific body validation for GET, but query params can be validated
    ]
};

module.exports = healthDataValidation;