
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    itemCode: {
        type: String,
        required: [true, 'Item code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'medications',
            'equipment',
            'supplies',
            'devices',
            'consumables',
            'surgical',
            'laboratory',
            'emergency',
            'other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    quantity: { // Represents the quantity per unit of measure, e.g., if unit is 'boxes', this is the number of boxes
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: [
            'pieces',
            'boxes',
            'bottles',
            'tubes',
            'packs',
            'units',
            'sets',
            'kits',
            'meters',
            'liters',
            'grams',
            'milliliters'
        ]
    },
    minimumStock: {
        type: Number,
        required: [true, 'Minimum stock level is required'],
        min: [0, 'Minimum stock cannot be negative']
    },
    maximumStock: {
        type: Number,
        min: [0, 'Maximum stock cannot be negative']
    },
    currentStock: { // The actual count of items currently in stock
        type: Number,
        required: [true, 'Current stock is required'],
        min: [0, 'Current stock cannot be negative']
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative']
    },
    totalValue: {
        type: Number,
        min: [0, 'Total value cannot be negative']
    },
    supplier: {
        name: String,
        contactPerson: String,
        email: String,
        phone: String,
        address: String
    },
    manufacturer: {
        name: String,
        country: String,
        contactInfo: String
    },
    expiryDate: {
        type: Date
    },
    batchNumber: {
        type: String,
        trim: true
    },
    location: {
        building: String,
        floor: String,
        room: String,
        shelf: String,
        bin: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued', 'recalled'],
        default: 'active'
    },
    isCritical: {
        type: Boolean,
        default: false
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    tags: [String]
}, {
    timestamps: true
});

// Indexes for better performance
inventorySchema.index({
    category: 1
});
inventorySchema.index({
    status: 1
});
inventorySchema.index({
    isExpired: 1
});
inventorySchema.index({
    isLowStock: 1
});
inventorySchema.index({
    expiryDate: 1
});
inventorySchema.index({
    'supplier.name': 1
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
    if (this.currentStock <= 0) return 'out_of_stock';
    if (this.currentStock <= this.minimumStock) return 'low_stock';
    // If maximumStock is defined and currentStock exceeds it
    if (this.maximumStock !== undefined && this.currentStock >= this.maximumStock) return 'overstocked';
    return 'normal';
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
    if (!this.expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day
    const expiry = new Date(this.expiryDate);
    expiry.setHours(0, 0, 0, 0); // Normalize expiry to start of day

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate derived fields
inventorySchema.pre('save', function(next) {
    // Calculate total value
    this.totalValue = this.currentStock * this.unitPrice;

    // Check if stock is low
    this.isLowStock = this.currentStock <= this.minimumStock;

    // Check if expired
    if (this.expiryDate) {
        // Use a consistent comparison: current date vs. expiry date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(this.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        this.isExpired = today > expiry;
    } else {
        this.isExpired = false; // If no expiry date, it's not expired
    }

    next();
});

// Method to update stock
inventorySchema.methods.updateStock = async function(quantity, type = 'add') {
    if (type === 'add') {
        this.currentStock += quantity;
    } else if (type === 'subtract') {
        if (this.currentStock < quantity) {
            throw new Error('Insufficient stock');
        }
        this.currentStock -= quantity;
    } else if (type === 'set') {
        if (quantity < 0) {
            throw new Error('Quantity cannot be negative for set operation');
        }
        this.currentStock = quantity;
    } else {
        throw new Error('Invalid stock update type. Must be "add", "subtract", or "set".');
    }

    // `save()` will trigger the pre-save hook for totalValue, isLowStock, isExpired
    // You don't need to manually recalculate them here, save() will handle it.
    return this.save();
};

// Method to check if item needs reorder
inventorySchema.methods.needsReorder = function() {
    return this.currentStock <= this.minimumStock && this.status === 'active';
};

// Method to check if item is expiring soon
inventorySchema.methods.isExpiringSoon = function(days = 30) {
    if (!this.expiryDate) return false;
    const daysUntilExpiry = this.daysUntilExpiry;
    // Check if daysUntilExpiry is not null, is positive, and within the threshold
    return daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= days;
};


// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function() {
    return this.find({
        isLowStock: true,
        status: 'active'
    }).populate('addedBy', 'firstName lastName');
};

// Static method to get expiring items
inventorySchema.statics.getExpiringItems = function(days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    futureDate.setHours(23, 59, 59, 999); // Normalize to end of day

    return this.find({
            expiryDate: {
                $lte: futureDate, // Less than or equal to futureDate
                $gte: today // Greater than or equal to today
            },
            status: 'active',
            isExpired: false // Ensure we only get items not yet marked as expired
        })
        .populate('addedBy', 'firstName lastName');
};


// Static method to get inventory summary
inventorySchema.statics.getInventorySummary = function() {
    return this.aggregate([{
        $group: {
            _id: '$category',
            totalItems: {
                $sum: 1
            },
            totalQuantity: {
                $sum: '$currentStock'
            }, // Sum of actual stock quantity
            totalValue: {
                $sum: '$totalValue'
            },
            lowStockItems: {
                $sum: {
                    $cond: ['$isLowStock', 1, 0]
                }
            },
            expiredItems: {
                $sum: {
                    $cond: ['$isExpired', 1, 0]
                }
            }
        }
    }, {
        $sort: {
            _id: 1
        }
    }]);
};

// Static method to search inventory
inventorySchema.statics.searchInventory = function(searchTerm, filters = {}) {
    const query = {
        $or: [{
            itemName: {
                $regex: searchTerm,
                $options: 'i'
            }
        }, {
            itemCode: {
                $regex: searchTerm,
                $options: 'i'
            }
        }, {
            description: {
                $regex: searchTerm,
                $options: 'i'
            }
        }, {
            'supplier.name': {
                $regex: searchTerm,
                $options: 'i'
            }
        }, {
            'manufacturer.name': {
                $regex: searchTerm,
                $options: 'i'
            }
        }]
    };

    // Apply additional filters
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.isLowStock !== undefined) query.isLowStock = filters.isLowStock;
    if (filters.isExpired !== undefined) query.isExpired = filters.isExpired;

    return this.find(query)
        .populate('addedBy', 'firstName lastName')
        .sort({
            itemName: 1
        });
};

module.exports = mongoose.model('Inventory', inventorySchema);