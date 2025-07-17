
const { body, query, param } = require('express-validator');

const inventoryValidation = {
    addItem: [
        body('itemName').notEmpty().withMessage('Item name is required').trim().isLength({ max: 100 }).withMessage('Item name cannot exceed 100 characters'),
        body('itemCode').notEmpty().withMessage('Item code is required').trim().toUpperCase(),
        body('category').isIn([
            'medications', 'equipment', 'supplies', 'devices', 'consumables',
            'surgical', 'laboratory', 'emergency', 'other'
        ]).withMessage('Valid category is required'),
        body('quantity').isNumeric().withMessage('Quantity must be a number').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
        body('unit').isIn([
            'pieces', 'boxes', 'bottles', 'tubes', 'packs', 'units',
            'sets', 'kits', 'meters', 'liters', 'grams', 'milliliters'
        ]).withMessage('Valid unit is required'),
        body('minimumStock').isNumeric().withMessage('Minimum stock must be a number').isFloat({ min: 0 }).withMessage('Minimum stock cannot be negative'),
        body('maximumStock').optional().isNumeric().withMessage('Maximum stock must be a number').isFloat({ min: 0 }).withMessage('Maximum stock cannot be negative'),
        body('unitPrice').isNumeric().withMessage('Unit price must be a number').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
        body('currentStock').isNumeric().withMessage('Current stock must be a number').isFloat({ min: 0 }).withMessage('Current stock cannot be negative'),
        body('subcategory').optional().isString().trim(),
        body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('supplier.name').optional().isString().trim(),
        body('supplier.contactPerson').optional().isString().trim(),
        body('supplier.email').optional().isEmail(),
        body('supplier.phone').optional().isString().trim(),
        body('supplier.address').optional().isString().trim(),
        body('manufacturer.name').optional().isString().trim(),
        body('manufacturer.country').optional().isString().trim(),
        body('manufacturer.contactInfo').optional().isString().trim(),
        body('expiryDate').optional().isISO8601().toDate().withMessage('Valid expiry date is required (YYYY-MM-DD)'),
        body('batchNumber').optional().isString().trim(),
        body('location.building').optional().isString().trim(),
        body('location.floor').optional().isString().trim(),
        body('location.room').optional().isString().trim(),
        body('location.shelf').optional().isString().trim(),
        body('location.bin').optional().isString().trim(),
        body('status').optional().isIn(['active', 'inactive', 'discontinued', 'recalled']).withMessage('Invalid status'),
        body('isCritical').optional().isBoolean().withMessage('Is Critical must be a boolean'),
        body('notes').optional().isString().trim(),
        body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
        body('tags.*').optional().isString().trim().notEmpty().withMessage('Each tag must be a non-empty string')
    ],
    updateItem: [
        body('itemName').optional().notEmpty().withMessage('Item name is required').trim().isLength({ max: 100 }).withMessage('Item name cannot exceed 100 characters'),
        body('itemCode').optional().notEmpty().withMessage('Item code is required').trim().toUpperCase(),
        body('category').optional().isIn([
            'medications', 'equipment', 'supplies', 'devices', 'consumables',
            'surgical', 'laboratory', 'emergency', 'other'
        ]).withMessage('Valid category is required'),
        body('quantity').optional().isNumeric().withMessage('Quantity must be a number').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
        body('unit').optional().isIn([
            'pieces', 'boxes', 'bottles', 'tubes', 'packs', 'units',
            'sets', 'kits', 'meters', 'liters', 'grams', 'milliliters'
        ]).withMessage('Valid unit is required'),
        body('minimumStock').optional().isNumeric().withMessage('Minimum stock must be a number').isFloat({ min: 0 }).withMessage('Minimum stock cannot be negative'),
        body('maximumStock').optional().isNumeric().withMessage('Maximum stock must be a number').isFloat({ min: 0 }).withMessage('Maximum stock cannot be negative'),
        body('currentStock').optional().isNumeric().withMessage('Current stock must be a number').isFloat({ min: 0 }).withMessage('Current stock cannot be negative'),
        body('subcategory').optional().isString().trim(),
        body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
        body('supplier.name').optional().isString().trim(),
        body('supplier.contactPerson').optional().isString().trim(),
        body('supplier.email').optional().isEmail(),
        body('supplier.phone').optional().isString().trim(),
        body('supplier.address').optional().isString().trim(),
        body('manufacturer.name').optional().isString().trim(),
        body('manufacturer.country').optional().isString().trim(),
        body('manufacturer.contactInfo').optional().isString().trim(),
        body('expiryDate').optional().isISO8601().toDate().withMessage('Valid expiry date is required (YYYY-MM-DD)'),
        body('batchNumber').optional().isString().trim(),
        body('location.building').optional().isString().trim(),
        body('location.floor').optional().isString().trim(),
        body('location.room').optional().isString().trim(),
        body('location.shelf').optional().isString().trim(),
        body('location.bin').optional().isString().trim(),
        body('status').optional().isIn(['active', 'inactive', 'discontinued', 'recalled']).withMessage('Invalid status'),
        body('isCritical').optional().isBoolean().withMessage('Is Critical must be a boolean'),
        body('notes').optional().isString().trim(),
        body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
        body('tags.*').optional().isString().trim().notEmpty().withMessage('Each tag must be a non-empty string')
    ],
    getList: [
        query('category').optional().isString().trim(),
        query('status').optional().isString().trim(),
        query('search').optional().isString().trim(),
        query('isLowStock').optional().isBoolean().withMessage('isLowStock must be a boolean (true/false)'),
        query('isExpired').optional().isBoolean().withMessage('isExpired must be a boolean (true/false)'),
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1 }).toInt().withMessage('Limit must be a positive integer'),
        query('sortBy').optional().isString().trim(),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"')
    ],
    updateStock: [
        body('quantity').isNumeric().withMessage('Quantity must be a number').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
        body('type').isIn(['add', 'subtract', 'set']).withMessage('Valid type is required (add, subtract, set)'),
        body('notes').optional().isString().trim().withMessage('Notes must be a string')
    ],
    getExpiringAlerts: [
        query('days').optional().isInt({ min: 1 }).toInt().withMessage('Days must be a positive integer')
    ],
    bulkUpdate: [
        body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
        body('items.*.id').isMongoId().withMessage('Valid item ID is required for each item'),
        body('items.*.quantity').isNumeric().withMessage('Quantity must be a number for each item').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
        body('items.*.type').isIn(['add', 'subtract', 'set']).withMessage('Valid type is required for each item (add, subtract, set)')
    ],
    // Validate ID parameter for routes like /:id
    idParam: [
        param('id').isMongoId().withMessage('Invalid Inventory Item ID')
    ]
};

module.exports = inventoryValidation;