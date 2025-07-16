// user/user.controller.js
const User = require('./user.model');
const { getPublicProfile } = require('./user.interface');
const {
  findUserById,
  updateUserById,
  findDoctors,
  countDoctors,
  findDoctorById,
  softDeleteUser
} = require('./user.service');

const { uploadToCloudinary } = require('../../utils/cloudinaryService');


exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('doctorInfo.specialization')
    .populate('adminInfo.permissions');
  res.json({ success: true, data: { user: getPublicProfile(user) } });
};

exports.updateProfile = async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'preferences'];
  const updateData = {};
  allowedFields.forEach(f => req.body[f] !== undefined && (updateData[f] = req.body[f]));

  const user = await updateUserById(req.user._id, updateData);
  res.json({ success: true, message: 'Profile updated', data: { user: getPublicProfile(user) } });
};

exports.uploadProfilePicture = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const result = await uploadToCloudinary(req.file.path, 'profile-pictures');
  const user = await updateUserById(req.user._id, { profilePicture: result.secure_url });
  res.json({ success: true, message: 'Profile picture updated', data: { profilePicture: result.secure_url, user: getPublicProfile(user) } });
};

exports.getHealthData = async (req, res) => {
  const user = await findUserById(req.user._id);
  res.json({ success: true, data: { healthData: user.patientInfo } });
};

exports.updateHealthData = async (req, res) => {
  const updateData = {};
  [
    'bloodGroup', 'height', 'weight',
    'allergies', 'chronicDiseases',
    'currentMedications', 'familyHistory'
  ].forEach(f => req.body[f] !== undefined && (updateData[`patientInfo.${f}`] = req.body[f]));

  const user = await updateUserById(req.user._id, updateData);
  res.json({ success: true, message: 'Health data updated', data: { healthData: user.patientInfo } });
};

exports.getAllDoctors = async (req, res) => {
  const { specialization, city, rating, experience, page = 1, limit = 10, sortBy = 'rating', sortOrder = 'desc' } = req.query;
  const query = { role: 'doctor', isVerified: true, isActive: true };
  if (specialization) query['doctorInfo.specialization'] = { $in: [specialization] };
  if (city) query['address.city'] = { $regex: city, $options: 'i' };
  if (rating) query['doctorInfo.rating'] = { $gte: parseFloat(rating) };
  if (experience) query['doctorInfo.experience'] = { $gte: parseInt(experience) };

  const sortOptions = { [`doctorInfo.${sortBy}`]: sortOrder === 'desc' ? -1 : 1 };
  const doctors = await findDoctors(query, limit * 1, (page - 1) * limit, sortOptions);
  const total = await countDoctors(query);

  res.json({
    success: true,
    data: {
      doctors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDoctors: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
};

exports.getDoctorById = async (req, res) => {
  const doctor = await findDoctorById(req.params.id);
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
  res.json({ success: true, data: { doctor: getPublicProfile(doctor) } });
};

exports.getDoctorSchedule = async (req, res) => {
  const { date } = req.query;
  const doctor = await findDoctorById(req.params.id);
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

  const slots = doctor.doctorInfo.availableSlots || [];
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const available = slots.filter(slot => slot.day === dayOfWeek && slot.isAvailable);

  res.json({
    success: true,
    data: {
      doctorId: doctor._id,
      date,
      availableSlots: available,
      consultationFee: doctor.doctorInfo.consultationFee
    }
  });
};

exports.updatePreferences = async (req, res) => {
  const updateData = {};
  ['language', 'theme', 'notifications'].forEach(f => req.body[f] !== undefined && (updateData[`preferences.${f}`] = req.body[f]));
  const user = await updateUserById(req.user._id, updateData);
  res.json({ success: true, message: 'Preferences updated', data: { preferences: user.preferences } });
};

exports.deactivateAccount = async (req, res) => {
  await softDeleteUser(req.user._id);
  res.json({ success: true, message: 'Account deactivated' });
};

exports.verifyPhone = async (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await updateUserById(req.user._id, {
    phone,
    phoneVerificationCode: code,
    phoneVerificationExpire: Date.now() + 10 * 60 * 1000
  });
  res.json({ success: true, message: 'Verification code sent' });
};

exports.confirmPhone = async (req, res) => {
  const { code } = req.body;
  const user = await findUserById(req.user._id);
  if (!user.phoneVerificationCode || user.phoneVerificationCode !== code || user.phoneVerificationExpire < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
  }
  user.phoneVerified = true;
  user.phoneVerificationCode = undefined;
  user.phoneVerificationExpire = undefined;
  await user.save();
  res.json({ success: true, message: 'Phone number verified' });
};
