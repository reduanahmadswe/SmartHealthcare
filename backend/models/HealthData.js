const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Vital Signs
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' }
    },
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' }
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°C' }
    },
    oxygenSaturation: {
      value: Number,
      unit: { type: String, default: '%' }
    },
    respiratoryRate: {
      value: Number,
      unit: { type: String, default: 'breaths/min' }
    }
  },

  // Body Measurements
  measurements: {
    height: {
      value: Number,
      unit: { type: String, default: 'cm' }
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'kg' }
    },
    bmi: Number,
    waistCircumference: {
      value: Number,
      unit: { type: String, default: 'cm' }
    },
    hipCircumference: {
      value: Number,
      unit: { type: String, default: 'cm' }
    }
  },

  // Lab Results
  labResults: {
    bloodSugar: {
      fasting: Number,
      postprandial: Number,
      unit: { type: String, default: 'mg/dL' }
    },
    cholesterol: {
      total: Number,
      hdl: Number,
      ldl: Number,
      triglycerides: Number,
      unit: { type: String, default: 'mg/dL' }
    },
    hemoglobin: {
      value: Number,
      unit: { type: String, default: 'g/dL' }
    },
    creatinine: {
      value: Number,
      unit: { type: String, default: 'mg/dL' }
    }
  },

  // Symptoms and Conditions
  symptoms: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String,
    notes: String
  }],

  // Medications
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }],

  // Lifestyle Data
  lifestyle: {
    sleepHours: Number,
    exerciseMinutes: Number,
    waterIntake: {
      value: Number,
      unit: { type: String, default: 'liters' }
    },
    smokingStatus: {
      type: String,
      enum: ['never', 'former', 'current']
    },
    alcoholConsumption: {
      type: String,
      enum: ['none', 'occasional', 'moderate', 'heavy']
    }
  },

  // Notes and Observations
  notes: String,
  
  // Data Source
  source: {
    type: String,
    enum: ['manual', 'device', 'lab', 'doctor'],
    default: 'manual'
  },

  // Recording Information
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isAbnormal: {
    type: Boolean,
    default: false
  },

  abnormalValues: [{
    field: String,
    value: mongoose.Schema.Types.Mixed,
    normalRange: String,
    severity: {
      type: String,
      enum: ['low', 'high', 'critical']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
healthDataSchema.index({ patient: 1, createdAt: -1 });
healthDataSchema.index({ 'vitals.bloodPressure.systolic': 1 });
healthDataSchema.index({ 'vitals.heartRate.value': 1 });
healthDataSchema.index({ isAbnormal: 1 });

// Virtual for BMI calculation
healthDataSchema.virtual('calculatedBMI').get(function() {
  if (this.measurements.height && this.measurements.weight) {
    const heightInMeters = this.measurements.height.value / 100;
    return (this.measurements.weight.value / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
});

// Pre-save middleware to calculate BMI and check for abnormal values
healthDataSchema.pre('save', function(next) {
  // Calculate BMI if height and weight are provided
  if (this.measurements.height && this.measurements.weight) {
    const heightInMeters = this.measurements.height.value / 100;
    this.measurements.bmi = parseFloat((this.measurements.weight.value / (heightInMeters * heightInMeters)).toFixed(2));
  }

  // Check for abnormal values
  this.abnormalValues = [];
  
  // Blood Pressure
  if (this.vitals.bloodPressure) {
    if (this.vitals.bloodPressure.systolic > 140) {
      this.abnormalValues.push({
        field: 'bloodPressure.systolic',
        value: this.vitals.bloodPressure.systolic,
        normalRange: '90-140 mmHg',
        severity: this.vitals.bloodPressure.systolic > 180 ? 'critical' : 'high'
      });
    }
    if (this.vitals.bloodPressure.diastolic > 90) {
      this.abnormalValues.push({
        field: 'bloodPressure.diastolic',
        value: this.vitals.bloodPressure.diastolic,
        normalRange: '60-90 mmHg',
        severity: this.vitals.bloodPressure.diastolic > 110 ? 'critical' : 'high'
      });
    }
  }

  // Heart Rate
  if (this.vitals.heartRate && this.vitals.heartRate.value) {
    if (this.vitals.heartRate.value < 60 || this.vitals.heartRate.value > 100) {
      this.abnormalValues.push({
        field: 'heartRate',
        value: this.vitals.heartRate.value,
        normalRange: '60-100 bpm',
        severity: this.vitals.heartRate.value < 50 || this.vitals.heartRate.value > 120 ? 'critical' : 'high'
      });
    }
  }

  // Temperature
  if (this.vitals.temperature && this.vitals.temperature.value) {
    if (this.vitals.temperature.value < 36.1 || this.vitals.temperature.value > 37.2) {
      this.abnormalValues.push({
        field: 'temperature',
        value: this.vitals.temperature.value,
        normalRange: '36.1-37.2°C',
        severity: this.vitals.temperature.value < 35 || this.vitals.temperature.value > 38 ? 'critical' : 'high'
      });
    }
  }

  // Oxygen Saturation
  if (this.vitals.oxygenSaturation && this.vitals.oxygenSaturation.value) {
    if (this.vitals.oxygenSaturation.value < 95) {
      this.abnormalValues.push({
        field: 'oxygenSaturation',
        value: this.vitals.oxygenSaturation.value,
        normalRange: '95-100%',
        severity: this.vitals.oxygenSaturation.value < 90 ? 'critical' : 'high'
      });
    }
  }

  // Set isAbnormal flag
  this.isAbnormal = this.abnormalValues.length > 0;
  
  next();
});

// Method to get latest vitals for a patient
healthDataSchema.statics.getLatestVitals = function(patientId) {
  return this.findOne({ patient: patientId })
    .sort({ createdAt: -1 })
    .select('vitals measurements createdAt');
};

// Method to get vitals history for charts
healthDataSchema.statics.getVitalsHistory = function(patientId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    patient: patientId,
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: 1 })
  .select('vitals measurements createdAt');
};

module.exports = mongoose.model('HealthData', healthDataSchema); 