// D:\SmartHealthcare\backend\services\admin.service.js
const User = require('../../models/user/user.model');
const Appointment = require('../Appointment');
const Prescription = require('../prescription/prescription.model');
const MedicalRecord = require('../MedicalRecord');
const LabTest = require('../../models/labTest/labTest.model');
const { sendEmail } = require('../../utils/emailService');

class AdminService {

    /**
     * Get admin dashboard statistics within a date range.
     * @param {Date} start - Start date for statistics.
     * @param {Date} end - End date for statistics.
     * @returns {Object} An object containing various statistics.
     */
    static async getDashboardStatistics(start, end) {
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    verifiedCount: {
                        $sum: { $cond: ['$isVerified', 1, 0] }
                    },
                    activeCount: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            }
        ]);

        const appointmentStats = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$consultationFee' }
                }
            }
        ]);

        const prescriptionStats = await Prescription.aggregate([
            {
                $match: {
                    prescriptionDate: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPrescriptions: { $sum: 1 },
                    avgMedicationsPerPrescription: { $avg: { $size: '$medications' } }
                }
            }
        ]);

        const medicalRecordStats = await MedicalRecord.aggregate([
            {
                $match: {
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

        const labTestStats = await LabTest.aggregate([
            {
                $match: {
                    appointmentDate: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$testType',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$testFee' }
                }
            }
        ]);

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email role createdAt');

        const recentAppointments = await Appointment.find()
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(5);

        return {
            userStats,
            appointmentStats,
            prescriptionStats: prescriptionStats[0] || { totalPrescriptions: 0, avgMedicationsPerPrescription: 0 },
            medicalRecordStats,
            labTestStats,
            recentUsers,
            recentAppointments
        };
    }

    /**
     * Get all users with pagination and filters.
     * @param {Object} filters - Query filters (role, status, search).
     * @param {number} page - Current page number.
     * @param {number} limit - Number of items per page.
     * @param {string} sortBy - Field to sort by.
     * @param {string} sortOrder - Sort order ('asc' or 'desc').
     * @returns {Object} Users data and pagination info.
     */
    static async getAllUsers({ role, status, search, page, limit, sortBy, sortOrder }) {
        const query = {};

        if (role) {
            query.role = role;
        }
        if (status === 'verified') {
            query.isVerified = true;
        } else if (status === 'unverified') {
            query.isVerified = false;
        } else if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const users = await User.find(query)
            .select('-password -loginHistory')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        return {
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Get user details by ID.
     * @param {string} userId - ID of the user.
     * @returns {Object} User object.
     */
    static async getUserById(userId) {
        return User.findById(userId).select('-password -loginHistory');
    }

    /**
     * Verify or reject a user's verification status.
     * @param {string} userId - ID of the user.
     * @param {string} status - 'approved' or 'rejected'.
     * @param {string} reason - Reason for rejection (optional).
     * @param {string} adminId - ID of the admin performing the action.
     * @returns {Object} Updated user object.
     * @throws {Error} If user not found.
     */
    static async updateUserVerificationStatus(userId, status, reason, adminId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (status === 'approved') {
            user.isVerified = true;
            user.verifiedBy = adminId;
            user.verifiedAt = new Date();
        } else {
            user.isVerified = false;
            user.verificationRejectedReason = reason;
        }

        await user.save();

        await sendEmail({
            to: user.email,
            subject: `Account Verification ${status === 'approved' ? 'Approved' : 'Rejected'} - Smart Healthcare Assistant`,
            template: 'accountVerification',
            context: {
                name: user.firstName,
                status,
                reason: reason || 'No reason provided'
            }
        });

        return user;
    }

    /**
     * Update user active status.
     * @param {string} userId - ID of the user.
     * @param {boolean} isActive - New active status.
     * @returns {Object} Updated user object.
     * @throws {Error} If user not found.
     */
    static async updateUserStatus(userId, isActive) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = isActive;
        await user.save();

        return user;
    }

    /**
     * Get all appointments with filters.
     * @param {Object} filters - Query filters (status, date, doctorId, patientId).
     * @param {number} page - Current page number.
     * @param {number} limit - Number of items per page.
     * @returns {Object} Appointments data and pagination info.
     */
    static async getAllAppointments({ status, date, doctorId, patientId, page, limit }) {
        const query = {};

        if (status) {
            query.status = status;
        }
        if (date) {
            query.appointmentDate = {
                $gte: new Date(date),
                $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            };
        }
        if (doctorId) {
            query.doctor = doctorId;
        }
        if (patientId) {
            query.patient = patientId;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email')
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        return {
            appointments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalAppointments: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Get detailed analytics.
     * @param {Date} start - Start date for analytics.
     * @param {Date} end - End date for analytics.
     * @param {string} groupBy - Grouping period ('day' or 'month').
     * @returns {Object} Detailed analytics data.
     */
    static async getDetailedAnalytics(start, end, groupBy) {
        const userRegistrationTrends = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const appointmentTrends = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$consultationFee' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const revenueByDoctor = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    'payment.status': 'paid'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'doctor',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            {
                $unwind: '$doctor'
            },
            {
                $group: {
                    _id: '$doctor._id',
                    doctorName: { $first: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] } },
                    totalRevenue: { $sum: '$payment.amount' },
                    appointmentCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        const topDoctors = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'doctor',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            {
                $unwind: '$doctor'
            },
            {
                $group: {
                    _id: '$doctor._id',
                    doctorName: { $first: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] } },
                    appointmentCount: { $sum: 1 },
                    avgRating: { $avg: '$rating' }
                }
            },
            { $sort: { appointmentCount: -1 } },
            { $limit: 10 }
        ]);

        const patientDemographics = await User.aggregate([
            {
                $match: {
                    role: 'patient',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);

        const ageDistribution = await User.aggregate([
            {
                $match: {
                    role: 'patient',
                    dateOfBirth: { $exists: true }
                }
            },
            {
                $addFields: {
                    age: {
                        $floor: {
                            $divide: [
                                { $subtract: [new Date(), '$dateOfBirth'] },
                                365 * 24 * 60 * 60 * 1000
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lt: ['$age', 18] }, then: '0-17' },
                                { case: { $lt: ['$age', 30] }, then: '18-29' },
                                { case: { $lt: ['$age', 45] }, then: '30-44' },
                                { case: { $lt: ['$age', 60] }, then: '45-59' },
                                { case: { $lt: ['$age', 75] }, then: '60-74' }
                            ],
                            default: '75+'
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            userRegistrationTrends,
            appointmentTrends,
            revenueByDoctor,
            topDoctors,
            patientDemographics,
            ageDistribution
        };
    }

    /**
     * Get system health metrics.
     * @returns {Object} System health data.
     */
    static async getSystemHealthMetrics() {
        const dbStats = {
            users: await User.countDocuments(),
            appointments: await Appointment.countDocuments(),
            prescriptions: await Prescription.countDocuments(),
            medicalRecords: await MedicalRecord.countDocuments(),
            labTests: await LabTest.countDocuments()
        };

        const recentErrors = []; // Placeholder for actual logging system integration

        const systemMetrics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };

        return {
            dbStats,
            recentErrors,
            systemMetrics
        };
    }

    /**
     * Send broadcast email to users.
     * @param {string} subject - Email subject.
     * @param {string} message - Email message content.
     * @param {string} recipients - Recipient group ('all', 'patients', 'doctors', 'admins').
     * @returns {Object} Email sending statistics.
     */
    static async sendBroadcastEmail(subject, message, recipients) {
        const query = {};
        if (recipients === 'patients') {
            query.role = 'patient';
        } else if (recipients === 'doctors') {
            query.role = 'doctor';
        } else if (recipients === 'admins') {
            query.role = 'admin';
        }

        const users = await User.find(query)
            .select('email firstName lastName')
            .limit(1000);

        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < users.length; i += batchSize) {
            batches.push(users.slice(i, i + batchSize));
        }

        let successCount = 0;
        let failureCount = 0;

        for (const batch of batches) {
            const emailPromises = batch.map(user =>
                sendEmail({
                    to: user.email,
                    subject,
                    template: 'broadcast',
                    context: {
                        name: user.firstName,
                        message
                    }
                }).catch(error => {
                    console.error(`Failed to send email to ${user.email}:`, error);
                    return false;
                })
            );

            const results = await Promise.allSettled(emailPromises);
            successCount += results.filter(r => r.status === 'fulfilled' && r.value !== false).length;
            failureCount += results.filter(r => r.status === 'rejected' || r.value === false).length;
        }

        return {
            totalRecipients: users.length,
            successCount,
            failureCount
        };
    }

    /**
     * Get unverified doctors with pagination.
     * @param {number} page - Current page number.
     * @param {number} limit - Number of items per page.
     * @returns {Object} Unverified doctors data and pagination info.
     */
    static async getUnverifiedDoctors({ page, limit }) {
        const unverifiedDoctors = await User.find({
            role: 'doctor',
            isVerified: false,
            isActive: true
        })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments({
            role: 'doctor',
            isVerified: false,
            isActive: true
        });

        return {
            doctors: unverifiedDoctors,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalDoctors: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Verify a doctor.
     * @param {string} doctorId - ID of the doctor to verify.
     * @param {string} verificationNotes - Notes regarding verification.
     * @param {string} adminId - ID of the admin performing the verification.
     * @returns {Object} Verified doctor details.
     * @throws {Error} If doctor not found or invalid role/already verified.
     */
    static async verifyDoctor(doctorId, verificationNotes, adminId) {
        const doctor = await User.findById(doctorId);

        if (!doctor) {
            throw new Error('Doctor not found');
        }
        if (doctor.role !== 'doctor') {
            throw new Error('User is not a doctor');
        }
        if (doctor.isVerified) {
            throw new Error('Doctor is already verified');
        }

        doctor.isVerified = true;
        doctor.verificationNotes = verificationNotes;
        doctor.verifiedBy = adminId;
        doctor.verifiedAt = new Date();
        await doctor.save();

        await sendEmail({
            to: doctor.email,
            subject: 'Account Verified - Smart Healthcare Assistant',
            template: 'doctorVerified',
            context: {
                doctorName: doctor.firstName,
                verificationNotes: verificationNotes || 'Your account has been verified successfully.'
            }
        });

        return {
            id: doctor._id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            email: doctor.email,
            specialization: doctor.doctorInfo?.specialization,
            verifiedAt: doctor.verifiedAt
        };
    }

    /**
     * Reject a doctor's verification.
     * @param {string} doctorId - ID of the doctor to reject.
     * @param {string} rejectionReason - Reason for rejection.
     * @returns {Object} Rejected doctor details.
     * @throws {Error} If doctor not found or invalid role/already verified.
     */
    static async rejectDoctorVerification(doctorId, rejectionReason) {
        const doctor = await User.findById(doctorId);

        if (!doctor) {
            throw new Error('Doctor not found');
        }
        if (doctor.role !== 'doctor') {
            throw new Error('User is not a doctor');
        }
        if (doctor.isVerified) {
            throw new Error('Doctor is already verified');
        }

        // Note: The original code does not set isVerified to false or
        // store rejection reason on the user object for rejection.
        // It only sends an email. If you want to store this, you'll need
        // to uncomment/add lines like:
        // doctor.isVerified = false;
        // doctor.verificationRejectedReason = rejectionReason;
        // await doctor.save();

        await sendEmail({
            to: doctor.email,
            subject: 'Account Verification Rejected - Smart Healthcare Assistant',
            template: 'doctorRejected',
            context: {
                doctorName: doctor.firstName,
                rejectionReason
            }
        });

        return {
            id: doctor._id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            email: doctor.email,
            rejectionReason
        };
    }

    /**
     * Get system logs.
     * @param {Object} filters - Query filters (level, startDate, endDate, page, limit).
     * @returns {Object} Logs data and pagination info.
     */
    static async getSystemLogs({ level, startDate, endDate, page, limit }) {
        // This is a mock implementation as per original code.
        // In a real application, this would query a dedicated logging database or service.
        const logs = [
            {
                timestamp: new Date(),
                level: 'info',
                message: 'System started successfully',
                userId: 'system'
            }
        ];

        return {
            logs,
            pagination: {
                currentPage: page,
                totalPages: 1, // Mock
                totalLogs: logs.length, // Mock
                hasNextPage: false, // Mock
                hasPrevPage: false // Mock
            }
        };
    }
}

module.exports = AdminService;