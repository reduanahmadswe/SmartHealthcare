const PrescriptionService = require('./prescription.service');
const {
    validationResult
} = require('express-validator');
const {
    asyncHandler
} = require('../../middleware/errorHandler'); 


class PrescriptionController {
    static createPrescription = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const prescriptionData = req.body;
        const doctorId = req.user._id;

        const prescription = await PrescriptionService.createPrescription(prescriptionData, doctorId);

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            data: {
                prescription
            }
        });
    });

    static getPrescriptions = asyncHandler(async (req, res) => {
        const {
            status,
            page = 1,
            limit = 10
        } = req.query;
        const user = req.user;

        const result = await PrescriptionService.getPrescriptions(user, {
            status,
            page,
            limit
        });

        res.json({
            success: true,
            data: result
        });
    });

    static getPrescriptionById = asyncHandler(async (req, res) => {
        const prescriptionId = req.params.id;
        const userId = req.user._id;
        const userRole = req.user.role;

        const prescription = await PrescriptionService.getPrescriptionById(prescriptionId, userId, userRole);

        res.json({
            success: true,
            data: {
                prescription
            }
        });
    });

    static downloadPrescriptionPdf = asyncHandler(async (req, res) => {
        const prescriptionId = req.params.id;
        const userId = req.user._id;
        const userRole = req.user.role;

        const result = await PrescriptionService.downloadPrescriptionPdf(prescriptionId, userId, userRole);

        // In a real scenario, you might want to stream the PDF directly
        // For now, sending the URL as in the original code.
        res.json({
            success: true,
            data: result
        });
    });

    static updatePrescription = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const prescriptionId = req.params.id;
        const updateData = req.body;
        const doctorId = req.user._id;

        const updatedPrescription = await PrescriptionService.updatePrescription(prescriptionId, updateData, doctorId);

        res.json({
            success: true,
            message: 'Prescription updated successfully',
            data: {
                prescription: updatedPrescription
            }
        });
    });

    static verifyPrescriptionSignature = asyncHandler(async (req, res) => {
        const prescriptionId = req.params.id;

        const result = await PrescriptionService.verifyPrescriptionSignature(prescriptionId);

        res.json({
            success: true,
            data: result
        });
    });

    static getPrescriptionsForPatient = asyncHandler(async (req, res) => {
        const {
            patientId
        } = req.params;
        const {
            page = 1,
            limit = 10
        } = req.query;
        const reqUserId = req.user._id;
        const reqUserRole = req.user.role;

        const result = await PrescriptionService.getPrescriptionsForPatient(patientId, reqUserId, reqUserRole, {
            page,
            limit
        });

        res.json({
            success: true,
            data: result
        });
    });

    static getPrescriptionStatistics = asyncHandler(async (req, res) => {
        const {
            startDate,
            endDate
        } = req.query;
        const doctorId = req.user._id;

        const result = await PrescriptionService.getPrescriptionStatistics(doctorId, {
            startDate,
            endDate
        });

        res.json({
            success: true,
            data: result
        });
    });
}

module.exports = PrescriptionController;