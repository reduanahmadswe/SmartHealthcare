const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logInventoryActivity } = require('../middleware/activityLogger');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/inventory/add
// @desc    Add new inventory item
// @access  Private (Admin only)
router.post('/add', [
  body('itemName').notEmpty().withMessage('Item name is required'),
  body('itemCode').notEmpty().withMessage('Item code is required'),
  body('category').isIn([
    'medications', 'equipment', 'supplies', 'devices', 'consumables',
    'surgical', 'laboratory', 'emergency', 'other'
  ]).withMessage('Valid category is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('unit').isIn([
    'pieces', 'boxes', 'bottles', 'tubes', 'packs', 'units',
    'sets', 'kits', 'meters', 'liters', 'grams', 'milliliters'
  ]).withMessage('Valid unit is required'),
  body('minimumStock').isNumeric().withMessage('Minimum stock must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('supplier.name').optional().isString().withMessage('Supplier name must be a string'),
  body('manufacturer.name').optional().isString().withMessage('Manufacturer name must be a string'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('location.building').optional().isString().withMessage('Building must be a string'),
  body('location.floor').optional().isString().withMessage('Floor must be a string'),
  body('location.room').optional().isString().withMessage('Room must be a string'),
  body('location.shelf').optional().isString().withMessage('Shelf must be a string'),
  body('location.bin').optional().isString().withMessage('Bin must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], logInventoryActivity('add_inventory_item', 'Add inventory item'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // Check if item code already exists
  const existingItem = await Inventory.findOne({ itemCode: req.body.itemCode });
  if (existingItem) {
    return res.status(400).json({
      success: false,
      message: 'Item code already exists'
    });
  }

  const newItem = new Inventory({
    ...req.body,
    addedBy: req.user._id
  });

  await newItem.save();

  res.status(201).json({
    success: true,
    message: 'Inventory item added successfully',
    data: newItem
  });
}));

// @route   GET /api/inventory/list
// @desc    Get inventory list with filters
// @access  Private (Admin only)
router.get('/list', logInventoryActivity('view_inventory_list', 'View inventory list'), asyncHandler(async (req, res) => {
  const {
    category,
    status,
    search,
    isLowStock,
    isExpired,
    page = 1,
    limit = 20,
    sortBy = 'itemName',
    sortOrder = 'asc'
  } = req.query;

  const query = {};

  // Apply filters
  if (category) query.category = category;
  if (status) query.status = status;
  if (isLowStock === 'true') query.isLowStock = true;
  if (isExpired === 'true') query.isExpired = true;

  // Search functionality
  if (search) {
    query.$or = [
      { itemName: { $regex: search, $options: 'i' } },
      { itemCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'supplier.name': { $regex: search, $options: 'i' } },
      { 'manufacturer.name': { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const inventory = await Inventory.find(query)
    .populate('addedBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Inventory.countDocuments(query);

  res.json({
    success: true,
    data: {
      inventory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/inventory/summary
// @desc    Get inventory summary statistics
// @access  Private (Admin only)
router.get('/summary', logInventoryActivity('view_inventory_summary', 'View inventory summary'), asyncHandler(async (req, res) => {
  const summary = await Inventory.getInventorySummary();
  
  const lowStockItems = await Inventory.getLowStockItems();
  const expiringItems = await Inventory.getExpiringItems(30);
  
  const totalItems = await Inventory.countDocuments();
  const totalValue = await Inventory.aggregate([
    { $group: { _id: null, total: { $sum: '$totalValue' } } }
  ]);

  res.json({
    success: true,
    data: {
      summary,
      lowStockItems: lowStockItems.length,
      expiringItems: expiringItems.length,
      totalItems,
      totalValue: totalValue[0]?.total || 0,
      alerts: {
        lowStock: lowStockItems.length,
        expiring: expiringItems.length,
        critical: lowStockItems.filter(item => item.isCritical).length
      }
    }
  });
}));

// @route   GET /api/inventory/:id
// @desc    Get specific inventory item
// @access  Private (Admin only)
router.get('/:id', logInventoryActivity('view_inventory_item', 'View inventory item'), asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id)
    .populate('addedBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName');

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  res.json({
    success: true,
    data: item
  });
}));

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Admin only)
router.put('/:id', logInventoryActivity('update_inventory_item', 'Update inventory item'), asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Check if item code is being changed and if it already exists
  if (req.body.itemCode && req.body.itemCode !== item.itemCode) {
    const existingItem = await Inventory.findOne({ itemCode: req.body.itemCode });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item code already exists'
      });
    }
  }

  Object.assign(item, req.body);
  item.lastUpdatedBy = req.user._id;
  
  await item.save();

  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: item
  });
}));

// @route   PUT /api/inventory/:id/stock
// @desc    Update inventory stock
// @access  Private (Admin only)
router.put('/:id/stock', [
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('type').isIn(['add', 'subtract', 'set']).withMessage('Valid type is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], logInventoryActivity('update_inventory_stock', 'Update inventory stock'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { quantity, type, notes } = req.body;
  const item = await Inventory.findById(req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  try {
    await item.updateStock(quantity, type, notes);
    item.lastUpdatedBy = req.user._id;
    await item.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin only)
router.delete('/:id', logInventoryActivity('delete_inventory_item', 'Delete inventory item'), asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  await Inventory.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Inventory item deleted successfully'
  });
}));

// @route   GET /api/inventory/alerts/low-stock
// @desc    Get low stock alerts
// @access  Private (Admin only)
router.get('/alerts/low-stock', logInventoryActivity('view_low_stock_alerts', 'View low stock alerts'), asyncHandler(async (req, res) => {
  const lowStockItems = await Inventory.getLowStockItems();

  res.json({
    success: true,
    data: {
      items: lowStockItems,
      count: lowStockItems.length
    }
  });
}));

// @route   GET /api/inventory/alerts/expiring
// @desc    Get expiring items alerts
// @access  Private (Admin only)
router.get('/alerts/expiring', logInventoryActivity('view_expiring_alerts', 'View expiring alerts'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const expiringItems = await Inventory.getExpiringItems(days);

  res.json({
    success: true,
    data: {
      items: expiringItems,
      count: expiringItems.length,
      daysThreshold: days
    }
  });
}));

// @route   POST /api/inventory/bulk-update
// @desc    Bulk update inventory items
// @access  Private (Admin only)
router.post('/bulk-update', [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.id').isMongoId().withMessage('Valid item ID is required'),
  body('items.*.quantity').isNumeric().withMessage('Quantity must be a number'),
  body('items.*.type').isIn(['add', 'subtract', 'set']).withMessage('Valid type is required')
], logInventoryActivity('bulk_update_inventory', 'Bulk update inventory'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { items } = req.body;
  const results = [];

  for (const itemUpdate of items) {
    try {
      const item = await Inventory.findById(itemUpdate.id);
      if (item) {
        await item.updateStock(itemUpdate.quantity, itemUpdate.type);
        item.lastUpdatedBy = req.user._id;
        await item.save();
        results.push({ id: itemUpdate.id, success: true, item });
      } else {
        results.push({ id: itemUpdate.id, success: false, error: 'Item not found' });
      }
    } catch (error) {
      results.push({ id: itemUpdate.id, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  res.json({
    success: true,
    message: `Bulk update completed. ${successCount} successful, ${failureCount} failed.`,
    data: {
      results,
      summary: {
        total: items.length,
        successful: successCount,
        failed: failureCount
      }
    }
  });
}));

module.exports = router; 