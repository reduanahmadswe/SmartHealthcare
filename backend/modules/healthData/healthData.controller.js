const { validationResult } = require('express-validator');
const healthDataService = require('./healthData.service'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 

const healthDataController = {
    addHealthData: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const newHealthData = await healthDataService.addHealthData(req.body, req.user);

        res.status(201).json({
            success: true,
            message: 'Health data added successfully',
            data: newHealthData
        });
    }),

    getHealthData: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const {
            healthData,
            pagination
        } = await healthDataService.getHealthData(userId, req.user, req.query);

        res.json({
            success: true,
            data: {
                healthData,
                pagination
            }
        });
    }),

    getLatestHealthData: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const latestHealthData = await healthDataService.getLatestHealthData(userId, req.user);

        res.json({
            success: true,
            data: latestHealthData
        });
    }),

    getVitalsHistory: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { days } = req.query; // days parameter for history range
        const vitalsHistoryData = await healthDataService.getVitalsHistory(userId, req.user, parseInt(days));

        res.json({
            success: true,
            data: vitalsHistoryData
        });
    }),

    getAbnormalHealthData: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const {
            abnormalData,
            pagination
        } = await healthDataService.getAbnormalHealthData(userId, req.user, req.query);

        res.json({
            success: true,
            data: {
                abnormalData,
                pagination
            }
        });
    }),

    updateHealthData: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updatedHealthData = await healthDataService.updateHealthData(id, req.body, req.user);

        res.json({
            success: true,
            message: 'Health data updated successfully',
            data: updatedHealthData
        });
    }),

    deleteHealthData: asyncHandler(async (req, res) => {
        const { id } = req.params;
        await healthDataService.deleteHealthData(id, req.user);

        res.json({
            success: true,
            message: 'Health data deleted successfully'
        });
    })
};

module.exports = healthDataController;