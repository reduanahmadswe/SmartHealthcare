const { validationResult } = require('express-validator');
const User = require('../user/user.model');
const Appointment = require('../appointment/appointment.model'); 
const HealthData = require('../healthData/healthData.model'); 
const analyticsService = require('./analytics.service');

// Get patient health analytics dashboard
exports.getPatientHealthDashboard = async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Get patient's health data
    const patient = await User.findById(req.user._id);
    const healthData = patient.patientInfo || {};

    // Get appointment statistics
    const appointmentStats = await analyticsService.getAppointmentStats(req.user._id, start, end, 'patient');

    // Get prescription statistics
    const prescriptionStats = await analyticsService.getPrescriptionStats(req.user._id, start, end, 'patient');

    // Get medical record statistics
    const medicalRecordStats = await analyticsService.getMedicalRecordStats(req.user._id, start, end);

    // Get lab test statistics
    const labTestStats = await analyticsService.getLabTestStats(req.user._id, start, end);

    // Calculate health trends
    const healthTrends = await analyticsService.calculateHealthTrends(req.user._id, start, end);

    // Get medication adherence
    const medicationAdherence = await analyticsService.calculateMedicationAdherence(req.user._id, start, end);

    // Get vital signs trends
    const vitalSignsTrends = await analyticsService.calculateVitalSignsTrends(req.user._id, start, end);

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
};

// Get doctor analytics dashboard
exports.getDoctorDashboard = async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Get appointment statistics
    const appointmentStats = await analyticsService.getAppointmentStats(req.user._id, start, end, 'doctor');

    // Get patient demographics
    const patientDemographics = await analyticsService.getPatientDemographics(req.user._id, start, end);

    // Get prescription statistics
    const prescriptionStats = await analyticsService.getPrescriptionStats(req.user._id, start, end, 'doctor');

    // Get rating statistics
    const ratingStats = await analyticsService.getRatingStats(req.user._id, start, end);

    // Get appointment trends
    const appointmentTrends = await analyticsService.getAppointmentTrends(req.user._id, start, end);

    // Get top patients
    const topPatients = await analyticsService.getTopPatients(req.user._id, start, end);

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
};

// Get health trends over time
exports.getHealthTrends = async (req, res) => {
    const { startDate, endDate, metric } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 90));
    const end = endDate ? new Date(endDate) : new Date();

    const trends = await analyticsService.calculateHealthTrends(req.user._id, start, end, metric);

    res.json({
        success: true,
        data: {
            period: { start, end },
            metric,
            trends
        }
    });
};

// Get medication adherence analytics
exports.getMedicationAdherence = async (req, res) => {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const adherence = await analyticsService.calculateMedicationAdherence(req.user._id, start, end);

    res.json({
        success: true,
        data: {
            period: { start, end },
            adherence
        }
    });
};

// Get vital signs trends
exports.getVitalSignsTrends = async (req, res) => {
    const { startDate, endDate, vital } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const trends = await analyticsService.calculateVitalSignsTrends(req.user._id, start, end, vital);

    res.json({
        success: true,
        data: {
            period: { start, end },
            vital,
            trends
        }
    });
};

// Get vitals analytics for a patient
exports.getVitalsAnalytics = async (req, res) => {
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
        bloodPressure: analyticsService.calculateTrend(chartData.bloodPressure, 'systolic'),
        heartRate: analyticsService.calculateTrend(chartData.heartRate, 'value'),
        temperature: analyticsService.calculateTrend(chartData.temperature, 'value'),
        oxygenSaturation: analyticsService.calculateTrend(chartData.oxygenSaturation, 'value'),
        weight: analyticsService.calculateTrend(chartData.weight, 'value'),
        bmi: analyticsService.calculateTrend(chartData.bmi, 'value')
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
                abnormalRecords: vitalsHistory.filter(record => record.isAbnormal).length, // Assuming `isAbnormal` exists on HealthData model
                latestRecord: vitalsHistory[vitalsHistory.length - 1] || null
            }
        }
    });
};

// Set health goals
exports.setHealthGoals = async (req, res) => {
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
};

// Get health goals
exports.getHealthGoals = async (req, res) => {
    const user = await User.findById(req.user._id);
    const goals = user.healthGoals || [];

    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
            const progress = await analyticsService.calculateGoalProgress(req.user._id, goal);
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
};