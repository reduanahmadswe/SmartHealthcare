
/**
 * @typedef {object} Dosage
 * @property {number} amount
 * @property {string} unit
 * @property {string} frequency
 * @property {string} duration
 */

/**
 * @typedef {object} Medication
 * @property {string} name
 * @property {string} [genericName]
 * @property {Dosage} dosage
 * @property {'oral'|'topical'|'inhalation'|'injection'|'other'} [route='oral']
 * @property {string} [instructions]
 * @property {object} quantity
 * @property {number} quantity.amount
 * @property {string} quantity.unit
 * @property {boolean} [isGeneric=false]
 * @property {boolean} [isControlled=false]
 * @property {number} [refills=0]
 * @property {string} [pharmacyNotes]
 */

/**
 * @typedef {object} LabTest
 * @property {string} testName
 * @property {string} [testCode]
 * @property {string} [instructions]
 * @property {boolean} [fastingRequired=false]
 * @property {string} [specialInstructions]
 */

/**
 * @typedef {object} LifestyleRecommendations
 * @property {string[]} [diet]
 * @property {string[]} [exercise]
 * @property {string[]} [lifestyle]
 * @property {string[]} [restrictions]
 */

/**
 * @typedef {object} FollowUp
 * @property {boolean} [required=false]
 * @property {Date} [date]
 * @property {'in_person'|'video_call'|'phone_call'} [type='in_person']
 * @property {string} [reason]
 */

/**
 * @typedef {object} DigitalSignature
 * @property {string} doctorSignature - Base64 encoded signature
 * @property {Date} [signatureDate]
 * @property {string} [signatureHash] - For verification
 * @property {object} [certificateInfo]
 * @property {string} [certificateInfo.issuer]
 * @property {Date} [certificateInfo.validFrom]
 * @property {Date} [certificateInfo.validTo]
 */

/**
 * @typedef {object} PatientInstructions
 * @property {string} [general]
 * @property {string} [medicationInstructions]
 * @property {string[]} [sideEffects]
 * @property {string} [emergencyContact]
 * @property {string[]} [whenToSeekHelp]
 */

/**
 * @typedef {object} Pharmacy
 * @property {string} [name]
 * @property {string} [address]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [notes]
 */

/**
 * @typedef {object} Insurance
 * @property {string} [provider]
 * @property {string} [policyNumber]
 * @property {string} [groupNumber]
 * @property {number} [copay]
 */

/**
 * @typedef {object} AuditHistory
 * @property {'created'|'modified'|'verified'|'cancelled'|'expired'} action
 * @property {mongoose.Types.ObjectId} performedBy
 * @property {Date} [timestamp]
 * @property {string} [notes]
 */

/**
 * @typedef {object} PrescriptionData
 * @property {mongoose.Types.ObjectId} patient
 * @property {mongoose.Types.ObjectId} doctor
 * @property {mongoose.Types.ObjectId} appointment
 * @property {Date} [prescriptionDate]
 * @property {string} [prescriptionNumber]
 * @property {object} diagnosis
 * @property {string} diagnosis.primary
 * @property {string[]} [diagnosis.secondary]
 * @property {string[]} [diagnosis.icd10Codes]
 * @property {string[]} [symptoms]
 * @property {string} [clinicalNotes]
 * @property {Medication[]} medications
 * @property {LabTest[]} [labTests]
 * @property {LifestyleRecommendations} [lifestyleRecommendations]
 * @property {FollowUp} [followUp]
 * @property {DigitalSignature} digitalSignature
 * @property {'draft'|'active'|'expired'|'cancelled'} [status='active']
 * @property {boolean} [isVerified=false]
 * @property {mongoose.Types.ObjectId} [verifiedBy]
 * @property {Date} [verifiedAt]
 * @property {string} [pdfUrl]
 * @property {Date} [pdfGeneratedAt]
 * @property {object[]} [attachments]
 * @property {PatientInstructions} [patientInstructions]
 * @property {Pharmacy} [pharmacy]
 * @property {Insurance} [insurance]
 * @property {string[]} [tags]
 * @property {'low'|'medium'|'high'|'urgent'} [priority='medium']
 * @property {AuditHistory[]} [history]
 */

// This file primarily serves as documentation for the data structures.
// No executable code is typically exported from an interface file in JavaScript,
// but  might export constants if they logically belong to the prescription domain.
// For now, it's just JSDoc definitions.