// const express = require("express");
// const { body, validationResult } = require("express-validator");
// const User = require("../models/User");
// const {
//   authenticateToken,
//   requirePatient,
//   requireOwnership,
// } = require("../middleware/auth");
// const { asyncHandler } = require("../middleware/errorHandler");
// const { uploadToCloudinary } = require("../utils/cloudinaryService");

// const router = express.Router();

// // @route   GET /api/users/profile
// // @desc    Get current user profile
// // @access  Private
// router.get(
//   "/profile",
//   asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id)
//       .populate("doctorInfo.specialization")
//       .populate("adminInfo.permissions");

//     res.json({
//       success: true,
//       data: {
//         user: user.getPublicProfile(),
//       },
//     });
//   })
// );

// // @route   PUT /api/users/profile
// // @desc    Update user profile
// // @access  Private
// router.put(
//   "/profile",
//   [
//     body("firstName").optional().trim().isLength({ min: 2, max: 50 }),
//     body("lastName").optional().trim().isLength({ min: 2, max: 50 }),
//     body("phone")
//       .optional()
//       .matches(/^[\+]?[1-9][\d]{0,15}$/),
//     body("dateOfBirth").optional().isISO8601(),
//     body("gender").optional().isIn(["male", "female", "other"]),
//     body("address").optional().isObject(),
//     body("emergencyContact").optional().isObject(),
//   ],
//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const allowedFields = [
//       "firstName",
//       "lastName",
//       "phone",
//       "dateOfBirth",
//       "gender",
//       "address",
//       "emergencyContact",
//       "preferences",
//     ];

//     const updateData = {};
//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });

//     const user = await User.findByIdAndUpdate(req.user._id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       data: {
//         user: user.getPublicProfile(),
//       },
//     });
//   })
// );

// // @route   POST /api/users/profile-picture
// // @desc    Upload profile picture
// // @access  Private
// router.post(
//   "/profile-picture",
//   asyncHandler(async (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Please upload a file",
//       });
//     }

//     // Upload to Cloudinary
//     const result = await uploadToCloudinary(req.file.path, "profile-pictures");

//     // Update user profile
//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { profilePicture: result.secure_url },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Profile picture updated successfully",
//       data: {
//         profilePicture: result.secure_url,
//         user: user.getPublicProfile(),
//       },
//     });
//   })
// );

// // @route   GET /api/users/health-data
// // @desc    Get patient health data
// // @access  Private (Patient only)
// router.get(
//   "/health-data",
//   requirePatient,
//   asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);

//     res.json({
//       success: true,
//       data: {
//         healthData: user.patientInfo,
//       },
//     });
//   })
// );

// // @route   PUT /api/users/health-data
// // @desc    Update patient health data
// // @access  Private (Patient only)
// router.put(
//   "/health-data",
//   requirePatient,
//   [
//     body("bloodGroup")
//       .optional()
//       .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
//     body("height").optional().isNumeric(),
//     body("weight").optional().isNumeric(),
//     body("allergies").optional().isArray(),
//     body("chronicDiseases").optional().isArray(),
//     body("currentMedications").optional().isArray(),
//     body("familyHistory").optional().isArray(),
//   ],
//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const allowedFields = [
//       "bloodGroup",
//       "height",
//       "weight",
//       "allergies",
//       "chronicDiseases",
//       "currentMedications",
//       "familyHistory",
//     ];

//     const updateData = {};
//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updateData[`patientInfo.${field}`] = req.body[field];
//       }
//     });

//     const user = await User.findByIdAndUpdate(req.user._id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({
//       success: true,
//       message: "Health data updated successfully",
//       data: {
//         healthData: user.patientInfo,
//       },
//     });
//   })
// );

// // @route   GET /api/users/doctors
// // @desc    Get all verified doctors
// // @access  Public
// router.get(
//   "/doctors",
//   asyncHandler(async (req, res) => {
//     const {
//       specialization,
//       city,
//       rating,
//       experience,
//       page = 1,
//       limit = 10,
//       sortBy = "rating",
//       sortOrder = "desc",
//     } = req.query;

//     const query = {
//       role: "doctor",
//       isVerified: true,
//       isActive: true,
//     };

//     // Add filters
//     if (specialization) {
//       query["doctorInfo.specialization"] = { $in: [specialization] };
//     }
//     if (city) {
//       query["address.city"] = { $regex: city, $options: "i" };
//     }
//     if (rating) {
//       query["doctorInfo.rating"] = { $gte: parseFloat(rating) };
//     }
//     if (experience) {
//       query["doctorInfo.experience"] = { $gte: parseInt(experience) };
//     }

//     const sortOptions = {};
//     sortOptions[`doctorInfo.${sortBy}`] = sortOrder === "desc" ? -1 : 1;

//     const doctors = await User.find(query)
//       .select(
//         "firstName lastName email phone address doctorInfo profilePicture"
//       )
//       .sort(sortOptions)
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await User.countDocuments(query);

//     res.json({
//       success: true,
//       data: {
//         doctors,
//         pagination: {
//           currentPage: page,
//           totalPages: Math.ceil(total / limit),
//           totalDoctors: total,
//           hasNextPage: page * limit < total,
//           hasPrevPage: page > 1,
//         },
//       },
//     });
//   })
// );

// // @route   GET /api/users/doctors/:id
// // @desc    Get doctor profile by ID
// // @access  Public
// router.get(
//   "/doctors/:id",
//   asyncHandler(async (req, res) => {
//     const doctor = await User.findOne({
//       _id: req.params.id,
//       role: "doctor",
//       isVerified: true,
//       isActive: true,
//     }).select("-password -loginHistory");

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         doctor: doctor.getPublicProfile(),
//       },
//     });
//   })
// );

// // @route   GET /api/users/doctors/:id/schedule
// // @desc    Get doctor's available schedule
// // @access  Public
// router.get(
//   "/doctors/:id/schedule",
//   asyncHandler(async (req, res) => {
//     const { date } = req.query;

//     const doctor = await User.findOne({
//       _id: req.params.id,
//       role: "doctor",
//       isVerified: true,
//       isActive: true,
//     });

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     // Get available slots for the specified date
//     const availableSlots = doctor.doctorInfo.availableSlots || [];

//     // Filter slots for the specific date (implement date logic)
//     const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
//       weekday: "lowercase",
//     });
//     const daySlots = availableSlots.filter(
//       (slot) => slot.day === dayOfWeek && slot.isAvailable
//     );

//     res.json({
//       success: true,
//       data: {
//         doctorId: doctor._id,
//         date,
//         availableSlots: daySlots,
//         consultationFee: doctor.doctorInfo.consultationFee,
//       },
//     });
//   })
// );

// // @route   PUT /api/users/preferences
// // @desc    Update user preferences
// // @access  Private
// router.put(
//   "/preferences",
//   [
//     body("language").optional().isIn(["en", "bn", "hi"]),
//     body("theme").optional().isIn(["light", "dark"]),
//     body("notifications.email").optional().isBoolean(),
//     body("notifications.sms").optional().isBoolean(),
//     body("notifications.push").optional().isBoolean(),
//   ],
//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const allowedFields = ["language", "theme", "notifications"];
//     const updateData = {};

//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updateData[`preferences.${field}`] = req.body[field];
//       }
//     });

//     const user = await User.findByIdAndUpdate(req.user._id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({
//       success: true,
//       message: "Preferences updated successfully",
//       data: {
//         preferences: user.preferences,
//       },
//     });
//   })
// );

// // @route   DELETE /api/users/account
// // @desc    Delete user account
// // @access  Private
// router.delete(
//   "/account",
//   asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);

//     // Soft delete - mark as inactive
//     user.isActive = false;
//     await user.save();

//     res.json({
//       success: true,
//       message: "Account deactivated successfully",
//     });
//   })
// );

// // @route   POST /api/users/verify-phone
// // @desc    Send phone verification code
// // @access  Private
// router.post(
//   "/verify-phone",
//   [
//     body("phone")
//       .matches(/^[\+]?[1-9][\d]{0,15}$/)
//       .withMessage("Please provide a valid phone number"),
//   ],
//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const { phone } = req.body;

//     // Generate verification code (6 digits)
//     const verificationCode = Math.floor(
//       100000 + Math.random() * 900000
//     ).toString();

//     // Store code in user document (in production, use Redis for better performance)
//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       {
//         phone,
//         phoneVerificationCode: verificationCode,
//         phoneVerificationExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
//       },
//       { new: true }
//     );

//     // Send SMS (implement SMS service)
//     // await sendSMS(phone, `Your verification code is: ${verificationCode}`);

//     res.json({
//       success: true,
//       message: "Verification code sent to your phone",
//     });
//   })
// );

// // @route   POST /api/users/confirm-phone
// // @desc    Confirm phone verification code
// // @access  Private
// router.post(
//   "/confirm-phone",
//   [
//     body("code")
//       .isLength({ min: 6, max: 6 })
//       .withMessage("Please provide a 6-digit code"),
//   ],
//   asyncHandler(async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const { code } = req.body;

//     const user = await User.findById(req.user._id);

//     if (
//       !user.phoneVerificationCode ||
//       user.phoneVerificationCode !== code ||
//       user.phoneVerificationExpire < Date.now()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired verification code",
//       });
//     }

//     // Mark phone as verified
//     user.phoneVerified = true;
//     user.phoneVerificationCode = undefined;
//     user.phoneVerificationExpire = undefined;
//     await user.save();

//     res.json({
//       success: true,
//       message: "Phone number verified successfully",
//     });
//   })
// );

// module.exports = router;


const express = require('express');
const router = express.Router();

const userRoutes = require('../user/user.route');
router.use('/', userRoutes);

module.exports = router;
