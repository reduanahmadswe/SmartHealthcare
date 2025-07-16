// user/user.interface.js

exports.getPublicProfile = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationExpire;
  delete userObj.loginHistory;
  return userObj;
};
