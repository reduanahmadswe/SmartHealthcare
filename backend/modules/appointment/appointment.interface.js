/**
 * @typedef {Object} AppointmentData
 * @property {string} doctorId - The ID of the doctor for the appointment.
 * @property {string} appointmentDate - The date of the appointment (ISO 8601 format).
 * @property {string} appointmentTime - The time of the appointment (HH:MM format).
 * @property {'consultation'|'follow_up'|'emergency'|'routine_checkup'|'vaccination'} appointmentType - The type of appointment.
 * @property {'in_person'|'video_call'|'chat'} appointmentMode - The mode of the appointment.
 * @property {string[]} [symptoms] - An array of symptoms (optional).
 * @property {string} [patientNotes] - Notes from the patient (optional).
 * @property {boolean} [isEmergency] - Indicates if it's an emergency appointment (optional).
 */

/**
 * @typedef {Object} AppointmentUpdateStatusData
 * @property {'pending'|'confirmed'|'in_progress'|'completed'|'cancelled'|'no_show'} status - The new status of the appointment.
 * @property {string} [notes] - Additional notes for the status update (optional).
 */

/**
 * @typedef {Object} AppointmentRescheduleData
 * @property {string} appointmentDate - The new date of the appointment (ISO 8601 format).
 * @property {string} appointmentTime - The new time of the appointment (HH:MM format).
 * @property {string} [reason] - The reason for rescheduling (optional).
 */

/**
 * @typedef {Object} AppointmentCancellationData
 * @property {string} [reason] - The reason for cancellation (optional).
 */

/**
 * @typedef {Object} AppointmentRatingData
 * @property {number} rating - The rating given to the appointment (1-5).
 * @property {string} [review] - A review text (optional).
 */

/**
 * @typedef {Object} ConsultationNotesData
 * @property {string} [diagnosis] - The diagnosis for the patient (optional).
 * @property {string} [treatment] - The treatment prescribed (optional).
 * @property {string} [followUp] - Notes for follow-up (optional).
 * @property {string} [signature] - Doctor's signature or additional notes (optional).
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} currentPage - The current page number.
 * @property {number} totalPages - The total number of pages.
 * @property {number} totalAppointments - The total count of appointments.
 * @property {boolean} hasNextPage - True if there's a next page.
 * @property {boolean} hasPrevPage - True if there's a previous page.
 */

/**
 * @typedef {Object} GetAppointmentsResponse
 * @property {Array<Object>} appointments - An array of appointment objects.
 * @property {PaginationInfo} pagination - Pagination details.
 */

// This file primarily provides type definitions and doesn't export any executable code.
// It's meant for documentation and tooling (like VS Code's IntelliSense).