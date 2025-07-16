
const { validationResult } = require('express-validator');
const inventoryService = require('./inventory.service');
const { asyncHandler } = require('../../middleware/errorHandler');

const inventoryController = {
    addItem: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const newItem = await inventoryService.addItem(req.body, req.user._id);

        res.status(201).json({
            success: true,
            message: 'Inventory item added successfully',
            data: newItem
        });
    }),

    getInventoryList: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { inventory, pagination } = await inventoryService.getInventoryList(req.query);

        res.json({
            success: true,
            data: {
                inventory,
                pagination
            }
        });
    }),

    getInventorySummary: asyncHandler(async (req, res) => {
        const summaryData = await inventoryService.getInventorySummary(req.query.expiringDays);

        res.json({
            success: true,
            data: summaryData
        });
    }),

    getItemById: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const item = await inventoryService.getItemById(req.params.id);

        res.json({
            success: true,
            data: item
        });
    }),

    updateItem: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const updatedItem = await inventoryService.updateItem(req.params.id, req.body, req.user._id);

        res.json({
            success: true,
            message: 'Inventory item updated successfully',
            data: updatedItem
        });
    }),

    updateItemStock: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { quantity, type } = req.body;
        const updatedItem = await inventoryService.updateItemStock(req.params.id, quantity, type, req.user._id);

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: updatedItem
        });
    }),

    deleteItem: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        await inventoryService.deleteItem(req.params.id);

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    }),

    getLowStockAlerts: asyncHandler(async (req, res) => {
        const alerts = await inventoryService.getLowStockAlerts();

        res.json({
            success: true,
            data: alerts
        });
    }),

    getExpiringAlerts: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { days } = req.query;
        const alerts = await inventoryService.getExpiringAlerts(days);

        res.json({
            success: true,
            data: alerts
        });
    }),

    bulkUpdateInventory: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { items } = req.body;
        const results = await inventoryService.bulkUpdateInventory(items, req.user._id);

        // Determine status code based on partial success or complete failure
        const successCount = results.summary.successful;
        const totalCount = results.summary.total;
        let statusCode = 200; // Default success
        if (successCount === 0 && totalCount > 0) {
            statusCode = 400; // All failed
        } else if (successCount > 0 && successCount < totalCount) {
            statusCode = 207; // Multi-status, for partial success
        }

        res.status(statusCode).json({
            success: true, // Mark as true if at least one item was successful
            message: results.message,
            data: {
                results: results.results,
                summary: results.summary
            }
        });
    })
};

module.exports = inventoryController;