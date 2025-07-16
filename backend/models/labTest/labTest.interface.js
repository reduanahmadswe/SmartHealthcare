/**
 * @typedef {Object} ILabTestInstructionFasting
 * @property {boolean} required - True if fasting is required.
 * @property {string} [duration] - Duration of fasting (e.g., "8 hours").
 */

/**
 * @typedef {Object} ILabTestInstructions
 * @property {string[]} [preparation] - Array of preparation instructions.
 * @property {ILabTestInstructionFasting} [fasting] - Fasting requirements.
 * @property {string[]} [specialInstructions] - Array of special instructions.
 * @property {string[]} [medications] - Array of medications to avoid.
 * @property {string[]} [restrictions] - Array of restrictions.
 */

/**
 * @typedef {Object} ILabTestLabAddress
 * @property {string} [street]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [zipCode]
 * @property {string} [country='Bangladesh']
 */

/**
 * @typedef {Object} ILabTestLabOperatingHours
 * @property {{open: string, close: string}} [monday]
 * @property {{open: string, close: string}} [tuesday]
 * @property {{open: string, close: string}} [wednesday]
 * @property {{open: string, close: string}} [thursday]
 * @property {{open: string, close: string}} [friday]
 * @property {{open: string, close: string}} [saturday]
 * @property {{open: string, close: string}} [sunday]
 */

/**
 * @typedef {Object} ILabTestLab
 * @property {string} name - Lab name.
 * @property {ILabTestLabAddress} [address] - Lab address.
 * @property {string} [phone] - Lab phone number.
 * @property {string} [email] - Lab email.
 * @property {string} [website] - Lab website.
 * @property {ILabTestLabOperatingHours} [operatingHours] - Lab operating hours.
 */

/**
 * @typedef {Object} ILabTestParameterNormalRange
 * @property {number} [min]
 * @property {number} [max]
 * @property {'male'|'female'|'both'} [gender]
 * @property {{min: number, max: number}} [ageRange]
 */

/**
 * @typedef {Object} ILabTestParameter
 * @property {string} [name]
 * @property {string} [code]
 * @property {string} [unit]
 * @property {ILabTestParameterNormalRange} [normalRange]
 * @property {boolean} [isCritical=false]
 */

/**
 * @typedef {Object} ILabTestResult
 * @property {string} parameter - Name of the parameter.
 * @property {string} value - Result value.
 * @property {string} [unit] - Unit of the result.
 * @property {string} [normalRange] - Normal range for the parameter.
 * @property {boolean} [isAbnormal=false] - True if result is abnormal.
 * @property {boolean} [isCritical=false] - True if result is critical.
 * @property {string} [notes] - Additional notes for the result.
 * @property {string} [reviewedBy] - Name of the reviewer.
 * @property {Date} [reviewedAt] - Date of review.
 */

/**
 * @typedef {Object} ILabTestResultFile
 * @property {string} [name] - File name.
 * @property {string} [url] - URL of the file.
 * @property {'report'|'image'|'document'} [type] - Type of file.
 * @property {Date} [uploadedAt] - Upload timestamp.
 * @property {boolean} [isPrimary=false] - True if it's the primary result file.
 */

/**
 * @typedef {Object} ILabTestCost
 * @property {number} amount - Cost amount.
 * @property {string} [currency='BDT'] - Currency.
 * @property {number} [discount=0] - Discount percentage.
 * @property {number} [finalAmount] - Final calculated amount after discount.
 */

/**
 * @typedef {Object} ILabTestInsurance
 * @property {string} [provider] - Insurance provider name.
 * @property {string} [policyNumber] - Insurance policy number.
 * @property {number} [coverage] - Percentage covered by insurance.
 * @property {string} [claimNumber] - Claim number.
 * @property {'pending'|'approved'|'rejected'|'paid'} [status='pending'] - Insurance claim status.
 */

/**
 * @typedef {Object} ILabTestComment
 * @property {import('mongoose').Types.ObjectId} author - ID of the user who commented.
 * @property {string} comment - The comment text.
 * @property {Date} [timestamp] - Timestamp of the comment.
 * @property {boolean} [isPrivate=false] - True if the comment is private.
 */

/**
 * @typedef {Object} ILabTestNotification
 * @property {'booking_confirmation'|'reminder'|'result_ready'|'cancellation'} type - Type of notification.
 * @property {string} message - Notification message.
 * @property {Date} [sentAt] - Timestamp when notification was sent.
 * @property {boolean} [isRead=false] - True if notification has been read.
 */

/**
 * @typedef {Object} ILabTestRescheduledFrom
 * @property {Date} date
 * @property {string} time
 */

/**
 * @typedef {Object} ILabTest
 * @property {import('mongoose').Types.ObjectId} patient - ID of the patient.
 * @property {import('mongoose').Types.ObjectId} [doctor] - ID of the prescribing doctor.
 * @property {import('mongoose').Types.ObjectId} [appointment] - ID of the associated appointment.
 * @property {string} testName - Name of the lab test.
 * @property {string} testCode - Unique code for the test (generated pre-save).
 * @property {'blood_test'|'urine_test'|'stool_test'|'x_ray'|'mri_scan'|'ct_scan'|'ultrasound'|'ecg'|'echocardiogram'|'endoscopy'|'biopsy'|'culture_test'|'genetic_test'|'allergy_test'|'hormone_test'|'other'} testCategory - Category of the test.
 * @property {string} [description] - Description of the test.
 * @property {ILabTestInstructions} [instructions] - Test instructions.
 * @property {Date} bookingDate - Date of booking.
 * @property {Date} scheduledDate - Scheduled date for the test.
 * @property {string} scheduledTime - Scheduled time for the test (HH:MM).
 * @property {import('mongoose').Types.ObjectId} lab - ID of the lab where the test is conducted.
 * @property {'booked'|'confirmed'|'in_progress'|'completed'|'cancelled'|'rescheduled'} [status='booked'] - Current status of the test.
 * @property {ILabTestParameter[]} [parameters] - Array of test parameters.
 * @property {ILabTestResult[]} [results] - Array of actual test results.
 * @property {ILabTestResultFile[]} [resultFiles] - Array of result files.
 * @property {ILabTestCost} cost - Cost details of the test.
 * @property {'pending'|'paid'|'refunded'|'failed'} [paymentStatus='pending'] - Payment status.
 * @property {'cash'|'card'|'mobile_banking'|'insurance'} [paymentMethod='cash'] - Payment method.
 * @property {string} [transactionId] - Transaction ID for payment.
 * @property {ILabTestInsurance} [insurance] - Insurance details.
 * @property {number} [estimatedDuration] - Estimated duration of the test in minutes.
 * @property {number} [actualDuration] - Actual duration of the test in minutes.
 * @property {Date} [completedAt] - Timestamp when test was completed.
 * @property {Date} [resultReadyAt] - Timestamp when results were made ready.
 * @property {ILabTestNotification[]} [notifications] - Array of notifications related to the test.
 * @property {string} [cancellationReason] - Reason for cancellation.
 * @property {import('mongoose').Types.ObjectId} [cancelledBy] - User who cancelled the test.
 * @property {Date} [cancelledAt] - Timestamp of cancellation.
 * @property {ILabTestRescheduledFrom} [rescheduledFrom] - Original date/time if rescheduled.
 * @property {import('mongoose').Types.ObjectId} [rescheduledBy] - User who rescheduled the test.
 * @property {Date} [rescheduledAt] - Timestamp of reschedule.
 * @property {ILabTestComment[]} [comments] - Array of comments/notes.
 * @property {'routine'|'urgent'|'emergency'} [priority='routine'] - Priority of the test.
 * @property {boolean} [isEmergency=false] - True if it's an emergency test.
 * @property {string[]} [tags] - Array of tags.
 * @property {string} [referenceNumber] - External reference number.
 * @property {string} [externalLabId] - ID for integration with external lab systems.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 *
 * @property {number} [duration] - Virtual: returns actualDuration or estimatedDuration.
 * @property {boolean} [isOverdue] - Virtual: true if scheduledDate/Time is past and status is not 'completed'.
 * @property {number} [abnormalResultsCount] - Virtual: count of abnormal results.
 * @property {number} [criticalResultsCount] - Virtual: count of critical results.
 *
 * @method addResult(resultData: ILabTestResult): Promise<this>
 * @method addResultFile(fileData: ILabTestResultFile): Promise<this>
 * @method addComment(author: import('mongoose').Types.ObjectId, comment: string, isPrivate?: boolean): Promise<this>
 * @method addNotification(type: ILabTestNotification['type'], message: string): Promise<this>
 * @method areResultsReady(): boolean
 * @method getAbnormalResults(): ILabTestResult[]
 * @method getCriticalResults(): ILabTestResult[]
 *
 * @static
 * @method getStatistics(patientId: string, startDate: Date, endDate: Date): Promise<Object[]>
 * @static
 * @method getAvailableTests(): Promise<Object[]>
 */
class ILabTest {} // This is a dummy class just for JSDoc.
module.exports = ILabTest;