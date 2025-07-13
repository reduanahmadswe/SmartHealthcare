const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireDoctor, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadToCloudinary } = require('../utils/cloudinaryService');

const router = express.Router();

// @route   POST /api/doctors/register
// @desc    Register a new doctor
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('specialization').isArray().notEmpty(),
  body('experience').isNumeric(),
  body('licenseNumber').notEmpty(),
  body('consultationFee').isNumeric(),
  body('address').isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    specialization,
    experience,
    licenseNumber,
    consultationFee,
    address,
    education,
    certifications
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create doctor user
  const doctor = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    role: 'doctor',
    address,
    doctorInfo: {
      specialization,
      experience,
      licenseNumber,
      consultationFee,
      education: education || [],
      certifications: certifications || []
    }
  });

  await doctor.save();

  res.status(201).json({
    success: true,
    message: 'Doctor registered successfully. Please wait for admin verification.',
    data: {
      doctor: doctor.getPublicProfile()
    }
  });
}));

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put('/profile', requireDoctor, [
  body('specialization').optional().isArray(),
  body('experience').optional().isNumeric(),
  body('consultationFee').optional().isNumeric(),
  body('education').optional().isArray(),
  body('certifications').optional().isArray(),
  body('availableSlots').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const allowedFields = [
    'specialization', 'experience', 'consultationFee',
    'education', 'certifications', 'availableSlots'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[`doctorInfo.${field}`] = req.body[field];
    }
  });

  const doctor = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Doctor profile updated successfully',
    data: {
      doctor: doctor.getPublicProfile()
    }
  });
}));

// @route   POST /api/doctors/certificates
// @desc    Upload doctor certificates
// @access  Private (Doctor only)
router.post('/certificates', requireDoctor, asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a certificate file'
    });
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.path, 'doctor-certificates');

  // Add certificate to doctor profile
  const certificate = {
    name: req.body.certificateName || 'Certificate',
    issuingAuthority: req.body.issuingAuthority || 'Unknown',
    issueDate: req.body.issueDate || new Date(),
    certificateUrl: result.secure_url
  };

  const doctor = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { 'doctorInfo.certifications': certificate } },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Certificate uploaded successfully',
    data: {
      certificate,
      doctor: doctor.getPublicProfile()
    }
  });
}));

// @route   GET /api/doctors/pending-verification
// @desc    Get doctors pending verification (Admin only)
// @access  Private (Admin only)
router.get('/pending-verification', requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const doctors = await User.find({
    role: 'doctor',
    isVerified: false,
    isActive: true
  })
  .select('firstName lastName email phone doctorInfo createdAt')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  const total = await User.countDocuments({
    role: 'doctor',
    isVerified: false,
    isActive: true
  });

  res.json({
    success: true,
    data: {
      doctors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDoctors: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   PUT /api/doctors/:id/verify
// @desc    Verify doctor (Admin only)
// @access  Private (Admin only)
router.put('/:id/verify', requireAdmin, [
  body('status').isIn(['approved', 'rejected']),
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { status, reason } = req.body;
  const doctorId = req.params.id;

  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor'
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  if (status === 'approved') {
    doctor.isVerified = true;
    doctor.verifiedBy = req.user._id;
    doctor.verifiedAt = new Date();
  } else {
    doctor.isVerified = false;
    doctor.verificationRejectedReason = reason;
  }

  await doctor.save();

  // Send email notification to doctor
  const { sendEmail } = require('../utils/emailService');
  await sendEmail({
    to: doctor.email,
    subject: `Doctor Verification ${status === 'approved' ? 'Approved' : 'Rejected'} - Smart Healthcare Assistant`,
    template: 'doctorVerification',
    context: {
      name: doctor.firstName,
      status,
      reason: reason || 'No reason provided'
    }
  });

  res.json({
    success: true,
    message: `Doctor ${status} successfully`,
    data: {
      doctor: doctor.getPublicProfile()
    }
  });
}));

// @route   GET /api/doctors/:id/appointments
// @desc    Get doctor's appointments
// @access  Private (Doctor only)
router.get('/:id/appointments', requireDoctor, asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 10 } = req.query;
  const doctorId = req.params.id;

  // Verify doctor owns this profile or is admin
  if (req.user._id.toString() !== doctorId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const query = { doctor: doctorId };

  if (status) {
    query.status = status;
  }
  if (date) {
    query.appointmentDate = {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
    };
  }

  const Appointment = require('../models/Appointment');
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

// @route   GET /api/doctors/:id/schedule
// @desc    Get doctor's schedule
// @access  Private (Doctor only)
router.get('/:id/schedule', requireDoctor, asyncHandler(async (req, res) => {
  const doctorId = req.params.id;

  // Verify doctor owns this profile or is admin
  if (req.user._id.toString() !== doctorId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const doctor = await User.findById(doctorId);
  const availableSlots = doctor.doctorInfo.availableSlots || [];

  res.json({
    success: true,
    data: {
      doctorId,
      availableSlots,
      consultationFee: doctor.doctorInfo.consultationFee
    }
  });
}));

// @route   PUT /api/doctors/:id/schedule
// @desc    Update doctor's schedule
// @access  Private (Doctor only)
router.put('/:id/schedule', requireDoctor, [
  body('availableSlots').isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const doctorId = req.params.id;
  const { availableSlots } = req.body;

  // Verify doctor owns this profile or is admin
  if (req.user._id.toString() !== doctorId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const doctor = await User.findByIdAndUpdate(
    doctorId,
    { 'doctorInfo.availableSlots': availableSlots },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Schedule updated successfully',
    data: {
      availableSlots: doctor.doctorInfo.availableSlots
    }
  });
}));

// @route   GET /api/doctors/:id/statistics
// @desc    Get doctor's statistics
// @access  Private (Doctor only)
router.get('/:id/statistics', requireDoctor, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const doctorId = req.params.id;

  // Verify doctor owns this profile or is admin
  if (req.user._id.toString() !== doctorId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const Appointment = require('../models/Appointment');
  const Prescription = require('../models/Prescription');

  // Get appointment statistics
  const appointmentStats = await Appointment.getStatistics(doctorId, start, end);

  // Get prescription statistics
  const prescriptionStats = await Prescription.getStatistics(doctorId, start, end);

  // Calculate revenue
  const totalRevenue = appointmentStats.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0);

  // Get patient count
  const uniquePatients = await Appointment.distinct('patient', {
    doctor: doctorId,
    appointmentDate: { $gte: start, $lte: end }
  });

  res.json({
    success: true,
    data: {
      period: { start, end },
      appointments: appointmentStats,
      prescriptions: prescriptionStats,
      totalRevenue,
      uniquePatients: uniquePatients.length
    }
  });
}));

// @route   GET /api/doctors/specializations
// @desc    Get all specializations
// @access  Public
router.get('/specializations', asyncHandler(async (req, res) => {
  const specializations = await User.aggregate([
    {
      $match: {
        role: 'doctor',
        isVerified: true,
        isActive: true
      }
    },
    {
      $unwind: '$doctorInfo.specialization'
    },
    {
      $group: {
        _id: '$doctorInfo.specialization',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      specializations: specializations.map(spec => ({
        name: spec._id,
        count: spec.count
      }))
    }
  });
}));

module.exports = router; 