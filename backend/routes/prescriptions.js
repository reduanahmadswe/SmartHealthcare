const express = require('express');
const { body, validationResult } = require('express-validator');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePrescriptionPDF } = require('../utils/pdfService');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor only)
router.post('/', requireDoctor, [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('diagnosis.primary').notEmpty().withMessage('Primary diagnosis is required'),
  body('medications').isArray().notEmpty().withMessage('At least one medication is required'),
  body('medications.*.name').notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage.amount').isNumeric().withMessage('Dosage amount is required'),
  body('medications.*.dosage.unit').notEmpty().withMessage('Dosage unit is required'),
  body('medications.*.dosage.frequency').notEmpty().withMessage('Dosage frequency is required'),
  body('medications.*.dosage.duration').notEmpty().withMessage('Dosage duration is required'),
  body('digitalSignature.doctorSignature').notEmpty().withMessage('Digital signature is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    appointmentId,
    diagnosis,
    symptoms,
    clinicalNotes,
    medications,
    labTests,
    lifestyleRecommendations,
    followUp,
    patientInstructions,
    digitalSignature
  } = req.body;

  // Check if appointment exists and belongs to this doctor
  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (appointment.doctor._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only create prescriptions for your appointments.'
    });
  }

  // Create prescription
  const prescription = new Prescription({
    patient: appointment.patient._id,
    doctor: req.user._id,
    appointment: appointmentId,
    diagnosis,
    symptoms,
    clinicalNotes,
    medications,
    labTests,
    lifestyleRecommendations,
    followUp,
    patientInstructions,
    digitalSignature: {
      ...digitalSignature,
      signatureDate: new Date(),
      signatureHash: generateSignatureHash(digitalSignature.doctorSignature)
    }
  });

  await prescription.save();

  // Update appointment with prescription
  appointment.prescription = prescription._id;
  await appointment.save();

  // Generate PDF
  const pdfBuffer = await generatePrescriptionPDF(prescription);
  const pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `prescriptions/${prescription.prescriptionNumber}`);

  // Update prescription with PDF URL
  prescription.pdfUrl = pdfUrl;
  prescription.pdfGeneratedAt = new Date();
  await prescription.save();

  // Send email to patient
  await sendEmail({
    to: appointment.patient.email,
    subject: 'Prescription Ready - Smart Healthcare Assistant',
    template: 'prescriptionReady',
    context: {
      patientName: appointment.patient.firstName,
      doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      prescriptionNumber: prescription.prescriptionNumber,
      prescriptionDate: prescription.prescriptionDate,
      medicationCount: prescription.medications.length,
      downloadUrl: pdfUrl
    }
  });

  res.status(201).json({
    success: true,
    message: 'Prescription created successfully',
    data: {
      prescription
    }
  });
}));

// @route   GET /api/prescriptions
// @desc    Get prescriptions for user
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

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

  const prescriptions = await Prescription.find(query)
    .populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ prescriptionDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Prescription.countDocuments(query);

  res.json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Add this route before any '/:id' route
// @route   GET /api/prescriptions/patient
// @desc    Get prescriptions for the current patient
// @access  Private (Patient only)
router.get('/patient', requirePatient, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const query = { patient: req.user._id };
  const prescriptions = await Prescription.find(query)
    .populate('doctor', 'firstName lastName')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ prescriptionDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await Prescription.countDocuments(query);
  res.json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// Place this before any '/:id' route
// @route   GET /api/prescriptions/doctor
// @desc    Get prescriptions for the current doctor
// @access  Private (Doctor only)
router.get('/doctor', requireDoctor, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const query = { doctor: req.user._id };
  const prescriptions = await Prescription.find(query)
    .populate('patient', 'firstName lastName')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ prescriptionDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await Prescription.countDocuments(query);
  res.json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone patientInfo')
    .populate('doctor', 'firstName lastName email phone doctorInfo')
    .populate('appointment', 'appointmentDate appointmentTime symptoms');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check if user has access to this prescription
  const isPatient = prescription.patient._id.toString() === req.user._id.toString();
  const isDoctor = prescription.doctor._id.toString() === req.user._id.toString();
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
      prescription
    }
  });
}));

// @route   GET /api/prescriptions/:id/download
// @desc    Download prescription PDF
// @access  Private
router.get('/:id/download', asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check if user has access to this prescription
  const isPatient = prescription.patient._id.toString() === req.user._id.toString();
  const isDoctor = prescription.doctor._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (!prescription.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: 'PDF not available'
    });
  }

  // Redirect to PDF URL or serve the file
  res.json({
    success: true,
    data: {
      pdfUrl: prescription.pdfUrl,
      prescriptionNumber: prescription.prescriptionNumber
    }
  });
}));

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (Doctor only)
router.put('/:id', requireDoctor, [
  body('diagnosis.primary').optional().notEmpty(),
  body('medications').optional().isArray(),
  body('clinicalNotes').optional().isString(),
  body('patientInstructions').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const prescriptionId = req.params.id;
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check if doctor owns this prescription
  if (prescription.doctor.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Update prescription
  const allowedFields = ['diagnosis', 'medications', 'clinicalNotes', 'patientInstructions'];
  const updateData = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedPrescription = await Prescription.findByIdAndUpdate(
    prescriptionId,
    updateData,
    { new: true, runValidators: true }
  );

  // Regenerate PDF if medications changed
  if (req.body.medications) {
    const pdfBuffer = await generatePrescriptionPDF(updatedPrescription);
    const pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `prescriptions/${updatedPrescription.prescriptionNumber}`);
    
    updatedPrescription.pdfUrl = pdfUrl;
    updatedPrescription.pdfGeneratedAt = new Date();
    await updatedPrescription.save();
  }

  res.json({
    success: true,
    message: 'Prescription updated successfully',
    data: {
      prescription: updatedPrescription
    }
  });
}));

// @route   POST /api/prescriptions/:id/verify
// @desc    Verify prescription signature
// @access  Private
router.post('/:id/verify', asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Verify digital signature
  const isValidSignature = verifyDigitalSignature(
    prescription.digitalSignature.doctorSignature,
    prescription.digitalSignature.signatureHash
  );

  res.json({
    success: true,
    data: {
      isValidSignature,
      signatureDate: prescription.digitalSignature.signatureDate,
      prescriptionNumber: prescription.prescriptionNumber
    }
  });
}));

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get prescriptions for a specific patient (Doctor/Admin only)
// @access  Private (Doctor/Admin only)
router.get('/patient/:patientId', requireDoctor, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const query = { patient: patientId };

  // If doctor, only show their prescriptions for this patient
  if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  }

  const prescriptions = await Prescription.find(query)
    .populate('doctor', 'firstName lastName')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ prescriptionDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Prescription.countDocuments(query);

  res.json({
    success: true,
    data: {
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/prescriptions/statistics
// @desc    Get prescription statistics
// @access  Private (Doctor only)
router.get('/statistics', requireDoctor, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const stats = await Prescription.getStatistics(req.user._id, start, end);

  res.json({
    success: true,
    data: {
      period: { start, end },
      statistics: stats
    }
  });
}));

// Helper functions
const generateSignatureHash = (signature) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(signature).digest('hex');
};

const verifyDigitalSignature = (signature, hash) => {
  const crypto = require('crypto');
  const calculatedHash = crypto.createHash('sha256').update(signature).digest('hex');
  return calculatedHash === hash;
};

const uploadPDFToCloudinary = async (pdfBuffer, folder) => {
  const cloudinary = require('cloudinary').v2;
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'raw',
        format: 'pdf'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(pdfBuffer);
  });
};

module.exports = router; 