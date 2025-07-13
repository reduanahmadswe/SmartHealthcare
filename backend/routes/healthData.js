const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requirePatient, requireDoctor, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logHealthDataActivity } = require('../middleware/activityLogger');
const HealthData = require('../models/HealthData');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/health/add
// @desc    Add health data for a patient
// @access  Private (Patient, Doctor, Admin)
router.post('/add', [
  body('vitals.bloodPressure.systolic').optional().isNumeric().withMessage('Systolic must be a number'),
  body('vitals.bloodPressure.diastolic').optional().isNumeric().withMessage('Diastolic must be a number'),
  body('vitals.heartRate.value').optional().isNumeric().withMessage('Heart rate must be a number'),
  body('vitals.temperature.value').optional().isNumeric().withMessage('Temperature must be a number'),
  body('vitals.oxygenSaturation.value').optional().isNumeric().withMessage('Oxygen saturation must be a number'),
  body('measurements.height.value').optional().isNumeric().withMessage('Height must be a number'),
  body('measurements.weight.value').optional().isNumeric().withMessage('Weight must be a number'),
  body('labResults.bloodSugar.fasting').optional().isNumeric().withMessage('Fasting blood sugar must be a number'),
  body('labResults.bloodSugar.postprandial').optional().isNumeric().withMessage('Postprandial blood sugar must be a number'),
  body('labResults.cholesterol.total').optional().isNumeric().withMessage('Total cholesterol must be a number'),
  body('labResults.cholesterol.hdl').optional().isNumeric().withMessage('HDL must be a number'),
  body('labResults.cholesterol.ldl').optional().isNumeric().withMessage('LDL must be a number'),
  body('labResults.cholesterol.triglycerides').optional().isNumeric().withMessage('Triglycerides must be a number'),
  body('labResults.hemoglobin.value').optional().isNumeric().withMessage('Hemoglobin must be a number'),
  body('labResults.creatinine.value').optional().isNumeric().withMessage('Creatinine must be a number'),
  body('lifestyle.sleepHours').optional().isNumeric().withMessage('Sleep hours must be a number'),
  body('lifestyle.exerciseMinutes').optional().isNumeric().withMessage('Exercise minutes must be a number'),
  body('lifestyle.waterIntake.value').optional().isNumeric().withMessage('Water intake must be a number'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('medications').optional().isArray().withMessage('Medications must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('source').optional().isIn(['manual', 'device', 'lab', 'doctor']).withMessage('Invalid source'),
  body('patientId').optional().isMongoId().withMessage('Valid patient ID is required')
], logHealthDataActivity('add_health_data', 'Add health data'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { patientId, ...healthData } = req.body;
  
  // Determine patient ID based on user role
  let targetPatientId;
  if (req.user.role === 'patient') {
    targetPatientId = req.user._id;
  } else if (req.user.role === 'doctor' || req.user.role === 'admin') {
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required for doctors and admins'
      });
    }
    targetPatientId = patientId;
    
    // Verify patient exists
    const patient = await User.findById(targetPatientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
  }

  // Create health data record
  const newHealthData = new HealthData({
    patient: targetPatientId,
    recordedBy: req.user._id,
    ...healthData
  });

  await newHealthData.save();

  res.status(201).json({
    success: true,
    message: 'Health data added successfully',
    data: newHealthData
  });
}));

// @route   GET /api/health/:userId
// @desc    Get health data for a specific user
// @access  Private (Patient can access own data, Doctor/Admin can access patient data)
router.get('/:userId', logHealthDataActivity('view_health_data', 'View health data'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, startDate, endDate } = req.query;

  // Check access permissions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own health data.'
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

  // Build query
  const query = { patient: userId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const healthData = await HealthData.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('recordedBy', 'firstName lastName');

  const total = await HealthData.countDocuments(query);

  res.json({
    success: true,
    data: {
      healthData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/health/:userId/latest
// @desc    Get latest health data for a user
// @access  Private (Patient, Doctor, Admin)
router.get('/:userId/latest', logHealthDataActivity('view_latest_health_data', 'View latest health data'), asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check access permissions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own health data.'
    });
  }

  const latestHealthData = await HealthData.findOne({ patient: userId })
    .sort({ createdAt: -1 })
    .populate('recordedBy', 'firstName lastName');

  if (!latestHealthData) {
    return res.status(404).json({
      success: false,
      message: 'No health data found for this user'
    });
  }

  res.json({
    success: true,
    data: latestHealthData
  });
}));

// @route   GET /api/health/:userId/vitals
// @desc    Get vitals history for charts
// @access  Private (Patient, Doctor, Admin)
router.get('/:userId/vitals', logHealthDataActivity('view_vitals_history', 'View vitals history'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30, vital } = req.query;

  // Check access permissions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own health data.'
    });
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

  res.json({
    success: true,
    data: {
      period: { startDate, endDate: new Date() },
      vitalsHistory,
      chartData,
      summary: {
        totalRecords: vitalsHistory.length,
        abnormalRecords: vitalsHistory.filter(record => record.isAbnormal).length,
        latestRecord: vitalsHistory[vitalsHistory.length - 1] || null
      }
    }
  });
}));

// @route   GET /api/health/:userId/abnormal
// @desc    Get abnormal health data records
// @access  Private (Patient, Doctor, Admin)
router.get('/:userId/abnormal', logHealthDataActivity('view_abnormal_health_data', 'View abnormal health data'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check access permissions
  if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own health data.'
    });
  }

  const abnormalData = await HealthData.find({
    patient: userId,
    isAbnormal: true
  })
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit)
  .populate('recordedBy', 'firstName lastName');

  const total = await HealthData.countDocuments({
    patient: userId,
    isAbnormal: true
  });

  res.json({
    success: true,
    data: {
      abnormalData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   PUT /api/health/:id
// @desc    Update health data record
// @access  Private (Patient can update own data, Doctor/Admin can update patient data)
router.put('/:id', logHealthDataActivity('update_health_data', 'Update health data'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const healthData = await HealthData.findById(id);
  if (!healthData) {
    return res.status(404).json({
      success: false,
      message: 'Health data record not found'
    });
  }

  // Check access permissions
  if (req.user.role === 'patient' && healthData.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own health data.'
    });
  }

  // Update health data
  Object.assign(healthData, req.body);
  healthData.lastUpdatedBy = req.user._id;
  
  await healthData.save();

  res.json({
    success: true,
    message: 'Health data updated successfully',
    data: healthData
  });
}));

// @route   DELETE /api/health/:id
// @desc    Delete health data record
// @access  Private (Patient can delete own data, Admin can delete any data)
router.delete('/:id', logHealthDataActivity('delete_health_data', 'Delete health data'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const healthData = await HealthData.findById(id);
  if (!healthData) {
    return res.status(404).json({
      success: false,
      message: 'Health data record not found'
    });
  }

  // Check access permissions
  if (req.user.role === 'patient' && healthData.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete your own health data.'
    });
  }

  if (req.user.role === 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Doctors cannot delete health data records.'
    });
  }

  await HealthData.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Health data deleted successfully'
  });
}));

module.exports = router; 