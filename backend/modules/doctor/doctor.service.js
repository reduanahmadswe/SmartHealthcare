const User = require("../user/user.model");
const Appointment = require("../appointment/appointment.model");
const Prescription = require("../prescription/prescription.model");
const { uploadToCloudinary } = require("../../utils/cloudinaryService");
const { sendEmail } = require("../../utils/emailService");
const mongoose = require("mongoose");

const doctorService = {
  /**
   * Registers a new doctor.
   * @param {object} doctorData - Data for doctor registration.
   * @returns {Promise<object>} The newly registered doctor's public profile.
   * @throws {Error} If user with email already exists.
   */
  registerDoctor: async (doctorData) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      specialization,
      experience,
      licenseNumber,
      consultationFee,
      address,
      education,
      certifications,
    } = doctorData;

    const existingUser = await User.findOne({
      email,
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const doctor = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: "doctor",
      isVerified: false,
      isActive: true,
      address,
      doctorInfo: {
        specialization,
        experience,
        licenseNumber,
        consultationFee,
        education: education || [],
        certifications: certifications || [],
      },
    });
    console.log("Admin email from ENV:", process.env.ADMIN_EMAIL);

    await doctor.save();

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Doctor Registration - Verification Required",
        template: "newDoctorRegistration",
        context: {
          name: `${firstName} ${lastName}`,
          email,
          specialization,
        },
      });
    } catch (err) {
      console.error("❌ Failed to send admin email:", err);
    }

    console.log("Sending registration email to:", process.env.ADMIN_EMAIL);

    return doctor.getPublicProfile();
  },

  /**
   * Updates a doctor's profile.
   * @param {string} doctorId - The ID of the doctor to update.
   * @param {object} updateData - Data to update the doctor profile.
   * @returns {Promise<object>} The updated doctor's public profile.
   */
  updateDoctorProfile: async (doctorId, updateData) => {
    const fieldsToUpdate = {};
    const allowedFields = [
      "specialization",
      "experience",
      "consultationFee",
      "education",
      "certifications",
      "availableSlots",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        fieldsToUpdate[`doctorInfo.${field}`] = updateData[field];
      }
    });

    const doctor = await User.findByIdAndUpdate(doctorId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return doctor.getPublicProfile();
  },

  /**
   * Uploads a certificate for a doctor.
   * @param {string} doctorId - The ID of the doctor.
   * @param {object} file - The uploaded file object.
   * @param {object} certificateInfo - Name, authority, issue date of the certificate.
   * @returns {Promise<object>} The uploaded certificate details and updated doctor profile.
   * @throws {Error} If no file is provided.
   */
  uploadDoctorCertificate: async (doctorId, file, certificateInfo) => {
    if (!file) {
      throw new Error("Please upload a certificate file");
    }

    const result = await uploadToCloudinary(file.path, "doctor-certificates");

    const certificate = {
      name: certificateInfo.certificateName || "Certificate",
      issuingAuthority: certificateInfo.issuingAuthority || "Unknown",
      issueDate: certificateInfo.issueDate || new Date(),
      certificateUrl: result.secure_url,
    };

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      {
        $push: {
          "doctorInfo.certifications": certificate,
        },
      },
      {
        new: true,
      }
    );

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return {
      certificate,
      doctor: doctor.getPublicProfile(),
    };
  },

  /**
   * Gets a list of doctors pending verification.
   * @param {object} pagination - Pagination parameters (page, limit).
   * @returns {Promise<object>} List of doctors and pagination info.
   */
  getDoctorsPendingVerification: async ({ page = 1, limit = 10 }) => {
    const doctors = await User.find({
      role: "doctor",
      isVerified: false,
      isActive: true,
    })
      .select("firstName lastName email phone doctorInfo createdAt")
      .sort({
        createdAt: -1,
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({
      role: "doctor",
      isVerified: false,
      isActive: true,
    });

    return {
      doctors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDoctors: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1,
      },
    };
  },

  /**
   * Verifies or rejects a doctor's account.
   * @param {string} doctorId - The ID of the doctor to verify.
   * @param {string} status - 'approved' or 'rejected'.
   * @param {string} reason - Optional reason for rejection.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {Promise<object>} The updated doctor's public profile.
   * @throws {Error} If doctor not found.
   */
  verifyDoctor: async (doctorId, status, reason, adminId) => {
    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    if (status === "approved") {
      doctor.isVerified = true;
      doctor.verifiedBy = adminId;
      doctor.verifiedAt = new Date();
      doctor.verificationRejectedReason = undefined; // Clear any previous rejection reason
    } else {
      doctor.isVerified = false;
      doctor.verificationRejectedReason = reason;
      doctor.verifiedBy = undefined; // Clear verified by if rejected
      doctor.verifiedAt = undefined; // Clear verified at if rejected
    }

    await doctor.save();

    await sendEmail({
      to: doctor.email,
      subject: `Doctor Verification ${
        status === "approved" ? "Approved" : "Rejected"
      } - Smart Healthcare Assistant`,
      template: "doctorVerification",
      context: {
        name: doctor.firstName,
        status,
        reason: reason || "No reason provided",
      },
    });

    return doctor.getPublicProfile();
  },

  /**
   * Gets a doctor's appointments.
   * @param {string} doctorId - The ID of the doctor.
   * @param {object} currentUser - The authenticated user.
   * @param {object} filters - Filters for appointments (status, date, page, limit).
   * @returns {Promise<object>} List of appointments and pagination info.
   * @throws {Error} If access denied.
   */
  getDoctorAppointments: async (doctorId, currentUser, filters) => {
    const { status, date, page = 1, limit = 10 } = filters;

    // Verify doctor owns this profile or is admin
    if (
      currentUser._id.toString() !== doctorId &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    const query = {
      doctor: doctorId,
    };

    if (status) {
      query.status = status;
    }
    if (date) {
      query.appointmentDate = {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName email phone")
      .sort({
        appointmentDate: -1,
        appointmentTime: -1,
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    return {
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1,
      },
    };
  },

  /**
   * Gets a doctor's schedule (available slots).
   * @param {string} doctorId - The ID of the doctor.
   * @param {object} currentUser - The authenticated user.
   * @returns {Promise<object>} Doctor's schedule and consultation fee.
   * @throws {Error} If access denied or doctor not found.
   */
  getDoctorSchedule: async (doctorId, currentUser) => {
    // Verify doctor owns this profile or is admin
    if (
      currentUser._id.toString() !== doctorId &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    const availableSlots = doctor.doctorInfo.availableSlots || [];

    return {
      doctorId,
      availableSlots,
      consultationFee: doctor.doctorInfo.consultationFee,
    };
  },

  /**
   * Updates a doctor's schedule.
   * @param {string} doctorId - The ID of the doctor.
   * @param {object[]} availableSlots - Array of new available slots.
   * @param {object} currentUser - The authenticated user.
   * @returns {Promise<object>} Updated available slots.
   * @throws {Error} If access denied.
   */
  updateDoctorSchedule: async (doctorId, availableSlots, currentUser) => {
    // Verify doctor owns this profile or is admin
    if (
      currentUser._id.toString() !== doctorId &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      {
        "doctorInfo.availableSlots": availableSlots,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return {
      availableSlots: doctor.doctorInfo.availableSlots,
    };
  },

  /**
   * Gets a doctor's statistics (appointments, prescriptions, revenue, patients).
   * @param {string} doctorId - The ID of the doctor.
   * @param {object} currentUser - The authenticated user.
   * @param {object} dateRange - Start and end dates for statistics.
   * @returns {Promise<object>} Doctor's statistics.
   * @throws {Error} If access denied.
   */
  getDoctorStatistics: async (doctorId, currentUser, dateRange) => {
    const { startDate, endDate } = dateRange;

    // Verify doctor owns this profile or is admin
    if (
      currentUser._id.toString() !== doctorId &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Get appointment statistics
    const appointmentStats = await Appointment.getStatistics(
      doctorId,
      start,
      end
    );

    // Get prescription statistics
    const prescriptionStats = await Prescription.getStatistics(
      doctorId,
      start,
      end
    );

    // Calculate total revenue
    const totalRevenue = appointmentStats.reduce(
      (sum, stat) => sum + (stat.totalRevenue || 0),
      0
    );

    // Get unique patient count
    const uniquePatients = await Appointment.distinct("patient", {
      doctor: doctorId,
      appointmentDate: {
        $gte: start,
        $lte: end,
      },
    });

    return {
      period: {
        start,
        end,
      },
      appointments: appointmentStats,
      prescriptions: prescriptionStats,
      totalRevenue,
      uniquePatients: uniquePatients.length,
    };
  },

  /**
   * Gets all available specializations from verified and active doctors.
   * @returns {Promise<object[]>} Array of specializations with counts.
   */
  getAllSpecializations: async () => {
    const specializations = await User.aggregate([
      {
        $match: {
          role: "doctor",
          isVerified: true,
          isActive: true,
        },
      },
      {
        $unwind: "$doctorInfo.specialization",
      },
      {
        $group: {
          _id: "$doctorInfo.specialization",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return specializations.map((spec) => ({
      name: spec._id,
      count: spec.count,
    }));
  },

  /**
   * Gets all verified and active doctors for patient appointment booking.
   * @returns {Promise<object[]>} Array of simplified doctor profiles.
   */
  getAllVerifiedDoctors: async () => {
    const doctors = await User.find({
      role: "doctor",
      isVerified: true,
      isActive: true,
    }).select("firstName lastName email doctorInfo consultationFee");

    return doctors.map((doc) => ({
      _id: doc._id,
      name: `${doc.firstName} ${doc.lastName}`,
      email: doc.email,

      fee:
        doc.doctorInfo && doc.doctorInfo.consultationFee
          ? doc.doctorInfo.consultationFee
          : 0,
      specialization:
        doc.doctorInfo && doc.doctorInfo.specialization
          ? doc.doctorInfo.specialization
          : [],
    }));
  },

  /**
   * Gets all unique patients for a specific doctor (current and previous).
   * @param {string} doctorId - The ID of the doctor.
   * @param {object} currentUser - The authenticated user.
   * @returns {Promise<object[]>} Array of patient profiles.
   * @throws {Error} If access denied.
   */
  getDoctorPatients: async (doctorId, currentUser) => {
    // Only allow the doctor themselves or admin to access
    if (
      currentUser._id.toString() !== doctorId &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Find all unique patient IDs for this doctor
    const patientIds = await Appointment.distinct("patient", {
      doctor: doctorId,
    });

    // Get patient details
    const patients = await User.find({
      _id: {
        $in: patientIds,
      },
    }).select("firstName lastName email phone patientInfo");

    return patients;
  },
};

module.exports = doctorService;
