
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
            unit: {
                type: String,
                default: 'mmHg'
            }
        },
        heartRate: {
            value: Number,
            unit: {
                type: String,
                default: 'bpm'
            }
        },
        temperature: {
            value: Number,
            unit: {
                type: String,
                default: '°C'
            }
        },
        oxygenSaturation: {
            value: Number,
            unit: {
                type: String,
                default: '%'
            }
        },
        respiratoryRate: {
            value: Number,
            unit: {
                type: String,
                default: 'breaths/min'
            }
        }
    },

    // Body Measurements
    measurements: {
        height: {
            value: Number,
            unit: {
                type: String,
                default: 'cm'
            }
        },
        weight: {
            value: Number,
            unit: {
                type: String,
                default: 'kg'
            }
        },
        bmi: Number,
        waistCircumference: {
            value: Number,
            unit: {
                type: String,
                default: 'cm'
            }
        },
        hipCircumference: {
            value: Number,
            unit: {
                type: String,
                default: 'cm'
            }
        }
    },

    // Lab Results
    labResults: {
        bloodSugar: {
            fasting: Number,
            postprandial: Number,
            unit: {
                type: String,
                default: 'mg/dL'
            }
        },
        cholesterol: {
            total: Number,
            hdl: Number,
            ldl: Number,
            triglycerides: Number,
            unit: {
                type: String,
                default: 'mg/dL'
            }
        },
        hemoglobin: {
            value: Number,
            unit: {
                type: String,
                default: 'g/dL'
            }
        },
        creatinine: {
            value: Number,
            unit: {
                type: String,
                default: 'mg/dL'
            }
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
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // Lifestyle Data
    lifestyle: {
        sleepHours: Number,
        exerciseMinutes: Number,
        waterIntake: {
            value: Number,
            unit: {
                type: String,
                default: 'liters'
            }
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
healthDataSchema.index({
    patient: 1,
    createdAt: -1
});
healthDataSchema.index({
    'vitals.bloodPressure.systolic': 1
});
healthDataSchema.index({
    'vitals.heartRate.value': 1
});
healthDataSchema.index({
    isAbnormal: 1
});

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
    if (this.measurements.height && this.measurements.weight && this.measurements.height.value > 0) {
        const heightInMeters = this.measurements.height.value / 100;
        this.measurements.bmi = parseFloat((this.measurements.weight.value / (heightInMeters * heightInMeters)).toFixed(2));
    }

    // Check for abnormal values
    this.abnormalValues = [];

    // Blood Pressure
    if (this.vitals && this.vitals.bloodPressure) {
        const {
            systolic,
            diastolic
        } = this.vitals.bloodPressure;
        if (systolic !== undefined) {
            if (systolic > 140) {
                this.abnormalValues.push({
                    field: 'bloodPressure.systolic',
                    value: systolic,
                    normalRange: '90-140 mmHg',
                    severity: systolic > 180 ? 'critical' : 'high'
                });
            } else if (systolic < 90) { // Also check for low systolic
                this.abnormalValues.push({
                    field: 'bloodPressure.systolic',
                    value: systolic,
                    normalRange: '90-140 mmHg',
                    severity: systolic < 70 ? 'critical' : 'low'
                });
            }
        }
        if (diastolic !== undefined) {
            if (diastolic > 90) {
                this.abnormalValues.push({
                    field: 'bloodPressure.diastolic',
                    value: diastolic,
                    normalRange: '60-90 mmHg',
                    severity: diastolic > 110 ? 'critical' : 'high'
                });
            } else if (diastolic < 60) { // Also check for low diastolic
                this.abnormalValues.push({
                    field: 'bloodPressure.diastolic',
                    value: diastolic,
                    normalRange: '60-90 mmHg',
                    severity: diastolic < 40 ? 'critical' : 'low'
                });
            }
        }
    }

    // Heart Rate
    if (this.vitals && this.vitals.heartRate && this.vitals.heartRate.value !== undefined) {
        const hr = this.vitals.heartRate.value;
        if (hr < 60 || hr > 100) {
            this.abnormalValues.push({
                field: 'heartRate',
                value: hr,
                normalRange: '60-100 bpm',
                severity: hr < 50 || hr > 120 ? 'critical' : (hr < 60 ? 'low' : 'high')
            });
        }
    }

    // Temperature
    if (this.vitals && this.vitals.temperature && this.vitals.temperature.value !== undefined) {
        const temp = this.vitals.temperature.value;
        if (temp < 36.1 || temp > 37.2) {
            this.abnormalValues.push({
                field: 'temperature',
                value: temp,
                normalRange: '36.1-37.2°C',
                severity: temp < 35 || temp > 38 ? 'critical' : (temp < 36.1 ? 'low' : 'high')
            });
        }
    }

    // Oxygen Saturation
    if (this.vitals && this.vitals.oxygenSaturation && this.vitals.oxygenSaturation.value !== undefined) {
        const osat = this.vitals.oxygenSaturation.value;
        if (osat < 95) {
            this.abnormalValues.push({
                field: 'oxygenSaturation',
                value: osat,
                normalRange: '95-100%',
                severity: osat < 90 ? 'critical' : 'low'
            });
        }
    }

    // Lab Results - Blood Sugar (Fasting)
    if (this.labResults && this.labResults.bloodSugar && this.labResults.bloodSugar.fasting !== undefined) {
        const fasting = this.labResults.bloodSugar.fasting;
        // Example: Normal fasting blood sugar < 100 mg/dL (American Diabetes Association)
        if (fasting < 70 || fasting > 100) {
            this.abnormalValues.push({
                field: 'labResults.bloodSugar.fasting',
                value: fasting,
                normalRange: '70-100 mg/dL',
                severity: fasting < 70 ? 'low' : (fasting > 125 ? 'critical' : 'high')
            });
        }
    }

    // Lab Results - Blood Sugar (Postprandial)
    if (this.labResults && this.labResults.bloodSugar && this.labResults.bloodSugar.postprandial !== undefined) {
        const postprandial = this.labResults.bloodSugar.postprandial;
        // Example: Normal postprandial blood sugar < 140 mg/dL (2 hours after eating)
        if (postprandial > 140) {
            this.abnormalValues.push({
                field: 'labResults.bloodSugar.postprandial',
                value: postprandial,
                normalRange: '< 140 mg/dL',
                severity: postprandial > 200 ? 'critical' : 'high'
            });
        }
    }

    // Lab Results - Cholesterol (Total)
    if (this.labResults && this.labResults.cholesterol && this.labResults.cholesterol.total !== undefined) {
        const totalChol = this.labResults.cholesterol.total;
        // Example: Optimal < 200 mg/dL
        if (totalChol > 200) {
            this.abnormalValues.push({
                field: 'labResults.cholesterol.total',
                value: totalChol,
                normalRange: '< 200 mg/dL',
                severity: totalChol > 240 ? 'critical' : 'high'
            });
        }
    }

    // Lab Results - Hemoglobin
    if (this.labResults && this.labResults.hemoglobin && this.labResults.hemoglobin.value !== undefined) {
        const hb = this.labResults.hemoglobin.value;
        // Example: Normal for adult males: 13.5-17.5 g/dL; adult females: 12.0-15.5 g/dL (these are illustrative, real ranges vary)
        // This check is generic, a real application might need gender/age specific ranges.
        if (hb < 12.0 || hb > 17.5) {
            this.abnormalValues.push({
                field: 'labResults.hemoglobin',
                value: hb,
                normalRange: '12.0-17.5 g/dL (approx)',
                severity: hb < 10.0 || hb > 19.0 ? 'critical' : (hb < 12.0 ? 'low' : 'high')
            });
        }
    }

    // Lab Results - Creatinine
    if (this.labResults && this.labResults.creatinine && this.labResults.creatinine.value !== undefined) {
        const creatinine = this.labResults.creatinine.value;
        // Example: Normal 0.74-1.35 mg/dL for men, 0.59-1.04 mg/dL for women (illustrative)
        // Again, a real app needs more specific logic.
        if (creatinine < 0.5 || creatinine > 1.4) {
            this.abnormalValues.push({
                field: 'labResults.creatinine',
                value: creatinine,
                normalRange: '0.5-1.4 mg/dL (approx)',
                severity: creatinine > 2.0 ? 'critical' : (creatinine < 0.5 ? 'low' : 'high')
            });
        }
    }


    // Set isAbnormal flag
    this.isAbnormal = this.abnormalValues.length > 0;

    next();
});

// Static method to get latest vitals for a patient
healthDataSchema.statics.getLatestVitals = function(patientId) {
    return this.findOne({
            patient: patientId
        })
        .sort({
            createdAt: -1
        })
        .select('vitals measurements createdAt');
};

// Static method to get vitals history for charts
healthDataSchema.statics.getVitalsHistory = function(patientId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
            patient: patientId,
            createdAt: {
                $gte: startDate
            }
        })
        .sort({
            createdAt: 1
        })
        .select('vitals measurements createdAt');
};

const HealthData = mongoose.model('HealthData', healthDataSchema);

module.exports = HealthData;