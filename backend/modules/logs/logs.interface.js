/**
 * @typedef {'low'|'medium'|'high'|'critical'} LogSeverity
 */

/**
 * @typedef {'success'|'failure'|'pending'|'cancelled'} LogStatus
 */

/**
 * @typedef {'user'|'appointment'|'prescription'|'medical_record'|'lab_test'|'payment'|'chat'|'health_data'|'inventory'|'system'|'auth'|'admin'} ResourceType
 */

/**
 * @typedef {'patient'|'doctor'|'admin'} UserRole
 */

/**
 * @typedef {object} ActivityLogEntry
 * @property {string} _id
 * @property {string} action
 * @property {string} description
 * @property {string} user - ObjectId of the User who performed the action.
 * @property {UserRole} userRole
 * @property {string} userEmail
 * @property {string} [userIP]
 * @property {string} [userAgent]
 * @property {ResourceType} [resourceType]
 * @property {string} [resourceId] - ObjectId of the resource affected.
 * @property {string} [resourceName]
 * @property {LogSeverity} [severity='low']
 * @property {LogStatus} [status='success']
 * @property {object} [metadata={}] - Arbitrary additional data.
 * @property {string} [sessionId]
 * @property {string} [requestId]
 * @property {number} [duration] - Duration of the action in milliseconds.
 * @property {object} [errorDetails]
 * @property {string} [errorDetails.message]
 * @property {string} [errorDetails.stack]
 * @property {string} [errorDetails.code]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} [formattedTimestamp] - Virtual property for formatted creation time.
 * @property {string} [actionCategory] - Virtual property for categorized action.
 */

/**
 * @typedef {object} LogFilters
 * @property {string} [action]
 * @property {UserRole} [userRole]
 * @property {ResourceType} [resourceType]
 * @property {LogSeverity} [severity]
 * @property {LogStatus} [status]
 * @property {string} [startDate] - ISO 8601 date string.
 * @property {string} [endDate] - ISO 8601 date string.
 */

/**
 * @typedef {object} PaginationInfo
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalLogs
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

/**
 * @typedef {object} GetLogsResponse
 * @property {ActivityLogEntry[]} logs
 * @property {PaginationInfo} pagination
 */

/**
 * @typedef {object} ActivitySummaryByRoleAndStatus
 * @property {string} role
 * @property {LogStatus} status
 * @property {number} count
 * @property {number} [avgDuration]
 * @property {number} [totalDuration]
 */

/**
 * @typedef {object} ActivitySummaryEntry
 * @property {string} _id - The action name.
 * @property {ActivitySummaryByRoleAndStatus[]} roles
 * @property {number} totalCount
 * @property {number} [totalDuration]
 */

/**
 * @typedef {object} GetSummaryResponse
 * @property {ActivitySummaryEntry[]} summary
 * @property {number} todayCount
 * @property {number} yesterdayCount
 * @property {number} errorCount
 * @property {number} securityCount
 * @property {object} period
 * @property {Date} period.startDate
 * @property {Date} period.endDate
 */

// This file primarily serves as documentation for the data structures.
// No executable code is typically exported from an interface file in JavaScript.