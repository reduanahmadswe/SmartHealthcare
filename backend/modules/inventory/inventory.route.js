
const express = require('express');
const { validationResult } = require('express-validator'); 
const { authenticateToken, requireAdmin } = require('../../middleware/auth'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 
const { logInventoryActivity } = require('../../middleware/activityLogger'); 
const inventoryValidation = require('./inventory.validation'); 
const inventoryController = require('./inventory.controller'); 

const router = express.Router();

// Middleware to ensure admin access for all inventory routes
router.use(authenticateToken, requireAdmin);

// @route   POST /api/inventory/add
// @desc    Add new inventory item
// @access  Private (Admin only)
router.post('/add',
    inventoryValidation.addItem,
    logInventoryActivity('add_inventory_item', 'Add inventory item'),
    inventoryController.addItem
);

// @route   GET /api/inventory/list
// @desc    Get inventory list with filters
// @access  Private (Admin only)
router.get('/list',
    inventoryValidation.getList,
    logInventoryActivity('view_inventory_list', 'View inventory list'),
    inventoryController.getInventoryList
);

// @route   GET /api/inventory/summary
// @desc    Get inventory summary statistics
// @access  Private (Admin only)
router.get('/summary',
    logInventoryActivity('view_inventory_summary', 'View inventory summary'),
    inventoryController.getInventorySummary
);

// @route   GET /api/inventory/:id
// @desc    Get specific inventory item
// @access  Private (Admin only)
router.get('/:id',
    inventoryValidation.idParam, // Validate ID format
    logInventoryActivity('view_inventory_item', 'View inventory item'),
    inventoryController.getItemById
);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Admin only)
router.put('/:id',
    inventoryValidation.idParam, // Validate ID format
    inventoryValidation.updateItem,
    logInventoryActivity('update_inventory_item', 'Update inventory item'),
    inventoryController.updateItem
);

// @route   PUT /api/inventory/:id/stock
// @desc    Update inventory stock
// @access  Private (Admin only)
router.put('/:id/stock',
    inventoryValidation.idParam, // Validate ID format
    inventoryValidation.updateStock,
    logInventoryActivity('update_inventory_stock', 'Update inventory stock'),
    inventoryController.updateItemStock
);

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin only)
router.delete('/:id',
    inventoryValidation.idParam, // Validate ID format
    logInventoryActivity('delete_inventory_item', 'Delete inventory item'),
    inventoryController.deleteItem
);

// @route   GET /api/inventory/alerts/low-stock
// @desc    Get low stock alerts
// @access  Private (Admin only)
router.get('/alerts/low-stock',
    logInventoryActivity('view_low_stock_alerts', 'View low stock alerts'),
    inventoryController.getLowStockAlerts
);

// @route   GET /api/inventory/alerts/expiring
// @desc    Get expiring items alerts
// @access  Private (Admin only)
router.get('/alerts/expiring',
    inventoryValidation.getExpiringAlerts,
    logInventoryActivity('view_expiring_alerts', 'View expiring alerts'),
    inventoryController.getExpiringAlerts
);

// @route   POST /api/inventory/bulk-update
// @desc    Bulk update inventory items
// @access  Private (Admin only)
router.post('/bulk-update',
    inventoryValidation.bulkUpdate,
    logInventoryActivity('bulk_update_inventory', 'Bulk update inventory'),
    inventoryController.bulkUpdateInventory
);

module.exports = router;