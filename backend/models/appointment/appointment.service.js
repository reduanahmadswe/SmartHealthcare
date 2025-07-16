const Appointment = require('./appointment.model'); 
const User = require('../../models/user/user.model'); 
const { sendEmail } = require('../../utils/emailService');
const mongoose = require('mongoose');

const appointmentService = {
    /**
     * Books a new appointment.
     * @param {Object} appointmentData - Data for the new appointment.
     * @param {Object} patientUser - The patient user object from req.user.
     * @returns {Promise<Object>} The created appointment object.
     */
    bookAppointment: async (appointmentData, patientUser) => {
        const {
            doctorId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            appointmentMode,
            symptoms,
            patientNotes,
            isEmergency
        } = appointmentData;

        // Check if doctor exists and is verified
        const doctor = await User.findOne({
            _id: doctorId,
            role: 'doctor',
            isVerified: true,
            isActive: true
        });

        if (!doctor) {
            throw new Error('Doctor not found or not verified');
        }

        // Check if appointment time is available
        const isAvailable = await Appointment.checkAvailability(
            doctorId,
            appointmentDate,
            appointmentTime
        );

        if (!isAvailable) {
            throw new Error('Selected time slot is not available');
        }

        // Create appointment
        const appointment = new Appointment({
            patient: patientUser._id,
            doctor: doctorId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            appointmentMode,
            symptoms,
            patientNotes,
            isEmergency,
            consultationFee: doctor.doctorInfo.consultationFee
        });

        await appointment.save();

        // Populate doctor and patient details for email/response
        await appointment.populate('doctor', 'firstName lastName email phone');
        await appointment.populate('patient', 'firstName lastName email phone');

        // Send confirmation email to patient
        try {
            await sendEmail({
                to: patientUser.email,
                subject: 'Appointment Booked - Smart Healthcare Assistant',
                template: 'appointmentConfirmation',
                context: {
                    patientName: patientUser.firstName,
                    doctorName: `${doctor.firstName} ${doctor.lastName}`,
                    appointmentDate: appointmentDate,
                    appointmentTime: appointmentTime,
                    appointmentType: appointmentType,
                    appointmentMode: appointmentMode,
                    consultationFee: doctor.doctorInfo.consultationFee
                }
            });
        } catch (emailError) {
            console.error('Failed to send patient confirmation email:', emailError);
            // Log the error, but don't re-throw as appointment is already booked
        }

        // Send notification email to doctor
        try {
            await sendEmail({
                to: doctor.email,
                subject: 'New Appointment Request - Smart Healthcare Assistant',
                template: 'newAppointmentRequest',
                context: {
                    doctorName: doctor.firstName,
                    patientName: `${patientUser.firstName} ${patientUser.lastName}`,
                    appointmentDate: appointmentDate,
                    appointmentTime: appointmentTime,
                    appointmentType: appointmentType,
                    appointmentMode: appointmentMode
                }
            });
        } catch (emailError) {
            console.error('Failed to send doctor notification email:', emailError);
            // Log the error, but don't re-throw as appointment is already booked
        }

        return appointment;
    },

    /**
     * Retrieves appointments based on user role and filters.
     * @param {Object} user - The authenticated user object.
     * @param {Object} filters - Query parameters for filtering.
     * @returns {Promise<Object>} Object containing appointments and pagination info.
     */
    getAppointments: async (user, filters) => {
        const {
            status,
            date,
            page = 1,
            limit = 10
        } = filters;

        const query = {};

        // Filter by user role
        if (user.role === 'patient') {
            query.patient = user._id;
        } else if (user.role === 'doctor') {
            query.doctor = user._id;
        }

        if (status) {
            query.status = status;
        }
        if (date) {
            query.appointmentDate = {
                $gte: new Date(date),
                $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('doctor', 'firstName lastName email phone')
            .sort({
                appointmentDate: -1,
                appointmentTime: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        return {
            appointments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalAppointments: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    },

    /**
     * Gets a single appointment by ID.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {Object} user - The authenticated user object for access control.
     * @returns {Promise<Object>} The appointment object.
     */
    getAppointmentById: async (appointmentId, user) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email phone patientInfo')
            .populate('doctor', 'firstName lastName email phone doctorInfo');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if user has access to this appointment
        const isPatient = appointment.patient._id.toString() === user._id.toString();
        const isDoctor = appointment.doctor._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new Error('Access denied');
        }

        return appointment;
    },

    /**
     * Updates the status of an appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {string} newStatus - The new status to set.
     * @param {string} notes - Optional notes for the status update.
     * @param {Object} user - The authenticated user object for access control.
     * @returns {Promise<Object>} The updated appointment object.
     */
    updateAppointmentStatus: async (appointmentId, newStatus, notes, user) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if doctor owns this appointment or is admin
        const isOwner = appointment.doctor._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Access denied');
        }

        const oldStatus = appointment.status;
        appointment.status = newStatus;
        if (notes) {
            appointment.doctorNotes = notes;
        }

        await appointment.save();

        // Send notification email to patient
        if (newStatus !== oldStatus) {
            try {
                await sendEmail({
                    to: appointment.patient.email,
                    subject: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - Smart Healthcare Assistant`,
                    template: 'appointmentStatusUpdate',
                    context: {
                        patientName: appointment.patient.firstName,
                        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                        appointmentDate: appointment.appointmentDate,
                        appointmentTime: appointment.appointmentTime,
                        oldStatus,
                        newStatus,
                        notes: notes || ''
                    }
                });
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
            }
        }

        return appointment;
    },

    /**
     * Reschedules an appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {Object} rescheduleData - New date, time, and optional reason.
     * @param {Object} user - The authenticated user object for access control.
     * @returns {Promise<Object>} The rescheduled appointment object.
     */
    rescheduleAppointment: async (appointmentId, rescheduleData, user) => {
        const {
            appointmentDate,
            appointmentTime,
            reason
        } = rescheduleData;

        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if user can reschedule this appointment
        const isPatient = appointment.patient._id.toString() === user._id.toString();
        const isDoctor = appointment.doctor._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new Error('Access denied');
        }

        // Check if new time is available
        const isAvailable = await Appointment.checkAvailability(
            appointment.doctor._id,
            appointmentDate,
            appointmentTime,
            appointment.duration
        );

        if (!isAvailable) {
            throw new Error('Selected time slot is not available');
        }

        // Store old appointment details
        const rescheduledFrom = {
            date: appointment.appointmentDate,
            time: appointment.appointmentTime
        };

        // Update appointment
        appointment.appointmentDate = appointmentDate;
        appointment.appointmentTime = appointmentTime;
        appointment.rescheduledFrom = rescheduledFrom;
        appointment.rescheduledBy = user._id;
        appointment.rescheduledAt = new Date();
        appointment.status = 'pending'; // Set to pending after reschedule if not explicitly confirmed

        await appointment.save();

        // Send notification emails
        const rescheduledBy = user.role === 'patient' ? 'patient' : 'doctor';

        try {
            await sendEmail({
                to: appointment.patient.email,
                subject: 'Appointment Rescheduled - Smart Healthcare Assistant',
                template: 'appointmentRescheduled',
                context: {
                    patientName: appointment.patient.firstName,
                    doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                    oldDate: rescheduledFrom.date,
                    oldTime: rescheduledFrom.time,
                    newDate: appointmentDate,
                    newTime: appointmentTime,
                    rescheduledBy,
                    reason: reason || 'No reason provided'
                }
            });

            await sendEmail({
                to: appointment.doctor.email,
                subject: 'Appointment Rescheduled - Smart Healthcare Assistant',
                template: 'appointmentRescheduled',
                context: {
                    doctorName: appointment.doctor.firstName,
                    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
                    oldDate: rescheduledFrom.date,
                    oldTime: rescheduledFrom.time,
                    newDate: appointmentDate,
                    newTime: appointmentTime,
                    rescheduledBy,
                    reason: reason || 'No reason provided'
                }
            });
        } catch (emailError) {
            console.error('Failed to send reschedule emails:', emailError);
        }


        return appointment;
    },

    /**
     * Cancels an appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {string} reason - Optional reason for cancellation.
     * @param {Object} user - The authenticated user object for access control.
     * @returns {Promise<Object>} The cancelled appointment object.
     */
    cancelAppointment: async (appointmentId, reason, user) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if user can cancel this appointment
        const isPatient = appointment.patient._id.toString() === user._id.toString();
        const isDoctor = appointment.doctor._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new Error('Access denied');
        }

        // Cancel appointment
        appointment.status = 'cancelled';
        appointment.cancellationReason = reason;
        appointment.cancelledBy = user._id;
        appointment.cancelledAt = new Date();

        await appointment.save();

        // Send cancellation notification
        const cancelledBy = user.role === 'patient' ? 'patient' : 'doctor';

        try {
            await sendEmail({
                to: appointment.patient.email,
                subject: 'Appointment Cancelled - Smart Healthcare Assistant',
                template: 'appointmentCancelled',
                context: {
                    patientName: appointment.patient.firstName,
                    doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    cancelledBy,
                    reason: reason || 'No reason provided'
                }
            });

            await sendEmail({
                to: appointment.doctor.email,
                subject: 'Appointment Cancelled - Smart Healthcare Assistant',
                template: 'appointmentCancelled',
                context: {
                    doctorName: appointment.doctor.firstName,
                    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    cancelledBy,
                    reason: reason || 'No reason provided'
                }
            });
        } catch (emailError) {
            console.error('Failed to send cancellation emails:', emailError);
        }

        return appointment;
    },

    /**
     * Rates a completed appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {number} rating - The rating (1-5).
     * @param {string} review - Optional review text.
     * @param {Object} user - The authenticated patient user object.
     * @returns {Promise<Object>} The updated appointment object.
     */
    rateAppointment: async (appointmentId, rating, review, user) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctor', 'firstName lastName');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if patient owns this appointment
        if (appointment.patient.toString() !== user._id.toString()) {
            throw new Error('Access denied');
        }

        // Check if appointment is completed
        if (appointment.status !== 'completed') {
            throw new Error('Can only rate completed appointments');
        }

        // Update appointment rating
        appointment.rating = rating;
        appointment.review = review;
        appointment.reviewDate = new Date();

        await appointment.save();

        // Update doctor's average rating
        const doctor = await User.findById(appointment.doctor._id);
        const doctorAppointments = await Appointment.find({
            doctor: appointment.doctor._id,
            rating: {
                $exists: true,
                $ne: null
            }
        });

        const totalRating = doctorAppointments.reduce((sum, apt) => sum + apt.rating, 0);
        const averageRating = totalRating / doctorAppointments.length;

        doctor.doctorInfo.rating = averageRating;
        doctor.doctorInfo.totalReviews = doctorAppointments.length;
        await doctor.save();

        return appointment;
    },

    /**
     * Gets upcoming appointments for a user (patient or doctor).
     * @param {Object} user - The authenticated user object.
     * @returns {Promise<Array>} List of upcoming appointments.
     */
    getUpcomingAppointments: async (user) => {
        const query = {
            appointmentDate: {
                $gte: new Date()
            },
            status: {
                $in: ['pending', 'confirmed']
            }
        };

        if (user.role === 'patient') {
            query.patient = user._id;
        } else if (user.role === 'doctor') {
            query.doctor = user._id;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email phone')
            .populate('doctor', 'firstName lastName email phone')
            .sort({
                appointmentDate: 1,
                appointmentTime: 1
            })
            .limit(5);

        return appointments;
    },

    /**
     * Adds or updates consultation notes for an appointment.
     * @param {string} appointmentId - The ID of the appointment.
     * @param {Object} notesData - Object containing diagnosis, treatment, followUp, signature.
     * @param {Object} user - The authenticated user object for access control.
     * @returns {Promise<Object>} The updated appointment object.
     */
    updateConsultationNotes: async (appointmentId, notesData, user) => {
        const {
            diagnosis,
            treatment,
            followUp,
            signature
        } = notesData;

        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Check if doctor owns this appointment or is admin
        const isOwner = appointment.doctor._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new Error('Access denied');
        }

        if (diagnosis !== undefined) appointment.diagnosis = diagnosis;
        if (treatment !== undefined) appointment.treatment = treatment;
        if (followUp !== undefined) appointment.followUpNotes = followUp;
        if (signature !== undefined) appointment.doctorNotes = signature;

        await appointment.save();

        return appointment;
    },

    /**
     * Checks doctor availability for a given date and time.
     * @param {string} doctorId - The ID of the doctor.
     * @param {string} appointmentDate - The date string.
     * @param {string} appointmentTime - The time string.
     * @returns {Promise<boolean>} True if available, false otherwise.
     */
    checkDoctorAvailability: async (doctorId, appointmentDate, appointmentTime) => {
        if (!doctorId || !appointmentDate || !appointmentTime) {
            throw new Error('Missing required parameters for availability check.');
        }
        return await Appointment.checkAvailability(doctorId, appointmentDate, appointmentTime);
    },

    /**
     * Get appointments for the current patient.
     * @param {Object} user - The authenticated patient user object.
     * @param {Object} filters - Query parameters for pagination.
     * @returns {Promise<Object>} Object containing appointments and pagination info.
     */
    getPatientAppointments: async (user, filters) => {
        const {
            page = 1,
            limit = 10
        } = filters;
        const query = {
            patient: user._id
        };
        const appointments = await Appointment.find(query)
            .populate('doctor', 'firstName lastName email phone')
            .sort({
                appointmentDate: -1,
                appointmentTime: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Appointment.countDocuments(query);
        return {
            appointments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalAppointments: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    },

    /**
     * Get appointments for the current doctor.
     * @param {Object} user - The authenticated doctor user object.
     * @param {Object} filters - Query parameters for pagination.
     * @returns {Promise<Object>} Object containing appointments and pagination info.
     */
    getDoctorAppointments: async (user, filters) => {
        const {
            page = 1,
            limit = 10
        } = filters;
        const query = {
            doctor: user._id
        };
        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email phone')
            .sort({
                appointmentDate: -1,
                appointmentTime: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Appointment.countDocuments(query);
        return {
            appointments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalAppointments: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    },
};

module.exports = appointmentService;