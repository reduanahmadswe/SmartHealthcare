// user/user.service.js
const User = require('./user.model');

exports.findUserById = (id) => User.findById(id);

exports.updateUserById = (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true, runValidators: true });

exports.softDeleteUser = async (id) => {
  const user = await User.findById(id);
  user.isActive = false;
  return user.save();
};

exports.findDoctors = (query, limit, skip, sortOptions) =>
  User.find(query)
    .select('firstName lastName email phone address doctorInfo profilePicture')
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);

exports.countDoctors = (query) => User.countDocuments(query);

exports.findDoctorById = (id) =>
  User.findOne({ _id: id, role: 'doctor', isVerified: true, isActive: true })
    .select('-password -loginHistory');
