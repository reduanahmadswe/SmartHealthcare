// const mongoose = require('mongoose');

// const prescriptionSchema = new mongoose.Schema({
//   patient: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: [true, 'Patient is required']
//   },
//   doctor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: [true, 'Doctor is required']
//   },
//   appointment: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Appointment',
//     required: [true, 'Appointment is required']
//   },
//   prescriptionDate: {
//     type: Date,
//     default: Date.now
//   },
//   prescriptionNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   diagnosis: {
//     primary: String,
//     secondary: [String],
//     icd10Codes: [String]
//   },
//   symptoms: [String],
//   clinicalNotes: String,
//   medications: [{
//     name: { type: String, required: true },
//     genericName: String,
//     dosage: {
//       amount: Number,
//       unit: String,
//       frequency: String,
//       duration: String
//     },
//     route: {
//       type: String,
//       enum: ['oral', 'topical', 'inhalation', 'injection', 'other'],
//       default: 'oral'
//     },
//     instructions: String,
//     quantity: {
//       amount: Number,
//       unit: String
//     },
//     isGeneric: { type: Boolean, default: false },
//     isControlled: { type: Boolean, default: false },
//     refills: { type: Number, default: 0, min: 0, max: 12 },
//     pharmacyNotes: String
//   }],
//   labTests: [{
//     testName: String,
//     testCode: String,
//     instructions: String,
//     fastingRequired: { type: Boolean, default: false },
//     specialInstructions: String
//   }],
//   lifestyleRecommendations: {
//     diet: [String],
//     exercise: [String],
//     lifestyle: [String],
//     restrictions: [String]
//   },
//   followUp: {
//     required: { type: Boolean, default: false },
//     date: Date,
//     type: {
//       type: String,
//       enum: ['in_person', 'video_call', 'phone_call'],
//       default: 'in_person'
//     },
//     reason: String
//   },
//   digitalSignature: {
//     doctorSignature: { type: String, required: true },
//     signatureDate: { type: Date, default: Date.now },
//     signatureHash: String,
//     certificateInfo: {
//       issuer: String,
//       validFrom: Date,
//       validTo: Date
//     }
//   },
//   status: {
//     type: String,
//     enum: ['draft', 'active', 'expired', 'cancelled'],
//     default: 'active'
//   },
//   isVerified: { type: Boolean, default: false },
//   verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   verifiedAt: Date,
//   pdfUrl: String,
//   pdfGeneratedAt: Date,
//   attachments: [{
//     name: String,
//     url: String,
//     type: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }],
//   patientInstructions: {
//     general: String,
//     medicationInstructions: String,
//     sideEffects: [String],
//     emergencyContact: String,
//     whenToSeekHelp: [String]
//   },
//   pharmacy: {
//     name: String,
//     address: String,
//     phone: String,
//     email: String,
//     notes: String
//   },
//   insurance: {
//     provider: String,
//     policyNumber: String,
//     groupNumber: String,
//     copay: Number
//   },
//   tags: [String],
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high', 'urgent'],
//     default: 'medium'
//   },
//   history: [{
//     action: {
//       type: String,
//       enum: ['created', 'modified', 'verified', 'cancelled', 'expired']
//     },
//     performedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     timestamp: { type: Date, default: Date.now },
//     notes: String
//   }]
// }, {
//   timestamps: true
// });

// // Indexes
// prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
// prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });
// prescriptionSchema.index({ status: 1 });
// prescriptionSchema.index({ 'medications.isControlled': 1 });

// // Export the schema for use in methods
// module.exports = mongoose.model('Prescription', prescriptionSchema);
