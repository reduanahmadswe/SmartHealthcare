const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const LabTest = require('../models/LabTest');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', requireAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  // Get user statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verifiedCount: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  // Get appointment statistics
  const appointmentStats = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$consultationFee' }
      }
    }
  ]);

  // Get prescription statistics
  const prescriptionStats = await Prescription.aggregate([
    {
      $match: {
        prescriptionDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        avgMedicationsPerPrescription: { $avg: { $size: '$medications' } }
      }
    }
  ]);

  // Get medical record statistics
  const medicalRecordStats = await MedicalRecord.aggregate([
    {
      $match: {
        recordDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    }
  ]);

  // Get lab test statistics
  const labTestStats = await LabTest.aggregate([
    {
      $match: {
        appointmentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$testType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$testFee' }
      }
    }
  ]);

  // Get recent activities
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email role createdAt');

  const recentAppointments = await Appointment.find()
    .populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      period: { start, end },
      userStats,
      appointmentStats,
      prescriptionStats: prescriptionStats[0] || { totalPrescriptions: 0, avgMedicationsPerPrescription: 0 },
      medicalRecordStats,
      labTestStats,
      recentUsers,
      recentAppointments
    }
  });
}));

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', requireAdmin, asyncHandler(async (req, res) => {
  const {
    role,
    status,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }
  if (status === 'verified') {
    query.isVerified = true;
  } else if (status === 'unverified') {
    query.isVerified = false;
  } else if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const users = await User.find(query)
    .select('-password -loginHistory')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/admin/users/:id
// @desc    Get user details by ID
// @access  Private (Admin only)
router.get('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -loginHistory');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
}));

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify user (Admin only)
// @access  Private (Admin only)
router.put('/users/:id/verify', requireAdmin, [
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
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (status === 'approved') {
    user.isVerified = true;
    user.verifiedBy = req.user._id;
    user.verifiedAt = new Date();
  } else {
    user.isVerified = false;
    user.verificationRejectedReason = reason;
  }

  await user.save();

  // Send notification email to user
  await sendEmail({
    to: user.email,
    subject: `Account Verification ${status === 'approved' ? 'Approved' : 'Rejected'} - Smart Healthcare Assistant`,
    template: 'accountVerification',
    context: {
      name: user.firstName,
      status,
      reason: reason || 'No reason provided'
    }
  });

  res.json({
    success: true,
    message: `User ${status} successfully`,
    data: {
      user
    }
  });
}));

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin only)
router.put('/users/:id/status', requireAdmin, [
  body('isActive').isBoolean().withMessage('Active status is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { isActive } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user
    }
  });
}));

// @route   GET /api/admin/appointments
// @desc    Get all appointments with filters
// @access  Private (Admin only)
router.get('/appointments', requireAdmin, asyncHandler(async (req, res) => {
  const {
    status,
    date,
    doctorId,
    patientId,
    page = 1,
    limit = 10
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }
  if (date) {
    query.appointmentDate = {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
    };
  }
  if (doctorId) {
    query.doctor = doctorId;
  }
  if (patientId) {
    query.patient = patientId;
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email')
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

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin only)
router.get('/analytics', requireAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  // User registration trends
  const userRegistrationTrends = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Appointment trends
  const appointmentTrends = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$consultationFee' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Revenue by doctor
  const revenueByDoctor = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        'payment.status': 'paid'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: '$doctor._id',
        doctorName: { $first: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] } },
        totalRevenue: { $sum: '$payment.amount' },
        appointmentCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Top performing doctors
  const topDoctors = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: '$doctor._id',
        doctorName: { $first: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] } },
        appointmentCount: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    },
    { $sort: { appointmentCount: -1 } },
    { $limit: 10 }
  ]);

  // Patient demographics
  const patientDemographics = await User.aggregate([
    {
      $match: {
        role: 'patient',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 }
      }
    }
  ]);

  // Age distribution
  const ageDistribution = await User.aggregate([
    {
      $match: {
        role: 'patient',
        dateOfBirth: { $exists: true }
      }
    },
    {
      $addFields: {
        age: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$dateOfBirth'] },
              365 * 24 * 60 * 60 * 1000
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lt: ['$age', 18] }, then: '0-17' },
              { case: { $lt: ['$age', 30] }, then: '18-29' },
              { case: { $lt: ['$age', 45] }, then: '30-44' },
              { case: { $lt: ['$age', 60] }, then: '45-59' },
              { case: { $lt: ['$age', 75] }, then: '60-74' }
            ],
            default: '75+'
          }
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      userRegistrationTrends,
      appointmentTrends,
      revenueByDoctor,
      topDoctors,
      patientDemographics,
      ageDistribution
    }
  });
}));

// @route   GET /api/admin/system-health
// @desc    Get system health metrics
// @access  Private (Admin only)
router.get('/system-health', requireAdmin, asyncHandler(async (req, res) => {
  // Database statistics
  const dbStats = {
    users: await User.countDocuments(),
    appointments: await Appointment.countDocuments(),
    prescriptions: await Prescription.countDocuments(),
    medicalRecords: await MedicalRecord.countDocuments(),
    labTests: await LabTest.countDocuments()
  };

  // Recent errors (implement logging system)
  const recentErrors = []; // This would come from a logging system

  // System performance metrics
  const systemMetrics = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };

  res.json({
    success: true,
    data: {
      dbStats,
      recentErrors,
      systemMetrics
    }
  });
}));

// @route   POST /api/admin/broadcast-email
// @desc    Send broadcast email to users
// @access  Private (Admin only)
router.post('/broadcast-email', requireAdmin, [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('recipients').isIn(['all', 'patients', 'doctors', 'admins']).withMessage('Valid recipients required'),
  body('role').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { subject, message, recipients, role } = req.body;

  // Build query based on recipients
  const query = {};
  if (recipients === 'patients') {
    query.role = 'patient';
  } else if (recipients === 'doctors') {
    query.role = 'doctor';
  } else if (recipients === 'admins') {
    query.role = 'admin';
  }

  // Get users to send email to
  const users = await User.find(query)
    .select('email firstName lastName')
    .limit(1000); // Limit to prevent abuse

  // Send emails in batches
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < users.length; i += batchSize) {
    batches.push(users.slice(i, i + batchSize));
  }

  let successCount = 0;
  let failureCount = 0;

  for (const batch of batches) {
    const emailPromises = batch.map(user =>
      sendEmail({
        to: user.email,
        subject,
        template: 'broadcast',
        context: {
          name: user.firstName,
          message
        }
      }).catch(error => {
        console.error(`Failed to send email to ${user.email}:`, error);
        return false;
      })
    );

    const results = await Promise.allSettled(emailPromises);
    successCount += results.filter(r => r.status === 'fulfilled' && r.value !== false).length;
    failureCount += results.filter(r => r.status === 'rejected' || r.value === false).length;
  }

  res.json({
    success: true,
    message: 'Broadcast email sent',
    data: {
      totalRecipients: users.length,
      successCount,
      failureCount
    }
  });
}));

// @route   GET /api/admin/logs
// @desc    Get system logs
// @access  Private (Admin only)
router.get('/logs', requireAdmin, asyncHandler(async (req, res) => {
  const { level, startDate, endDate, page = 1, limit = 100 } = req.query;

  // This would integrate with a proper logging system
  // For now, return mock data
  const logs = [
    {
      timestamp: new Date(),
      level: 'info',
      message: 'System started successfully',
      userId: 'system'
    }
  ];

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalLogs: logs.length,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  });
}));

module.exports = router; 