// D:\SmartHealthcare\backend\services\prescription.service.js
const Prescription = require('./prescription.model');
const Appointment = require('../appointment/appointment.model'); 
const {
    generatePrescriptionPDF
} = require('../../utils/pdfService');
const {
    sendEmail
} = require('../../utils/emailService');
const cloudinary = require('cloudinary').v2; 

// Helper functions (moved from route for better separation)
const generateSignatureHash = (signature) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(signature).digest('hex');
};

const verifyDigitalSignature = (signature, hash) => {
    const crypto = require('crypto');
    const calculatedHash = crypto.createHash('sha256').update(signature).digest('hex');
    return calculatedHash === hash;
};

const uploadPDFToCloudinary = async (pdfBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: folder,
            resource_type: 'raw',
            format: 'pdf'
        }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result.secure_url);
            }
        });
        uploadStream.end(pdfBuffer);
    });
};

class PrescriptionService {
    static async createPrescription(prescriptionData, doctorId) {
        const {
            appointmentId,
            diagnosis,
            symptoms,
            clinicalNotes,
            medications,
            labTests,
            lifestyleRecommendations,
            followUp,
            patientInstructions,
            digitalSignature
        } = prescriptionData;

        // Check if appointment exists and belongs to this doctor
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName');

        if (!appointment) {
            const error = new Error('Appointment not found');
            error.statusCode = 404;
            throw error;
        }

        if (appointment.doctor._id.toString() !== doctorId.toString()) {
            const error = new Error('Access denied. You can only create prescriptions for your appointments.');
            error.statusCode = 403;
            throw error;
        }

        // Create prescription
        const prescription = new Prescription({
            patient: appointment.patient._id,
            doctor: doctorId,
            appointment: appointmentId,
            diagnosis,
            symptoms,
            clinicalNotes,
            medications,
            labTests,
            lifestyleRecommendations,
            followUp,
            patientInstructions,
            digitalSignature: {
                ...digitalSignature,
                signatureDate: new Date(),
                signatureHash: generateSignatureHash(digitalSignature.doctorSignature)
            }
        });

        await prescription.save();

        // Update appointment with prescription
        appointment.prescription = prescription._id;
        await appointment.save();

        // Generate PDF
        const pdfBuffer = await generatePrescriptionPDF(prescription);
        const pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `prescriptions/${prescription.prescriptionNumber}`);

        // Update prescription with PDF URL
        prescription.pdfUrl = pdfUrl;
        prescription.pdfGeneratedAt = new Date();
        await prescription.save();

        // Send email to patient
        await sendEmail({
            to: appointment.patient.email,
            subject: 'Prescription Ready - Smart Healthcare Assistant',
            template: 'prescriptionReady',
            context: {
                patientName: appointment.patient.firstName,
                doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                prescriptionNumber: prescription.prescriptionNumber,
                prescriptionDate: prescription.prescriptionDate,
                medicationCount: prescription.medications.length,
                downloadUrl: pdfUrl
            }
        });

        return prescription;
    }

    static async getPrescriptions(user, {
        status,
        page,
        limit
    }) {
        const query = {};

        // Filter by user role
        if (user.role === 'patient') {
            query.patient = user._id;
        } else if (user.role === 'doctor') {
            query.doctor = user._id;
        }

        if (status) {
            query.status = status;
        }

        const prescriptions = await Prescription.find(query)
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .populate('appointment', 'appointmentDate appointmentTime')
            .sort({
                prescriptionDate: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Prescription.countDocuments(query);

        return {
            prescriptions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPrescriptions: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    }

    static async getPrescriptionById(prescriptionId, userId, userRole) {
        const prescription = await Prescription.findById(prescriptionId)
            .populate('patient', 'firstName lastName email phone patientInfo')
            .populate('doctor', 'firstName lastName email phone doctorInfo')
            .populate('appointment', 'appointmentDate appointmentTime symptoms');

        if (!prescription) {
            const error = new Error('Prescription not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if user has access to this prescription
        const isPatient = prescription.patient._id.toString() === userId.toString();
        const isDoctor = prescription.doctor._id.toString() === userId.toString();
        const isAdmin = userRole === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            const error = new Error('Access denied');
            error.statusCode = 403;
            throw error;
        }

        return prescription;
    }

    static async downloadPrescriptionPdf(prescriptionId, userId, userRole) {
        const prescription = await Prescription.findById(prescriptionId)
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName');

        if (!prescription) {
            const error = new Error('Prescription not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if user has access to this prescription
        const isPatient = prescription.patient._id.toString() === userId.toString();
        const isDoctor = prescription.doctor._id.toString() === userId.toString();
        const isAdmin = userRole === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            const error = new Error('Access denied');
            error.statusCode = 403;
            throw error;
        }

        if (!prescription.pdfUrl) {
            const error = new Error('PDF not available');
            error.statusCode = 404;
            throw error;
        }

        return {
            pdfUrl: prescription.pdfUrl,
            prescriptionNumber: prescription.prescriptionNumber
        };
    }

    static async updatePrescription(prescriptionId, updateData, doctorId) {
        const prescription = await Prescription.findById(prescriptionId);

        if (!prescription) {
            const error = new Error('Prescription not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if doctor owns this prescription
        if (prescription.doctor.toString() !== doctorId.toString()) {
            const error = new Error('Access denied');
            error.statusCode = 403;
            throw error;
        }

        const allowedFields = ['diagnosis', 'medications', 'clinicalNotes', 'patientInstructions', 'labTests', 'lifestyleRecommendations', 'followUp', 'pharmacy', 'insurance', 'tags', 'priority', 'status'];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                prescription[field] = updateData[field];
            }
        }

        // Regenerate PDF if medications or other relevant fields changed
        if (updateData.medications || updateData.diagnosis || updateData.clinicalNotes || updateData.patientInstructions || updateData.labTests || updateData.lifestyleRecommendations) {
            const pdfBuffer = await generatePrescriptionPDF(prescription);
            const pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `prescriptions/${prescription.prescriptionNumber}`);

            prescription.pdfUrl = pdfUrl;
            prescription.pdfGeneratedAt = new Date();
        }

        await prescription.save();
        return prescription;
    }

    static async verifyPrescriptionSignature(prescriptionId) {
        const prescription = await Prescription.findById(prescriptionId);

        if (!prescription) {
            const error = new Error('Prescription not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify digital signature
        const isValidSignature = verifyDigitalSignature(
            prescription.digitalSignature.doctorSignature,
            prescription.digitalSignature.signatureHash
        );

        return {
            isValidSignature,
            signatureDate: prescription.digitalSignature.signatureDate,
            prescriptionNumber: prescription.prescriptionNumber
        };
    }

    static async getPrescriptionsForPatient(patientId, reqUserId, reqUserRole, {
        page,
        limit
    }) {
        const query = {
            patient: patientId
        };

        // If doctor, only show their prescriptions for this patient
        if (reqUserRole === 'doctor' && patientId.toString() !== reqUserId.toString()) {
            query.doctor = reqUserId;
        } else if (reqUserRole === 'patient' && patientId.toString() !== reqUserId.toString()) {
            const error = new Error('Access denied. You can only view your own prescriptions.');
            error.statusCode = 403;
            throw error;
        }

        const prescriptions = await Prescription.find(query)
            .populate('doctor', 'firstName lastName')
            .populate('appointment', 'appointmentDate appointmentTime')
            .sort({
                prescriptionDate: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Prescription.countDocuments(query);

        return {
            prescriptions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPrescriptions: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    }

    static async getPrescriptionStatistics(doctorId, {
        startDate,
        endDate
    }) {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();

        const stats = await Prescription.getStatistics(doctorId, start, end);

        return {
            period: {
                start,
                end
            },
            statistics: stats
        };
    }
}

module.exports = PrescriptionService;