const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requirePatient, requireDoctor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const LabTest = require('../models/LabTest');
const HealthData = require('../models/HealthData');

const router = express.Router();

// @route   GET /api/analytics/health-dashboard
// @desc    Get patient health analytics dashboard
// @access  Private (Patient only)
router.get('/health-dashboard', requirePatient, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  // Get patient's health data
  const patient = await User.findById(req.user._id);
  const healthData = patient.patientInfo || {};

  // Get appointment statistics
  const appointmentStats = await Appointment.aggregate([
    {
      $match: {
        patient: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSpent: { $sum: '$consultationFee' }
      }
    }
  ]);

  // Get prescription statistics
  const prescriptionStats = await Prescription.aggregate([
    {
      $match: {
        patient: req.user._id,
        prescriptionDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        avgMedicationsPerPrescription: { $avg: { $size: '$medications' } },
        mostCommonMedications: {
          $push: '$medications.name'
        }
      }
    }
  ]);

  // Get medical record statistics
  const medicalRecordStats = await MedicalRecord.aggregate([
    {
      $match: {
        patient: req.user._id,
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
        patient: req.user._id,
        appointmentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$testType',
        count: { $sum: 1 },
        totalSpent: { $sum: '$testFee' },
        abnormalResults: {
          $sum: {
            $cond: [
              { $eq: ['$testResults.isAbnormal', true] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Calculate health trends
  const healthTrends = await calculateHealthTrends(req.user._id, start, end);

  // Get medication adherence
  const medicationAdherence = await calculateMedicationAdherence(req.user._id, start, end);

  // Get vital signs trends
  const vitalSignsTrends = await calculateVitalSignsTrends(req.user._id, start, end);

  res.json({
    success: true,
    data: {
      period: { start, end },
      healthData,
      appointmentStats,
      prescriptionStats: prescriptionStats[0] || {
        totalPrescriptions: 0,
        avgMedicationsPerPrescription: 0,
        mostCommonMedications: []
      },
      medicalRecordStats,
      labTestStats,
      healthTrends,
      medicationAdherence,
      vitalSignsTrends
    }
  });
}));

// @route   GET /api/analytics/doctor-dashboard
// @desc    Get doctor analytics dashboard
// @access  Private (Doctor only)
router.get('/doctor-dashboard', requireDoctor, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  // Get appointment statistics
  const appointmentStats = await Appointment.aggregate([
    {
      $match: {
        doctor: req.user._id,
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

  // Get patient demographics
  const patientDemographics = await Appointment.aggregate([
    {
      $match: {
        doctor: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patient'
      }
    },
    {
      $unwind: '$patient'
    },
    {
      $group: {
        _id: '$patient.gender',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get prescription statistics
  const prescriptionStats = await Prescription.aggregate([
    {
      $match: {
        doctor: req.user._id,
        prescriptionDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        avgMedicationsPerPrescription: { $avg: { $size: '$medications' } },
        mostPrescribedMedications: {
          $push: '$medications.name'
        }
      }
    }
  ]);

  // Get rating statistics
  const ratingStats = await Appointment.aggregate([
    {
      $match: {
        doctor: req.user._id,
        rating: { $exists: true, $ne: null },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  // Get appointment trends
  const appointmentTrends = await Appointment.aggregate([
    {
      $match: {
        doctor: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$consultationFee' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get top patients
  const topPatients = await Appointment.aggregate([
    {
      $match: {
        doctor: req.user._id,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'patient',
        foreignField: '_id',
        as: 'patient'
      }
    },
    {
      $unwind: '$patient'
    },
    {
      $group: {
        _id: '$patient._id',
        patientName: { $first: { $concat: ['$patient.firstName', ' ', '$patient.lastName'] } },
        appointmentCount: { $sum: 1 },
        totalSpent: { $sum: '$consultationFee' },
        avgRating: { $avg: '$rating' }
      }
    },
    { $sort: { appointmentCount: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      appointmentStats,
      patientDemographics,
      prescriptionStats: prescriptionStats[0] || {
        totalPrescriptions: 0,
        avgMedicationsPerPrescription: 0,
        mostPrescribedMedications: []
      },
      ratingStats: ratingStats[0] || {
        avgRating: 0,
        totalReviews: 0,
        ratingDistribution: []
      },
      appointmentTrends,
      topPatients
    }
  });
}));

// @route   GET /api/analytics/health-trends
// @desc    Get health trends over time
// @access  Private (Patient only)
router.get('/health-trends', requirePatient, asyncHandler(async (req, res) => {
  const { startDate, endDate, metric } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 90));
  const end = endDate ? new Date(endDate) : new Date();

  const trends = await calculateHealthTrends(req.user._id, start, end, metric);

  res.json({
    success: true,
    data: {
      period: { start, end },
      metric,
      trends
    }
  });
}));

// @route   GET /api/analytics/medication-adherence
// @desc    Get medication adherence analytics
// @access  Private (Patient only)
router.get('/medication-adherence', requirePatient, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const adherence = await calculateMedicationAdherence(req.user._id, start, end);

  res.json({
    success: true,
    data: {
      period: { start, end },
      adherence
    }
  });
}));

// @route   GET /api/analytics/vital-signs
// @desc    Get vital signs trends
// @access  Private (Patient only)
router.get('/vital-signs', requirePatient, asyncHandler(async (req, res) => {
  const { startDate, endDate, vital } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const trends = await calculateVitalSignsTrends(req.user._id, start, end, vital);

  res.json({
    success: true,
    data: {
      period: { start, end },
      vital,
      trends
    }
  });
}));

// @route   GET /api/analytics/vitals/:userId
// @desc    Get vitals analytics for a patient
// @access  Private (Patient, Doctor, Admin)
router.get('/vitals/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;

  // Check access permissions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own vitals.'
    });
  }

  if (req.user.role === 'doctor') {
    // Check if doctor has appointment with this patient
    const Appointment = require('../models/Appointment');
    const hasAppointment = await Appointment.findOne({
      doctor: req.user._id,
      patient: userId,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (!hasAppointment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No appointment history with this patient.'
      });
    }
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const vitalsHistory = await HealthData.find({
    patient: userId,
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: 1 })
  .select('vitals measurements createdAt');

  // Format data for charts
  const chartData = {
    bloodPressure: vitalsHistory.map(record => ({
      date: record.createdAt,
      systolic: record.vitals.bloodPressure?.systolic,
      diastolic: record.vitals.bloodPressure?.diastolic
    })).filter(item => item.systolic || item.diastolic),
    
    heartRate: vitalsHistory.map(record => ({
      date: record.createdAt,
      value: record.vitals.heartRate?.value
    })).filter(item => item.value),
    
    temperature: vitalsHistory.map(record => ({
      date: record.createdAt,
      value: record.vitals.temperature?.value
    })).filter(item => item.value),
    
    oxygenSaturation: vitalsHistory.map(record => ({
      date: record.createdAt,
      value: record.vitals.oxygenSaturation?.value
    })).filter(item => item.value),
    
    weight: vitalsHistory.map(record => ({
      date: record.createdAt,
      value: record.measurements.weight?.value
    })).filter(item => item.value),
    
    bmi: vitalsHistory.map(record => ({
      date: record.createdAt,
      value: record.measurements.bmi
    })).filter(item => item.value)
  };

  // Calculate trends
  const trends = {
    bloodPressure: calculateTrend(chartData.bloodPressure, 'systolic'),
    heartRate: calculateTrend(chartData.heartRate, 'value'),
    temperature: calculateTrend(chartData.temperature, 'value'),
    oxygenSaturation: calculateTrend(chartData.oxygenSaturation, 'value'),
    weight: calculateTrend(chartData.weight, 'value'),
    bmi: calculateTrend(chartData.bmi, 'value')
  };

  res.json({
    success: true,
    data: {
      period: { startDate, endDate: new Date() },
      vitalsHistory,
      chartData,
      trends,
      summary: {
        totalRecords: vitalsHistory.length,
        abnormalRecords: vitalsHistory.filter(record => record.isAbnormal).length,
        latestRecord: vitalsHistory[vitalsHistory.length - 1] || null
      }
    }
  });
}));

// @route   POST /api/analytics/health-goals
// @desc    Set health goals
// @access  Private (Patient only)
router.post('/health-goals', requirePatient, [
  body('goals').isArray().withMessage('Goals must be an array'),
  body('goals.*.type').isIn(['weight', 'blood_pressure', 'steps', 'sleep', 'medication', 'custom']),
  body('goals.*.target').notEmpty().withMessage('Target is required'),
  body('goals.*.deadline').isISO8601().withMessage('Valid deadline is required'),
  body('goals.*.description').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { goals } = req.body;

  const user = await User.findById(req.user._id);
  user.healthGoals = goals;
  await user.save();

  res.json({
    success: true,
    message: 'Health goals updated successfully',
    data: {
      goals
    }
  });
}));

// @route   GET /api/analytics/health-goals
// @desc    Get health goals
// @access  Private (Patient only)
router.get('/health-goals', requirePatient, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const goals = user.healthGoals || [];

  // Calculate progress for each goal
  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const progress = await calculateGoalProgress(req.user._id, goal);
      return {
        ...goal,
        progress
      };
    })
  );

  res.json({
    success: true,
    data: {
      goals: goalsWithProgress
    }
  });
}));

// Helper functions
const calculateHealthTrends = async (userId, start, end, metric = null) => {
  // This would calculate health trends based on medical records, vitals, etc.
  // For now, return mock data
  return {
    weight: [
      { date: '2024-01-01', value: 70 },
      { date: '2024-01-15', value: 69.5 },
      { date: '2024-02-01', value: 69 }
    ],
    bloodPressure: [
      { date: '2024-01-01', systolic: 120, diastolic: 80 },
      { date: '2024-01-15', systolic: 118, diastolic: 78 },
      { date: '2024-02-01', systolic: 115, diastolic: 75 }
    ],
    heartRate: [
      { date: '2024-01-01', value: 72 },
      { date: '2024-01-15', value: 70 },
      { date: '2024-02-01', value: 68 }
    ]
  };
};

const calculateMedicationAdherence = async (userId, start, end) => {
  // This would calculate medication adherence based on prescriptions and patient behavior
  // For now, return mock data
  return {
    overallAdherence: 85,
    medications: [
      {
        name: 'Aspirin',
        adherence: 90,
        missedDoses: 2,
        totalDoses: 20
      },
      {
        name: 'Metformin',
        adherence: 80,
        missedDoses: 4,
        totalDoses: 20
      }
    ],
    trends: [
      { date: '2024-01-01', adherence: 85 },
      { date: '2024-01-15', adherence: 88 },
      { date: '2024-02-01', adherence: 82 }
    ]
  };
};

const calculateVitalSignsTrends = async (userId, start, end, vital = null) => {
  // This would calculate vital signs trends from medical records
  // For now, return mock data
  return {
    bloodPressure: [
      { date: '2024-01-01', systolic: 120, diastolic: 80 },
      { date: '2024-01-15', systolic: 118, diastolic: 78 },
      { date: '2024-02-01', systolic: 115, diastolic: 75 }
    ],
    heartRate: [
      { date: '2024-01-01', value: 72 },
      { date: '2024-01-15', value: 70 },
      { date: '2024-02-01', value: 68 }
    ],
    temperature: [
      { date: '2024-01-01', value: 98.6 },
      { date: '2024-01-15', value: 98.4 },
      { date: '2024-02-01', value: 98.2 }
    ],
    weight: [
      { date: '2024-01-01', value: 70 },
      { date: '2024-01-15', value: 69.5 },
      { date: '2024-02-01', value: 69 }
    ]
  };
};

const calculateGoalProgress = async (userId, goal) => {
  // This would calculate progress towards health goals
  // For now, return mock data
  const progress = Math.random() * 100;
  return {
    current: Math.random() * goal.target,
    target: goal.target,
    percentage: progress,
    status: progress >= 100 ? 'completed' : progress >= 75 ? 'on_track' : 'needs_attention'
  };
};

// Helper function to calculate trends
const calculateTrend = (data, valueKey) => {
  if (data.length < 2) return { trend: 'stable', change: 0 };
  
  const firstValue = data[0][valueKey];
  const lastValue = data[data.length - 1][valueKey];
  const change = lastValue - firstValue;
  const percentChange = (change / firstValue) * 100;
  
  let trend = 'stable';
  if (percentChange > 5) trend = 'increasing';
  else if (percentChange < -5) trend = 'decreasing';
  
  return {
    trend,
    change,
    percentChange: parseFloat(percentChange.toFixed(2)),
    firstValue,
    lastValue
  };
};

module.exports = router; 