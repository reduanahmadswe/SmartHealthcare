// const mongoose = require('mongoose');

// const labTestSchema = new mongoose.Schema({
//   // Basic Information
//   patient: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: [true, 'Patient is required']
//   },
//   doctor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   appointment: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Appointment'
//   },
  
//   // Test Details
//   testName: {
//     type: String,
//     required: [true, 'Test name is required']
//   },
//   testCode: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   testCategory: {
//     type: String,
//     enum: [
//       'blood_test',
//       'urine_test',
//       'stool_test',
//       'x_ray',
//       'mri_scan',
//       'ct_scan',
//       'ultrasound',
//       'ecg',
//       'echocardiogram',
//       'endoscopy',
//       'biopsy',
//       'culture_test',
//       'genetic_test',
//       'allergy_test',
//       'hormone_test',
//       'other'
//     ],
//     required: [true, 'Test category is required']
//   },
  
//   // Test Information
//   description: String,
//   instructions: {
//     preparation: [String],
//     fasting: {
//       required: {
//         type: Boolean,
//         default: false
//       },
//       duration: String // e.g., "8 hours", "12 hours"
//     },
//     specialInstructions: [String],
//     medications: [String], // medications to avoid
//     restrictions: [String]
//   },
  
//   // Booking Details
//   bookingDate: {
//     type: Date,
//     required: [true, 'Booking date is required']
//   },
//   scheduledDate: {
//     type: Date,
//     required: [true, 'Scheduled date is required']
//   },
//   scheduledTime: String,
  
//   // Lab Information
//   lab: {
//     name: {
//       type: String,
//       required: [true, 'Lab name is required']
//     },
//     address: {
//       street: String,
//       city: String,
//       state: String,
//       zipCode: String,
//       country: {
//         type: String,
//         default: 'Bangladesh'
//       }
//     },
//     phone: String,
//     email: String,
//     website: String,
//     operatingHours: {
//       monday: { open: String, close: String },
//       tuesday: { open: String, close: String },
//       wednesday: { open: String, close: String },
//       thursday: { open: String, close: String },
//       friday: { open: String, close: String },
//       saturday: { open: String, close: String },
//       sunday: { open: String, close: String }
//     }
//   },
  
//   // Status and Progress
//   status: {
//     type: String,
//     enum: ['booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
//     default: 'booked'
//   },
  
//   // Test Parameters
//   parameters: [{
//     name: String,
//     code: String,
//     unit: String,
//     normalRange: {
//       min: Number,
//       max: Number,
//       gender: {
//         type: String,
//         enum: ['male', 'female', 'both']
//       },
//       ageRange: {
//         min: Number,
//         max: Number
//       }
//     },
//     isCritical: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Results
//   results: [{
//     parameter: {
//       type: String,
//       required: true
//     },
//     value: {
//       type: String,
//       required: true
//     },
//     unit: String,
//     normalRange: String,
//     isAbnormal: {
//       type: Boolean,
//       default: false
//     },
//     isCritical: {
//       type: Boolean,
//       default: false
//     },
//     notes: String,
//     reviewedBy: String,
//     reviewedAt: Date
//   }],
  
//   // Result Files
//   resultFiles: [{
//     name: String,
//     url: String,
//     type: {
//       type: String,
//       enum: ['report', 'image', 'document']
//     },
//     uploadedAt: {
//       type: Date,
//       default: Date.now
//     },
//     isPrimary: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Payment Information
//   cost: {
//     amount: {
//       type: Number,
//       required: [true, 'Test cost is required']
//     },
//     currency: {
//       type: String,
//       default: 'BDT'
//     },
//     discount: {
//       type: Number,
//       default: 0
//     },
//     finalAmount: Number
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'refunded', 'failed'],
//     default: 'pending'
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cash', 'card', 'mobile_banking', 'insurance'],
//     default: 'cash'
//   },
//   transactionId: String,
  
//   // Insurance
//   insurance: {
//     provider: String,
//     policyNumber: String,
//     coverage: Number, // percentage covered
//     claimNumber: String,
//     status: {
//       type: String,
//       enum: ['pending', 'approved', 'rejected', 'paid'],
//       default: 'pending'
//     }
//   },
  
//   // Timing
//   estimatedDuration: Number, // in minutes
//   actualDuration: Number, // in minutes
//   completedAt: Date,
//   resultReadyAt: Date,
  
//   // Notifications
//   notifications: [{
//     type: {
//       type: String,
//       enum: ['booking_confirmation', 'reminder', 'result_ready', 'cancellation']
//     },
//     message: String,
//     sentAt: {
//       type: Date,
//       default: Date.now
//     },
//     isRead: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Cancellation/Reschedule
//   cancellationReason: String,
//   cancelledBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   cancelledAt: Date,
  
//   rescheduledFrom: {
//     date: Date,
//     time: String
//   },
//   rescheduledBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   rescheduledAt: Date,
  
//   // Comments and Notes
//   comments: [{
//     author: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     comment: String,
//     timestamp: {
//       type: Date,
//       default: Date.now
//     },
//     isPrivate: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Priority and Urgency
//   priority: {
//     type: String,
//     enum: ['routine', 'urgent', 'emergency'],
//     default: 'routine'
//   },
//   isEmergency: {
//     type: Boolean,
//     default: false
//   },
  
//   // Metadata
//   tags: [String],
//   referenceNumber: String,
//   externalLabId: String // for integration with external lab systems
// }, {
//   timestamps: true
// });

// // Indexes for better performance
// labTestSchema.index({ patient: 1, scheduledDate: -1 });
// labTestSchema.index({ doctor: 1, scheduledDate: -1 });
// labTestSchema.index({ status: 1 });
// labTestSchema.index({ 'lab.name': 1 });
// labTestSchema.index({ priority: 1 });

// // Generate test code
// labTestSchema.pre('save', async function(next) {
//   if (this.isNew && !this.testCode) {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
    
//     // Get count of tests for today
//     const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
//     const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
//     const count = await this.constructor.countDocuments({
//       bookingDate: { $gte: todayStart, $lt: todayEnd }
//     });
    
//     this.testCode = `LT${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
//   }
  
//   // Calculate final amount
//   if (this.cost.amount && this.cost.discount) {
//     this.cost.finalAmount = this.cost.amount - (this.cost.amount * this.cost.discount / 100);
//   } else {
//     this.cost.finalAmount = this.cost.amount;
//   }
  
//   next();
// });

// // Virtual for test duration
// labTestSchema.virtual('duration').get(function() {
//   return this.actualDuration || this.estimatedDuration;
// });

// // Virtual for is overdue
// labTestSchema.virtual('isOverdue').get(function() {
//   if (this.status !== 'completed' && this.scheduledDate) {
//     const now = new Date();
//     const scheduledDateTime = new Date(this.scheduledDate);
//     if (this.scheduledTime) {
//       const [hours, minutes] = this.scheduledTime.split(':').map(Number);
//       scheduledDateTime.setHours(hours, minutes, 0, 0);
//     }
//     return now > scheduledDateTime;
//   }
//   return false;
// });

// // Virtual for abnormal results count
// labTestSchema.virtual('abnormalResultsCount').get(function() {
//   if (!this.results) return 0;
//   return this.results.filter(result => result.isAbnormal).length;
// });

// // Virtual for critical results count
// labTestSchema.virtual('criticalResultsCount').get(function() {
//   if (!this.results) return 0;
//   return this.results.filter(result => result.isCritical).length;
// });

// // Method to add result
// labTestSchema.methods.addResult = function(resultData) {
//   this.results.push(resultData);
//   return this.save();
// };

// // Method to add result file
// labTestSchema.methods.addResultFile = function(fileData) {
//   this.resultFiles.push(fileData);
//   return this.save();
// };

// // Method to add comment
// labTestSchema.methods.addComment = function(author, comment, isPrivate = false) {
//   this.comments.push({
//     author,
//     comment,
//     isPrivate,
//     timestamp: new Date()
//   });
//   return this.save();
// };

// // Method to add notification
// labTestSchema.methods.addNotification = function(type, message) {
//   this.notifications.push({
//     type,
//     message,
//     sentAt: new Date()
//   });
//   return this.save();
// };

// // Method to check if results are ready
// labTestSchema.methods.areResultsReady = function() {
//   return this.status === 'completed' && this.resultFiles.length > 0;
// };

// // Method to get abnormal results
// labTestSchema.methods.getAbnormalResults = function() {
//   if (!this.results) return [];
//   return this.results.filter(result => result.isAbnormal);
// };

// // Method to get critical results
// labTestSchema.methods.getCriticalResults = function() {
//   if (!this.results) return [];
//   return this.results.filter(result => result.isCritical);
// };

// // Static method to get test statistics
// labTestSchema.statics.getStatistics = async function(patientId, startDate, endDate) {
//   const stats = await this.aggregate([
//     {
//       $match: {
//         patient: mongoose.Types.ObjectId(patientId),
//         scheduledDate: { $gte: startDate, $lte: endDate }
//       }
//     },
//     {
//       $group: {
//         _id: '$status',
//         count: { $sum: 1 },
//         totalCost: { $sum: '$cost.finalAmount' }
//       }
//     }
//   ]);
  
//   return stats;
// };

// // Static method to get available tests
// labTestSchema.statics.getAvailableTests = async function() {
//   const tests = await this.aggregate([
//     {
//       $group: {
//         _id: {
//           testName: '$testName',
//           testCategory: '$testCategory',
//           cost: '$cost.amount'
//         },
//         count: { $sum: 1 }
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         testName: '$_id.testName',
//         testCategory: '$_id.testCategory',
//         cost: '$_id.cost',
//         count: 1
//       }
//     },
//     {
//       $sort: { testName: 1 }
//     }
//   ]);
  
//   return tests;
// };

// module.exports = mongoose.model('LabTest', labTestSchema); 