const { validationResult } = require('express-validator');
const medicalRecordService = require('./medicalRecord.service'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 

const medicalRecordController = {
    uploadRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // req.file is populated by multer middleware
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please include a file for the medical record.'
            });
        }

        // Parse JSON fields from form-data if present
        const recordData = { ...req.body };
        if (recordData.vitals) recordData.vitals = JSON.parse(recordData.vitals);
        if (recordData.testResults) recordData.testResults = JSON.parse(recordData.testResults);
        if (recordData.diagnosis) recordData.diagnosis = JSON.parse(recordData.diagnosis);
        if (recordData.medications) recordData.medications = JSON.parse(recordData.medications);
        if (recordData.procedures) recordData.procedures = JSON.parse(recordData.procedures);
        if (recordData.allergies) recordData.allergies = JSON.parse(recordData.allergies);
        if (recordData.familyHistory) recordData.familyHistory = JSON.parse(recordData.familyHistory);

        const medicalRecord = await medicalRecordService.uploadRecord(recordData, req.file, req.user);

        res.status(201).json({
            success: true,
            message: 'Medical record uploaded successfully',
            data: {
                medicalRecord
            }
        });
    }),

    getRecords: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { medicalRecords, pagination } = await medicalRecordService.getRecords(req.query, req.user);

        res.json({
            success: true,
            data: {
                medicalRecords,
                pagination
            }
        });
    }),

    getPatientRecordsForPatient: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        // This route is specifically for a patient to get their own records
        // Filters will be applied by the service based on req.user._id
        const { medicalRecords, pagination } = await medicalRecordService.getRecords(req.query, req.user);

        res.json({
            success: true,
            data: {
                medicalRecords,
                pagination
            }
        });
    }),

    getRecordById: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const medicalRecord = await medicalRecordService.getRecordById(req.params.id, req.user);

        res.json({
            success: true,
            data: {
                medicalRecord
            }
        });
    }),

    updateRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const updatedRecord = await medicalRecordService.updateRecord(req.params.id, req.body, req.user);

        res.json({
            success: true,
            message: 'Medical record updated successfully',
            data: {
                medicalRecord: updatedRecord
            }
        });
    }),

    deleteRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        await medicalRecordService.deleteRecord(req.params.id, req.user);

        res.json({
            success: true,
            message: 'Medical record deleted successfully'
        });
    }),

    shareRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { doctorId, permission } = req.body;
        const { medicalRecord } = await medicalRecordService.shareRecordWithDoctor(req.params.id, doctorId, permission, req.user);

        res.json({
            success: true,
            message: 'Medical record shared successfully',
            data: {
                sharedWith: medicalRecord.sharedWith.find(s => s.doctor.toString() === doctorId) // Return the relevant share entry
            }
        });
    }),

    unshareRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        await medicalRecordService.unshareRecordWithDoctor(req.params.id, req.params.doctorId, req.user);

        res.json({
            success: true,
            message: 'Access removed successfully'
        });
    }),

    downloadRecord: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { pdfUrl, recordTitle, recordType } = await medicalRecordService.downloadRecord(req.params.id, req.user);

        res.json({
            success: true,
            data: {
                pdfUrl,
                recordTitle,
                recordType
            }
        });
    }),

    getPatientRecordsByDoctor: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { medicalRecords, pagination } = await medicalRecordService.getPatientRecordsByDoctor(req.params.patientId, req.query, req.user);

        res.json({
            success: true,
            data: {
                medicalRecords,
                pagination
            }
        });
    }),

    getMedicalRecordStatistics: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const statsData = await medicalRecordService.getMedicalRecordStatistics(req.query, req.user);

        res.json({
            success: true,
            data: statsData
        });
    })
};

module.exports = medicalRecordController;