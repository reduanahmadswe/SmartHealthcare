// const Prescription = require('./prescription.model');
// const mongoose = require('mongoose');

// // Virtual: totalMedications
// Prescription.schema.virtual('totalMedications').get(function () {
//   return this.medications ? this.medications.length : 0;
// });

// // Virtual: controlledMedications
// Prescription.schema.virtual('controlledMedications').get(function () {
//   return this.medications ? this.medications.filter(med => med.isControlled) : [];
// });

// // Virtual: ageInDays
// Prescription.schema.virtual('ageInDays').get(function () {
//   const now = new Date();
//   const diff = Math.abs(now - new Date(this.prescriptionDate));
//   return Math.ceil(diff / (1000 * 60 * 60 * 24));
// });

// // Pre-save: Generate unique prescriptionNumber
// Prescription.schema.pre('save', async function (next) {
//   if (this.isNew && !this.prescriptionNumber) {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');

//     const start = new Date(date.setHours(0, 0, 0, 0));
//     const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

//     const count = await Prescription.countDocuments({
//       prescriptionDate: { $gte: start, $lt: end }
//     });

//     this.prescriptionNumber = `RX${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// // Instance Method: isExpired
// Prescription.schema.methods.isExpired = function () {
//   const expiration = new Date(this.prescriptionDate);
//   expiration.setMonth(expiration.getMonth() + 6);
//   return new Date() > expiration;
// };

// // Instance Method: getSummary
// Prescription.schema.methods.getSummary = function () {
//   return {
//     prescriptionNumber: this.prescriptionNumber,
//     patientName: this.patient,
//     doctorName: this.doctor,
//     prescriptionDate: this.prescriptionDate,
//     diagnosis: this.diagnosis.primary,
//     medicationCount: this.totalMedications,
//     status: this.status,
//     isExpired: this.isExpired()
//   };
// };

// // Instance Method: addToHistory
// Prescription.schema.methods.addToHistory = function (action, performedBy, notes = '') {
//   this.history.push({
//     action,
//     performedBy,
//     notes,
//     timestamp: new Date()
//   });
//   return this.save();
// };

// // Static Method: getStatistics
// Prescription.schema.statics.getStatistics = async function (doctorId, startDate, endDate) {
//   const stats = await this.aggregate([
//     {
//       $match: {
//         doctor: new mongoose.Types.ObjectId(doctorId),
//         prescriptionDate: { $gte: startDate, $lte: endDate }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalPrescriptions: { $sum: 1 },
//         totalMedications: { $sum: { $size: '$medications' } },
//         controlledMedications: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: '$medications',
//                 cond: { $eq: ['$$this.isControlled', true] }
//               }
//             }
//           }
//         }
//       }
//     }
//   ]);

//   return stats[0] || { totalPrescriptions: 0, totalMedications: 0, controlledMedications: 0 };
// };

// module.exports = Prescription;
