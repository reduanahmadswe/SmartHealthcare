const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const { authenticateToken, requirePatient, requireDoctor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadMedicalDocument, uploadProfilePicture } = require('../utils/cloudinaryService');
const { generateMedicalRecordPDF } = require('../utils/pdfService');

const router = express.Router();

// @route   POST /api/medical-records
// @desc    Upload a new medical record
// @access  Private (Patient/Doctor)
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('recordType').isIn(['lab_report', 'x_ray', 'mri_scan', 'prescription', 'vaccination_record', 'surgery_record', 'consultation_note', 'other']),
  body('description').optional().isString(),
  body('recordDate').isISO8601().withMessage('Valid record date is required'),
  body('tags').optional().isArray()
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
      message: 'Please upload a file'
    });
  }

  const {
    title,
    recordType,
    description,
    recordDate,
    tags,
    vitals,
    testResults,
    diagnosis,
    medications,
    procedures,
    allergies,
    familyHistory
  } = req.body;

  // Upload file to Cloudinary
  const uploadResult = await uploadMedicalDocument(
    req.file.path,
    recordType,
    req.user._id.toString()
  );

  // Create medical record
  const medicalRecord = new MedicalRecord({
    patient: req.user.role === 'patient' ? req.user._id : req.body.patientId,
    uploadedBy: req.user._id,
    title,
    recordType,
    description,
    recordDate,
    tags: tags || [],
    fileUrl: uploadResult.url,
    filePublicId: uploadResult.public_id,
    fileSize: uploadResult.size,
    fileFormat: uploadResult.format,
    vitals: vitals ? JSON.parse(vitals) : null,
    testResults: testResults ? JSON.parse(testResults) : null,
    diagnosis: diagnosis ? JSON.parse(diagnosis) : null,
    medications: medications ? JSON.parse(medications) : [],
    procedures: procedures ? JSON.parse(procedures) : [],
    allergies: allergies ? JSON.parse(allergies) : [],
    familyHistory: familyHistory ? JSON.parse(familyHistory) : []
  });

  await medicalRecord.save();

  res.status(201).json({
    success: true,
    message: 'Medical record uploaded successfully',
    data: {
      medicalRecord
    }
  });
}));

// @route   GET /api/medical-records
// @desc    Get medical records for user
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { recordType, date, tags, page = 1, limit = 10 } = req.query;

  const query = {};

  // Filter by user role
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    // Doctors can see records they have access to
    query.$or = [
      { patient: req.user._id },
      { sharedWith: req.user._id },
      { uploadedBy: req.user._id }
    ];
  }

  if (recordType) {
    query.recordType = recordType;
  }
  if (date) {
    query.recordDate = {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
    };
  }
  if (tags) {
    query.tags = { $in: tags.split(',') };
  }

  const medicalRecords = await MedicalRecord.find(query)
    .populate('patient', 'firstName lastName')
    .populate('uploadedBy', 'firstName lastName')
    .sort({ recordDate: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await MedicalRecord.countDocuments(query);

  res.json({
    success: true,
    data: {
      medicalRecords,
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

// @route   GET /api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone')
    .populate('uploadedBy', 'firstName lastName')
    .populate('sharedWith', 'firstName lastName email');

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if user has access to this record
  const isOwner = medicalRecord.patient.toString() === req.user._id.toString();
  const isUploader = medicalRecord.uploadedBy._id.toString() === req.user._id.toString();
  const isShared = medicalRecord.sharedWith.some(user => user._id.toString() === req.user._id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isUploader && !isShared && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      medicalRecord
    }
  });
}));

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private
router.put('/:id', [
  body('title').optional().notEmpty(),
  body('description').optional().isString(),
  body('tags').optional().isArray(),
  body('vitals').optional().isObject(),
  body('testResults').optional().isObject(),
  body('diagnosis').optional().isObject(),
  body('medications').optional().isArray(),
  body('procedures').optional().isArray(),
  body('allergies').optional().isArray(),
  body('familyHistory').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if user can update this record
  const isOwner = medicalRecord.patient.toString() === req.user._id.toString();
  const isUploader = medicalRecord.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isUploader && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Update record
  const allowedFields = [
    'title', 'description', 'tags', 'vitals', 'testResults',
    'diagnosis', 'medications', 'procedures', 'allergies', 'familyHistory'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedRecord = await MedicalRecord.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Medical record updated successfully',
    data: {
      medicalRecord: updatedRecord
    }
  });
}));

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if user can delete this record
  const isOwner = medicalRecord.patient.toString() === req.user._id.toString();
  const isUploader = medicalRecord.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isUploader && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Delete file from Cloudinary
  if (medicalRecord.filePublicId) {
    const { deleteFromCloudinary } = require('../utils/cloudinaryService');
    await deleteFromCloudinary(medicalRecord.filePublicId);
  }

  await MedicalRecord.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Medical record deleted successfully'
  });
}));

// @route   POST /api/medical-records/:id/share
// @desc    Share medical record with doctor
// @access  Private (Patient only)
router.post('/:id/share', requirePatient, [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('permissions').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { doctorId, permissions } = req.body;
  const medicalRecordId = req.params.id;

  const medicalRecord = await MedicalRecord.findById(medicalRecordId);

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if patient owns this record
  if (medicalRecord.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if doctor exists
  const User = require('../models/User');
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isVerified: true,
    isActive: true
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Add doctor to shared list
  const shareInfo = {
    doctor: doctorId,
    sharedAt: new Date(),
    permissions: permissions || ['read']
  };

  medicalRecord.sharedWith.push(shareInfo);
  await medicalRecord.save();

  // Send notification email to doctor
  const { sendEmail } = require('../utils/emailService');
  await sendEmail({
    to: doctor.email,
    subject: 'Medical Record Shared - Smart Healthcare Assistant',
    template: 'medicalRecordShared',
    context: {
      doctorName: doctor.firstName,
      patientName: `${req.user.firstName} ${req.user.lastName}`,
      recordTitle: medicalRecord.title,
      recordType: medicalRecord.recordType,
      recordDate: medicalRecord.recordDate
    }
  });

  res.json({
    success: true,
    message: 'Medical record shared successfully',
    data: {
      sharedWith: shareInfo
    }
  });
}));

// @route   DELETE /api/medical-records/:id/share/:doctorId
// @desc    Remove doctor's access to medical record
// @access  Private (Patient only)
router.delete('/:id/share/:doctorId', requirePatient, asyncHandler(async (req, res) => {
  const { id, doctorId } = req.params;

  const medicalRecord = await MedicalRecord.findById(id);

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if patient owns this record
  if (medicalRecord.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Remove doctor from shared list
  medicalRecord.sharedWith = medicalRecord.sharedWith.filter(
    share => share.doctor.toString() !== doctorId
  );

  await medicalRecord.save();

  res.json({
    success: true,
    message: 'Access removed successfully'
  });
}));

// @route   GET /api/medical-records/:id/download
// @desc    Download medical record PDF
// @access  Private
router.get('/:id/download', asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'firstName lastName')
    .populate('uploadedBy', 'firstName lastName');

  if (!medicalRecord) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check if user has access to this record
  const isOwner = medicalRecord.patient._id.toString() === req.user._id.toString();
  const isUploader = medicalRecord.uploadedBy._id.toString() === req.user._id.toString();
  const isShared = medicalRecord.sharedWith.some(user => user.toString() === req.user._id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isUploader && !isShared && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Generate PDF
  const pdfBuffer = await generateMedicalRecordPDF(medicalRecord);
  const { uploadBufferToCloudinary } = require('../utils/cloudinaryService');
  const pdfUrl = await uploadBufferToCloudinary(pdfBuffer, `medical-records/${medicalRecord._id}`);

  res.json({
    success: true,
    data: {
      pdfUrl,
      recordTitle: medicalRecord.title,
      recordType: medicalRecord.recordType
    }
  });
}));

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get medical records for a specific patient (Doctor only)
// @access  Private (Doctor only)
router.get('/patient/:patientId', requireDoctor, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { recordType, page = 1, limit = 10 } = req.query;

  const query = {
    $or: [
      { patient: patientId, sharedWith: req.user._id },
      { patient: patientId, uploadedBy: req.user._id }
    ]
  };

  if (recordType) {
    query.recordType = recordType;
  }

  const medicalRecords = await MedicalRecord.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort({ recordDate: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await MedicalRecord.countDocuments(query);

  res.json({
    success: true,
    data: {
      medicalRecords,
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

// @route   GET /api/medical-records/statistics
// @desc    Get medical records statistics
// @access  Private
router.get('/statistics', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const query = {
    recordDate: { $gte: start, $lte: end }
  };

  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.$or = [
      { patient: req.user._id },
      { sharedWith: req.user._id },
      { uploadedBy: req.user._id }
    ];
  }

  // Get statistics by record type
  const statsByType = await MedicalRecord.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get total statistics
  const totalStats = await MedicalRecord.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgSize: { $avg: '$fileSize' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      statsByType,
      totalStats: totalStats[0] || { totalRecords: 0, totalSize: 0, avgSize: 0 }
    }
  });
}));

module.exports = router; 