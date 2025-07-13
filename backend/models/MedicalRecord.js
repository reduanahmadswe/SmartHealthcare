const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  // Basic Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Record Details
  recordType: {
    type: String,
    enum: [
      'lab_report',
      'x_ray',
      'mri_scan',
      'ct_scan',
      'ultrasound',
      'ecg',
      'blood_test',
      'urine_test',
      'prescription',
      'discharge_summary',
      'operation_report',
      'vaccination_record',
      'growth_chart',
      'dental_record',
      'eye_test',
      'other'
    ],
    required: [true, 'Record type is required']
  },
  
  title: {
    type: String,
    required: [true, 'Record title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: String,
  
  // File Information
  files: [{
    originalName: String,
    fileName: String,
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: Number, // in bytes
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Test Results (for lab reports)
  testResults: {
    testName: String,
    testDate: Date,
    results: [{
      parameter: String,
      value: String,
      unit: String,
      normalRange: String,
      isAbnormal: Boolean,
      notes: String
    }],
    labName: String,
    labAddress: String,
    technician: String,
    reviewedBy: String
  },
  
  // Vital Signs
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    oxygenSaturation: Number,
    respiratoryRate: Number
  },
  
  // Diagnosis and Treatment
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Codes: [String]
  },
  treatment: String,
  medications: [{
    name: String,
    dosage: String,
    duration: String,
    instructions: String
  }],
  
  // Status and Privacy
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['patient_only', 'doctor_patient', 'all_doctors'],
    default: 'doctor_patient'
  },
  
  // Dates
  recordDate: {
    type: Date,
    required: [true, 'Record date is required']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  
  // Tags and Categories
  tags: [String],
  category: {
    type: String,
    enum: [
      'diagnostic',
      'treatment',
      'preventive',
      'emergency',
      'routine',
      'specialist',
      'surgery',
      'therapy'
    ]
  },
  
  // Sharing and Permissions
  sharedWith: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'full_access'],
      default: 'view'
    }
  }],
  
  // Comments and Notes
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Audit Trail
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'viewed', 'shared', 'archived', 'deleted']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  
  // Metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: String, // Hospital/Clinic where record was created
  department: String,
  
  // Insurance and Billing
  insurance: {
    provider: String,
    policyNumber: String,
    claimNumber: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
medicalRecordSchema.index({ patient: 1, recordDate: -1 });
medicalRecordSchema.index({ doctor: 1, recordDate: -1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ tags: 1 });
medicalRecordSchema.index({ 'testResults.testDate': -1 });

// Virtual for file count
medicalRecordSchema.virtual('fileCount').get(function() {
  return this.files ? this.files.length : 0;
});

// Virtual for total file size
medicalRecordSchema.virtual('totalFileSize').get(function() {
  if (!this.files) return 0;
  return this.files.reduce((total, file) => total + (file.fileSize || 0), 0);
});

// Virtual for primary file
medicalRecordSchema.virtual('primaryFile').get(function() {
  if (!this.files || this.files.length === 0) return null;
  return this.files.find(file => file.isPrimary) || this.files[0];
});

// Virtual for record age
medicalRecordSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const recordDate = new Date(this.recordDate);
  const diffTime = Math.abs(now - recordDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to add file
medicalRecordSchema.methods.addFile = function(fileData) {
  this.files.push(fileData);
  return this.save();
};

// Method to remove file
medicalRecordSchema.methods.removeFile = function(fileName) {
  this.files = this.files.filter(file => file.fileName !== fileName);
  return this.save();
};

// Method to add comment
medicalRecordSchema.methods.addComment = function(author, comment, isPrivate = false) {
  this.comments.push({
    author,
    comment,
    isPrivate,
    timestamp: new Date()
  });
  return this.save();
};

// Method to share with doctor
medicalRecordSchema.methods.shareWithDoctor = function(doctorId, permission = 'view') {
  const existingShare = this.sharedWith.find(share => share.doctor.toString() === doctorId.toString());
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      doctor: doctorId,
      permission,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to add to history
medicalRecordSchema.methods.addToHistory = function(action, performedBy, details = '') {
  this.history.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get record statistics
medicalRecordSchema.statics.getStatistics = async function(patientId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        patient: mongoose.Types.ObjectId(patientId),
        recordDate: { $gte: startDate, $lte: endDate },
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        totalFileSize: { $sum: { $sum: '$files.fileSize' } }
      }
    }
  ]);
  
  return stats;
};

// Static method to search records
medicalRecordSchema.statics.searchRecords = async function(patientId, searchTerm, filters = {}) {
  const query = {
    patient: mongoose.Types.ObjectId(patientId),
    status: 'active',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { 'testResults.testName': { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  // Add filters
  if (filters.recordType) query.recordType = filters.recordType;
  if (filters.category) query.category = filters.category;
  if (filters.startDate && filters.endDate) {
    query.recordDate = { $gte: filters.startDate, $lte: filters.endDate };
  }
  
  return await this.find(query).sort({ recordDate: -1 });
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 