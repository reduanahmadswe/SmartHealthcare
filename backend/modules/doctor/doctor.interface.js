

/**
 * @typedef {object} DoctorRegistrationPayload
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 * @property {string} phone
 * @property {string} dateOfBirth - ISO 8601 date string
 * @property {'male'|'female'|'other'} gender
 * @property {string[]} specialization
 * @property {number} experience
 * @property {string} licenseNumber
 * @property {number} consultationFee
 * @property {object} address
 * @property {string} [address.street]
 * @property {string} [address.city]
 * @property {string} [address.state]
 * @property {string} [address.zipCode]
 * @property {object[]} [education]
 * @property {object[]} [certifications]
 */

/**
 * @typedef {object} DoctorProfileUpdatePayload
 * @property {string[]} [specialization]
 * @property {number} [experience]
 * @property {number} [consultationFee]
 * @property {object[]} [education]
 * @property {object[]} [certifications]
 * @property {object[]} [availableSlots]
 */

/**
 * @typedef {object} CertificateUploadPayload
 * @property {string} [certificateName]
 * @property {string} [issuingAuthority]
 * @property {string} [issueDate] - ISO 8601 date string
 * @property {Express.Multer.File} file - The uploaded file object.
 */

/**
 * @typedef {object} DoctorVerificationPayload
 * @property {'approved'|'rejected'} status
 * @property {string} [reason]
 */

/**
 * @typedef {object} DoctorScheduleUpdatePayload
 * @property {object[]} availableSlots
 */

/**
 * @typedef {object} DoctorPublicProfile
 * @property {string} _id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} role
 * @property {boolean} isVerified
 * @property {boolean} isActive
 * @property {object} doctorInfo
 * @property {string[]} doctorInfo.specialization
 * @property {number} doctorInfo.experience
 * @property {number} doctorInfo.consultationFee
 * @property {number} [doctorInfo.rating]
 * @property {number} [doctorInfo.totalReviews]
 * @property {object[]} doctorInfo.education
 * @property {object[]} doctorInfo.certifications
 * @property {object[]} doctorInfo.availableSlots
 */

/**
 * @typedef {object} PaginationInfo
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalDoctors
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

/**
 * @typedef {object} DoctorListResponse
 * @property {DoctorPublicProfile[]} doctors
 * @property {PaginationInfo} pagination
 */

/**
 * @typedef {object} SpecializationStats
 * @property {string} name
 * @property {number} count
 */

// This file primarily serves as documentation for the data structures.
// No executable code is typically exported from an interface file in JavaScript.