const express = require('express');
const { body, validationResult } = require('express-validator');
const LabTest = require('../models/LabTest');
const User = require('../models/User');
const { authenticateToken, requirePatient, requireDoctor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadLabTestResults } = require('../utils/cloudinaryService');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/lab-tests/book
// @desc    Book a new lab test
// @access  Private (Patient only)
router.post('/book', requirePatient, [
  body('testName').notEmpty().withMessage('Test name is required'),
  body('testType').isIn(['blood_test', 'urine_test', 'imaging', 'biopsy', 'culture', 'other']),
  body('labId').isMongoId().withMessage('Valid lab ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('prescribedBy').optional().isMongoId(),
  body('instructions').optional().isString(),
  body('fastingRequired').optional().isBoolean(),
  body('preparationNotes').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    testName,
    testType,
    labId,
    appointmentDate,
    appointmentTime,
    prescribedBy,
    instructions,
    fastingRequired,
    preparationNotes,
    additionalTests
  } = req.body;

  // Check if lab exists
  const lab = await User.findOne({
    _id: labId,
    role: 'lab',
    isVerified: true,
    isActive: true
  });

  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Lab not found or not verified'
    });
  }

  // Check if doctor exists (if prescribed)
  let doctor = null;
  if (prescribedBy) {
    doctor = await User.findOne({
      _id: prescribedBy,
      role: 'doctor',
      isVerified: true,
      isActive: true
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Prescribing doctor not found'
      });
    }
  }

  // Create lab test booking
  const labTest = new LabTest({
    patient: req.user._id,
    lab: labId,
    prescribedBy: prescribedBy || null,
    testName,
    testType,
    appointmentDate,
    appointmentTime,
    instructions,
    fastingRequired: fastingRequired || false,
    preparationNotes,
    additionalTests: additionalTests || [],
    testFee: lab.labInfo.testFees[testType] || 0
  });

  await labTest.save();

  // Populate lab and doctor details
  await labTest.populate('lab', 'firstName lastName email phone address');
  if (doctor) {
    await labTest.populate('prescribedBy', 'firstName lastName email');
  }

  // Send confirmation email to patient
  await sendEmail({
    to: req.user.email,
    subject: 'Lab Test Booked - Smart Healthcare Assistant',
    template: 'labTestBooked',
    context: {
      patientName: req.user.firstName,
      testName,
      testType,
      labName: `${lab.firstName} ${lab.lastName}`,
      appointmentDate,
      appointmentTime,
      instructions,
      fastingRequired,
      preparationNotes
    }
  });

  // Send notification email to lab
  await sendEmail({
    to: lab.email,
    subject: 'New Lab Test Booking - Smart Healthcare Assistant',
    template: 'newLabTestBooking',
    context: {
      labName: lab.firstName,
      patientName: `${req.user.firstName} ${req.user.lastName}`,
      testName,
      testType,
      appointmentDate,
      appointmentTime
    }
  });

  res.status(201).json({
    success: true,
    message: 'Lab test booked successfully',
    data: {
      labTest
    }
  });
}));

// @route   GET /api/lab-tests
// @desc    Get lab tests for user
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, testType, date, page = 1, limit = 10 } = req.query;

  const query = {};

  // Filter by user role
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.prescribedBy = req.user._id;
  } else if (req.user.role === 'lab') {
    query.lab = req.user._id;
  }

  if (status) {
    query.status = status;
  }
  if (testType) {
    query.testType = testType;
  }
  if (date) {
    query.appointmentDate = {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
    };
  }

  const labTests = await LabTest.find(query)
    .populate('patient', 'firstName lastName email phone')
    .populate('lab', 'firstName lastName email phone address')
    .populate('prescribedBy', 'firstName lastName email')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await LabTest.countDocuments(query);

  res.json({
    success: true,
    data: {
      labTests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/lab-tests/:id
// @desc    Get lab test by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const labTest = await LabTest.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone patientInfo')
    .populate('lab', 'firstName lastName email phone address labInfo')
    .populate('prescribedBy', 'firstName lastName email doctorInfo');

  if (!labTest) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  // Check if user has access to this test
  const isPatient = labTest.patient._id.toString() === req.user._id.toString();
  const isLab = labTest.lab._id.toString() === req.user._id.toString();
  const isPrescriber = labTest.prescribedBy && labTest.prescribedBy._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isLab && !isPrescriber && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      labTest
    }
  });
}));

// @route   PUT /api/lab-tests/:id/status
// @desc    Update lab test status
// @access  Private (Lab only)
router.put('/:id/status', [
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
  const labTestId = req.params.id;

  const labTest = await LabTest.findById(labTestId)
    .populate('patient', 'firstName lastName email')
    .populate('lab', 'firstName lastName email');

  if (!labTest) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  // Check if lab owns this test
  if (labTest.lab._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const oldStatus = labTest.status;
  labTest.status = status;
  if (notes) {
    labTest.notes = notes;
  }

  await labTest.save();

  // Send notification email to patient
  if (status !== oldStatus) {
    await sendEmail({
      to: labTest.patient.email,
      subject: `Lab Test ${status.charAt(0).toUpperCase() + status.slice(1)} - Smart Healthcare Assistant`,
      template: 'labTestStatusUpdate',
      context: {
        patientName: labTest.patient.firstName,
        testName: labTest.testName,
        labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
        appointmentDate: labTest.appointmentDate,
        appointmentTime: labTest.appointmentTime,
        oldStatus,
        newStatus: status,
        notes: notes || ''
      }
    });
  }

  res.json({
    success: true,
    message: 'Lab test status updated successfully',
    data: {
      labTest
    }
  });
}));

// @route   POST /api/lab-tests/:id/results
// @desc    Upload lab test results
// @access  Private (Lab only)
router.post('/:id/results', [
  body('results').isArray().notEmpty().withMessage('Test results are required'),
  body('conclusion').optional().isString(),
  body('recommendations').optional().isString(),
  body('isAbnormal').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload results file'
    });
  }

  const { results, conclusion, recommendations, isAbnormal } = req.body;
  const labTestId = req.params.id;

  const labTest = await LabTest.findById(labTestId)
    .populate('patient', 'firstName lastName email')
    .populate('lab', 'firstName lastName email')
    .populate('prescribedBy', 'firstName lastName email');

  if (!labTest) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  // Check if lab owns this test
  if (labTest.lab._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Upload results file to Cloudinary
  const uploadResult = await uploadLabTestResults(
    req.file.path,
    labTestId,
    labTest.patient._id.toString()
  );

  // Update lab test with results
  labTest.testResults = {
    results: JSON.parse(results),
    conclusion,
    recommendations,
    isAbnormal: isAbnormal || false,
    resultFileUrl: uploadResult.url,
    resultFilePublicId: uploadResult.public_id,
    completedAt: new Date()
  };

  labTest.status = 'completed';
  await labTest.save();

  // Send results notification to patient
  await sendEmail({
    to: labTest.patient.email,
    subject: 'Lab Test Results Ready - Smart Healthcare Assistant',
    template: 'labTestResultsReady',
    context: {
      patientName: labTest.patient.firstName,
      testName: labTest.testName,
      labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
      isAbnormal: isAbnormal || false,
      resultFileUrl: uploadResult.url
    }
  });

  // Send results notification to prescribing doctor
  if (labTest.prescribedBy) {
    await sendEmail({
      to: labTest.prescribedBy.email,
      subject: 'Lab Test Results Available - Smart Healthcare Assistant',
      template: 'labTestResultsForDoctor',
      context: {
        doctorName: labTest.prescribedBy.firstName,
        patientName: `${labTest.patient.firstName} ${labTest.patient.lastName}`,
        testName: labTest.testName,
        labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
        isAbnormal: isAbnormal || false,
        resultFileUrl: uploadResult.url
      }
    });
  }

  res.json({
    success: true,
    message: 'Lab test results uploaded successfully',
    data: {
      labTest
    }
  });
}));

// @route   GET /api/lab-tests/labs
// @desc    Get all verified labs
// @access  Public
router.get('/labs', asyncHandler(async (req, res) => {
  const {
    city,
    testType,
    page = 1,
    limit = 10,
    sortBy = 'rating',
    sortOrder = 'desc'
  } = req.query;

  const query = {
    role: 'lab',
    isVerified: true,
    isActive: true
  };

  // Add filters
  if (city) {
    query['address.city'] = { $regex: city, $options: 'i' };
  }
  if (testType) {
    query['labInfo.availableTests'] = { $in: [testType] };
  }

  const sortOptions = {};
  sortOptions[`labInfo.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

  const labs = await User.find(query)
    .select('firstName lastName email phone address labInfo profilePicture')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      labs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLabs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/lab-tests/labs/:id
// @desc    Get lab profile by ID
// @access  Public
router.get('/labs/:id', asyncHandler(async (req, res) => {
  const lab = await User.findOne({
    _id: req.params.id,
    role: 'lab',
    isVerified: true,
    isActive: true
  }).select('-password -loginHistory');

  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Lab not found'
    });
  }

  res.json({
    success: true,
    data: {
      lab: lab.getPublicProfile()
    }
  });
}));

// @route   GET /api/lab-tests/labs/:id/schedule
// @desc    Get lab's available schedule
// @access  Public
router.get('/labs/:id/schedule', asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  const lab = await User.findOne({
    _id: req.params.id,
    role: 'lab',
    isVerified: true,
    isActive: true
  });

  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Lab not found'
    });
  }

  // Get available slots for the specified date
  const availableSlots = lab.labInfo.availableSlots || [];
  
  // Filter slots for the specific date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  const daySlots = availableSlots.filter(slot => 
    slot.day === dayOfWeek && slot.isAvailable
  );

  res.json({
    success: true,
    data: {
      labId: lab._id,
      date,
      availableSlots: daySlots,
      testFees: lab.labInfo.testFees
    }
  });
}));

// @route   GET /api/lab-tests/patient/:patientId
// @desc    Get lab tests for a specific patient (Doctor/Lab only)
// @access  Private (Doctor/Lab only)
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { patient: patientId };

  // Filter by user role
  if (req.user.role === 'doctor') {
    query.prescribedBy = req.user._id;
  } else if (req.user.role === 'lab') {
    query.lab = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  const labTests = await LabTest.find(query)
    .populate('lab', 'firstName lastName email')
    .populate('prescribedBy', 'firstName lastName email')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await LabTest.countDocuments(query);

  res.json({
    success: true,
    data: {
      labTests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/lab-tests/statistics
// @desc    Get lab test statistics
// @access  Private
router.get('/statistics', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const query = {
    appointmentDate: { $gte: start, $lte: end }
  };

  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.prescribedBy = req.user._id;
  } else if (req.user.role === 'lab') {
    query.lab = req.user._id;
  }

  // Get statistics by test type
  const statsByType = await LabTest.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$testType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$testFee' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get total statistics
  const totalStats = await LabTest.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        totalRevenue: { $sum: '$testFee' },
        avgFee: { $avg: '$testFee' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      statsByType,
      totalStats: totalStats[0] || { totalTests: 0, totalRevenue: 0, avgFee: 0 }
    }
  });
}));

module.exports = router; 