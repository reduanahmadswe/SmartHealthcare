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
  quantity: {
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
  currentStock: {
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
inventorySchema.index({ itemCode: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ isExpired: 1 });
inventorySchema.index({ isLowStock: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ 'supplier.name': 1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  if (this.currentStock >= this.maximumStock) return 'overstocked';
  return 'normal';
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
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
    this.isExpired = new Date() > new Date(this.expiryDate);
  }
  
  next();
});

// Method to update stock
inventorySchema.methods.updateStock = function(quantity, type = 'add', notes = '') {
  if (type === 'add') {
    this.currentStock += quantity;
  } else if (type === 'subtract') {
    if (this.currentStock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.currentStock -= quantity;
  } else if (type === 'set') {
    this.currentStock = quantity;
  }
  
  // Recalculate derived fields
  this.totalValue = this.currentStock * this.unitPrice;
  this.isLowStock = this.currentStock <= this.minimumStock;
  
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
  return daysUntilExpiry !== null && daysUntilExpiry <= days && daysUntilExpiry > 0;
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
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: expiryDate, $gte: new Date() },
    status: 'active'
  }).populate('addedBy', 'firstName lastName');
};

// Static method to get inventory summary
inventorySchema.statics.getInventorySummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        lowStockItems: {
          $sum: { $cond: ['$isLowStock', 1, 0] }
        },
        expiredItems: {
          $sum: { $cond: ['$isExpired', 1, 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to search inventory
inventorySchema.statics.searchInventory = function(searchTerm, filters = {}) {
  const query = {
    $or: [
      { itemName: { $regex: searchTerm, $options: 'i' } },
      { itemCode: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { 'supplier.name': { $regex: searchTerm, $options: 'i' } },
      { 'manufacturer.name': { $regex: searchTerm, $options: 'i' } }
    ]
  };

  // Apply additional filters
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.isLowStock !== undefined) query.isLowStock = filters.isLowStock;
  if (filters.isExpired !== undefined) query.isExpired = filters.isExpired;

  return this.find(query)
    .populate('addedBy', 'firstName lastName')
    .sort({ itemName: 1 });
};

module.exports = mongoose.model('Inventory', inventorySchema); 