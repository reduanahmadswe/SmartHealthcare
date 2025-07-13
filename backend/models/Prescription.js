const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  // Basic Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment is required']
  },
  
  // Prescription Details
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Diagnosis and Symptoms
  diagnosis: {
    primary: String,
    secondary: [String],
    icd10Codes: [String]
  },
  symptoms: [String],
  clinicalNotes: String,
  
  // Medications
  medications: [{
    name: {
      type: String,
      required: true
    },
    genericName: String,
    dosage: {
      amount: Number,
      unit: String,
      frequency: String, // e.g., "twice daily", "every 8 hours"
      duration: String // e.g., "7 days", "until finished"
    },
    route: {
      type: String,
      enum: ['oral', 'topical', 'inhalation', 'injection', 'other'],
      default: 'oral'
    },
    instructions: String,
    quantity: {
      amount: Number,
      unit: String // e.g., "tablets", "ml", "mg"
    },
    isGeneric: {
      type: Boolean,
      default: false
    },
    isControlled: {
      type: Boolean,
      default: false
    },
    refills: {
      type: Number,
      default: 0,
      min: 0,
      max: 12
    },
    pharmacyNotes: String
  }],
  
  // Lab Tests
  labTests: [{
    testName: String,
    testCode: String,
    instructions: String,
    fastingRequired: {
      type: Boolean,
      default: false
    },
    specialInstructions: String
  }],
  
  // Lifestyle Recommendations
  lifestyleRecommendations: {
    diet: [String],
    exercise: [String],
    lifestyle: [String],
    restrictions: [String]
  },
  
  // Follow-up
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    type: {
      type: String,
      enum: ['in_person', 'video_call', 'phone_call'],
      default: 'in_person'
    },
    reason: String
  },
  
  // Digital Signature
  digitalSignature: {
    doctorSignature: {
      type: String, // Base64 encoded signature
      required: true
    },
    signatureDate: {
      type: Date,
      default: Date.now
    },
    signatureHash: String, // For verification
    certificateInfo: {
      issuer: String,
      validFrom: Date,
      validTo: Date
    }
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'cancelled'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // PDF and Files
  pdfUrl: String,
  pdfGeneratedAt: Date,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Patient Instructions
  patientInstructions: {
    general: String,
    medicationInstructions: String,
    sideEffects: [String],
    emergencyContact: String,
    whenToSeekHelp: [String]
  },
  
  // Pharmacy Information
  pharmacy: {
    name: String,
    address: String,
    phone: String,
    email: String,
    notes: String
  },
  
  // Insurance and Billing
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    copay: Number
  },
  
  // Metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Audit Trail
  history: [{
    action: {
      type: String,
      enum: ['created', 'modified', 'verified', 'cancelled', 'expired']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better performance
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ 'medications.isControlled': 1 });

// Generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of prescriptions for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const count = await this.constructor.countDocuments({
      prescriptionDate: { $gte: todayStart, $lt: todayEnd }
    });
    
    this.prescriptionNumber = `RX${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for total medication count
prescriptionSchema.virtual('totalMedications').get(function() {
  return this.medications ? this.medications.length : 0;
});

// Virtual for controlled medications
prescriptionSchema.virtual('controlledMedications').get(function() {
  return this.medications ? this.medications.filter(med => med.isControlled) : [];
});

// Virtual for prescription age
prescriptionSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const prescriptionDate = new Date(this.prescriptionDate);
  const diffTime = Math.abs(now - prescriptionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if prescription is expired
prescriptionSchema.methods.isExpired = function() {
  // Most prescriptions expire after 6 months
  const expirationDate = new Date(this.prescriptionDate);
  expirationDate.setMonth(expirationDate.getMonth() + 6);
  return new Date() > expirationDate;
};

// Method to get prescription summary
prescriptionSchema.methods.getSummary = function() {
  return {
    prescriptionNumber: this.prescriptionNumber,
    patientName: this.patient,
    doctorName: this.doctor,
    prescriptionDate: this.prescriptionDate,
    diagnosis: this.diagnosis.primary,
    medicationCount: this.totalMedications,
    status: this.status,
    isExpired: this.isExpired()
  };
};

// Method to add to history
prescriptionSchema.methods.addToHistory = function(action, performedBy, notes = '') {
  this.history.push({
    action,
    performedBy,
    notes,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get prescription statistics
prescriptionSchema.statics.getStatistics = async function(doctorId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        doctor: mongoose.Types.ObjectId(doctorId),
        prescriptionDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        totalMedications: { $sum: { $size: '$medications' } },
        controlledMedications: {
          $sum: {
            $size: {
              $filter: {
                input: '$medications',
                cond: { $eq: ['$$this.isControlled', true] }
              }
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || { totalPrescriptions: 0, totalMedications: 0, controlledMedications: 0 };
};

module.exports = mongoose.model('Prescription', prescriptionSchema); 