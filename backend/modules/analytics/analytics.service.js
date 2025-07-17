const Appointment = require('../appointment/appointment.model'); 
const Prescription = require('../prescription/prescription.model'); 
const MedicalRecord = require('../medicalRecord/medicalRecord.model'); 
const LabTest = require('../labTest/labTest.model'); 

// Helper function to get appointment statistics
exports.getAppointmentStats = async (userId, start, end, userType) => {
    const matchCriteria = userType === 'patient' ? { patient: userId } : { doctor: userId };
    return await Appointment.aggregate([
        {
            $match: {
                ...matchCriteria,
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalSpent: { $sum: '$consultationFee' },
                totalRevenue: { $sum: '$consultationFee' } // For doctors
            }
        }
    ]);
};

// Helper function to get patient demographics (for doctor dashboard)
exports.getPatientDemographics = async (doctorId, start, end) => {
    return await Appointment.aggregate([
        {
            $match: {
                doctor: doctorId,
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
};

// Helper function to get prescription statistics
exports.getPrescriptionStats = async (userId, start, end, userType) => {
    const matchCriteria = userType === 'patient' ? { patient: userId } : { doctor: userId };
    return await Prescription.aggregate([
        {
            $match: {
                ...matchCriteria,
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
                },
                mostPrescribedMedications: { // For doctors
                    $push: '$medications.name'
                }
            }
        }
    ]);
};

// Helper function to get medical record statistics (for patient dashboard)
exports.getMedicalRecordStats = async (patientId, start, end) => {
    return await MedicalRecord.aggregate([
        {
            $match: {
                patient: patientId,
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
};

// Helper function to get lab test statistics (for patient dashboard)
exports.getLabTestStats = async (patientId, start, end) => {
    return await LabTest.aggregate([
        {
            $match: {
                patient: patientId,
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
};

// Helper function to get rating statistics (for doctor dashboard)
exports.getRatingStats = async (doctorId, start, end) => {
    return await Appointment.aggregate([
        {
            $match: {
                doctor: doctorId,
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
};

// Helper function to get appointment trends (for doctor dashboard)
exports.getAppointmentTrends = async (doctorId, start, end) => {
    return await Appointment.aggregate([
        {
            $match: {
                doctor: doctorId,
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
};

// Helper function to get top patients (for doctor dashboard)
exports.getTopPatients = async (doctorId, start, end) => {
    return await Appointment.aggregate([
        {
            $match: {
                doctor: doctorId,
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
};


// Helper functions
exports.calculateHealthTrends = async (userId, start, end, metric = null) => {
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

exports.calculateMedicationAdherence = async (userId, start, end) => {
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

exports.calculateVitalSignsTrends = async (userId, start, end, vital = null) => {
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

exports.calculateGoalProgress = async (userId, goal) => {
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

// Helper function to calculate trends for chart data
exports.calculateTrend = (data, valueKey) => {
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