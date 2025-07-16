// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   // Basic Information
//   firstName: {
//     type: String,
//     required: [true, 'First name is required'],
//     trim: true,
//     maxlength: [50, 'First name cannot exceed 50 characters']
//   },
//   lastName: {
//     type: String,
//     required: [true, 'Last name is required'],
//     trim: true,
//     maxlength: [50, 'Last name cannot exceed 50 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters'],
//     select: false
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
//   },
//   dateOfBirth: {
//     type: Date,
//     required: [true, 'Date of birth is required']
//   },
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other'],
//     required: [true, 'Gender is required']
//   },
//   profilePicture: {
//     type: String,
//     default: ''
//   },

//   // Role and Status
//   role: {
//     type: String,
//     enum: ['patient', 'doctor', 'admin'],
//     default: 'patient'
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },

//   // Address Information
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     zipCode: String,
//     country: {
//       type: String,
//       default: 'Bangladesh'
//     }
//   },

//   // Emergency Contact
//   emergencyContact: {
//     name: String,
//     relationship: String,
//     phone: String,
//     email: String
//   },

//   // Patient-specific fields
//   patientInfo: {
//     bloodGroup: {
//       type: String,
//       enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
//     },
//     height: Number, // in cm
//     weight: Number, // in kg
//     allergies: [String],
//     chronicDiseases: [String],
//     currentMedications: [String],
//     familyHistory: [String]
//   },

//   // Doctor-specific fields
//   doctorInfo: {
//     specialization: [String],
//     experience: Number, // in years
//     licenseNumber: String,
//     education: [{
//       degree: String,
//       institution: String,
//       year: Number
//     }],
//     certifications: [{
//       name: String,
//       issuingAuthority: String,
//       issueDate: Date,
//       expiryDate: Date,
//       certificateUrl: String
//     }],
//     consultationFee: {
//       type: Number,
//       default: 500
//     },
//     availableSlots: [{
//       day: {
//         type: String,
//         enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
//       },
//       startTime: String,
//       endTime: String,
//       isAvailable: {
//         type: Boolean,
//         default: true
//       }
//     }],
//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5
//     },
//     totalReviews: {
//       type: Number,
//       default: 0
//     }
//   },

//   // Admin-specific fields
//   adminInfo: {
//     permissions: [{
//       type: String,
//       enum: ['user_management', 'doctor_verification', 'analytics', 'inventory', 'logs']
//     }],
//     department: String
//   },

//   // Account settings
//   preferences: {
//     language: {
//       type: String,
//       default: 'en',
//       enum: ['en', 'bn', 'hi']
//     },
//     notifications: {
//       email: { type: Boolean, default: true },
//       sms: { type: Boolean, default: true },
//       push: { type: Boolean, default: true }
//     },
//     theme: {
//       type: String,
//       default: 'light',
//       enum: ['light', 'dark']
//     }
//   },

//   // Security and verification
//   emailVerified: {
//     type: Boolean,
//     default: false
//   },
//   phoneVerified: {
//     type: Boolean,
//     default: false
//   },
//   resetPasswordToken: String,
//   resetPasswordExpire: Date,
//   emailVerificationToken: String,
//   emailVerificationExpire: Date,

//   // Timestamps
//   lastLogin: Date,
//   loginHistory: [{
//     timestamp: Date,
//     ip: String,
//     userAgent: String
//   }]
// }, {
//   timestamps: true
// });

// // Indexes for better performance

// userSchema.index({ role: 1 });
// userSchema.index({ isVerified: 1 });
// userSchema.index({ 'doctorInfo.specialization': 1 });

// // Virtual for full name
// userSchema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });

// // Virtual for age
// userSchema.virtual('age').get(function() {
//   if (!this.dateOfBirth) return null;
//   const today = new Date();
//   const birthDate = new Date(this.dateOfBirth);
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const monthDiff = today.getMonth() - birthDate.getMonth();
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//     age--;
//   }
//   return age;
// });

// // Pre-save middleware to hash password
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare password
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Method to get public profile (without sensitive data)
// userSchema.methods.getPublicProfile = function() {
//   const userObject = this.toObject();
//   delete userObject.password;
//   delete userObject.resetPasswordToken;
//   delete userObject.resetPasswordExpire;
//   delete userObject.emailVerificationToken;
//   delete userObject.emailVerificationExpire;
//   delete userObject.loginHistory;
//   return userObject;
// };

// // Method to update last login
// userSchema.methods.updateLastLogin = function(ip, userAgent) {
//   this.lastLogin = new Date();
//   this.loginHistory.push({
//     timestamp: new Date(),
//     ip: ip,
//     userAgent: userAgent
//   });
  
//   // Keep only last 10 login records
//   if (this.loginHistory.length > 10) {
//     this.loginHistory = this.loginHistory.slice(-10);
//   }
  
//   return this.save();
// };

// module.exports = mongoose.model('User', userSchema); 