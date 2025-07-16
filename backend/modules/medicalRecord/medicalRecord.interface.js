
/**
 * @typedef {'lab_report'|'x_ray'|'mri_scan'|'ct_scan'|'ultrasound'|'ecg'|'blood_test'|'urine_test'|'prescription'|'discharge_summary'|'operation_report'|'vaccination_record'|'growth_chart'|'dental_record'|'eye_test'|'surgery_record'|'consultation_note'|'other'} RecordType
 */

/**
 * @typedef {'diagnostic'|'treatment'|'preventive'|'emergency'|'routine'|'specialist'|'surgery'|'therapy'} RecordCategory
 */

/**
 * @typedef {'active'|'archived'|'deleted'} RecordStatus
 */

/**
 * @typedef {'patient_only'|'doctor_patient'|'all_doctors'} AccessLevel
 */

/**
 * @typedef {'view'|'edit'|'full_access'|'read'} SharePermission
 */

/**
 * @typedef {'low'|'medium'|'high'|'urgent'} RecordPriority
 */

/**
 * @typedef {'pending'|'approved'|'rejected'|'paid'} InsuranceStatus
 */

/**
 * @typedef {object} FileDetails
 * @property {string} originalName
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {string} filePublicId
 * @property {number} fileSize
 * @property {string} mimeType
 * @property {Date} uploadedAt
 * @property {boolean} isPrimary
 */

/**
 * @typedef {object} TestParameter
 * @property {string} parameter
 * @property {string} value
 * @property {string} unit
 * @property {string} normalRange
 * @property {boolean} isAbnormal
 * @property {string} [notes]
 */

/**
 * @typedef {object} TestResults
 * @property {string} testName
 * @property {Date} testDate
 * @property {TestParameter[]} results
 * @property {string} labName
 * @property {string} labAddress
 * @property {string} technician
 * @property {string} reviewedBy
 */

/**
 * @typedef {object} VitalSigns
 * @property {object} [bloodPressure]
 * @property {number} [bloodPressure.systolic]
 * @property {number} [bloodPressure.diastolic]
 * @property {number} [heartRate]
 * @property {number} [temperature]
 * @property {number} [weight]
 * @property {number} [height]
 * @property {number} [bmi]
 * @property {number} [oxygenSaturation]
 * @property {number} [respiratoryRate]
 */

/**
 * @typedef {object} Diagnosis
 * @property {string} primary
 * @property {string[]} [secondary]
 * @property {string[]} [icd10Codes]
 */

/**
 * @typedef {object} Medication
 * @property {string} name
 * @property {string} dosage
 * @property {string} duration
 * @property {string} instructions
 */

/**
 * @typedef {object} SharedWith
 * @property {string} doctor - ObjectId of User
 * @property {Date} sharedAt
 * @property {SharePermission} permission
 */

/**
 * @typedef {object} Comment
 * @property {string} author - ObjectId of User
 * @property {string} comment
 * @property {Date} timestamp
 * @property {boolean} isPrivate
 */

/**
 * @typedef {object} HistoryEntry
 * @property {'created'|'updated'|'viewed'|'shared'|'archived'|'deleted'|'file_added'|'file_removed'} action
 * @property {string} performedBy - ObjectId of User
 * @property {Date} timestamp
 * @property {string} [details]
 */

/**
 * @typedef {object} InsuranceDetails
 * @property {string} [provider]
 * @property {string} [policyNumber]
 * @property {string} [claimNumber]
 * @property {number} [amount]
 * @property {InsuranceStatus} [status]
 */

/**
 * @typedef {object} MedicalRecord
 * @property {string} _id
 * @property {string} patient - ObjectId of User
 * @property {string} [doctor] - ObjectId of User
 * @property {string} uploadedBy - ObjectId of User
 * @property {string} [appointment] - ObjectId of Appointment
 * @property {RecordType} recordType
 * @property {string} title
 * @property {string} [description]
 * @property {FileDetails[]} [files]
 * @property {string} [fileUrl] - For backward compatibility with single file
 * @property {string} [filePublicId] - For backward compatibility with single file
 * @property {number} [fileSize] - For backward compatibility with single file
 * @property {string} [fileFormat] - For backward compatibility with single file
 * @property {TestResults} [testResults]
 * @property {VitalSigns} [vitals]
 * @property {Diagnosis} [diagnosis]
 * @property {string} [treatment]
 * @property {Medication[]} [medications]
 * @property {string[]} [procedures]
 * @property {string[]} [allergies]
 * @property {string[]} [familyHistory]
 * @property {RecordStatus} [status]
 * @property {boolean} [isPrivate]
 * @property {AccessLevel} [accessLevel]
 * @property {Date} recordDate
 * @property {Date} uploadDate
 * @property {string[]} [tags]
 * @property {RecordCategory} [category]
 * @property {SharedWith[]} [sharedWith]
 * @property {Comment[]} [comments]
 * @property {HistoryEntry[]} [history]
 * @property {RecordPriority} [priority]
 * @property {string} [location]
 * @property {string} [department]
 * @property {InsuranceDetails} [insurance]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {number} [fileCount] - Virtual
 * @property {number} [totalFileSize] - Virtual
 * @property {FileDetails | object} [primaryFile] - Virtual
 * @property {number} [ageInDays] - Virtual
 */


/**
 * @typedef {object} AddMedicalRecordPayload
 * @property {string} title
 * @property {RecordType} recordType
 * @property {string} recordDate - ISO 8601 date string
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {string} [patientId] - Required if doctor is uploading for a specific patient
 * @property {VitalSigns} [vitals]
 * @property {TestResults} [testResults]
 * @property {Diagnosis} [diagnosis]
 * @property {Medication[]} [medications]
 * @property {string[]} [procedures]
 * @property {string[]} [allergies]
 * @property {string[]} [familyHistory]
 * @property {string} [doctor] - ObjectId of doctor if different from uploader
 * @property {string} [appointment] - ObjectId of appointment
 * @property {RecordCategory} [category]
 * @property {RecordPriority} [priority]
 * @property {string} [location]
 * @property {string} [department]
 */

/**
 * @typedef {object} UpdateMedicalRecordPayload
 * @property {string} [title]
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {VitalSigns} [vitals]
 * @property {TestResults} [testResults]
 * @property {Diagnosis} [diagnosis]
 * @property {Medication[]} [medications]
 * @property {string[]} [procedures]
 * @property {string[]} [allergies]
 * @property {string[]} [familyHistory]
 * @property {RecordStatus} [status]
 * @property {boolean} [isPrivate]
 * @property {AccessLevel} [accessLevel]
 * @property {RecordCategory} [category]
 * @property {RecordPriority} [priority]
 * @property {string} [location]
 * @property {string} [department]
 * @property {InsuranceDetails} [insurance]
 */

/**
 * @typedef {object} ShareMedicalRecordPayload
 * @property {string} doctorId - ObjectId of the doctor to share with
 * @property {SharePermission} [permission='view'] - Single permission string
 */

/**
 * @typedef {object} GetRecordsFilters
 * @property {RecordType} [recordType]
 * @property {string} [date] - ISO 8601 date string for specific day
 * @property {string} [tags] - Comma-separated tags
 * @property {number} [page=1]
 * @property {number} [limit=10]
 * @property {RecordCategory} [category]
 * @property {string} [status]
 * @property {string} [searchTerm]
 * @property {string} [startDate] - ISO 8601 date string for range start
 * @property {string} [endDate] - ISO 8601 date string for range end
 */

// This file primarily serves as documentation for the data structures.
// No executable code is typically exported from an interface file in JavaScript.