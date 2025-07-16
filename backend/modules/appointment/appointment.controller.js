const { validationResult } = require('express-validator');
const appointmentService = require('./appointment.service'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 

const appointmentController = {
    bookAppointment: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const appointment = await appointmentService.bookAppointment(req.body, req.user);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointment
            }
        });
    }),

    getAppointments: asyncHandler(async (req, res) => {
        const {
            appointments,
            pagination
        } = await appointmentService.getAppointments(req.user, req.query);

        res.json({
            success: true,
            data: {
                appointments,
                pagination
            }
        });
    }),

    getPatientAppointments: asyncHandler(async (req, res) => {
        const {
            appointments,
            pagination
        } = await appointmentService.getPatientAppointments(req.user, req.query);

        res.json({
            success: true,
            data: {
                appointments,
                pagination
            }
        });
    }),

    getDoctorAppointments: asyncHandler(async (req, res) => {
        const {
            appointments,
            pagination
        } = await appointmentService.getDoctorAppointments(req.user, req.query);

        res.json({
            success: true,
            data: {
                appointments,
                pagination
            }
        });
    }),

    checkDoctorAvailability: asyncHandler(async (req, res) => {
        const { doctor, appointmentDate, appointmentTime } = req.query;
        const isAvailable = await appointmentService.checkDoctorAvailability(doctor, appointmentDate, appointmentTime);
        res.json({ success: true, available: isAvailable });
    }),

    getAppointmentById: asyncHandler(async (req, res) => {
        const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);

        res.json({
            success: true,
            data: {
                appointment
            }
        });
    }),

    updateAppointmentStatus: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            status,
            notes
        } = req.body;
        const appointmentId = req.params.id;

        const appointment = await appointmentService.updateAppointmentStatus(
            appointmentId,
            status,
            notes,
            req.user
        );

        res.json({
            success: true,
            message: 'Appointment status updated successfully',
            data: {
                appointment
            }
        });
    }),

    rescheduleAppointment: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const appointmentId = req.params.id;
        const rescheduleData = req.body;

        const appointment = await appointmentService.rescheduleAppointment(
            appointmentId,
            rescheduleData,
            req.user
        );

        res.json({
            success: true,
            message: 'Appointment rescheduled successfully',
            data: {
                appointment
            }
        });
    }),

    cancelAppointment: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            reason
        } = req.body;
        const appointmentId = req.params.id;

        const appointment = await appointmentService.cancelAppointment(
            appointmentId,
            reason,
            req.user
        );

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: {
                appointment
            }
        });
    }),

    rateAppointment: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            rating,
            review
        } = req.body;
        const appointmentId = req.params.id;

        const appointment = await appointmentService.rateAppointment(
            appointmentId,
            rating,
            review,
            req.user
        );

        res.json({
            success: true,
            message: 'Appointment rated successfully',
            data: {
                appointment
            }
        });
    }),

    getUpcomingAppointments: asyncHandler(async (req, res) => {
        const appointments = await appointmentService.getUpcomingAppointments(req.user);

        res.json({
            success: true,
            data: {
                appointments
            }
        });
    }),

    updateConsultationNotes: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const appointmentId = req.params.id;
        const notesData = req.body;

        const appointment = await appointmentService.updateConsultationNotes(
            appointmentId,
            notesData,
            req.user
        );

        res.json({
            success: true,
            message: 'Consultation notes updated successfully',
            data: {
                appointment
            }
        });
    }),
};

module.exports = appointmentController;