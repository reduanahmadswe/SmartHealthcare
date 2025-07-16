
const HealthData = require('./healthData.model'); 
const User = require('../user/user.model'); 


const healthDataService = {
    /**
     * Adds new health data for a patient.
     * @param {Object} healthDataPayload - The health data to add.
     * @param {Object} user - The authenticated user performing the action.
     * @returns {Promise<Object>} The newly created health data record.
     * @throws {Error} If patient ID is missing for doctors/admins, or patient not found.
     */
    addHealthData: async (healthDataPayload, user) => {
        const {
            patientId,
            ...data
        } = healthDataPayload;

        let targetPatientId;
        if (user.role === 'patient') {
            targetPatientId = user._id;
        } else if (user.role === 'doctor' || user.role === 'admin') {
            if (!patientId) {
                throw new Error('Patient ID is required for doctors and admins');
            }
            targetPatientId = patientId;

            // Verify patient exists
            const patient = await User.findById(targetPatientId);
            if (!patient || patient.role !== 'patient') {
                throw new Error('Patient not found');
            }
        } else {
            throw new Error('Unauthorized action');
        }

        const newHealthData = new HealthData({
            patient: targetPatientId,
            recordedBy: user._id,
            ...data
        });

        await newHealthData.save();
        return newHealthData;
    },

    /**
     * Retrieves health data for a specific user, with pagination and date range filtering.
     * Includes access control based on user role.
     * @param {string} userId - The ID of the patient whose health data is requested.
     * @param {Object} currentUser - The authenticated user requesting the data.
     * @param {Object} filters - Query parameters including page, limit, startDate, endDate.
     * @returns {Promise<Object>} Object containing health data records and pagination info.
     * @throws {Error} If access is denied.
     */
    getHealthData: async (userId, currentUser, filters) => {
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate
        } = filters;

        // Check access permissions
        if (currentUser.role === 'patient' && currentUser._id.toString() !== userId) {
            throw new Error('Access denied. You can only view your own health data.');
        }

        if (currentUser.role === 'doctor') {
            // Check if doctor has appointment with this patient
            const hasAppointment = require('../models/appointment/appointment.model'); // Re-require here to avoid circular dependency issues if Appointment also imports User or other models
            const existingAppointment = await hasAppointment.findOne({
                doctor: currentUser._id,
                patient: userId,
                status: {
                    $in: ['confirmed', 'completed']
                }
            });

            if (!existingAppointment) {
                throw new Error('Access denied. No appointment history with this patient.');
            }
        }

        // Build query
        const query = {
            patient: userId
        };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const healthData = await HealthData.find(query)
            .sort({
                createdAt: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('recordedBy', 'firstName lastName');

        const total = await HealthData.countDocuments(query);

        return {
            healthData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Gets the latest health data record for a specific user.
     * @param {string} userId - The ID of the patient.
     * @param {Object} currentUser - The authenticated user requesting the data.
     * @returns {Promise<Object>} The latest health data record.
     * @throws {Error} If no data found or access denied.
     */
    getLatestHealthData: async (userId, currentUser) => {
        // Check access permissions (same as getHealthData)
        if (currentUser.role === 'patient' && currentUser._id.toString() !== userId) {
            throw new Error('Access denied. You can only view your own health data.');
        }

        if (currentUser.role === 'doctor') {
            const Appointment = require('../models/appointment/appointment.model');
            const hasAppointment = await Appointment.findOne({
                doctor: currentUser._id,
                patient: userId,
                status: {
                    $in: ['confirmed', 'completed']
                }
            });
            if (!hasAppointment) {
                throw new Error('Access denied. No appointment history with this patient.');
            }
        }

        const latestHealthData = await HealthData.findOne({
                patient: userId
            })
            .sort({
                createdAt: -1
            })
            .populate('recordedBy', 'firstName lastName');

        if (!latestHealthData) {
            throw new Error('No health data found for this user');
        }

        return latestHealthData;
    },

    /**
     * Gets vitals history for charting purposes.
     * @param {string} userId - The ID of the patient.
     * @param {Object} currentUser - The authenticated user requesting the data.
     * @param {number} days - Number of days to retrieve history for.
     * @returns {Promise<Object>} Formatted vitals history data for charts.
     * @throws {Error} If access denied.
     */
    getVitalsHistory: async (userId, currentUser, days = 30) => {
        // Check access permissions (same as getHealthData)
        if (currentUser.role === 'patient' && currentUser._id.toString() !== userId) {
            throw new Error('Access denied. You can only view your own health data.');
        }

        if (currentUser.role === 'doctor') {
            const Appointment = require('../models/appointment/appointment.model');
            const hasAppointment = await Appointment.findOne({
                doctor: currentUser._id,
                patient: userId,
                status: {
                    $in: ['confirmed', 'completed']
                }
            });
            if (!hasAppointment) {
                throw new Error('Access denied. No appointment history with this patient.');
            }
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const vitalsHistory = await HealthData.find({
                patient: userId,
                createdAt: {
                    $gte: startDate
                }
            })
            .sort({
                createdAt: 1
            })
            .select('vitals measurements createdAt isAbnormal abnormalValues'); // Select abnormal fields too

        // Format data for charts
        const chartData = {
            bloodPressure: vitalsHistory.map(record => ({
                date: record.createdAt,
                systolic: record.vitals && record.vitals.bloodPressure ? record.vitals.bloodPressure.systolic : undefined,
                diastolic: record.vitals && record.vitals.bloodPressure ? record.vitals.bloodPressure.diastolic : undefined
            })).filter(item => item.systolic !== undefined || item.diastolic !== undefined),

            heartRate: vitalsHistory.map(record => ({
                date: record.createdAt,
                value: record.vitals && record.vitals.heartRate ? record.vitals.heartRate.value : undefined
            })).filter(item => item.value !== undefined),

            temperature: vitalsHistory.map(record => ({
                date: record.createdAt,
                value: record.vitals && record.vitals.temperature ? record.vitals.temperature.value : undefined
            })).filter(item => item.value !== undefined),

            oxygenSaturation: vitalsHistory.map(record => ({
                date: record.createdAt,
                value: record.vitals && record.vitals.oxygenSaturation ? record.vitals.oxygenSaturation.value : undefined
            })).filter(item => item.value !== undefined),

            weight: vitalsHistory.map(record => ({
                date: record.createdAt,
                value: record.measurements && record.measurements.weight ? record.measurements.weight.value : undefined
            })).filter(item => item.value !== undefined),

            bmi: vitalsHistory.map(record => ({
                date: record.createdAt,
                value: record.measurements ? record.measurements.bmi : undefined
            })).filter(item => item.value !== undefined)
        };

        return {
            period: {
                startDate,
                endDate: new Date()
            },
            vitalsHistory,
            chartData,
            summary: {
                totalRecords: vitalsHistory.length,
                abnormalRecords: vitalsHistory.filter(record => record.isAbnormal).length,
                latestRecord: vitalsHistory[vitalsHistory.length - 1] || null
            }
        };
    },

    /**
     * Gets abnormal health data records for a user.
     * @param {string} userId - The ID of the patient.
     * @param {Object} currentUser - The authenticated user requesting the data.
     * @param {Object} filters - Query parameters for pagination.
     * @returns {Promise<Object>} Object containing abnormal health data records and pagination info.
     * @throws {Error} If access denied.
     */
    getAbnormalHealthData: async (userId, currentUser, filters) => {
        const {
            page = 1,
            limit = 10
        } = filters;

        // Check access permissions (same as getHealthData)
        if (currentUser.role === 'patient' && currentUser._id.toString() !== userId) {
            throw new Error('Access denied. You can only view your own health data.');
        }

        if (currentUser.role === 'doctor') {
            const Appointment = require('../models/appointment/appointment.model');
            const hasAppointment = await Appointment.findOne({
                doctor: currentUser._id,
                patient: userId,
                status: {
                    $in: ['confirmed', 'completed']
                }
            });
            if (!hasAppointment) {
                throw new Error('Access denied. No appointment history with this patient.');
            }
        }

        const abnormalData = await HealthData.find({
                patient: userId,
                isAbnormal: true // Corrected from isAbormal
            })
            .sort({
                createdAt: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('recordedBy', 'firstName lastName');

        const total = await HealthData.countDocuments({
            patient: userId,
            isAbnormal: true
        });

        return {
            abnormalData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Updates an existing health data record.
     * @param {string} recordId - The ID of the health data record to update.
     * @param {Object} updateData - The data to update.
     * @param {Object} currentUser - The authenticated user performing the update.
     * @returns {Promise<Object>} The updated health data record.
     * @throws {Error} If record not found or access denied.
     */
    updateHealthData: async (recordId, updateData, currentUser) => {
        const healthData = await HealthData.findById(recordId);
        if (!healthData) {
            throw new Error('Health data record not found');
        }

        // Check access permissions
        if (currentUser.role === 'patient' && healthData.patient.toString() !== currentUser._id.toString()) {
            throw new Error('Access denied. You can only update your own health data.');
        }
        // Doctors/Admins can update any patient's health data (assuming patientId check is sufficient implicitly)

        // Prevent direct modification of `patient` or `recordedBy` during update if not explicitly allowed
        if (updateData.patient) delete updateData.patient;
        if (updateData.recordedBy) delete updateData.recordedBy;


        // Object.assign will trigger the pre-save hooks again for BMI and abnormal checks
        Object.assign(healthData, updateData);
        // Although lastUpdatedBy is not in schema, adding it here for potential future use or logging
        // healthData.lastUpdatedBy = currentUser._id;

        await healthData.save();

        return healthData;
    },

    /**
     * Deletes a health data record.
     * @param {string} recordId - The ID of the health data record to delete.
     * @param {Object} currentUser - The authenticated user performing the deletion.
     * @returns {Promise<void>}
     * @throws {Error} If record not found, access denied, or doctor tries to delete.
     */
    deleteHealthData: async (recordId, currentUser) => {
        const healthData = await HealthData.findById(recordId);
        if (!healthData) {
            throw new Error('Health data record not found');
        }

        // Check access permissions
        if (currentUser.role === 'patient' && healthData.patient.toString() !== currentUser._id.toString()) {
            throw new Error('Access denied. You can only delete your own health data.');
        }

        if (currentUser.role === 'doctor') {
            throw new Error('Doctors cannot delete health data records.');
        }

        await HealthData.findByIdAndDelete(recordId);
    }
};

module.exports = healthDataService;