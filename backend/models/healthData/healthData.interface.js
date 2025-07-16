/**
 * @typedef {Object} VitalSigns
 * @property {{systolic: number, diastolic: number, unit?: string}} [bloodPressure] - Blood pressure readings.
 * @property {{value: number, unit?: string}} [heartRate] - Heart rate reading.
 * @property {{value: number, unit?: string}} [temperature] - Body temperature reading.
 * @property {{value: number, unit?: string}} [oxygenSaturation] - Oxygen saturation reading.
 * @property {{value: number, unit?: string}} [respiratoryRate] - Respiratory rate reading.
 */

/**
 * @typedef {Object} BodyMeasurements
 * @property {{value: number, unit?: string}} [height] - Height measurement.
 * @property {{value: number, unit?: string}} [weight] - Weight measurement.
 * @property {number} [bmi] - Body Mass Index (calculated automatically).
 * @property {{value: number, unit?: string}} [waistCircumference] - Waist circumference.
 * @property {{value: number, unit?: string}} [hipCircumference] - Hip circumference.
 */

/**
 * @typedef {Object} LabResults
 * @property {{fasting?: number, postprandial?: number, unit?: string}} [bloodSugar] - Blood sugar levels.
 * @property {{total?: number, hdl?: number, ldl?: number, triglycerides?: number, unit?: string}} [cholesterol] - Cholesterol levels.
 * @property {{value?: number, unit?: string}} [hemoglobin] - Hemoglobin level.
 * @property {{value?: number, unit?: string}} [creatinine] - Creatinine level.
 */

/**
 * @typedef {Object} Symptom
 * @property {string} name - Name of the symptom.
 * @property {'mild'|'moderate'|'severe'} [severity] - Severity of the symptom.
 * @property {string} [duration] - Duration of the symptom.
 * @property {string} [notes] - Additional notes about the symptom.
 */

/**
 * @typedef {Object} Medication
 * @property {string} name - Name of the medication.
 * @property {string} [dosage] - Dosage information.
 * @property {string} [frequency] - Frequency of administration.
 * @property {Date} [startDate] - Start date of medication.
 * @property {Date} [endDate] - End date of medication.
 * @property {boolean} [isActive] - Whether the medication is currently active.
 */

/**
 * @typedef {Object} LifestyleData
 * @property {number} [sleepHours] - Hours of sleep per day.
 * @property {number} [exerciseMinutes] - Minutes of exercise per day.
 * @property {{value: number, unit?: string}} [waterIntake] - Daily water intake.
 * @property {'never'|'former'|'current'} [smokingStatus] - Smoking status.
 * @property {'none'|'occasional'|'moderate'|'heavy'} [alcoholConsumption] - Alcohol consumption level.
 */

/**
 * @typedef {Object} AbnormalValue
 * @property {string} field - The field name with abnormal value (e.g., 'bloodPressure.systolic').
 * @property {any} value - The actual recorded value.
 * @property {string} normalRange - The expected normal range for the field.
 * @property {'low'|'high'|'critical'} severity - The severity of the abnormality.
 */

/**
 * @typedef {Object} HealthDataPayload
 * @property {string} [patientId] - The ID of the patient (required for doctor/admin).
 * @property {VitalSigns} [vitals] - Vital signs data.
 * @property {BodyMeasurements} [measurements] - Body measurements data.
 * @property {LabResults} [labResults] - Lab results data.
 * @property {Symptom[]} [symptoms] - Array of symptoms.
 * @property {Medication[]} [medications] - Array of medications.
 * @property {LifestyleData} [lifestyle] - Lifestyle data.
 * @property {string} [notes] - General notes or observations.
 * @property {'manual'|'device'|'lab'|'doctor'} [source] - Source of the health data.
 */

/**
 * @typedef {Object} HealthDataRecord - Full health data record returned from DB.
 * @property {string} _id - MongoDB document ID.
 * @property {string} patient - Patient's User ID.
 * @property {VitalSigns} [vitals] - Vital signs.
 * @property {BodyMeasurements} [measurements] - Body measurements.
 * @property {number} [bmi] - Calculated BMI.
 * @property {LabResults} [labResults] - Lab results.
 * @property {Symptom[]} [symptoms] - Symptoms.
 * @property {Medication[]} [medications] - Medications.
 * @property {LifestyleData} [lifestyle] - Lifestyle data.
 * @property {string} [notes] - Notes.
 * @property {string} [source] - Data source.
 * @property {string} recordedBy - User ID of who recorded the data.
 * @property {boolean} isAbnormal - Flag indicating if any values are abnormal.
 * @property {AbnormalValue[]} abnormalValues - Array of detected abnormal values.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} currentPage - The current page number.
 * @property {number} totalPages - The total number of pages.
 * @property {number} totalRecords - The total count of records.
 * @property {boolean} hasNextPage - True if there's a next page.
 * @property {boolean} hasPrevPage - True if there's a previous page.
 */

/**
 * @typedef {Object} GetHealthDataResponse
 * @property {HealthDataRecord[]} healthData - An array of health data records.
 * @property {PaginationInfo} pagination - Pagination details.
 */

/**
 * @typedef {Object} VitalsHistoryChartData
 * @property {Array<{date: Date, systolic?: number, diastolic?: number}>} bloodPressure
 * @property {Array<{date: Date, value?: number}>} heartRate
 * @property {Array<{date: Date, value?: number}>} temperature
 * @property {Array<{date: Date, value?: number}>} oxygenSaturation
 * @property {Array<{date: Date, value?: number}>} weight
 * @property {Array<{date: Date, value?: number}>} bmi
 */

/**
 * @typedef {Object} GetVitalsHistoryResponse
 * @property {{startDate: Date, endDate: Date}} period - The date range of the history.
 * @property {HealthDataRecord[]} vitalsHistory - Raw health data records within the period.
 * @property {VitalsHistoryChartData} chartData - Formatted data suitable for charting.
 * @property {{totalRecords: number, abnormalRecords: number, latestRecord: HealthDataRecord|null}} summary - Summary statistics.
 */

// This file primarily provides type definitions and doesn't export any executable code.
// It's meant for documentation and tooling (like VS Code's IntelliSense).