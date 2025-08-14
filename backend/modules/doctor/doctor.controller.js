
const { validationResult } = require('express-validator');
const doctorService = require('./doctor.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const User = require('../user/user.model');

const doctorController = {
    // registerDoctor: asyncHandler(async (req, res) => {
    //     const errors = validationResult(req);
    //     if (!errors.isEmpty()) {
    //         return res.status(400).json({
    //             success: false,
    //             errors: errors.array()
    //         });
    //     }

    //     const doctor = await doctorService.registerDoctor(req.body);

    //     res.status(201).json({
    //         success: true,
    //         message: 'Doctor registered successfully. Please wait for admin verification.',
    //         data: {
    //             doctor
    //         }
    //     });
    // }),

    updateDoctorProfile: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const doctor = await doctorService.updateDoctorProfile(req.user._id, req.body);

        res.json({
            success: true,
            message: 'Doctor profile updated successfully',
            data: {
                doctor
            }
        });
    }),

    uploadDoctorCertificate: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { certificate, doctor } = await doctorService.uploadDoctorCertificate(req.user._id, req.file, req.body);

        res.json({
            success: true,
            message: 'Certificate uploaded successfully',
            data: {
                certificate,
                doctor
            }
        });
    }),

    getDoctorsPendingVerification: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { doctors, pagination } = await doctorService.getDoctorsPendingVerification(req.query);

        res.json({
            success: true,
            data: {
                doctors,
                pagination
            }
        });
    }),

    verifyDoctor: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { status, reason } = req.body;
        const doctorId = req.params.id;
        const adminId = req.user._id;

        const doctor = await doctorService.verifyDoctor(doctorId, status, reason, adminId);

        res.json({
            success: true,
            message: `Doctor ${status} successfully`,
            data: {
                doctor
            }
        });
    }),

    getDoctorAppointments: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const doctorId = req.params.id;
        const { appointments, pagination } = await doctorService.getDoctorAppointments(doctorId, req.user, req.query);

        res.json({
            success: true,
            data: {
                appointments,
                pagination
            }
        });
    }),

    getDoctorSchedule: asyncHandler(async (req, res) => {
        const doctorId = req.params.id;
        const { doctorId: returnedDoctorId, availableSlots, consultationFee } = await doctorService.getDoctorSchedule(doctorId, req.user);

        res.json({
            success: true,
            data: {
                doctorId: returnedDoctorId,
                availableSlots,
                consultationFee
            }
        });
    }),

    updateDoctorSchedule: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const doctorId = req.params.id;
        const { availableSlots } = req.body;

        const { availableSlots: updatedSlots } = await doctorService.updateDoctorSchedule(doctorId, availableSlots, req.user);

        res.json({
            success: true,
            message: 'Schedule updated successfully',
            data: {
                availableSlots: updatedSlots
            }
        });
    }),

    getDoctorStatistics: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const doctorId = req.params.id;
        const stats = await doctorService.getDoctorStatistics(doctorId, req.user, req.query);

        res.json({
            success: true,
            data: stats
        });
    }),

    getAllSpecializations: asyncHandler(async (req, res) => {
        const specializations = await doctorService.getAllSpecializations();

        res.json({
            success: true,
            data: {
                specializations
            }
        });
    }),

    // getAllVerifiedDoctors: asyncHandler(async (req, res) => {
    //     const doctors = await doctorService.getAllVerifiedDoctors();

    //     res.json({
    //         success: true,
    //         data: {
    //             doctors
    //         }
    //     });
    // }),

    getAllVerifiedDoctors: asyncHandler(async (req, res) => {
        try {
            const doctors = await User.find({
                role: 'doctor',
                isVerified: true,
                isActive: true
            });

            const formattedDoctors = doctors.map(doc => ({
                _id: doc._id,
                name: `${doc.firstName} ${doc.lastName}`,
                email: doc.email,
                phone: doc.phone,
                specialization: doc.doctorInfo?.specialization || [],
                consultationFee: doc.doctorInfo?.consultationFee || 0,
                rating: doc.doctorInfo?.rating || 0,
                totalReviews: doc.doctorInfo?.totalReviews || 0,
                profilePicture: doc.profilePicture || ''
            }));

            res.status(200).json({
                success: true,
                data: {
                    doctors: formattedDoctors
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }),



    getDoctorPatients: asyncHandler(async (req, res) => {
        const doctorId = req.params.id;
        const patients = await doctorService.getDoctorPatients(doctorId, req.user);

        res.json({
            success: true,
            data: {
                patients
            }
        });
    })
};

module.exports = doctorController;