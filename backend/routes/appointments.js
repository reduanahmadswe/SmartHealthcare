const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authenticateToken, requirePatient, requireDoctor, requireOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Booking handler function
const bookAppointmentHandler = [
  requirePatient,
  [
    body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
    body('appointmentType').isIn(['consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination']),
    body('appointmentMode').isIn(['in_person', 'video_call', 'chat']),
    body('symptoms').optional().isArray(),
    body('patientNotes').optional().isString(),
    body('isEmergency').optional().isBoolean()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      appointmentMode,
      symptoms,
      patientNotes,
      isEmergency
    } = req.body;

    // Check if doctor exists and is verified
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isVerified: true,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not verified'
      });
    }

    // Check if appointment time is available
    const isAvailable = await Appointment.checkAvailability(
      doctorId,
      appointmentDate,
      appointmentTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: req.user._id,
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

    // Populate doctor and patient details
    await appointment.populate('doctor', 'firstName lastName email phone');
    await appointment.populate('patient', 'firstName lastName email phone');

    // Send confirmation email to patient
    await sendEmail({
      to: req.user.email,
      subject: 'Appointment Booked - Smart Healthcare Assistant',
      template: 'appointmentConfirmation',
      context: {
        patientName: req.user.firstName,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        appointmentType: appointmentType,
        appointmentMode: appointmentMode,
        consultationFee: doctor.doctorInfo.consultationFee
      }
    });

    // Send notification email to doctor
    await sendEmail({
      to: doctor.email,
      subject: 'New Appointment Request - Smart Healthcare Assistant',
      template: 'newAppointmentRequest',
      context: {
        doctorName: doctor.firstName,
        patientName: `${req.user.firstName} ${req.user.lastName}`,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        appointmentType: appointmentType,
        appointmentMode: appointmentMode
      }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment
      }
    });
  })
];

// Support both POST /api/appointments and POST /api/appointments/book
router.post('/', ...bookAppointmentHandler);
router.post('/book', ...bookAppointmentHandler);

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 10 } = req.query;

  const query = {};

  // Filter by user role
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
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
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Appointment.countDocuments(query);

  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Add this route before any '/:id' route
// @route   GET /api/appointments/patient
// @desc    Get appointments for the current patient
// @access  Private (Patient only)
router.get('/patient', requirePatient, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const query = { patient: req.user._id };
  const appointments = await Appointment.find(query)
    .populate('doctor', 'firstName lastName email phone')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await Appointment.countDocuments(query);
  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Place this before any '/:id' route
// @route   GET /api/appointments/check
// @desc    Check doctor availability
// @access  Private
router.get('/check', authenticateToken, asyncHandler(async (req, res) => {
  const { doctor, appointmentDate, appointmentTime } = req.query;
  if (!doctor || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ success: false, message: 'Missing required query params.' });
  }
  const isAvailable = await Appointment.checkAvailability(doctor, appointmentDate, appointmentTime);
  res.json({ success: true, available: isAvailable });
}));

// @route   GET /api/appointments/doctor
// @desc    Get appointments for the current doctor
// @access  Private (Doctor only)
router.get('/doctor', requireDoctor, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const query = { doctor: req.user._id };
  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email phone')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await Appointment.countDocuments(query);
  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone patientInfo')
    .populate('doctor', 'firstName lastName email phone doctorInfo');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this appointment
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor/Admin only)
router.put('/:id/status', [requireDoctor], [
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  body('notes').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, notes } = req.body;
  const appointmentId = req.params.id;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if doctor owns this appointment or is admin
  const isOwner = appointment.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const oldStatus = appointment.status;
  appointment.status = status;
  if (notes) {
    appointment.doctorNotes = notes;
  }

  await appointment.save();

  // Send notification email to patient
  if (status !== oldStatus) {
    await sendEmail({
      to: appointment.patient.email,
      subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} - Smart Healthcare Assistant`,
      template: 'appointmentStatusUpdate',
      context: {
        patientName: appointment.patient.firstName,
        doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        oldStatus,
        newStatus: status,
        notes: notes || ''
      }
    });
  }

  res.json({
    success: true,
    message: 'Appointment status updated successfully',
    data: {
      appointment
    }
  });
}));

// @route   PUT /api/appointments/:id/reschedule
// @desc    Reschedule appointment
// @access  Private
router.put('/:id/reschedule', [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentDate, appointmentTime, reason } = req.body;
  const appointmentId = req.params.id;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user can reschedule this appointment
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if new time is available
  const isAvailable = await Appointment.checkAvailability(
    appointment.doctor._id,
    appointmentDate,
    appointmentTime,
    appointment.duration
  );

  if (!isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Selected time slot is not available'
    });
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
  appointment.rescheduledBy = req.user._id;
  appointment.rescheduledAt = new Date();

  await appointment.save();

  // Send notification emails
  const rescheduledBy = req.user.role === 'patient' ? 'patient' : 'doctor';
  
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

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: {
      appointment
    }
  });
}));

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', [
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const appointmentId = req.params.id;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user can cancel this appointment
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Cancel appointment
  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  appointment.cancelledBy = req.user._id;
  appointment.cancelledAt = new Date();

  await appointment.save();

  // Send cancellation notification
  const cancelledBy = req.user.role === 'patient' ? 'patient' : 'doctor';

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

  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: {
      appointment
    }
  });
}));

// @route   POST /api/appointments/:id/rating
// @desc    Rate appointment
// @access  Private (Patient only)
router.post('/:id/rating', requirePatient, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { rating, review } = req.body;
  const appointmentId = req.params.id;

  const appointment = await Appointment.findById(appointmentId)
    .populate('doctor', 'firstName lastName');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if patient owns this appointment
  if (appointment.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if appointment is completed
  if (appointment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only rate completed appointments'
    });
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
    rating: { $exists: true, $ne: null }
  });

  const totalRating = doctorAppointments.reduce((sum, apt) => sum + apt.rating, 0);
  const averageRating = totalRating / doctorAppointments.length;

  doctor.doctorInfo.rating = averageRating;
  doctor.doctorInfo.totalReviews = doctorAppointments.length;
  await doctor.save();

  res.json({
    success: true,
    message: 'Appointment rated successfully',
    data: {
      appointment
    }
  });
}));

// @route   GET /api/appointments/upcoming
// @desc    Get upcoming appointments
// @access  Private
router.get('/upcoming', asyncHandler(async (req, res) => {
  const query = {
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };

  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email phone')
    .populate('doctor', 'firstName lastName email phone')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      appointments
    }
  });
}));

module.exports = router; 